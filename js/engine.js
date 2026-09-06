// מנוע משותף ל"פסק דין": ערבוב, ניקוד וסיכום תיק.
// נטען גם ב-solo.html וגם ב-index.html (מסך המרצה). לא נטען ב-play.html.
console.log("[engine] נטען");

window.psakDin = (function () {
  // ------------------------------------------------------------------
  // ערבוב. כל 20 ההכרעות נכתבו בקובץ עם correct:0, ולכן בלי ערבוב
  // בזמן ריצה כל התשובות הנכונות יושבות ראשונות. מחזיר גם את הפרמוטציה
  // כדי שאפשר יהיה לתרגם בין אינדקס מוצג לאינדקס מקורי.
  // ------------------------------------------------------------------
  function shuffled(list, rnd) {
    const perm = list.map((_, i) => i);
    for (let i = perm.length - 1; i > 0; i--) {
      const j = Math.floor((rnd ? rnd() : Math.random()) * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return { items: perm.map((i) => list[i]), perm };
  }

  // שאלה מעורבבת: מחזיר אפשרויות בסדר חדש ואת המקום שאליו עברה הנכונה.
  function shuffleQuestion(q, rnd) {
    const { items, perm } = shuffled(q.options, rnd);
    return { q: q.q, options: items, correct: perm.indexOf(q.correct), perm, explanation: q.explanation };
  }

  // מחולל אקראי עם זרע, כדי שמסך המרצה וכל הטלפונים יראו אותו סדר.
  function seededRandom(seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  function seedOf(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // ------------------------------------------------------------------
  // ניקוד
  // ------------------------------------------------------------------

  // בונוס מהירות דועך מעריכית. בונוס ליניארי לא מתגמל מהירות בפועל:
  // בשעון של 25 שניות, הפרש של 3 שניות היה שווה פחות מ-20 נקודות.
  function speedScore(meta, msUsed) {
    const frac = Math.max(0, Math.min(1, msUsed / (meta.questionSeconds * 1000)));
    return Math.round(meta.basePoints + meta.maxSpeedBonus * Math.exp(-meta.speedDecay * frac));
  }

  function timedPoints(meta, isRight, msUsed) {
    return isRight ? speedScore(meta, msUsed) : meta.wrongPenalty;
  }

  // הכרעת המסלול היא הכול או כלום: הקבוצה שנבחרה חייבת להיות זהה לנכונה.
  function tracksMatch(picked, correct) {
    if (picked.length !== correct.length) return false;
    const a = [...picked].sort().join("|");
    const b = [...correct].sort().join("|");
    return a === b;
  }

  function trackPoints(meta, picked, correct) {
    return tracksMatch(picked, correct) ? meta.trackPoints : meta.trackPenalty;
  }

  function evidencePoints(meta, card) {
    return card.relevant ? meta.evidenceRight : meta.evidenceWrong;
  }

  // ------------------------------------------------------------------
  // תארים. הקצאה חמדנית לפי סדר awards, תואר אחד לכל שחקן,
  // כדי שכמעט כל הכיתה תצא עם משהו.
  // ------------------------------------------------------------------
  function assignAwards(players, awards, metrics) {
    const taken = new Set();
    const out = [];
    if (players.length < 4) return out; // כולם על הפודיום, אין טעם בתארים
    for (const aw of awards) {
      const scorer = metrics[aw.id];
      if (!scorer) continue;
      let best = null, bestVal = -Infinity;
      for (const p of players) {
        if (taken.has(p.id)) continue;
        const v = scorer(p);
        if (v === null || v === undefined) continue;
        if (v > bestVal) { bestVal = v; best = p; }
      }
      if (best && bestVal > -Infinity) { taken.add(best.id); out.push({ award: aw, player: best, value: bestVal }); }
    }
    return out;
  }

  return {
    shuffled, shuffleQuestion, seededRandom, seedOf,
    speedScore, timedPoints, tracksMatch, trackPoints, evidencePoints, assignAwards,
  };
})();
