import { useState } from "react";
import type { FormEvent } from "react";
import { learningRequest } from "../infrastructure/learningClient";
import { uiText, useLocale } from "../i18n";

export function AuthPanel({ close }: { close: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const { locale } = useLocale();
  const t = (zh: string, en: string) => uiText(locale, zh, en);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { await learningRequest(`auth/${mode}`, mode === "login" ? { email, password } : { email, password, name }); close(); } catch (e) { setError(e instanceof Error ? e.message : t("操作失败", "Operation failed")); } finally { setBusy(false); } }
  return <form className="drawer-body identity-form" onSubmit={submit}><h3>{mode === "login" ? t("登录", "Sign in") : t("创建账户", "Create account")}</h3>{mode === "register" && <label>{t("显示名", "Display name")}<input value={name} maxLength={40} onChange={e => setName(e.target.value)} placeholder={t("你的名字", "Your name")} /></label>}<label>{t("邮箱", "Email")}<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>{t("密码", "Password")}<input type="password" required minLength={10} value={password} onChange={e => setPassword(e.target.value)} placeholder={t("至少 10 个字符", "At least 10 characters")} /></label>{error && <p className="service-error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? t("处理中…", "Working…") : mode === "login" ? t("登录", "Sign in") : t("注册", "Register")}</button><button type="button" className="secondary-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? t("创建新账户", "Create an account") : t("已有账户，去登录", "Already have an account? Sign in")}</button><p>{t("GitHub 和微信登录将在完成应用配置后启用。", "GitHub and WeChat sign-in will be enabled after the application configuration is complete.")}</p></form>;
}
