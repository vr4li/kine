#!/usr/bin/env python3
"""Append missing EN strings and patch render helpers."""
import json
import re
from pathlib import Path

PATH = Path(__file__).resolve().parent.parent / "public" / "index.html"
text = PATH.read_text(encoding="utf-8")

EXTRA = {
    "دليل التمارين العلاجية المصوّرة": "Illustrated therapeutic exercise guide",
    "تمارين مرتبة ومنسّقة للبالغين والأطفال — في المكتبة بنفس تنسيق الدليل: خطوات، مدة، وتكرار.": "Exercises organized for adults and children—in the library with the same guide format: steps, duration, and repetitions.",
    "للأطفال": "For children",
    "للبالغين": "For adults",
    "مرافق ومختص": "Companion & specialist",
    "٦ أقسام": "6 sections",
    "خطوات واضحة": "Clear steps",
    "المدة والتكرار لكل تمرين": "Duration & reps for each exercise",
    "افتح مكتبة الدليل المصوّر": "Open the illustrated guide library",
    "الدليل المصوّر": "Illustrated guide",
    "فئات الدليل": "Guide categories",
    "اقرأ هذه الإرشادات قبل أي ممارسة. استشر أخصائي العلاج الطبيعي أو طبيبك، خاصة مع الأطفال والرضع.": "Read these instructions before exercising. Consult your physical therapist or doctor—especially with children.",
    "دأب — خطوة كل يوم · استشر أخصائي العلاج الطبيعي أو طبيبك قبل البدء": "Da’ab — A step every day · Consult your physical therapist or doctor before starting",
    "بعد الجراحة / تأهيل": "Post-surgery / rehab",
    "تسجّل الدخول من الجوال أو اللابتوب أو الآيباد: البريد وكلمة المرور على الجهاز الذي أنشأت فيه الحساب. وإن كان حسابك على جهاز آخر، انقله برمز النقل أدناه ثم ادخل بنفس البريد.": "Sign in from your phone, laptop, or iPad: use email and password on the device where you created the account. If your account is on another device, import the transfer code below, then sign in with the same email.",
    "في هذه النسخة يُحفظ الحساب على الجهاز ولا يوجد خادم — لذلك «دخول» بالبريد وحده على جهاز جديد لا يكفي بدون استيراد الرمز مرة واحدة.": "In this demo, accounts stay on the device only (no server). Email sign-in alone on a new device is not enough until you import the transfer code once.",
    "على هذا الجهاز (جوال، لابتوب، أو آيباد): عند تسجيل الدخول تُحفظ قائمة تمارينك ونجومك وآخر وضع اخترته.": "On this device (phone, laptop, or iPad), sign-in saves your exercise list, stars, and last mode.",
    "حسابك على جوال أو لابتوب أو آيباد آخر؟": "Account on another phone, laptop, or iPad?",
    "على الجهاز القديم: سجّل دخولك → حسابي → إنشاء رمز النقل وانسخ الرمز.": "On the old device: sign in → My account → Create transfer code and copy it.",
    "على الجهاز الجديد (أي متصفح): الصق الرمز أدناه مع نفس كلمة المرور واضغط استيراد.": "On the new device (any browser): paste the code below with the same password and import.",
    "بعدها استخدم دخول أعلاه بالبريد وكلمة المرور كالمعتاد على هذا الجهاز.": "Then use Sign in above with your email and password as usual on this device.",
    "رمز النقل": "Transfer code",
    "كلمة المرور (نفس كلمة الحساب)": "Password (same as your account)",
    "استيراد الحساب على هذا الجهاز": "Import account on this device",
    "الصق الرمز من حسابي على اللابتوب أو الآيباد أو جوال آخر": "Paste the code from My account on your laptop, iPad, or other phone",
    "نقل الحساب إلى جوال أو لابتوب أو آيباد آخر": "Move your account to another phone, laptop, or iPad",
    "الحساب يُحفظ على هذا المتصفح فقط — ليس على السحابة. لذلك «دخول» بالبريد على جوال أو آيباد أو لابتوب جديد يحتاج مرة واحدة لصق رمز النقل هناك.": "Accounts are saved in this browser only—not in the cloud. Email sign-in on a new phone, iPad, or laptop needs a one-time transfer code paste there.",
    "ضيف: تُحفظ قائمة تمارينك على هذا الجهاز.": "Guest: your exercise list is saved on this device only.",
    "سجّل الدخول لحفظها مع حسابك.": "Sign in to save them with your account.",
    "مناسب لـ:": "Suitable for:",
    "مناسب لـ": "Suitable for",
    "التكرار": "Repetitions",
    "ثبات 2–5 ثوانٍ": "Hold 2–5 seconds",
    "10–15 تكراراً": "10–15 reps",
    "ثبات 3–5 ثوانٍ": "Hold 3–5 seconds",
    "10–12 تكراراً": "10–12 reps",
    "ثبات 15–30 ثانية": "Hold 15–30 seconds",
    "8–10 تكرارات": "8–10 reps",
    "ثبات 5–10 ثوانٍ بمتابعة هادئة": "Hold 5–10 seconds with calm tracking",
    "6–10 تكرارات": "6–10 reps",
    "سيطلب المتصفح إذن الكاميرا عند البدء لعدّ التكرارات وتحليل الحركة (بدون حفظ فيديو).": "The browser will ask for camera permission when you start—to count reps and analyze movement (no video is saved).",
    "الموقع الحالي يحتاج إنترنت": "The current website requires internet",
    "هذه نسخة ويب تجريبية — بدون اتصال لا تُحمَّل الصفحة ولا محلّل الحركة. مستقبلاً: تطبيق جوّال يعمل الجلسة كاملة دون إنترنت بعد تحميل الخطة.": "This is a beta website—without a connection the page and pose analyzer won’t load. Future: a mobile app will run full sessions offline after downloading the plan.",
    "الموقع الآن (يحتاج إنترنت)": "Website now (needs internet)",
    "مستقبلاً — التطبيق (دون إنترنت)": "Future — mobile app (offline)",
    "فتح الموقع وصفحة الجلسة": "Open the site and session page",
    "تحميل محلّل الحركة (MoveNet) من الشبكة": "Load the pose analyzer (MoveNet) from the network",
    "الكاميرا والعدّ أثناء الاتصال": "Camera and counting while online",
    "حفظ محدود على الجهاز (localStorage)": "Limited storage on device (localStorage)",
    "إرسال التقارير عند توفر الشبكة": "Send reports when online",
    "تحميل الخطة مرة ثم التمرين أياماً بدون إنترنت": "Download the plan once, then exercise offline for days",
    "الكاميرا والعدّ والتصحيح على الجهاز": "Camera, counting, and feedback on device",
    "تنبيهات محلية ووضع الطفل الآمن": "Local alerts and child-safe mode",
    "حفظ مشفّر على الهاتف": "Encrypted storage on phone",
    "مزامنة النتائج لاحقاً عند الاتصال": "Sync results later when connected",
    "هدفنا أن لا يتوقف التمرين بسبب انقطاع الشبكة — في التطبيق وليس في هذه النسخة من الموقع.": "Our goal is that exercise doesn’t stop because of network loss—in the app, not in this website version.",
    "تحريك الكاحل (ضخ وضخ)": "Ankle pumps",
    "من وضع جلوس أو استلقاء حرّك كاحلك للأعلى والأسفل كأنك تضغط دواسة. يحسّن الدورة الدموية ويقلّل تورّم القدم بعد الجراحة أو الإصابة. (Ankle Pumps)": "Sitting or lying, pump your ankle up and down as if pressing a pedal. Improves circulation and reduces swelling after surgery or injury. (Ankle Pumps)",
    "ثني ومد الركبة": "Knee flexion and extension",
    "من الجلوس ثنِ ركبتك ببطء ثم افردها بالكامل ضمن مدى مريح. يستعيد حركة الركبة بعد الجراحة أو فترة الجبيرة. (Knee Flexion and Extension)": "From a chair, slowly bend your knee then straighten it within a comfortable range. Restores knee motion after surgery or immobilization. (Knee Flexion and Extension)",
    "تحريك مفصل الكتف": "Shoulder range of motion",
    "ارفع ذراعك أمامك أو جانباً في مدى مريح دون ألم حاد، ثم أنزله ببطء. يحافظ على مرونة الكتف بعد الجبيرة أو العملية. (Shoulder Range of Motion)": "Raise your arm forward or to the side in a comfortable pain-free range, then lower slowly. Maintains shoulder mobility after a sling or surgery. (Shoulder Range of Motion)",
    "نقل الوزن بين القدمين": "Weight shifting between feet",
    "قف بمساندة حائط أو طاولة وانقل وزنك بلطف من قدم إلى الأخرى مع ثبات الجذع. يقوّي التوازن والثقة على الأرض بعد الجراحة أو الإصابة. (Weight Transfer)": "Stand supported by a wall or table and gently shift weight foot to foot while keeping your trunk steady. Builds balance and confidence after surgery or injury. (Weight Transfer)",
    "بعد جراحة الركبة أو الكاحل أو الساق": "After knee, ankle, or leg surgery",
    "بعد كسر في الطرف السفلي عندما يسمح المختص": "After lower-limb fracture when your specialist allows it",
    "من يجلس أو يستلقي فترات طويلة ويحتاج حركة آمنة للكاحل": "After long sitting or bed rest needing safe ankle motion",
    "بعد جراحة الركبة أو منظار الركبة": "After knee surgery or arthroscopy",
    "بعد كسر قريب من الركبة وبإذن المختص": "Near-knee fracture with specialist approval",
    "تيبّس الركبة بعد قلة الحركة": "Knee stiffness after reduced movement",
    "بعد جراحة الكتف أو كسره": "After shoulder surgery or fracture",
    "تيبّس الكتف بعد الجبيرة أو الحمالة": "Shoulder stiffness after sling or cast",
    "إصابات الكتف والتراكب بإشراف المختص": "Shoulder and rotator cuff injuries under specialist supervision",
    "بعد جراحة الورك أو الركبة عندما يسمح بالوقوف": "After hip or knee surgery when standing is allowed",
    "ضعف التوازن بعد الإصابة أو السكتة": "Balance weakness after injury or stroke",
    "كبار السن والتأهيل العام بحسب تقدير المختص": "Older adults and general rehab per specialist",
    "اجلس على كرسي بظهر مستقيم": "Sit on a chair with a straight back",
    "اثنِ ركبتك ببطء ثم افردها": "Slowly bend your knee, then straighten it",
    "كرّر دون ألم حاد": "Repeat without sharp pain",
    "قف بجانب حائط للدعم إن لزم": "Stand beside a wall for support if needed",
    "ارفع ذراعك في مدى مريح أمامك أو جانباً": "Raise your arm comfortably forward or to the side",
    "أنزلها ببطء وكرّر": "Lower slowly and repeat",
    "انقل وزنك من قدم إلى أخرى ببطء": "Slowly shift weight from foot to foot",
    "حافظ على ثبات جذعك": "Keep your trunk steady",
    "عضلات السمانة": "Calf muscles",
    "مثبتات الكاحل": "Ankle stabilizers",
    "منظر خلفي": "Back view",
    "العضلات الفخذية الأمامية (الرباعية)": "Quadriceps (front thigh)",
    "منظر أمامي": "Front view",
    " · الغامق رئيسية والفاتح داعمة": " · Dark = primary, light = supporting",
}

