"use client";

import { useEffect, useMemo, useState } from "react";
import { getDayTasks, moodOptions, toxinTypes, type ToxinType } from "./program";
import { loadAppData, saveCheckinData, saveProfileData } from "../src/supabase";

type Profile = { displayName: string; toxinType: ToxinType; startDate: string };
type Checkin = { day: number; completed: string[]; sleepAt: string; wakeAt: string; morningMood: string; morningNote: string; eveningMood: string; eveningNote: string };
type Tab = "today" | "plan" | "journal" | "profile";

const emptyCheckin = (day: number): Checkin => ({ day, completed: [], sleepAt: "23:00", wakeAt: "07:00", morningMood: "", morningNote: "", eveningMood: "", eveningNote: "" });
const assessmentUrl = "https://www.ipwa.tw/questionnaire/toxin-type";

export default function HealthApp({ signedInName, onSignOut }: { signedInName: string; onSignOut: () => void }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [day, setDay] = useState(1);
  const [checkin, setCheckin] = useState<Checkin>(emptyCheckin(1));
  const [tab, setTab] = useState<Tab>("today");
  const [onboarding, setOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ToxinType>("斷醣型");
  const [displayName, setDisplayName] = useState(signedInName.includes("@") ? "" : signedInName);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadAppData().then((data) => {
      if (data.profile) {
        setProfile(data.profile);
        setDay(data.currentDay ?? 1);
        setCheckin(data.checkin ?? emptyCheckin(data.currentDay ?? 1));
      } else setOnboarding(true);
    }).catch(() => setOnboarding(true)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profile) return;
    loadAppData(day).then((data) => setCheckin(data.checkin ?? emptyCheckin(day))).catch(() => setCheckin(emptyCheckin(day)));
  }, [day, profile]);

  const tasks = useMemo(() => getDayTasks(day, profile?.toxinType ?? selectedType), [day, profile, selectedType]);
  const completedCount = tasks.filter((t) => checkin.completed.includes(t.id)).length;
  const progress = Math.round((day / 21) * 100);
  const week = day <= 7 ? 1 : day <= 14 ? 2 : 3;
  const weekLabel = week === 1 ? "避開期" : week === 2 ? "導入期" : "維持期";

  async function saveProfile() {
    if (!displayName.trim()) return showToast("請先填寫你的稱呼");
    setSaving(true);
    const next = { displayName: displayName.trim(), toxinType: selectedType, startDate };
    try {
      await saveProfileData(next);
      setProfile(next); setDay(1); setCheckin(emptyCheckin(1)); setOnboarding(false); showToast("你的 21 天計畫已開啟！");
    } catch { showToast("目前無法儲存，請稍後再試"); } finally { setSaving(false); }
  }

  async function persist(next: Checkin, message = "已儲存今日紀錄") {
    setCheckin(next); setSaving(true);
    try {
      await saveCheckinData(next);
      showToast(message);
    } catch { showToast("儲存失敗，請再試一次"); } finally { setSaving(false); }
  }

  function toggleTask(id: string) {
    const completed = checkin.completed.includes(id) ? checkin.completed.filter((item) => item !== id) : [...checkin.completed, id];
    void persist({ ...checkin, completed }, completed.includes(id) ? "做得好，完成一項！" : "已更新任務狀態");
  }

  function showToast(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2600); }

  if (loading) return <main className="loading-screen"><div className="brand-mark">21</div><p>正在整理你的今日計畫…</p></main>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => setTab("today")}><span className="brand-mark">21</span><span>清新計畫</span></button>
        <div className="header-actions"><span className="access-pill secure">已安全登入</span><button className="avatar" onClick={() => setTab("profile")} aria-label="開啟個人資料">{(profile?.displayName ?? signedInName).slice(0, 1)}</button></div>
      </header>

      <section className="content">
        {tab === "today" && profile && <>
          <div className="welcome-row"><div><p className="eyebrow">21 天排毒調理</p><h1>{greeting()}，{profile.displayName}！</h1><p className="subtitle">今天也照顧自己一點點，就很棒了。</p></div><div className="streak"><span>🔥</span><strong>{Math.max(1, day)}</strong><small>進行天數</small></div></div>
          <section className="journey-card" aria-label="目前進度"><div className="journey-copy"><span className="week-tag">第 {week} 週 · {weekLabel}</span><h2>Day {day} / 21</h2><p>{profile.toxinType}計畫</p></div><div className="progress-orbit" style={{ background: `conic-gradient(#fff 0 ${progress}%, rgba(255,255,255,.25) ${progress}%)` }} aria-label={`完成 ${progress}%`}><span>{progress}%</span></div></section>
          <div className="day-picker-heading"><span>選擇其他天，查看當天安排</span><small>每一天都可以提前查看</small></div>
          <DayPicker day={day} onChange={setDay} />
          <div className="section-heading"><div><p className="eyebrow">TODAY</p><h2>今天的 {tasks.length} 個任務</h2></div><span className="counter">{completedCount} / {tasks.length}</span></div>
          <section className="task-list" aria-label="今日任務">{tasks.map((task) => { const done = checkin.completed.includes(task.id); return <button className={`task-card ${done ? "done" : ""}`} key={task.id} onClick={() => toggleTask(task.id)}><span className={`task-icon ${task.tone}`}>{task.icon}</span><span className="task-copy"><em>{task.category}</em><strong>{task.title}</strong><small>{task.detail}</small></span><span className="check-circle" aria-hidden="true">{done ? "✓" : ""}</span></button>; })}</section>
          <section className="checkin-card"><div><p className="eyebrow">DAILY CHECK-IN</p><h2>今天感覺如何？</h2><p>{checkin.morningMood || checkin.eveningMood ? "今天已有紀錄，隨時都能回來補充。" : "記錄睡眠與早晚心情，留下一點給自己的線索。"}</p></div><button className="primary-button" onClick={() => setCheckinOpen(true)}>{checkin.morningMood || checkin.eveningMood ? "更新今日紀錄" : "開始今日打卡"} <span>→</span></button></section>
        </>}

        {tab === "plan" && profile && <PlanView day={day} setDay={(value) => { setDay(value); setTab("today"); }} toxinType={profile.toxinType} />}
        {tab === "journal" && profile && <JournalView checkin={checkin} day={day} onEdit={() => setCheckinOpen(true)} />}
        {tab === "profile" && profile && <ProfileView profile={profile} onSignOut={onSignOut} onRestart={() => { setSelectedType(profile.toxinType); setDisplayName(profile.displayName); setStartDate(profile.startDate); setOnboardingStep(1); setOnboarding(true); }} />}
        <p className="health-note">本工具用於課程體驗與生活紀錄，不取代專業醫療建議。若身體不適，請尋求合格醫療專業人員協助。</p>
      </section>

      {profile && <nav className="bottom-nav" aria-label="主要導覽"><NavButton active={tab === "today"} icon="⌂" label="今日" onClick={() => setTab("today")} /><NavButton active={tab === "plan"} icon="✓" label="計畫" onClick={() => setTab("plan")} /><NavButton active={tab === "journal"} icon="◌" label="紀錄" onClick={() => setTab("journal")} /><NavButton active={tab === "profile"} icon="☺" label="我的" onClick={() => setTab("profile")} /></nav>}
      {onboarding && <Onboarding step={onboardingStep} setStep={setOnboardingStep} selectedType={selectedType} setSelectedType={setSelectedType} displayName={displayName} setDisplayName={setDisplayName} startDate={startDate} setStartDate={setStartDate} onSave={saveProfile} saving={saving} />}
      {checkinOpen && <CheckinModal value={checkin} onChange={setCheckin} onClose={() => setCheckinOpen(false)} onSave={() => { void persist(checkin); setCheckinOpen(false); }} saving={saving} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function greeting() { const hour = new Date().getHours(); return hour < 11 ? "早安" : hour < 18 ? "午安" : "晚安"; }

function DayPicker({ day, onChange }: { day: number; onChange: (day: number) => void }) { return <div className="day-strip" aria-label="選擇計畫天數">{Array.from({ length: 21 }, (_, i) => i + 1).map((value) => <button key={value} className={value === day ? "active" : ""} onClick={() => onChange(value)}><small>{value <= 7 ? "W1" : value <= 14 ? "W2" : "W3"}</small>{value}</button>)}</div>; }
function NavButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) { return <button className={active ? "active" : ""} onClick={onClick}><span>{icon}</span>{label}</button>; }

