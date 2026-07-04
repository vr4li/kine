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
    image: "./exercises/cat-cow.svg",
    nameAr: "تمرين القط والبقرة",
    nameEn: "Cat-Cow Stretch",
    descAr: "انحنِ ظهرك بلطف للأمام ثم للخلف — حركة بطيئة",
    descEn: "Gently arch and round your back — slow movement",
    stepsAr: ["قف على يديك وركبتيك", "انحنِ الظهر للأعلى (قط)", "ثم للأسفل (بقرة)", "10 مرات ببطء"],
    stepsEn: ["Hands and knees position", "Round spine up (cat)", "Then arch down (cow)", "10 slow reps"],
    type: "spine",
  },
  "pelvic-tilt": {
    id: "pelvic-tilt",
    image: "./exercises/pelvic-tilt.svg",
    nameAr: "ميلان الحوض",
    nameEn: "Pelvic Tilt",
    descAr: "استلقِ واضغط أسفل الظهر للأرض",
    descEn: "Lie down and press lower back to floor",
    stepsAr: ["استلقِ على ظهرك", "ثني الركبتين", "اضغط أسفل الظهر للأرض", "ثبّت 5 ثوانٍ × 10"],
    stepsEn: ["Lie on back", "Bend knees", "Press lower back down", "Hold 5s × 10"],
    type: "spine",
  },
  "bird-dog": {
    id: "bird-dog",
    image: "./exercises/bird-dog.svg",
    nameAr: "طائر-كلب",
    nameEn: "Bird Dog",
    descAr: "مدّ يد ورجل opposite مع ظهر مستقيم",
    descEn: "Extend opposite arm and leg — keep back flat",
    stepsAr: ["وضعية أربع", "مدّ يد يمين + رجل يسار", "ظهر مستقيم", "5 ثوانٍ ثم بدّل"],
    stepsEn: ["On all fours", "Extend opposite limbs", "Keep back flat", "Hold 5s, switch"],
    type: "spine",
  },
  "knee-raise": {
    id: "knee-raise",
    image: "./exercises/knee-raise.svg",
    nameAr: "رفع الرجل المستقيم",
    nameEn: "Straight Leg Raise",
    descAr: "ارفع رجلك مستقيمة دون ثني الركبة",
    descEn: "Raise leg straight without bending knee",
    stepsAr: ["استلقِ على ظهرك", "ارفع رجل واحدة مستقيمة", "لا تثني الركبة", "10 مرات"],
    stepsEn: ["Lie on back", "Raise one straight leg", "Don't bend knee", "10 reps"],
    type: "knee",
  },
  "heel-slide": {
    id: "heel-slide",
    image: "./exercises/heel-slide.svg",
    nameAr: "انزلاق الكعب",
    nameEn: "Heel Slide",
    descAr: "اسحب الكعب نحو الأرداف بلطف",
    descEn: "Slide heel toward glutes gently",
    stepsAr: ["استلقِ على ظهرك", "اسحب الكعب للأرداف", "أبقِ القدم على الأرض", "10 مرات"],
    stepsEn: ["Lie on back", "Slide heel to glutes", "Keep foot on floor", "10 reps"],
    type: "knee",
  },
  "quad-set": {
    id: "quad-set",
    image: "./exercises/quad-set.svg",
    nameAr: "تمرين الفخذ الأمامي",
    nameEn: "Quad Set",
    descAr: "اضغط ركبتك للأسفل ومدّ رجلتك",
    descEn: "Press knee down and straighten leg",
    stepsAr: ["استلقِ ومدّ رجلتك", "اضغط الركبة للأسفل", "ثبّت 5 ثوانٍ", "10 مرات"],
    stepsEn: ["Lie with leg straight", "Press knee down", "Hold 5 seconds", "10 reps"],
    type: "knee",
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