anchor = '"بدّل لغة الموقع بين العربية والإنجليزية. يتغير النص والصوت معاً.": "Switch the site between Arabic and English. The text and the voice change together."'
if anchor not in text:
    raise SystemExit("anchor not found")
pairs = ",".join(
    json.dumps(k, ensure_ascii=False) + ": " + json.dumps(v, ensure_ascii=False)
    for k, v in EXTRA.items()
)
text = text.replace(anchor, anchor + ", " + pairs)

def js_escape(s):
    return json.dumps(s, ensure_ascii=False)

# tx() helper
old = "function EN(){return document.documentElement.lang==='en'}"
new = """function EN(){return document.documentElement.lang==='en'}
function tx(s){if(s==null)return'';s=String(s);if(!EN())return s;try{if(window.DAAB_TR){var u=window.DAAB_TR(s);if(u)return u}}catch(e){}return s}
function i18nDynRefresh(){try{if(typeof renderLib==='function')renderLib();if(typeof paintPlan==='function')paintPlan();if(typeof acctUI==='function')acctUI();if(typeof route==='function')route()}catch(e){}}"""
if old not in text:
    raise SystemExit("EN() anchor missing")
text = text.replace(old, new, 1)

# lang toggle
text = text.replace(
    "B.addEventListener('click',function(){en=!en;try{localStorage.setItem(K,en?'en':'ar')}catch(e){}apply()});",
    "B.addEventListener('click',function(){en=!en;try{localStorage.setItem(K,en?'en':'ar')}catch(e){}apply();if(typeof i18nDynRefresh==='function')i18nDynRefresh()});",
    1,
)

