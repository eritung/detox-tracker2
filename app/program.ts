export const toxinTypes = ["斷醣型", "淨肝型", "微菌型", "氧化型", "壓力型", "免疫型"] as const;
export type ToxinType = (typeof toxinTypes)[number];
export type DailyTask = { id: string; icon: string; category: string; title: string; detail: string; tone: string };

const dailyFocus = [
  ["完成起始評估", "填寫總毒素負荷問卷，並完成靈性與能量狀態評估"],
  ["整理飲食環境", "找出家中最常出現的精緻糖與高加工澱粉，先替換一項"],
  ["建立核心起點", "完成站樁或深蹲 3–5 分鐘，記住今天的身體感受"],
  ["找到適合的氣功", "從三種氣功練習中選一種，完成 15 分鐘"],
  ["啟動心肺節奏", "快走、慢跑或超慢跑三擇一，完成 10 分鐘"],
  ["記錄避毒行動", "寫下一個今天有做到的避毒改變，以及它帶來的感受"],
  ["第一週回顧", "回顧本週最容易與最困難的任務，為下週留一句提醒"],
  ["辨識今天的情緒", "用情緒輪找出目前最貼近的情緒，先不急著改變它"],
  ["看見情緒能力", "完成 EQ 量表，找出一個想加強的面向"],
  ["第一次正念練習", "安排 15–30 分鐘正念，把注意力帶回呼吸與身體"],
  ["升級主食選擇", "今天至少一餐選擇低 GI 全穀、地瓜或玉米"],
  ["補進優蛋白", "以魚、去皮雞肉、豆製品、蛋或乳製品安排一餐"],
  ["完成彩色蔬菜盤", "以 5–7 份蔬菜為目標，加入十字花科、菇類或藻類"],
  ["第二週回顧", "整理最有感的飲食、運動或正念改變，決定要留下哪一項"],
  ["重新檢視負荷", "再次填寫總毒素負荷問卷，找出仍需調整的部分"],
  ["加入個別化食材", "依自己的毒型，挑選一種本週亮點食材加入今天飲食"],
  ["加強身體練習", "依毒型建議加強核心、氣功或腹式呼吸"],
  ["練習情緒釋放", "結合 SAR 三步驟、EQ 五步驟與呼吸，整理一個壓力事件"],
  ["重新檢測壓力", "再次完成 PSS 或 EQ 量表，觀察三週以來的變化"],
  ["選一個進階工具", "從數息、零極限、身體掃描或四句話中選一項練習"],
  ["完成 21 天回顧", "寫下三個改變、一個想維持的習慣，以及下一步計畫"],
] as const;

const typeFocus: Record<ToxinType, { nutrition: string; movement: string; support: string }> = {
  斷醣型: { nutrition: "加入植物多酚：綠茶、莓果、薑黃或肉桂", movement: "加入核心肌力：仰臥起坐、伏地挺身等", support: "如需營養補充，先諮詢專業人員評估 B 群、ALA、鎂或牛磺酸" },
  淨肝型: { nutrition: "增加十字花科、青花菜苗、芥蘭菜苗與黑豆", movement: "氣功加強「握拳扶頸肝膽開」至少 9 回", support: "如需營養補充，先諮詢專業人員評估乳薊素、NAC、維生素 C／E" },
  微菌型: { nutrition: "加入優格、納豆、味噌或泡菜，並酌量使用蔥蒜", movement: "每天額外增加腹式呼吸 5 分鐘", support: "如需營養補充，先諮詢專業人員評估益生菌等方案" },
  氧化型: { nutrition: "強化莓果、綠茶、黑豆、可可或葡萄籽", movement: "維持本週基礎運動計畫", support: "如需營養補充，先諮詢專業人員評估維生素 C／E、CoQ10 或硒" },
  壓力型: { nutrition: "補充高鎂食材、綠葉菜與易消化燉煮魚肉", movement: "維持本週基礎運動計畫", support: "重新檢測 PSS 與 EQ，針對需要加強處調整策略" },
  免疫型: { nutrition: "增加 Omega-3、富含鋅食材、發酵食品與多酚", movement: "維持本週基礎運動計畫", support: "重新檢測 PSS 與 EQ；補充品請先由專業人員評估" },
};

export function getDayTasks(day: number, toxinType: ToxinType): DailyTask[] {
  const week = day <= 7 ? 1 : day <= 14 ? 2 : 3;
  const nutrition = week === 1 ? "避開精緻糖與高加工澱粉；先從方便可近的選擇開始" : week === 2 ? "加入低 GI 全穀、原味堅果、好油、優蛋白與 5–7 份蔬菜" : `維持基礎飲食，${typeFocus[toxinType].nutrition}`;
  const movement = week === 1 ? "30 分鐘活動；核心 3–5 分鐘、氣功 15 分鐘或有氧 10 分鐘" : week === 2 ? "本週至少 5 天、每天 30 分鐘，氣功與有氧可交替" : `本週運動 5 次；${typeFocus[toxinType].movement}`;
  const stress = week === 1 ? "腹式呼吸 10 分鐘，留意今天的壓力訊號" : week === 2 ? "辨識情緒並做 15–30 分鐘正念練習" : "整合正念與腹式呼吸 15–30 分鐘，練習釋放壓力";
  const spirit = week === 1 ? "完成早晨與晚間基礎功課，需要時做 10 秒或 60 秒練習" : week === 2 ? "依本週評估結果完成早晚功課，可使用客製化內容" : "完成早晚功課，並維持感恩、寬恕與愛的練習";
  return [
    { id: "daily-focus", icon: "📅", category: `DAY ${day}`, title: dailyFocus[day - 1][0], detail: dailyFocus[day - 1][1], tone: "teal" },
    { id: "nutrition", icon: "🥗", category: "營養", title: week === 1 ? "避開期飲食" : week === 2 ? "導入期飲食" : `${toxinType}亮點食材`, detail: nutrition, tone: "green" },
    { id: "movement", icon: "🏃", category: "運動", title: "今日身體練習", detail: movement, tone: "blue" },
    { id: "detox", icon: "💧", category: "排毒", title: week === 3 ? "重新檢視排毒策略" : "日常避毒排毒", detail: week === 3 ? "重新檢視總毒素負荷，調整尚未改善的部分" : "記錄今天實際做到的避毒行動或改變", tone: "gold" },
    { id: "stress", icon: "🌬️", category: "紓壓", title: "讓身心慢下來", detail: stress, tone: "red" },
    { id: "spirit", icon: "✨", category: "靈昇", title: "早晚基礎功課", detail: spirit, tone: "purple" },
    ...(week === 3 ? [{ id: "focus", icon: "🎯", category: "個別化", title: `${toxinType}本週提醒`, detail: typeFocus[toxinType].support, tone: "teal" }] : []),
  ];
}

export const moodOptions = [
  { value: "great", emoji: "😄", label: "很好" }, { value: "good", emoji: "🙂", label: "不錯" }, { value: "okay", emoji: "😐", label: "普通" }, { value: "low", emoji: "😔", label: "低落" }, { value: "tired", emoji: "😴", label: "疲累" },
];
