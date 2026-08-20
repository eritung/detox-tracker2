# 清新計畫｜21 天健康打卡

專為 KOL 課程體驗者設計的 21 天健康任務與身心紀錄 App。

## [開啟線上 App →](https://eritung.github.io/detox-tracker2/)

功能包含：

- 依毒素類型顯示不同任務清單
- 可查看與切換 Day 1–21 每日安排
- 每日任務勾選、睡眠時間、早晚心情與自由筆記
- Supabase 信箱密碼登入，每位使用者只能存取自己的紀錄

### 管理者設定

1. 在 Supabase SQL Editor 執行 `supabase/schema.sql`。
2. 在 GitHub repository secrets 新增 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`。
3. 在 GitHub Pages 將 Source 設定為 GitHub Actions。

正式健康檢測：[IPWA 毒素類型問卷](https://www.ipwa.tw/questionnaire/toxin-type)

> 本工具用於課程體驗與生活紀錄，不取代專業醫療建議。