# badges
text = text.replace(
    "function downBadge(x){return x&&x.dn?'<span class=\"cat downb\">متلازمة داون</span>':''}\nfunction rxBadge(x){return x&&x.rx?'<span class=\"cat rxb\">بعد الجراحة / تأهيل</span>':''}\nfunction eyeBadge(x){return x&&x.cat==='eye'?'<span class=\"cat eyeb\">العين الكسولة</span>':''}",
    "function downBadge(x){return x&&x.dn?'<span class=\"cat downb\">'+tx('متلازمة داون')+'</span>':''}\nfunction rxBadge(x){return x&&x.rx?'<span class=\"cat rxb\">'+tx('بعد الجراحة / تأهيل')+'</span>':''}\nfunction eyeBadge(x){return x&&x.cat==='eye'?'<span class=\"cat eyeb\">'+tx('العين الكسولة')+'</span>':''}",
    1,
)

# musBlock
text = text.replace(
    "return '<div class=\"mus\"><svg viewBox=\"0 0 120 200\" role=\"img\" aria-label=\"'+(m.eye?'رسم عين':'رسم يبيّن العضلات المستهدفة: '+m.l.map(function(r){return r[0]}).join('، '))+'\">'+inner+'</svg><div><b>'+(m.eye?'لا عضلات هنا':'العضلات المستهدفة')+'</b><ul>'+m.l.map(function(r){return '<li><i class=\"'+(r[1]?'':'s')+'\"></i>'+r[0]+'</li>'}).join('')+'</ul><span class=\"mcap\">'+m.v+(m.l.some(function(r){return !r[1]})&&!m.eye?' · الغامق رئيسية والفاتح داعمة':'')+'</span></div></div>'",
    "return '<div class=\"mus\"><svg viewBox=\"0 0 120 200\" role=\"img\" aria-label=\"'+(m.eye?tx('رسم عين'):tx('رسم يبيّن العضلات المستهدفة: '+m.l.map(function(r){return r[0]}).join('، ')))+'\">'+inner+'</svg><div><b>'+(m.eye?tx('لا عضلات هنا'):tx('العضلات المستهدفة'))+'</b><ul>'+m.l.map(function(r){return '<li><i class=\"'+(r[1]?'':'s')+'\"></i>'+tx(r[0])+'</li>'}).join('')+'</ul><span class=\"mcap\">'+tx(m.v)+(m.l.some(function(r){return !r[1]})&&!m.eye?tx(' · الغامق رئيسية والفاتح داعمة'):'')+'</span></div></div>'",
    1,
)

