import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { problem, text } from './community-store.mjs';

const cookieName = 'ceptlens_session';
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digest = value => createHash('sha256').update(value).digest('hex');
const hashPassword = password => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};
const verifyPassword = (password, stored) => {
  const [salt, expected] = String(stored).split(':');
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  return actual.length === expected.length / 2 && timingSafeEqual(actual, Buffer.from(expected, 'hex'));
};
const cookies = header => Object.fromEntries(String(header ?? '').split(';').map(v => v.trim().split('=').map(decodeURIComponent)).filter(v => v.length === 2));
const sessionCookie = token => `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;

export function createAccountService(db, { clock = Date.now } = {}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth_accounts(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), provider TEXT NOT NULL, provider_subject TEXT NOT NULL, email TEXT, password_hash TEXT, created_at INTEGER NOT NULL, UNIQUE(provider, provider_subject));
    CREATE TABLE IF NOT EXISTS auth_sessions(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), token_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, revoked_at INTEGER);
    CREATE TABLE IF NOT EXISTS audit_events(id TEXT PRIMARY KEY, user_id TEXT, action TEXT NOT NULL, metadata TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS learning_progress(owner TEXT PRIMARY KEY REFERENCES users(id), data TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_events(user_id, created_at);
    CREATE TABLE IF NOT EXISTS account_roles(user_id TEXT PRIMARY KEY REFERENCES users(id), role TEXT NOT NULL CHECK(role IN ('learner','developer')));
  `);
  const audit = (userId, action, metadata = {}) => db.prepare('INSERT INTO audit_events VALUES(?,?,?,?,?)').run(randomUUID(), userId ?? null, action, JSON.stringify(metadata).slice(0, 4000), clock());
  const user = id => db.prepare("SELECT users.id, users.name, COALESCE(account_roles.role, 'learner') AS role FROM users LEFT JOIN account_roles ON account_roles.user_id=users.id WHERE users.id=?").get(id);
  const createUser = (name, provider, subject, email = null, passwordHash = null) => {
    const id = randomUUID();
    db.prepare('INSERT INTO users(id, token_hash, name) VALUES(?,?,?)').run(id, digest(randomUUID()), text(name, 40));
    db.prepare('INSERT INTO auth_accounts VALUES(?,?,?,?,?,?,?)').run(randomUUID(), id, provider, subject, email, passwordHash, clock());
    return user(id);
  };
  const startSession = (userId, action) => {
    const raw = randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO auth_sessions VALUES(?,?,?,?,?,?)').run(randomUUID(), userId, digest(raw), clock(), clock() + 2592000000, null);
    audit(userId, action); return { user: user(userId), cookie: sessionCookie(raw) };
  };
  const bySession = header => {
    const raw = cookies(header)[cookieName]; if (!raw) return null;
    const row = db.prepare('SELECT user_id FROM auth_sessions WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?').get(digest(raw), clock());
    return row ? user(row.user_id) : null;
  };
  const authenticate = (header, guest) => bySession(header) ?? guest();
  return {
    cookieName,
    authenticate,
    isAuthenticated: header => !!bySession(header),
    canManageContent: header => bySession(header)?.role === 'developer',
    rename(header, name) {
      const current = bySession(header); if (!current) throw problem('Please sign in.', 401);
      db.prepare('UPDATE users SET name=? WHERE id=?').run(text(name, 40), current.id);
      return user(current.id);
    },
    // Deliberately not exposed by the HTTP registration/profile API.
    setRole(userId, role) {
      if (!['learner', 'developer'].includes(role)) throw problem('Invalid account role.');
      if (!db.prepare('SELECT 1 FROM auth_accounts WHERE user_id=?').get(userId)) throw problem('Registered account not found.', 404);
      db.prepare('INSERT INTO account_roles VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role').run(userId, role);
      audit(userId, 'account.role_changed', { role, actor: 'server-owner' });
      return user(userId);
    },
    providers: () => ({ email: true, guest: true, github: !!(process.env.CEPTLENS_GITHUB_CLIENT_ID && process.env.CEPTLENS_GITHUB_CLIENT_SECRET), wechat: !!(process.env.CEPTLENS_WECHAT_APP_ID && process.env.CEPTLENS_WECHAT_APP_SECRET) }),
    register({ email, password, name }) {
      if (typeof email !== 'string' || !emailRe.test(email) || email.length > 200) throw problem('请输入有效邮箱。');
      if (typeof password !== 'string' || password.length < 10 || password.length > 200) throw problem('密码需为 10 至 200 个字符。');
      if (db.prepare('SELECT 1 FROM auth_accounts WHERE provider=? AND email=?').get('email', email.toLowerCase())) throw problem('该邮箱已注册。', 409);
      const u = createUser(name || email.split('@')[0], 'email', email.toLowerCase(), email.toLowerCase(), hashPassword(password));
      return startSession(u.id, 'account.register');
    },
    login({ email, password }) {
      if (typeof email !== 'string' || typeof password !== 'string' || password.length > 200) throw problem('邮箱或密码不正确。', 401);
      const row = db.prepare('SELECT user_id, password_hash FROM auth_accounts WHERE provider=? AND email=?').get('email', String(email).toLowerCase());
      if (!row || !verifyPassword(password, row.password_hash)) { audit(null, 'account.login_failed'); throw problem('邮箱或密码不正确。', 401); }
      return startSession(row.user_id, 'account.login');
    },
    logout(header) {
      const raw = cookies(header)[cookieName]; const row = raw && db.prepare('SELECT user_id FROM auth_sessions WHERE token_hash=? AND revoked_at IS NULL').get(digest(raw));
      if (row) { db.prepare('UPDATE auth_sessions SET revoked_at=? WHERE token_hash=?').run(clock(), digest(raw)); audit(row.user_id, 'account.logout'); }
      return { cookie: `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` };
    },
    progress(userId) { const row = db.prepare('SELECT data FROM learning_progress WHERE owner=?').get(userId); return row ? JSON.parse(row.data) : null; },
    saveProgress(userId, data) { db.prepare('INSERT INTO learning_progress VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at').run(userId, JSON.stringify(data).slice(0, 200000), clock()); audit(userId, 'learning.progress_saved'); },
    guestToAccount(userId, { email, password, name }) {
      if (typeof email !== 'string' || !emailRe.test(email) || email.length > 200 || typeof password !== 'string' || password.length < 10 || password.length > 200) throw problem('注册信息无效。');
      if (db.prepare('SELECT 1 FROM auth_accounts WHERE provider=? AND email=?').get('email', email.toLowerCase())) throw problem('该邮箱已注册。', 409);
      const existing = user(userId); if (!existing) throw problem('找不到访客身份。', 404);
      if (name) db.prepare('UPDATE users SET name=? WHERE id=?').run(text(name, 40), userId);
      db.prepare('INSERT INTO auth_accounts VALUES(?,?,?,?,?,?,?)').run(randomUUID(), userId, 'email', email.toLowerCase(), email.toLowerCase(), hashPassword(password), clock());
      const result = startSession(userId, 'account.guest_upgrade'); return { ...result, user: user(userId) };
    }
  };
}