function Onboarding({ step, setStep, selectedType, setSelectedType, displayName, setDisplayName, startDate, setStartDate, onSave, saving }: { step: number; setStep: (step: number) => void; selectedType: ToxinType; setSelectedType: (type: ToxinType) => void; displayName: string; setDisplayName: (value: string) => void; startDate: string; setStartDate: (value: string) => void; onSave: () => void; saving: boolean }) {
  return <div className="modal-backdrop"><section className="modal onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div className="modal-progress"><span className={step >= 1 ? "active" : ""} /><span className={step >= 2 ? "active" : ""} /></div>{step === 1 ? <><div className="onboarding-hero"><span>🌿</span></div><p className="eyebrow">開始前的小步驟</p><h2 id="onboarding-title">先了解自己的毒素類型</h2><p className="modal-copy">完成課程提供的線上檢測後，再回來選擇結果。我們會依你的類型開啟對應清單。</p><a className="primary-button button-link" href={assessmentUrl} target="_blank" rel="noreferrer">前往正式線上檢測 ↗</a><button className="text-button" onClick={() => setStep(2)}>我已經測完了</button><small className="config-note">檢測會在新分頁開啟，完成後回到這裡即可。</small></> : <><button className="back-button" onClick={() => setStep(1)}>← 返回</button><p className="eyebrow">你的個人計畫</p><h2 id="onboarding-title">檢測結果是哪一型？</h2><div className="type-grid">{toxinTypes.map((type) => <button key={type} className={selectedType === type ? "selected" : ""} onClick={() => setSelectedType(type)}><span>{typeEmoji(type)}</span>{type}</button>)}</div><div className="form-grid"><label>想怎麼稱呼你？<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="例如：安安" /></label><label>開始日期<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label></div><button className="primary-button full" onClick={onSave} disabled={saving}>{saving ? "正在開啟…" : "開啟我的 21 天計畫"}</button></>}</section></div>;
}

