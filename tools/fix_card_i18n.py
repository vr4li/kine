#!/usr/bin/env python3
"""Fix mixed AR/EN on exercise cards: exact tx() + missing D entries."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PATH = ROOT / "public" / "index.html"
text = PATH.read_text(encoding="utf-8")

EXTRA = {
    # Conditions
    "تأهيل بعد جراحة أو كسر (عام)": "Rehab after surgery or fracture (general)",
    "ضعف التوتر العضلي (رخاوة العضلات)": "Low muscle tone (hypotonia)",
    # Tracking footers
    "التتبع: عدّ بالكاميرا على جهازك": "Tracking: counts reps with your device camera",
    # Exercise names (missing)
    "الانتقال من الجلوس إلى الوقوف": "Sit to stand",
    "المشي بمساعدة": "Assisted walking",
    "الوقوف مع الدعم ونقل الوزن": "Supported standing & weight shift",
    "التناسق الحركي — تصفيق فوق الرأس": "Motor coordination — clap overhead",
    "تغطية العين السليمة": "Patching the sound eye",
    "تتبع يميناً ويساراً": "Horizontal tracking",
    "تتبع للأعلى والأسفل": "Vertical tracking",
    "متابعة الكرة وتتبع الأجسام": "Ball tracking",
    # Exercise descriptions (missing)
    "يجلس الطفل على كرسي ثابت ومنخفض ثم يقف ببطء مع دعم المرافق عند الحاجة. يقوّي الساقين ويُهيّئ لمهارات الوقوف والمشي اليومية. (مستوحى من برامج الرعاية المنزلية والتدخل المبكر)": "The child sits on a low stable chair, then stands slowly with companion support when needed. Strengthens the legs and builds sit-to-stand skills. (Inspired by home-care and early intervention programs)",
    "يمشي الطفل في مكانه أو للأمام مع إمساك يد المرافق أو مقبض آمن، ويرفع ركبتيه بالتناوب. يدرّب التنسيق والمشي المدعوم. (Assisted Walking)": "The child marches in place or walks forward holding a companion’s hand or a safe handle, lifting knees in turn. Trains coordination and supported walking. (Assisted Walking)",
    "يقف الطفل ويسند يديه على حائط أو كرسي ثابت، وينقل وزنه بلطف من قدم لأخرى مع ثبات الجذع. يقوّي التوازن والثبات. (Supported Standing / Weight Shifting)": "The child stands with hands on a wall or stable chair and gently shifts weight foot to foot while keeping the trunk steady. Builds balance and stability. (Supported Standing / Weight Shifting)",
    "يقف الطفل ويرفع ذراعيه معاً فوق الرأس ويصفّق مع عدّ هادئ من المرافق. يدرّب تنسيق الجانبين وحركة الكتفين. (Motor Coordination)": "Standing, the child raises both arms overhead and claps while the companion counts calmly. Trains bilateral coordination and shoulder movement. (Motor Coordination)",
    "غطِّ العين السليمة باللصقة أو النظارة الشمسية كما وصف طبيب العيون، واترك العين الكسولة مكشوفة للتدريب. ينبّهك دأب إذا وُضعت اللصقة على العين الخطأ. (Patching Therapy)": "Cover the sound eye with a patch or shaded glasses as prescribed, leaving the lazy eye uncovered for training. Da’ab alerts you if the patch is on the wrong eye. (Patching Therapy)",
    "بعد تجهيز اللصقة، تابع نقطة أو كرة تتحرك أفقياً على الشاشة بعينك الكسولة دون تحريك رأسك. (Horizontal Tracking)": "After setup, follow a dot or ball moving horizontally on screen with your lazy eye without moving your head. (Horizontal Tracking)",
    "تابع النقطة وهي تتحرك عمودياً بعينك المكشوفة، ورأسك ثابت. يدرّب حركة العين العمودية. (Vertical Tracking)": "Follow the dot moving up and down with your uncovered eye; keep your head still. Trains vertical eye movement. (Vertical Tracking)",
    "تابع دائرة تتحرك على الشاشة بعينك الكسولة؛ يُحاكى الكشف عن النظارة واللصقة. لا يقيس حدة البصر. (Ball / Visual Tracking)": "Follow a circle on screen with your lazy eye; glasses and patch checks are simulated. Does not measure visual acuity. (Ball / Visual Tracking)",
    # Who needs it (missing w[])
    "متلازمة داون وتأخر النمو الحركي": "Down syndrome with motor delay",
    "أطفال يعملون على قوة الوقوف بإشراف المرافق": "Children building standing strength with a companion",
    "من يحتاج تكراراً آمناً للجلوس والوقوف": "Those needing safe sit-to-stand repetition",
    "متلازمة داون في مرحلة ما قبل المشي المستقل": "Down syndrome before independent walking",
    "أطفال يحتاجون ثقة وتوازناً أثناء الخطو": "Children who need confidence and balance while stepping",
    "جلسات يقودها المرافق أو معالج النطق والحركة": "Sessions led by a companion or speech–movement therapist",
    "متلازمة داون وصعوبة التوازن": "Down syndrome with balance difficulty",
    "قبل الوقوف دون دعم كامل": "Before standing without full support",
    "من يحتاج تدريباً تدريجياً على تحمل الوزن": "Those who need gradual weight-bearing practice",
    "متلازمة داون وتأخر التنسيق بين اليدين": "Down syndrome with delayed hand coordination",
    "أطفال التدخل المبكر بعمر ما قبل المدرسة": "Early-intervention children preschool age",
    "تمارين تقليد وتحفيز مع المرافق": "Imitation and encouragement exercises with a companion",
    "أطفال كسل العين بخطة لصق موصوفة": "Children with amblyopia on a prescribed patching plan",
    "التزام بوصف النظارة أو اللصقة": "Following glasses or patch prescription",
    "جلسات متابعة مع طبيب العيون": "Follow-up sessions with an eye doctor",
    "كسل العين في مرحلة التدريب على حركة العين": "Amblyopia in eye-movement training phase",
    "بعد ضبط اللصقة والنظارة": "After patch and glasses are set up",
    "من يحتاج تقوية تتبع أفقي بإشراف الأهل": "Those who need horizontal tracking practice with parents",
    "كسل العين وتدريب مدى العمودي": "Amblyopia and vertical range training",
    "بعد تثبيت اللصقة على العين السليمة": "After patch is secured on the sound eye",
    "جلسات قصيرة يومية حسب خطة الطبيب": "Short daily sessions per the doctor’s plan",
    "كسل العين وتمارين المتابعة المنزلية": "Amblyopia and home tracking exercises",
    "من وُصف له تتبع الأجسام بعد تغطية العين السليمة": "Prescribed object tracking after covering the sound eye",
    "تذكير لطيف إذا سقطت اللصقة أو النظارة": "Gentle reminders if patch or glasses slip off",
    # Muscles
    "الدالية الأمامية (مقدمة الكتف)": "Anterior deltoid (front of shoulder)",
    "الرباعية الفخذية (أمام الفخذ)": "Quadriceps (front thigh)",
    "عضلات السمانة (خلف الساق)": "Calf muscles (back of lower leg)",
    "الألوية (الأرداف)": "Gluteals (hips)",
    "الدالية (الكتفان)": "Deltoids (shoulders)",
    "شبه المنحرفة (أعلى الظهر والرقبة)": "Trapezius (upper back and neck)",
    "عضلات ثني الورك (الحرقفية القطنية)": "Hip flexors (iliopsoas)",
    "الدالية بكل رؤوسها (الكتفان)": "Deltoid (all heads, shoulders)",
    "منظر أمامي": "Front view",
    "منظر خلفي": "Back view",
    "رسم تخطيطي": "Schematic view",
    "مهمة التزام": "Adherence task",
    "لا تمرين حركي: يذكّرك دأب بالوصفة ويسجّل التزامك": "No movement exercise: Da’ab reminds you of the plan and logs adherence",
    # Steps e13–e16 + extras
    "يجلس على كرسي منخفض ثابت": "Sit on a low stable chair",
    "ينهض ببطء مع مساعدة المرافق عند الحاجة": "Stand up slowly with companion help if needed",
    "يجلس بتحكم ويكرّر": "Sit down with control and repeat",
    "يمشي في المكان أو للأمام ممسكاً بيد المرافق": "March in place or walk forward holding the companion’s hand",
    "يرفع ركبتيه بالتناوب بإيقاع هادئ": "Lift knees in turn at a calm pace",
    "يقف ويسند يديه على حائط أو كرسي": "Stand with hands on a wall or chair",
    "ينقل وزنه من قدم لأخرى ببطء": "Slowly shift weight from foot to foot",
    "يرفع ذراعيه معاً ويصفّق فوق الرأس": "Raise both arms and clap overhead",
    "يكرّر مع عدّ المرافق": "Repeat while the companion counts",
}

# Insert into D
pairs = ",".join(json.dumps(k, ensure_ascii=False) + ": " + json.dumps(v, ensure_ascii=False) for k, v in EXTRA.items())
anchor = '"بدّل لغة الموقع بين العربية والإنجليزية. يتغير النص والصوت معاً.": "Switch the site between Arabic and English. The text and the voice change together."'
if anchor not in text:
    raise SystemExit("D anchor missing")
if pairs not in text:
    text = text.replace(anchor, anchor + ", " + pairs)

# tx() exact-only
old_tx = "function tx(s){if(s==null)return'';s=String(s);if(!EN())return s;try{if(window.DAAB_TR){var u=window.DAAB_TR(s);if(u)return u}}catch(e){}return s}"
new_tx = "function tx(s){if(s==null)return'';s=String(s);if(!EN())return s;try{if(window.DAAB_TR_EXACT){var u=window.DAAB_TR_EXACT(s);if(u)return u}}catch(e){}return s}"
text = text.replace(old_tx, new_tx, 1)

# DAAB_TR_EXACT
needle = "window.DAAB_TR=tr;\nwindow.DAAB_KW="
if "DAAB_TR_EXACT" not in text:
    text = text.replace(
        "window.DAAB_TR=tr;\nwindow.DAAB_KW=",
        "window.DAAB_TR=tr;\nwindow.DAAB_TR_EXACT=function(s){var k=String(s||'').trim();if(!k)return null;return Object.prototype.hasOwnProperty.call(D,k)?D[k]:null};\nwindow.DAAB_KW=",
        1,
    )

# Condition labels in UI
text = text.replace(
    "function cdName(id){var c=CD.filter(function(x){return x[0]===id})[0];return c?c[1]:id}",
    "function cdName(id){var c=CD.filter(function(x){return x[0]===id})[0];return c?tx(c[1]):id}",
    1,
)
text = text.replace(
    "+'> '+c[1]+'</label>'",
    "+'> '+tx(c[1])+'</label>'",
    1,
)

PATH.write_text(text, encoding="utf-8")
(ROOT / "index.html").write_text(text, encoding="utf-8")
print("Updated", PATH, "added", len(EXTRA), "keys")