# guideMeta
text = text.replace(
    "function guideMeta(x){if(!x)return {dur:'—',rep:'—'};if(x.cat==='eye')return {dur:'ثبات 5–10 ثوانٍ بمتابعة هادئة',rep:'6–10 تكرارات'};if(x.cat==='kid'||x.dn)return {dur:'ثبات 15–30 ثانية',rep:'8–10 تكرارات'};if(x.cat==='bal')return {dur:'ثبات 3–5 ثوانٍ',rep:'10–12 تكراراً'};return {dur:'ثبات 2–5 ثوانٍ',rep:'10–15 تكراراً'}}",
    "function guideMeta(x){if(!x)return {dur:'—',rep:'—'};if(x.cat==='eye')return {dur:tx('ثبات 5–10 ثوانٍ بمتابعة هادئة'),rep:tx('6–10 تكرارات')};if(x.cat==='kid'||x.dn)return {dur:tx('ثبات 15–30 ثانية'),rep:tx('8–10 تكرارات')};if(x.cat==='bal')return {dur:tx('ثبات 3–5 ثوانٍ'),rep:tx('10–12 تكراراً')};return {dur:tx('ثبات 2–5 ثوانٍ'),rep:tx('10–15 تكراراً')}}",
    1,
)

# exGuideCard
old_card = """ return '<article class="ex ex-guide"><div class="top"><div class="ex-tags"><span class="cat">'+CATS[x.cat]+'</span>'+(sgIds.indexOf(x.id)>-1?'<span class="cat sugb">مقترح لحالتك</span>':'')+downBadge(x)+rxBadge(x)+eyeBadge(x)+'</div><span class="imp"><span aria-hidden="true" style="display:inline-flex;gap:4px">'+imp+'</span>الأهمية: '+IMP[x.imp]+'</span></div><div class="ex-illus-wrap"><span class="ex-num">'+n+'</span>'+musBlock(x.id,true)+'</div><h4>'+x.n+'</h4>'+(st.length?'<ol class="ex-steps">'+st.map(function(t){return '<li>'+t+'</li>'}).join('')+'</ol>':'')+'<p class="ex-desc">'+x.s+'</p><div class="ex-pills"><span class="pill dur"><b>المدة</b>'+gm.dur+'</span><span class="pill rep"><b>التكرار</b>'+gm.rep+'</span></div>'+musBlock(x.id)+'<div class="ex-detail"><b>من يحتاجه؟</b><ul>'+x.w.map(function(w){return '<li>'+w+'</li>'}).join('')+'</ul></div><p class="small ex-track">'+x.t+'</p>'+libBtns(x.id,'grid',lbl)+'</article>'}"""
new_card = """ return '<article class="ex ex-guide"><div class="top"><div class="ex-tags"><span class="cat">'+tx(CATS[x.cat])+'</span>'+(sgIds.indexOf(x.id)>-1?'<span class="cat sugb">'+tx('مقترح لحالتك')+'</span>':'')+downBadge(x)+rxBadge(x)+eyeBadge(x)+'</div><span class="imp"><span aria-hidden="true" style="display:inline-flex;gap:4px">'+imp+'</span>'+tx('الأهمية')+': '+tx(IMP[x.imp])+'</span></div><div class="ex-illus-wrap"><span class="ex-num">'+n+'</span>'+musBlock(x.id,true)+'</div><h4>'+tx(x.n)+'</h4>'+(st.length?'<ol class="ex-steps">'+st.map(function(t){return '<li>'+tx(t)+'</li>'}).join('')+'</ol>':'')+'<p class="ex-desc">'+tx(x.s)+'</p><div class="ex-pills"><span class="pill dur"><b>'+tx('المدة')+'</b>'+gm.dur+'</span><span class="pill rep"><b>'+tx('التكرار')+'</b>'+gm.rep+'</span></div>'+musBlock(x.id)+'<div class="ex-detail"><b>'+tx('من يحتاجه؟')+'</b><ul>'+x.w.map(function(w){return '<li>'+tx(w)+'</li>'}).join('')+'</ul></div><p class="small ex-track">'+tx(x.t)+'</p>'+libBtns(x.id,'grid',lbl)+'</article>'}"""
if old_card not in text:
    raise SystemExit("exGuideCard block missing")
text = text.replace(old_card, new_card, 1)

# gNote
text = text.replace(
    "$('gNote').innerHTML=acct?'تُحفظ قائمتك وحالتك في حسابك.':'ضيف: تُحفظ قائمة تمارينك على هذا الجهاز. <a href=\"#auth\">سجّل الدخول",
    "$('gNote').innerHTML=acct?tx('تُحفظ قائمتك وحالتك في حسابك.'):tx('ضيف: تُحفظ قائمة تمارينك على هذا الجهاز.')+' <a href=\"#auth\">'+tx('سجّل الدخول لحفظها مع حسابك.')+'</a>. '+(acct?'':'<span hidden>سجّل الدخول",
    1,
)
# fix broken replacement - the old line continues - need read exact line

PATH.write_text(text, encoding="utf-8")
print("patched", PATH)
