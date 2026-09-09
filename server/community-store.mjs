import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export function problem(message, status = 400) { return Object.assign(new Error(message), { status }); }
export function text(value, max = 4000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw problem(`请输入有效文本（最多 ${max} 字）。`);
  return value.trim();
}

/** Host-owned state. Content publishing never opens, replaces or deletes this directory. */
export function openCommunityStore(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename, { timeout: 5000 });
  db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  const schema = db.prepare('PRAGMA user_version').get().user_version;
  if (schema > 1) { db.close(); throw new Error('服务数据库来自较新版本，禁止降级写入。'); }
  if (schema === 0) db.exec(`
    BEGIN IMMEDIATE;
    CREATE TABLE users(id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL);
    CREATE TABLE discussions(id TEXT PRIMARY KEY, resource TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX idx_discussions_resource ON discussions(resource);
    CREATE TABLE attempts(id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX idx_attempts_owner ON attempts(owner);
    CREATE UNIQUE INDEX idx_attempts_one_active ON attempts(owner) WHERE status='active';
    CREATE TABLE chats(owner TEXT PRIMARY KEY REFERENCES users(id), data TEXT NOT NULL);
    PRAGMA user_version=1;
    COMMIT;
  `);
  return {
    db,
    identity(token, name) {
      if (typeof token !== 'string' || !/^[a-f0-9]{48}$/.test(token)) throw problem('浏览器身份无效，请刷新页面。', 401);
      const digest = createHash('sha256').update(token).digest('hex');
      let user = db.prepare('SELECT id, name FROM users WHERE token_hash=?').get(digest);
      if (!user) {
        user = { id: randomUUID(), name: name ? text(name, 40) : `访客 ${digest.slice(0, 4)}` };
        db.prepare('INSERT INTO users VALUES(?,?,?)').run(user.id, digest, user.name);
      } else if (name !== undefined) {
        user.name = text(name, 40); db.prepare('UPDATE users SET name=? WHERE id=?').run(user.name, user.id);
      }
      return user;
    },
    listDiscussions(resource) { return db.prepare('SELECT data FROM discussions WHERE resource=? ORDER BY rowid DESC').all(resource).map(r => JSON.parse(r.data)); },
    getDiscussion(id) { const r = db.prepare('SELECT data FROM discussions WHERE id=?').get(id); return r ? JSON.parse(r.data) : null; },
    saveDiscussion(d) { db.prepare('INSERT INTO discussions VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(d.id, d.resource, JSON.stringify(d)); },
    listAttempts(owner) { return db.prepare('SELECT data FROM attempts WHERE owner=? ORDER BY rowid DESC').all(owner).map(r => JSON.parse(r.data)); },
    getAttempt(id, owner) { const r = db.prepare('SELECT data FROM attempts WHERE id=? AND owner=?').get(id, owner); if (!r) throw problem('找不到你的答卷。', 404); return JSON.parse(r.data); },
    saveAttempt(a) { db.prepare('INSERT INTO attempts VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,data=excluded.data').run(a.id, a.owner, a.status, JSON.stringify(a)); },
    chat(owner) { const row = db.prepare('SELECT data FROM chats WHERE owner=?').get(owner); return row ? JSON.parse(row.data) : []; },
    saveChat(owner, messages) { db.prepare('INSERT INTO chats VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data').run(owner, JSON.stringify(messages.slice(-60))); },
    close() { db.close(); }
  };
}
