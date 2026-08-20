import { createClient } from "@supabase/supabase-js";
import type { ToxinType } from "../app/program";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseKey || "placeholder",
);

type Profile = { displayName: string; toxinType: ToxinType; startDate: string };
type Checkin = { day: number; completed: string[]; sleepAt: string; wakeAt: string; morningMood: string; morningNote: string; eveningMood: string; eveningNote: string };

const toxinCodeByLabel: Record<ToxinType, string> = { 斷醣型: "sugar", 淨肝型: "liver", 微菌型: "microbiome", 氧化型: "oxidative", 壓力型: "stress", 免疫型: "immune" };
const toxinLabelByCode = Object.fromEntries(Object.entries(toxinCodeByLabel).map(([label, code]) => [code, label])) as Record<string, ToxinType>;

function currentUserId() {
  return supabase.auth.getUser().then(({ data, error }) => {
    if (error || !data.user) throw new Error("unauthorized");
    return data.user.id;
  });
}

export async function loadAppData(requestedDay?: number) {
  const userId = await currentUserId();
  const { data: row, error: profileError } = await supabase.from("profiles").select("display_name,toxin_type,program_start_date").eq("id", userId).maybeSingle();
  if (profileError) throw profileError;
  if (!row) return { profile: null, currentDay: 1, checkin: null };

  const start = new Date(row.program_start_date);
  const computedDay = Math.min(21, Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1));
  const day = requestedDay ? Math.min(21, Math.max(1, requestedDay)) : computedDay;
  const { data: checkin, error: checkinError } = await supabase.from("fresh21_checkins").select("*").eq("user_id", userId).eq("day", day).maybeSingle();
  if (checkinError) throw checkinError;

  return {
    profile: { displayName: row.display_name, toxinType: toxinLabelByCode[row.toxin_type] ?? "斷醣型", startDate: row.program_start_date },
    currentDay: day,
    checkin: checkin ? { day, completed: checkin.completed ?? [], sleepAt: checkin.sleep_at ?? "", wakeAt: checkin.wake_at ?? "", morningMood: checkin.morning_mood ?? "", morningNote: checkin.morning_note ?? "", eveningMood: checkin.evening_mood ?? "", eveningNote: checkin.evening_note ?? "" } : null,
  };
}

export async function saveProfileData(profile: Profile) {
  const userId = await currentUserId();
  const { error } = await supabase.from("profiles").upsert({ id: userId, display_name: profile.displayName.slice(0, 40), toxin_type: toxinCodeByLabel[profile.toxinType], program_start_date: profile.startDate }, { onConflict: "id" });
  if (error) throw error;
}

export async function saveCheckinData(checkin: Checkin) {
  const userId = await currentUserId();
  const { error } = await supabase.from("fresh21_checkins").upsert({ user_id: userId, day: checkin.day, completed: checkin.completed.slice(0, 20), sleep_at: checkin.sleepAt, wake_at: checkin.wakeAt, morning_mood: checkin.morningMood, morning_note: checkin.morningNote.slice(0, 1000), evening_mood: checkin.eveningMood, evening_note: checkin.eveningNote.slice(0, 1000), updated_at: new Date().toISOString() }, { onConflict: "user_id,day" });
  if (error) throw error;
}
