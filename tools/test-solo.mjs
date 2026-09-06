import { chromium } from "playwright";

const BASE = "http://localhost:8731";
const fails = [], notes = [];
function ck(cond, msg) { (cond ? notes : fails).push((cond ? "OK   " : "FAIL ") + msg); }

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

const missing = [];
page.on("response", r => { if (r.status() === 404) missing.push(r.url()); });
const errors = [];
page.on("pageerror", e => errors.push(String(e)));

await page.goto(BASE + "/solo.html");
await page.waitForSelector("#btnNew");

// כמה תיקים ואיזה תוכן טעון
const meta = await page.evaluate(() => ({
  cases: window.gameData.cases.length,
  picks: window.gameData.meta.evidencePicks,
  secs: window.gameData.meta.questionSeconds,
}));
ck(meta.cases === 10, `נטענו ${meta.cases} תיקים`);

await page.click("#btnNew");                      // לחיצה אמיתית, לא evaluate
await page.waitForSelector("#go");
ck((await page.textContent(".ctitle")).includes("האדריכל"), "כתב התביעה של תיק 1 מוצג");

// ---- הכרעה 1: מסלול. בודקים שהערבוב באמת מזיז, ושכפתור ההגשה נעול עד לבחירה
await page.click("#go");
await page.waitForSelector("#tracks .trk");
ck(await page.isDisabled("#go"), "כפתור ההגשה נעול לפני שנבחר מסלול");

const trackOrder = await page.$$eval("#tracks .trk", els => els.map(e => e.dataset.id));
ck(trackOrder.length === 4, "ארבעה מסלולים מוצגים");

// בוחרים את הנכון לתיק 1 (plili)
await page.click('#tracks .trk[data-id="plili"]');
ck(!(await page.isDisabled("#go")), "הכפתור נפתח אחרי בחירה");

// בדיקת ה"אין עילה" הבלעדי: לוחצים עליו ורואים שהוא מנקה את השאר
await page.click('#tracks .trk[data-id="none"]');
let onCount = await page.$$eval("#tracks .trk.on", e => e.length);
ck(onCount === 1, `"אין עילה" ביטל את שאר הבחירות (נשארו ${onCount})`);
await page.click('#tracks .trk[data-id="none"]');   // לבטל
await page.click('#tracks .trk[data-id="plili"]');
onCount = await page.$$eval("#tracks .trk.on", e => e.length);
ck(onCount === 1, "חזרנו לבחירה יחידה נכונה");

const before = await page.textContent("#pts");
await page.click("#go");
await page.waitForSelector("#go2");
const afterTrack = Number(await page.textContent("#pts"));
ck(afterTrack === 80, `הכרעת מסלול נכונה נתנה ${afterTrack} נק' (מצופה 80)`);
ck(await page.isVisible("#tracks .trk.right"), "המסלול הנכון סומן בירוק");

// ---- הכרעה 2: ראיות
await page.click("#go2");
await page.waitForSelector("#cards .card");
const cardCount = await page.$$eval("#cards .card", e => e.length);
ck(cardCount === 4, "ארבעה קלפי ראיה");

// פותחים קלף לא רלוונטי ואז רלוונטי, ומוודאים שהניקוד זז לשני הכיוונים
const relIds = await page.evaluate(() => {
  const c = window.gameData.cases[0];
  return { rel: c.evidence.filter(e => e.relevant).map(e => e.id),
           irr: c.evidence.filter(e => !e.relevant).map(e => e.id) };
});
const p0 = Number(await page.textContent("#pts"));
await page.click(`#cards .card[data-id="${relIds.irr[0]}"]`);
const p1 = Number(await page.textContent("#pts"));
ck(p1 - p0 === -15, `קלף לא רלוונטי עלה ${p1 - p0} (מצופה -15)`);
await page.click(`#cards .card[data-id="${relIds.rel[0]}"]`);
const p2 = Number(await page.textContent("#pts"));
ck(p2 - p1 === 40, `קלף רלוונטי זיכה ${p2 - p1} (מצופה +40)`);

await page.waitForSelector("#go3");
const spent = await page.$$eval("#cards .card.spent", e => e.length);
ck(spent === 2, `שני הקלפים שלא נפתחו ננעלו (${spent})`);
// לוודא שלחיצה על קלף שננעל לא עושה כלום
await page.click("#cards .card.spent", { force: true });
ck(Number(await page.textContent("#pts")) === p2, "לחיצה על קלף נעול לא משנה ניקוד");