function CheckinModal({ value, onChange, onClose, onSave, saving }: { value: Checkin; onChange: (value: Checkin) => void; onClose: () => void; onSave: () => void; saving: boolean }) {
  return <div className="modal-backdrop"><section className="modal checkin-modal" role="dialog" aria-modal="true" aria-labelledby="checkin-title"><button className="close-button" onClick={onClose} aria-label="關閉">×</button><p className="eyebrow">DAY {value.day} CHECK-IN</p><h2 id="checkin-title">今天，身心過得如何？</h2><div className="time-grid"><label>昨晚入睡時間<input type="time" value={value.sleepAt} onChange={(e) => onChange({ ...value, sleepAt: e.target.value })} /></label><label>今天起床時間<input type="time" value={value.wakeAt} onChange={(e) => onChange({ ...value, wakeAt: e.target.value })} /></label></div><MoodField label="起床時的感受" value={value.morningMood} onChange={(morningMood) => onChange({ ...value, morningMood })} /><label className="note-field">早晨想記下什麼？<textarea value={value.morningNote} onChange={(e) => onChange({ ...value, morningNote: e.target.value })} placeholder="自由寫下一兩句…" /></label><MoodField label="睡前的感受" value={value.eveningMood} onChange={(eveningMood) => onChange({ ...value, eveningMood })} /><label className="note-field">睡前想記下什麼？<textarea value={value.eveningNote} onChange={(e) => onChange({ ...value, eveningNote: e.target.value })} placeholder="今天值得感謝的是…" /></label><button className="primary-button full" onClick={onSave} disabled={saving}>{saving ? "儲存中…" : "儲存今日紀錄"}</button></section></div>;
}
function MoodField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <fieldset className="mood-field"><legend>{label}</legend><div>{moodOptions.map((mood) => <button type="button" key={mood.value} className={value === mood.value ? "selected" : ""} onClick={() => onChange(mood.value)}><span>{mood.emoji}</span><small>{mood.label}</small></button>)}</div></fieldset>; }

