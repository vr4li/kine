/** بيانات الحالات والتمارين + محلل الوضعية */

export const CONDITIONS = [
  {
    id: "disc",
    keywords: ["انزلاق", "غضروفي", "غضروف", "ديسك", "قرص", "ظهر", "lumbar", "disc", "herniation", "spine", "back"],
    nameAr: "انزلاق غضروفي / أسفل الظهر",
    nameEn: "Disc Herniation / Lower Back",
    exercises: ["cat-cow", "pelvic-tilt", "bird-dog"],
  },
  {
    id: "knee",
    keywords: ["ركبة", "ركبت", "acl", "رباط", "knee", "mcl", "quad"],
    nameAr: "إعادة تأهيل الركبة",
    nameEn: "Knee Rehabilitation",
    exercises: ["knee-raise", "heel-slide", "quad-set"],
  },
  {
    id: "shoulder",
    keywords: ["كتف", "shoulder", "دوران", "rotator"],
    nameAr: "إصابات الكتف",
    nameEn: "Shoulder Rehab",
    exercises: ["bird-dog", "pelvic-tilt"],
  },
];

export const EXERCISES = {
  "cat-cow": {
    id: "cat-cow",
    image: "./exercises/steps/cat-cow-1.svg",
    nameAr: "تمرين القط والبقرة",
    nameEn: "Cat-Cow Stretch",
    descAr: "3 خطوات — انحناء الظهر بلطف",
    descEn: "3 steps — gentle spine movement",
    type: "spine",
    steps: [
      { image: "./exercises/steps/cat-cow-1.svg", textAr: "قفي على يديك وركبتيك — ظهر مستقيم", textEn: "Hands and knees — neutral spine" },
      { image: "./exercises/steps/cat-cow-2.svg", textAr: "انحني الظهر للأعلى (وضعية القط)", textEn: "Round spine up (cat pose)" },
      { image: "./exercises/steps/cat-cow-3.svg", textAr: "انحني الظهر للأسفل (وضعية البقرة)", textEn: "Arch spine down (cow pose)" },
    ],
  },
  "pelvic-tilt": {
    id: "pelvic-tilt",
    image: "./exercises/steps/pelvic-tilt-1.svg",
    nameAr: "ميلان الحوض",
    nameEn: "Pelvic Tilt",
    descAr: "3 خطوات — تقوية أسفل الظهر",
    descEn: "3 steps — lower back activation",
    type: "spine",
    steps: [
      { image: "./exercises/steps/pelvic-tilt-1.svg", textAr: "استلقي واثني الركبتين", textEn: "Lie on back, bend knees" },
      { image: "./exercises/steps/pelvic-tilt-2.svg", textAr: "اضغطي أسفل الظهر للأرض", textEn: "Press lower back to floor" },
      { image: "./exercises/steps/pelvic-tilt-3.svg", textAr: "ثبّتي 5 ثوانٍ — كرّري 10 مرات", textEn: "Hold 5s — repeat 10 times" },
    ],
  },
  "bird-dog": {
    id: "bird-dog",
    image: "./exercises/steps/bird-dog.jpg",
    nameAr: "طائر-كلب",
    nameEn: "Bird Dog",
    descAr: "3 خطوات — توازن واستقرار الظهر",
    descEn: "3 steps — core stability",
    type: "spine",
    steps: [
      { image: "./exercises/steps/bird-dog-1.svg", textAr: "على اليدين والركبتين — ظهر مستقيم", textEn: "All fours — flat back" },
      { image: "./exercises/steps/bird-dog.jpg", textAr: "مدّي يد ورجل من الجهتين المعاكستين", textEn: "Extend opposite arm and leg" },
      { image: "./exercises/steps/bird-dog-3.svg", textAr: "ثبّتي 5 ثوانٍ ثم بدّلي الجانب", textEn: "Hold 5s then switch sides" },
    ],
  },
  "knee-raise": {
    id: "knee-raise",
    image: "./exercises/steps/knee-raise-1.svg",
    nameAr: "رفع الرجل المستقيم",
    nameEn: "Straight Leg Raise",
    descAr: "3 خطوات — تقوية الركبة بدون ضغط",
    descEn: "3 steps — knee-safe strengthening",
    type: "knee",
    steps: [
      { image: "./exercises/steps/knee-raise-1.svg", textAr: "استلقي — رجل واحدة ممدودة", textEn: "Lie down — one leg straight" },
      { image: "./exercises/steps/knee-raise-2.svg", textAr: "ارفعي الرجل 15–20 سم ببطء", textEn: "Raise leg slowly ~6 inches" },
      { image: "./exercises/steps/knee-raise-3.svg", textAr: "أبقي الركبة مستقيمة — لا تثني", textEn: "Keep knee straight — don't bend" },
    ],
  },
  "heel-slide": {
    id: "heel-slide",
    image: "./exercises/steps/heel-slide-1.svg",
    nameAr: "انزلاق الكعب",
    nameEn: "Heel Slide",
    descAr: "3 خطوات — مرونة الركبة",
    descEn: "3 steps — knee mobility",
    type: "knee",
    steps: [
      { image: "./exercises/steps/heel-slide-1.svg", textAr: "استلقي — ركبة مثنية", textEn: "Lie down — knee bent" },
      { image: "./exercises/steps/heel-slide-2.svg", textAr: "اسحبي الكعب بلطف نحو الأرداف", textEn: "Slide heel toward glutes" },
      { image: "./exercises/steps/heel-slide-3.svg", textAr: "أبقي القدم ملامسة للأرض", textEn: "Keep foot on the floor" },
    ],
  },
  "quad-set": {
    id: "quad-set",
    image: "./exercises/steps/quad-set-guide.png",
    nameAr: "تمرين الفخذ الأمامي",
    nameEn: "Quad Set",
    descAr: "3 خطوات — شد عضلة الفخذ",
    descEn: "3 steps — quadriceps activation",
    type: "knee",
    steps: [
      { image: "./exercises/steps/quad-set-guide.png", textAr: "مدّي رجلتك — ركبة مستقيمة", textEn: "Leg straight — knee extended" },
      { image: "./exercises/steps/quad-set-2.svg", textAr: "اضغطي الركبة للأسفل بقوة", textEn: "Press knee down firmly" },
      { image: "./exercises/steps/quad-set-3.svg", textAr: "شدّي الفخذ — ثبّتي 5 ثوانٍ", textEn: "Tighten thigh — hold 5 seconds" },
    ],
  },
};

