import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

type AppEnv = { DB?: D1Database };
async function database() {
  const db = (env as unknown as AppEnv).DB;
  if (!db) throw new Error("DB_UNAVAILABLE");
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS profiles (user_id TEXT PRIMARY KEY NOT NULL, display_name TEXT NOT NULL, toxin_type TEXT NOT NULL, start_date TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS checkins (user_id TEXT NOT NULL, day INTEGER NOT NULL, completed_json TEXT NOT NULL DEFAULT '[]', sleep_at TEXT NOT NULL DEFAULT '', wake_at TEXT NOT NULL DEFAULT '', morning_mood TEXT NOT NULL DEFAULT '', morning_note TEXT NOT NULL DEFAULT '', evening_mood TEXT NOT NULL DEFAULT '', evening_note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL, PRIMARY KEY (user_id, day))"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_checkins_user_day ON checkins(user_id, day)"),
  ]);
  return db;
}
function userId(request: NextRequest) { const id = request.headers.get("oai-authenticated-user-id"); if (id) return id; return request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1" ? "local-preview-user" : null; }
function normalizeCheckin(row: Record<string, unknown> | null, day: number) { if (!row) return null; let completed: string[] = []; try { completed = JSON.parse(String(row.completed_json ?? "[]")); } catch { completed = []; } return { day, completed, sleepAt: row.sleep_at ?? "", wakeAt: row.wake_at ?? "", morningMood: row.morning_mood ?? "", morningNote: row.morning_note ?? "", eveningMood: row.evening_mood ?? "", eveningNote: row.evening_note ?? "" }; }

export async function GET(request: NextRequest) {
  const id = userId(request); if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const db = await database(); const requested = Number(request.nextUrl.searchParams.get("day") || "0");
    const profile = await db.prepare("SELECT display_name, toxin_type, start_date FROM profiles WHERE user_id = ?").bind(id).first<Record<string, unknown>>();
    if (!profile) return NextResponse.json({ profile: null });
    const start = new Date(String(profile.start_date)); const currentDay = requested ? Math.min(21, Math.max(1, requested)) : Math.min(21, Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1));
    const row = await db.prepare("SELECT * FROM checkins WHERE user_id = ? AND day = ?").bind(id, currentDay).first<Record<string, unknown>>();
    return NextResponse.json({ profile: { displayName: profile.display_name, toxinType: profile.toxin_type, startDate: profile.start_date }, currentDay, checkin: normalizeCheckin(row, currentDay) });
  } catch { return NextResponse.json({ error: "database_unavailable" }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  const id = userId(request); if (!id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>; const db = await database(); const now = new Date().toISOString();
    if (body.action === "profile") {
      const displayName = String(body.displayName ?? "").trim().slice(0, 40); const toxinType = String(body.toxinType ?? ""); const startDate = String(body.startDate ?? ""); const valid = ["斷醣型", "淨肝型", "微菌型", "氧化型", "壓力型", "免疫型"];
      if (!displayName || !valid.includes(toxinType) || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
      await db.prepare("INSERT INTO profiles (user_id, display_name, toxin_type, start_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name, toxin_type=excluded.toxin_type, start_date=excluded.start_date, updated_at=excluded.updated_at").bind(id, displayName, toxinType, startDate, now, now).run();
      return NextResponse.json({ ok: true });
    }
    if (body.action === "checkin") {
      const day = Math.min(21, Math.max(1, Number(body.day ?? 1))); const completed = Array.isArray(body.completed) ? body.completed.filter((v): v is string => typeof v === "string").slice(0, 10) : []; const fields = ["sleepAt", "wakeAt", "morningMood", "morningNote", "eveningMood", "eveningNote"].map((key) => String(body[key] ?? "").slice(0, 1000));
      await db.prepare("INSERT INTO checkins (user_id, day, completed_json, sleep_at, wake_at, morning_mood, morning_note, evening_mood, evening_note, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, day) DO UPDATE SET completed_json=excluded.completed_json, sleep_at=excluded.sleep_at, wake_at=excluded.wake_at, morning_mood=excluded.morning_mood, morning_note=excluded.morning_note, evening_mood=excluded.evening_mood, evening_note=excluded.evening_note, updated_at=excluded.updated_at").bind(id, day, JSON.stringify(completed), ...fields, now).run();
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch { return NextResponse.json({ error: "save_failed" }, { status: 503 }); }
}