function PlanView({ day, setDay, toxinType }: { day: number; setDay: (value: number) => void; toxinType: ToxinType }) { return <section className="view-page"><p className="eyebrow">21-DAY ROADMAP</p><h1>你的完整計畫</h1><p className="subtitle">三週循序漸進：先避開、再導入，最後建立適合 {toxinType} 的維持節奏。</p><div className="week-overview"><article><span>01</span><h3>避開期</h3><p>避開精緻糖與高加工食物，建立排毒、呼吸與早晚功課。</p></article><article><span>02</span><h3>導入期</h3><p>加入低 GI 全穀、優蛋白、好油與更完整的運動節奏。</p></article><article><span>03</span><h3>維持期</h3><p>加入 {toxinType} 亮點食材，重新檢視並調整策略。</p></article></div><div className="calendar-grid">{Array.from({ length: 21 }, (_, i) => i + 1).map((value) => <button key={value} className={value === day ? "active" : ""} onClick={() => setDay(value)}><small>DAY</small><strong>{value}</strong><span>{value <= day ? "✓" : "•"}</span></button>)}</div></section>; }
function JournalView({ checkin, day, onEdit }: { checkin: Checkin; day: number; onEdit: () => void }) { const morning = moodOptions.find((m) => m.value === checkin.morningMood); const evening = moodOptions.find((m) => m.value === checkin.eveningMood); return <section className="view-page"><p className="eyebrow">MY JOURNAL</p><h1>身心紀錄</h1><p className="subtitle">看見自己的感受，是照顧自己的第一步。</p><article className="journal-card"><div className="journal-date"><strong>Day {day}</strong><span>{checkin.sleepAt} 入睡 · {checkin.wakeAt} 起床</span></div><div className="journal-moods"><section><span>{morning?.emoji ?? "○"}</span><div><small>起床感受</small><strong>{morning?.label ?? "尚未記錄"}</strong><p>{checkin.morningNote || "還沒有留下文字。"}</p></div></section><section><span>{evening?.emoji ?? "○"}</span><div><small>睡前感受</small><strong>{evening?.label ?? "尚未記錄"}</strong><p>{checkin.eveningNote || "還沒有留下文字。"}</p></div></section></div><button className="secondary-button" onClick={onEdit}>編輯 Day {day} 紀錄</button></article></section>; }
function ProfileView({ profile, onRestart, onSignOut }: { profile: Profile; onRestart: () => void; onSignOut: () => void }) { return <section className="view-page"><p className="eyebrow">MY PLAN</p><h1>{profile.displayName}的清新計畫</h1><div className="profile-card"><div className="profile-orb">{typeEmoji(profile.toxinType)}</div><div><small>目前計畫</small><h2>{profile.toxinType}</h2><p>開始日期：{profile.startDate}</p></div></div><div className="settings-list"><div><span>🔐</span><p><strong>帳號已受保護</strong><small>使用 Supabase 信箱與密碼安全登入</small></p></div><button onClick={onRestart}><span>🧭</span><p><strong>重新選擇毒型</strong><small>重新做檢測或調整你的結果</small></p><b>›</b></button><a href={assessmentUrl} target="_blank" rel="noreferrer"><span>↗</span><p><strong>再次前往線上檢測</strong><small>將在新分頁開啟</small></p><b>›</b></a><button onClick={onSignOut}><span>↪</span><p><strong>登出帳號</strong><small>安全結束這次使用</small></p><b>›</b></button></div></section>; }
function typeEmoji(type: ToxinType) { return ({ 斷醣型: "🍬", 淨肝型: "🌱", 微菌型: "🦠", 氧化型: "🫐", 壓力型: "🌬️", 免疫型: "🛡️" } as Record<ToxinType, string>)[type]; }
