import { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { User } from "@supabase/supabase-js";
import HealthApp from "../app/HealthApp";
import "../app/globals.css";
import { isSupabaseConfigured, supabase } from "./supabase";

function Root() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setChecking(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (checking) return <main className="loading-screen"><div className="brand-mark">21</div><p>正在確認登入狀態…</p></main>;
  if (!user) return <LoginScreen />;
  return <HealthApp signedInName={user.user_metadata?.display_name || user.email || "體驗者"} onSignOut={() => void supabase.auth.signOut()} />;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const result = mode === "login" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { data: { display_name: email.split("@")[0] } } });
    if (result.error) setMessage(result.error.message === "Invalid login credentials" ? "信箱或密碼不正確" : result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("請到信箱完成驗證，再回來登入。");
    setBusy(false);
  }

  return <main className="auth-screen"><section className="auth-card"><div className="brand-mark">21</div><p className="eyebrow">FRESH START</p><h1>清新計畫</h1><p>登入後開始你的 21 天健康任務與身心紀錄。</p><form onSubmit={submit}><label>電子信箱<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>密碼<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{message && <p className="auth-message" role="status">{message}</p>}<button className="primary-button full" disabled={busy}>{busy ? "請稍候…" : mode === "login" ? "登入" : "建立帳號"}</button></form><button className="text-button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "第一次使用？建立帳號" : "已經有帳號？返回登入"}</button><small>每位 KOL 的紀錄彼此獨立，不會互相看見。</small></section></main>;
}

function SetupScreen() {
  return <main className="auth-screen"><section className="auth-card"><div className="brand-mark">21</div><h1>尚未連接資料庫</h1><p>請先設定 Supabase 專案網址與公開金鑰，再重新部署。</p></section></main>;
}

createRoot(document.getElementById("root")!).render(<Root />);
