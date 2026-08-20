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
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const normalizedAccount = account.trim().toLowerCase();
    const result = await supabase.auth.signInWithPassword({
      email: `${normalizedAccount}@fresh21.local`,
      password,
    });
    if (result.error) setMessage("帳號或密碼不正確");
    setBusy(false);
  }

  return <main className="auth-screen"><section className="auth-card"><div className="brand-mark">21</div><p className="eyebrow">FRESH START</p><h1>清新計畫</h1><p>請使用主辦單位提供的帳號密碼登入。</p><form onSubmit={submit}><label>帳號<input type="text" autoComplete="username" autoCapitalize="none" value={account} onChange={(e) => setAccount(e.target.value)} required /></label><label>密碼<input type="password" autoComplete="current-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{message && <p className="auth-message" role="status">{message}</p>}<button className="primary-button full" disabled={busy}>{busy ? "請稍候…" : "登入"}</button></form><small>帳號由主辦單位統一建立，不開放自行註冊。</small></section></main>;
}

function SetupScreen() {
  return <main className="auth-screen"><section className="auth-card"><div className="brand-mark">21</div><h1>尚未連接資料庫</h1><p>請先設定 Supabase 專案網址與公開金鑰，再重新部署。</p></section></main>;
}

createRoot(document.getElementById("root")!).render(<Root />);
