import { chromium } from "playwright";

const BASE = "http://localhost:8731";
const fails = [], notes = [];
const ck = (c, m) => (c ? notes : fails).push((c ? "OK   " : "FAIL ") + m);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch();
const errors = [], missing = [];

async function mk(url, w = 420, h = 900) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  p.on("pageerror", e => errors.push(url + ": " + e));
  p.on("response", r => { if (r.status() === 404) missing.push(r.url()); });
  await p.goto(BASE + url);
  return p;
}

// ---- מסך המרצה
const t = await mk("/index.html", 1400, 900);
await t.waitForSelector("#btnMain");
await t.waitForFunction(() => typeof firebase !== "undefined" && window.gameData, null, { timeout: 15000 });

// מנקים לפני שמתחילים - הפרויקט חדש, אבל לא מתחילים על שאריות
await t.evaluate(() => firebase.database().ref().set({ game: { state: "lobby" } }));
await sleep(1200);
ck(await t.isVisible("#qr canvas"), "קוד ה-QR צויר בלובי");

// ---- שלושה סטודנטים, בהצטרפות אמיתית
const names = ["דנה", "יואב", "מירב"];
const st = [];
for (const nm of names) {
  const p = await mk("/play.html");
  await p.waitForSelector("#join");
  await p.fill("#nm", nm);
  await p.click("#join");                       // לחיצה אמיתית
  await p.waitForSelector(".pulse", { timeout: 15000 });
  st.push(p);
}
await sleep(1500);
ck((await t.textContent("#btnMain")).includes("3"), "מסך המרצה סופר 3 מצטרפים");

// ---- בדיקת האבטחה: השלט לא מחזיק תשובות
const remoteSrc = await (await fetch(BASE + "/play.html")).text();
ck(!/gameData\.js/.test(remoteSrc), "play.html לא טוען את gameData.js");
const leak = await st[0].evaluate(() => typeof window.gameData);
ck(leak === "undefined", `בטלפון אין window.gameData (${leak})`);

// ---- תיק 1: כתב התביעה
await t.click("#btnMain");
await sleep(900);
ck((await t.textContent("h1.case")).includes("האדריכל"), "כתב התביעה על מסך המרצה");
ck((await st[0].textContent("body")).includes("כתב התביעה"), "הטלפונים מציגים שהתיק על המסך");

// ---- הכרעה 1: מסלול
await t.click("#btnMain");
await sleep(1200);
ck((await t.textContent("h2.q")).includes("לאן התיק"), "שאלת המסלול שודרה");
const optCount = await st[0].$$eval("#opts .opt", e => e.length);
ck(optCount === 4, `בטלפון ${optCount} אפשרויות מסלול`);

// כל שלושתם עונים: שניים נכון, אחת לא
const idxPlili = await t.evaluate(() => live.ids.indexOf("plili"));
const idxEz = await t.evaluate(() => live.ids.indexOf("ezrachi"));
ck(idxPlili >= 0, "המסלול הנכון קיים ברשימה ששודרה");
for (let i = 0; i < 3; i++) {
  const pick = i < 2 ? idxPlili : idxEz;
  await st[i].click(`#opts .opt:nth-child(${pick + 1})`);
  await st[i].click("#submit");
  await sleep(250);
}
await sleep(2500);   // חשיפה אוטומטית כשכולם ענו
const state1 = await t.evaluate(() => cur.state);
ck(state1 === "reveal", `חשיפה אוטומטית אחרי שכולם הגישו (state=${state1})`);

const scores1 = await t.evaluate(() =>
  Object.values(players).map(p => ({ n: p.name, s: p.score })).sort((a, b) => b.s - a.s));
ck(scores1[0].s === 80 && scores1[2].s === -30,
   `ניקוד המסלול: ${scores1.map(x => x.n + "=" + x.s).join(", ")} (מצופה 80,80,-30)`);
ck(await t.isVisible(".opt.right"), "האפשרות הנכונה סומנה על מסך המרצה");
const tally = await t.$$eval(".opt .tally", e => e.map(x => x.textContent.trim()));
ck(tally.reduce((s, x) => s + Number(x), 0) === 3, `ספירת הסימונים מסתכמת ל-3 (${tally.join("/")})`);
ck((await st[0].textContent("body")).includes("צדקת"), "טלפון שצדק קיבל משוב חיובי");
ck((await st[2].textContent("body")).includes("לא הפעם"), "טלפון ששגה קיבל משוב שלילי");

// ---- הכרעה 2: ראיות, בדיוק שניים
await t.click("#btnMain");
await sleep(1200);
const exact = await st[0].evaluate(() => cur.prompt.exact);
ck(exact === 2, `הטלפון יודע שצריך לבחור בדיוק ${exact}`);
ck(await st[0].isDisabled("#submit"), "כפתור השליחה נעול לפני שנבחרו שניים");
await st[0].click("#opts .opt:nth-child(1)");
ck(await st[0].isDisabled("#submit"), "עדיין נעול אחרי בחירה אחת");
await st[0].click("#opts .opt:nth-child(2)");
ck(!(await st[0].isDisabled("#submit")), "נפתח אחרי שתי בחירות");
await st[0].click("#opts .opt:nth-child(3)");   // לא אמור להוסיף שלישי
const picked = await st[0].$$eval("#opts .opt.on", e => e.length);
ck(picked === 2, `אי אפשר לבחור שלישי (נבחרו ${picked})`);