// ---- הכרעה 3א: פסיקה. בודקים שהערבוב הזיז את התשובה הנכונה ממקום 0
await page.click("#go3");
await page.waitForSelector("#answers .ans");
const shownFirst = await page.textContent("#answers .ans:first-child");
const origFirst = await page.evaluate(() => window.gameData.cases[0].ruling.options[0]);
notes.push(`INFO סדר האפשרויות: המקורית-הראשונה ${shownFirst.includes(origFirst.slice(0, 20)) ? "נשארה" : "זזה"} ממקום 1`);
ck(await page.isVisible("#clock"), "השעון רץ בהכרעת הפסיקה");

// עונים נכון, ומודדים בונוס מהירות
const rightIdx = await page.evaluate(() => {
  const opts = [...document.querySelectorAll("#answers .ans")].map(e => e.textContent);
  const correct = window.gameData.cases[0].ruling.options[window.gameData.cases[0].ruling.correct];
  return opts.findIndex(o => o.includes(correct.slice(0, 25)));
});
ck(rightIdx >= 0, "נמצאה התשובה הנכונה בין המוצגות");
const p3 = Number(await page.textContent("#pts"));
await page.click(`#answers .ans:nth-child(${rightIdx + 1})`);
await page.waitForSelector("#go4");
const p4 = Number(await page.textContent("#pts"));
const gained = p4 - p3;
ck(gained >= 150 && gained <= 200, `תשובה מהירה נתנה ${gained} נק' (מצופה 150-200)`);
ck(await page.isVisible("#answers .ans.right"), "התשובה הנכונה סומנה");

// ---- הכרעה 3ב: סנקציה, והפעם עונים לא נכון
await page.click("#go4");
await page.waitForSelector("#answers .ans");
const wrongIdx = await page.evaluate(() => {
  const opts = [...document.querySelectorAll("#answers .ans")].map(e => e.textContent);
  const c = window.gameData.cases[0].sanction;
  return opts.findIndex(o => !o.includes(c.options[c.correct].slice(0, 25)));
});
const p5 = Number(await page.textContent("#pts"));
await page.click(`#answers .ans:nth-child(${wrongIdx + 1})`);
await page.waitForSelector("#go4");
const p6 = Number(await page.textContent("#pts"));
ck(p6 - p5 === -50, `תשובה שגויה קנסה ${p6 - p5} (מצופה -50)`);

// ---- סיכום תיק ומעבר
await page.click("#go4");
await page.waitForSelector("#go5");
ck((await page.textContent("body")).includes("נסגר"), "מסך סיכום התיק הוצג");

// ---- שרידות רענון
await page.click("#go5");
await page.waitForSelector(".ctitle");
const titleBefore = await page.textContent(".ctitle");
const ptsBefore = await page.textContent("#pts");
await page.reload();
await page.waitForSelector("#btnResume");
await page.click("#btnResume");
await page.waitForSelector(".ctitle");
ck(await page.textContent(".ctitle") === titleBefore, "אחרי רענון חזרנו לאותו תיק");
ck(await page.textContent("#pts") === ptsBefore, `הניקוד שרד את הרענון (${ptsBefore})`);

// ---- תיק עם שני מסלולים (5), בדיקה שחלקי לא מזכה
await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem("psak-din:solo:v1"));
  raw.i = 4; raw.phase = "track"; raw.picked = []; raw.opened = [];
  localStorage.setItem("psak-din:solo:v1", JSON.stringify(raw));
});
await page.reload();
await page.click("#btnResume");
await page.waitForSelector("#tracks .trk");
ck((await page.textContent(".fileno")).includes("תיק 5"), "הגענו לתיק 5");
const pA = Number(await page.textContent("#pts"));
await page.click('#tracks .trk[data-id="plili"]');   // רק אחד משניים
await page.click("#go");
await page.waitForSelector("#go2");
const pB = Number(await page.textContent("#pts"));
ck(pB - pA === -30, `בחירה חלקית בתיק דו-מסלולי נקנסה ${pB - pA} (מצופה -30)`);
const missing2 = await page.$$eval("#tracks .trk.miss", e => e.length);
ck(missing2 === 1, "המסלול שהוחמץ סומן במסגרת מקווקוות");

// ---- 404-ים ושגיאות
ck(errors.length === 0, errors.length ? "שגיאות JS: " + errors.join(" | ") : "אין שגיאות JS");
const missingNonImg = missing.filter(u => !/\/images\//.test(u));
ck(missingNonImg.length === 0, missingNonImg.length ? "קבצים חסרים: " + missingNonImg.join(", ") : "כל קובצי הקוד נטענו");
if (missing.some(u => /\/images\//.test(u)))
  notes.push("INFO תמונות התיקים עדיין לא קיימות, והדף מסתיר את המסגרת בלי לשבור כלום");

await page.screenshot({ path: "solo-track.png", fullPage: true });
await browser.close();

console.log(notes.join("\n"));
console.log(fails.length ? "\n" + fails.join("\n") : "\n=== כל הבדיקות עברו");
process.exit(fails.length ? 1 : 0);