/* ---- هندسة الوضعية ---- */
const kp = (map, name, min = 0.25) => {
  const p = map[name];
  return p && p.score >= min ? p : null;
};

const angle = (a, b, c) => {
  if (!a || !b || !c) return null;
  const abx = a.x - b.x, aby = a.y - b.y;
  const cbx = c.x - b.x, cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (!mag) return null;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
};

const avgY = (...pts) => {
  const v = pts.filter(Boolean);
  if (!v.length) return null;
  return v.reduce((s, p) => s + p.y, 0) / v.length;
};

const msg = (ar, en) => (document.documentElement.lang === "en" ? en : ar);

/** يُرجع: { level: 'good'|'warn'|'bad', textAr, textEn } */
export function analyzeExercise(exerciseId, keypoints) {
  const map = {};
  keypoints.forEach((k) => { map[k.name] = k; });

  const visible = keypoints.filter((k) => k.score >= 0.25).length;
  if (visible < 5) {
    return {
      level: "warn",
      textAr: "قف أمام الكاميرا — جسمك كامل بالإطار",
      textEn: "Stand fully in camera frame",
    };
  }

  switch (exerciseId) {
    case "knee-raise":
    case "quad-set": {
      const hip = kp(map, "left_hip") || kp(map, "right_hip");
      const knee = kp(map, "left_knee") || kp(map, "right_knee");
      const ankle = kp(map, "left_ankle") || kp(map, "right_ankle");
      const kneeAngle = angle(hip, knee, ankle);
      if (kneeAngle == null) return needMore();
      if (kneeAngle >= 155) {
        return good("✓ ممتاز — رجل مستقيمة", "✓ Great — leg straight");
      }
      if (kneeAngle >= 130) {
        return warn("⚠ حاول تمديد الركبة أكثر", "⚠ Try to straighten knee more");
      }
      return bad("✗ الركبة مثنية كثير — مدّ رجلتك", "✗ Knee too bent — straighten leg");
    }

    case "heel-slide": {
      const hip = kp(map, "left_hip") || kp(map, "right_hip");
      const knee = kp(map, "left_knee") || kp(map, "right_knee");
      const kneeAngle = angle(hip, knee, kp(map, "left_ankle") || kp(map, "right_ankle"));
      if (kneeAngle == null) return needMore();
      if (kneeAngle >= 90 && kneeAngle <= 140) {
        return good("✓ زاوية الركبة جيدة — استمر", "✓ Good knee angle — keep going");
      }
      return warn("⚠ اسحب الكعب بلطف نحو الأرداف", "⚠ Slide heel gently toward glutes");
    }

    case "cat-cow":
    case "pelvic-tilt":
    case "bird-dog": {
      const ls = kp(map, "left_shoulder"), rs = kp(map, "right_shoulder");
      const lh = kp(map, "left_hip"), rh = kp(map, "right_hip");
      if (!ls || !rs || !lh || !rh) return needMore();

      const shoulderTilt = Math.abs(ls.y - rs.y);
      const hipTilt = Math.abs(lh.y - rh.y);
      const shoulderMid = (ls.x + rs.x) / 2;
      const hipMid = (lh.x + rh.x) / 2;
      const spineLean = Math.abs(shoulderMid - hipMid);

      if (shoulderTilt > 40 || hipTilt > 35) {
        return bad("✗ ظهرك مائل — عدّل وضعيتك للمنتصف", "✗ Torso tilted — center yourself");
      }
      if (spineLean > 50) {
        return warn("⚠ حافظ على العمود الفقري مستقيماً", "⚠ Keep spine aligned");
      }
      if (exerciseId === "bird-dog") {
        const le = kp(map, "left_elbow"), re = kp(map, "right_elbow");
        const la = kp(map, "left_ankle"), ra = kp(map, "right_ankle");
        const armUp = (le && ls && le.y < ls.y - 30) || (re && rs && re.y < rs.y - 30);
        const legUp = (la && lh && la.y < lh.y - 20) || (ra && rh && ra.y < rh.y - 20);
        if (armUp || legUp) {
          return good("✓ ممتاز — ظهر مستقيم وامتداد جيد", "✓ Great — flat back, good extension");
        }
        return warn("⚠ مدّ يد ورجل opposite ببطء", "⚠ Extend opposite arm and leg slowly");
      }
      const shoulderY = avgY(ls, rs);
      const hipY = avgY(lh, rh);
      if (shoulderY != null && hipY != null) {
        return good("✓ وضعية الظهر جيدة — استمر", "✓ Good back posture — continue");
      }
      return warn("⚠ تحرّك ببطء وابقَ مستقراً", "⚠ Move slowly and stay stable");
    }

    default:
      return good("✓ تم رصد وضعيتك", "✓ Pose detected");
  }
}

function needMore() {
  return {
    level: "warn",
    textAr: "اقترب من الكاميرا — لا أرى جسمك كاملاً",
    textEn: "Move closer — can't see full body",
  };
}

function good(textAr, textEn) {
  return { level: "good", textAr, textEn: textEn || textAr };
}

function warn(textAr, textEn) {
  return { level: "warn", textAr, textEn: textEn || textAr };
}

function bad(textAr, textEn) {
  return { level: "bad", textAr, textEn: textEn || textAr };
}

export function findCondition(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return CONDITIONS.find((c) =>
    c.keywords.some((k) => q.includes(k.toLowerCase()) || k.toLowerCase().includes(q))
  ) || null;
}

export function getExercise(id) {
  return EXERCISES[id] || null;
}

export function getExercisesForCondition(condition) {
  if (!condition) return [];
  return condition.exercises.map((id) => EXERCISES[id]).filter(Boolean);
}