// מנקים את מה שהראשון סימן בבדיקה שלמעלה, ואז כולם בוחרים לפי תוכנית
const relIdx = await t.evaluate(() => live.correctIds.map(id => live.ids.indexOf(id)));
for (const on of await st[0].$$("#opts .opt.on")) await on.click();
ck((await st[0].$$eval("#opts .opt.on", e => e.length)) === 0, "אפשר לבטל סימון ראיה");
const allIdx = [0, 1, 2, 3];
const irrIdx = allIdx.filter(i => !relIdx.includes(i));
const plan = [relIdx, [relIdx[0], irrIdx[0]], irrIdx];
const pBefore = await t.evaluate(() => Object.values(players).map(p => p.score));
for (let i = 0; i < 3; i++) {
  for (const k of plan[i]) await st[i].click(`#opts .opt:nth-child(${k + 1})`);
  await st[i].click("#submit");
  await sleep(250);
}
await sleep(2500);
const evScores = await t.evaluate(() =>
  Object.values(players).map(p => ({ n: p.name, last: p.last })));
const lasts = evScores.map(x => x.last).sort((a, b) => b - a);
ck(lasts[0] === 80 && lasts[1] === 25 && lasts[2] === -30,
   `ניקוד הראיות: ${lasts.join(", ")} (מצופה 80 / 25 / -30)`);

// ---- הכרעה 3א: פסיקה על שעון
await t.click("#btnMain");
await sleep(1200);
ck(await t.isVisible("#clock"), "השעון רץ על מסך המרצה");
ck(await st[0].isVisible("#clock"), "השעון רץ גם בטלפון");
const correctIdx = await t.evaluate(() => live.correct);
const pB = await t.evaluate(() => Object.values(players).find(p => p.name === "דנה").score);
await st[0].click(`#opts .opt:nth-child(${correctIdx + 1})`);
await st[1].click(`#opts .opt:nth-child(${((correctIdx + 1) % 4) + 1})`);
await st[2].click(`#opts .opt:nth-child(${correctIdx + 1})`);
await sleep(2500);
const pA = await t.evaluate(() => Object.values(players).find(p => p.name === "דנה").score);
const gain = pA - pB;
ck(gain >= 150 && gain <= 200, `פסיקה מהירה ונכונה נתנה ${gain} (מצופה 150-200)`);
const wrongLast = await t.evaluate(() => Object.values(players).find(p => p.name === "יואב").last);
ck(wrongLast === -50, `פסיקה שגויה קנסה ${wrongLast}`);

// ---- הכרעה 3ב: סנקציה, ואז לוח התוצאות
await t.click("#btnMain");
await sleep(1200);
const cIdx2 = await t.evaluate(() => live.correct);
for (const p of st) await p.click(`#opts .opt:nth-child(${cIdx2 + 1})`);
await sleep(2500);
await t.click("#btnMain");
await sleep(1000);
ck((await t.textContent("body")).includes("אחרי תיק 1"), "לוח התוצאות בין התיקים הוצג");
const bars = await t.$$eval(".bar", e => e.length);
ck(bars === 3, `שלוש עמודות ניקוד (${bars})`);

await t.screenshot({ path: "class-scores.png", fullPage: true });

// ---- רענון של מסך המרצה באמצע תיק
await t.click("#btnMain");        // לתיק 2
await sleep(1000);
await t.click("#btnMain");        // הכרעת מסלול של תיק 2
await sleep(1200);
const qBefore = await t.textContent("h2.q");
await t.reload();
await t.waitForSelector("#btnMain");
await sleep(2500);
const qAfter = await t.textContent("h2.q").catch(() => "");
ck(qAfter === qBefore, `מסך המרצה שרד רענון באמצע תיק ("${qAfter.slice(0, 25)}")`);
const optsAfter = await t.$$eval(".opt .tx", e => e.map(x => x.textContent));
const optsPhone = await st[0].$$eval("#opts .opt span:last-child", e => e.map(x => x.textContent));
ck(JSON.stringify(optsAfter) === JSON.stringify(optsPhone),
   "סדר האפשרויות אחרי הרענון זהה למה שכבר על הטלפונים");

// ---- ניקוי
await t.evaluate(() => firebase.database().ref().set({ game: { state: "lobby" } }));
await sleep(1200);
const left = await t.evaluate(async () =>
  (await firebase.database().ref("players").once("value")).numChildren());
ck(left === 0, `אחרי איפוס לא נשארו שחקנים (${left})`);

ck(errors.length === 0, errors.length ? "שגיאות JS: " + errors.slice(0, 3).join(" | ") : "אין שגיאות JS");
const miss = missing.filter(u => !/\/images\//.test(u));
ck(miss.length === 0, miss.length ? "חסרים: " + miss.join(", ") : "כל הקבצים נטענו");

await browser.close();
console.log(notes.join("\n"));
console.log(fails.length ? "\n" + fails.join("\n") : "\n=== כל הבדיקות עברו");
process.exit(fails.length ? 1 : 0);
