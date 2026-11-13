#!/usr/bin/env python3
"""Auth + safe pages: merge split HTML, extend D, tx() for dynamic auth UI."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PATH = ROOT / "public" / "index.html"
text = PATH.read_text(encoding="utf-8")

replacements = [
    (
        '<p class="lead">تسجّل الدخول من <b>الجوال أو اللابتوب أو الآيباد</b>: البريد وكلمة المرور على الجهاز الذي أنشأت فيه الحساب. وإن كان حسابك على جهاز آخر، انقله برمز النقل أدناه ثم ادخل بنفس البريد.</p>',
        '<p class="lead">تسجّل الدخول من الجوال أو اللابتوب أو الآيباد: البريد وكلمة المرور على الجهاز الذي أنشأت فيه الحساب. وإن كان حسابك على جهاز آخر، انقله برمز النقل أدناه ثم ادخل بنفس البريد.</p>',
    ),
    (
        '<p>جرّب الموقع فوراً دون حساب. <b>لا نحفظ أي بيانات</b>: قائمة تمارينك ونجومك تختفي عند إغلاق الصفحة.</p>',
        '<p>جرّب الموقع فوراً دون حساب. لا نحفظ أي بيانات: قائمة تمارينك ونجومك تختفي عند إغلاق الصفحة.</p>',
    ),
    (
        '<p class="small" style="margin-top:14px">على <b>هذا الجهاز</b> (جوال، لابتوب، أو آيباد): عند تسجيل الدخول تُحفظ قائمة تمارينك ونجومك وآخر وضع اخترته.</p>',
        '<p class="small" style="margin-top:14px">على هذا الجهاز (جوال، لابتوب، أو آيباد): عند تسجيل الدخول تُحفظ قائمة تمارينك ونجومك وآخر وضع اخترته.</p>',
    ),
    (
        '<ol class="list" style="margin:10px 0 14px"><li>على الجهاز <b>القديم</b>: سجّل دخولك → <b>حسابي</b> → <b>إنشاء رمز النقل</b> وانسخ الرمز.</li><li>على الجهاز <b>الجديد</b> (أي متصفح): الصق الرمز أدناه مع <b>نفس كلمة المرور</b> واضغط استيراد.</li><li>بعدها استخدم <b>دخول</b> أعلاه بالبريد وكلمة المرور كالمعتاد على هذا الجهاز.</li></ol>',
        '<ol class="list" style="margin:10px 0 14px"><li>على الجهاز القديم: سجّل دخولك → حسابي → إنشاء رمز النقل وانسخ الرمز.</li><li>على الجهاز الجديد (أي متصفح): الصق الرمز أدناه مع نفس كلمة المرور واضغط استيراد.</li><li>بعدها استخدم دخول أعلاه بالبريد وكلمة المرور كالمعتاد على هذا الجهاز.</li></ol>',
    ),
    (
        '<p class="rule2">هذه نسخة ويب تجريبية — بدون اتصال لا تُحمَّل الصفحة ولا محلّل الحركة. <strong>مستقبلاً:</strong> تطبيق جوّال يعمل الجلسة كاملة دون إنترنت بعد تحميل الخطة.</p>',
        '<p class="rule2">هذه نسخة ويب تجريبية — بدون اتصال لا تُحمَّل الصفحة ولا محلّل الحركة. مستقبلاً: تطبيق جوّال يعمل الجلسة كاملة دون إنترنت بعد تحميل الخطة.</p>',
    ),
    (
        '<p class="small" style="margin-top:20px">هدفنا أن لا يتوقف التمرين بسبب انقطاع الشبكة — في <strong>التطبيق</strong> وليس في هذه النسخة من الموقع.</p>',
        '<p class="small" style="margin-top:20px">هدفنا أن لا يتوقف التمرين بسبب انقطاع الشبكة — في التطبيق وليس في هذه النسخة من الموقع.</p>',
    ),
    (
        '<li><b>5 إلى 10 ثوانٍ</b>يتوقف التمرين تلقائياً بصوت لطيف: «أين ذهبت؟ نكمل معاً».</li>',
        '<li>5 إلى 10 ثوانٍ: يتوقف التمرين تلقائياً بصوت لطيف: «أين ذهبت؟ نكمل معاً».</li>',
    ),
    (
        '<li><b>30 إلى 60 ثانية</b>تنبيه للمرافق: صوت عالٍ وإشارة بصرية على الجهاز نفسه.</li>',
        '<li>30 إلى 60 ثانية: تنبيه للمرافق: صوت عالٍ وإشارة بصرية على الجهاز نفسه.</li>',
    ),
    (
        '<li><b>عدة دقائق</b>تنتهي الجلسة وتُسجَّل «غير مكتملة» مع السبب.</li>',
        '<li>عدة دقائق: تنتهي الجلسة وتُسجَّل «غير مكتملة» مع السبب.</li>',
    ),
    (
        '<p><b>قفل برمز المرافق.</b> الخروج من وضع الطفل أو إنهاء الجلسة يحتاج رمزاً لا يعرفه إلا المسؤول.</p>',
        '<p>قفل برمز المرافق. الخروج من وضع الطفل أو إنهاء الجلسة يحتاج رمزاً لا يعرفه إلا المسؤول.</p>',
    ),
    (
        '<p><b>لا نحبس الطفل.</b> زر كبير «أحتاج مساعدة» يوقف الجلسة وينبّه المرافق فوراً دون رمز.</p>',
        '<p>لا نحبس الطفل. زر كبير «أحتاج مساعدة» يوقف الجلسة وينبّه المرافق فوراً دون رمز.</p>',
    ),
    (
        '<p><b>التوقف ليس فشلاً.</b> رسائل لطيفة وعودة هادئة، بلا عقاب ولا شاشات حزينة.</p>',
        '<p>التوقف ليس فشلاً. رسائل لطيفة وعودة هادئة، بلا عقاب ولا شاشات حزينة.</p>',
    ),
    (
        '<p><b>حدّ لعدد الجلسات.</b> يضع المرافق أو المختص جدولاً بأيام التمرين وعدد الجلسات في اليوم وفاصل بينها. وعند الوصول للحد يرى الطفل «وقت الراحة» ولا يكرّر التمرين أكثر من اللازم.</p>',
        '<p>حدّ لعدد الجلسات. يضع المرافق أو المختص جدولاً بأيام التمرين وعدد الجلسات في اليوم وفاصل بينها. وعند الوصول للحد يرى الطفل «وقت الراحة» ولا يكرّر التمرين أكثر من اللازم.</p>',
    ),
    (
        '<p><b>فائدة للطبيب.</b> يظهر في التقرير مثلاً: «6 من 7 جلسات اكتملت، وتوقفت واحدة بعد 3 دقائق».</p>',
        '<p>فائدة للطبيب. يظهر في التقرير مثلاً: «6 من 7 جلسات اكتملت، وتوقفت واحدة بعد 3 دقائق».</p>',
    ),
]

for old, new in replacements:
    if old not in text:
        print("WARN missing:", old[:50])
    else:
        text = text.replace(old, new, 1)

EXTRA = {
    "الدخول — دأب": "Sign in — Da'ab",
    "الأمان والخصوصية وأمان الطفل — دأب": "Safety, privacy & child mode — Da'ab",
    "تسجّل الدخول من الجوال أو اللابتوب أو الآيباد: البريد وكلمة المرور على الجهاز الذي أنشأت فيه الحساب. وإن كان حسابك على جهاز آخر، انقله برمز النقل أدناه ثم ادخل بنفس البريد.": "Sign in from your phone, laptop, or iPad: use the email and password from the device where you created the account. If your account is on another device, transfer it with the code below, then sign in with the same email.",
    "في هذه النسخة يُحفظ الحساب على الجهاز ولا يوجد خادم — لذلك «دخول» بالبريد وحده على جهاز جديد لا يكفي بدون استيراد الرمز مرة واحدة.": "In this demo, accounts are stored on-device only—there is no server—so signing in with email alone on a new device is not enough until you import the transfer code once.",
    "جرّب الموقع فوراً دون حساب. لا نحفظ أي بيانات: قائمة تمارينك ونجومك تختفي عند إغلاق الصفحة.": "Try the site right away with no account. We save nothing: your exercise list and stars disappear when you close the page.",
    "نوع الدخول": "Sign-in type",
    "دخول": "Sign in",
    "مرافق لطفل": "Companion for a child",
    "مرافق لبالغ": "Companion for an adult",
    "مريض بالغ": "Adult patient",
    "اختر دورك أولاً. الطفل لا ينشئ حساباً بنفسه: يسجّله مرافقه البالغ، ويدخل واجهته من حساب المرافق.": "Choose your role first. A child does not create their own account: an adult companion registers them and the child uses the companion’s account.",
    "حالة الطفل الذي ترافقه": "Condition of the child you support",
    "حالة البالغ الذي ترافقه": "Condition of the adult you support",
    "بيانات الطفل الذي ترافقه": "Child you support",
    "بيانات البالغ الذي ترافقه": "Adult you support",
    "اسم الطفل": "Child’s name",
    "اسم البالغ": "Adult’s name",
    "اختره الآن عند إنشاء الحساب — أنت وحدك من يعرفه. يقفل واجهة الطفل، وإنهاء الجلسة، والخروج من وضع الطفل.": "Choose it when you create the account—only you should know it. It locks child mode, ending sessions, and leaving child mode.",
    "بريدك الإلكتروني (تصلك عليه التنبيهات)": "Your email (for alerts)",
    "تصلك التنبيهات (توقف الجلسة، طلب المساعدة، اكتمال الجلسات) على هذا البريد. في هذه النسخة التجريبية لا يُرسل بريد فعلي.": "Session stops, help requests, and completed sessions are sent to this email. This demo does not send real email.",
    "إنشاء الحساب": "Create account",
    "على هذا الجهاز (جوال، لابتوب، أو آيباد): عند تسجيل الدخول تُحفظ قائمة تمارينك ونجومك وآخر وضع اخترته.": "On this device (phone, laptop, or iPad), when you sign in we save your exercise list, stars, and last mode you chose.",
    "على الجهاز القديم: سجّل دخولك → حسابي → إنشاء رمز النقل وانسخ الرمز.": "On the old device: sign in → My account → Create transfer code and copy the code.",
    "على الجهاز الجديد (أي متصفح): الصق الرمز أدناه مع نفس كلمة المرور واضغط استيراد.": "On the new device (any browser): paste the code below with the same password and tap Import.",
    "بعدها استخدم دخول أعلاه بالبريد وكلمة المرور كالمعتاد على هذا الجهاز.": "Then use Sign in above with email and password as usual on this device.",
    "الصق الرمز من حسابي على اللابتوب أو الآيباد أو جوال آخر": "Paste the code from My account on your laptop, iPad, or other phone",
    "كلمة المرور (نفس كلمة الحساب)": "Password (same as your account)",
    "استيراد الحساب على هذا الجهاز": "Import account on this device",
    "الطفل لا ينشئ حساباً بنفسه: يسجّله مرافقه البالغ، ويدخل واجهته من حسابك، وتقفلها برمز تختاره الآن ولا يعرفه.": "A child does not create their own account: an adult companion registers them, they use your account, and you lock it with a PIN only you know.",
    "اختر رمز مرافق من 4 أرقام — أنت وحدك من يعرفه. يُستخدم لقفل واجهة الطفل وإنهاء الجلسة والخروج من وضع الطفل.": "Choose a 4-digit companion PIN—only you should know it. It locks child mode, ends sessions, and exits child mode.",
    "حسابك لك أنت، ويمكنك إضافة مرافق اختياري.": "The account is yours; you can add an optional companion.",
    "هذه نسخة ويب تجريبية — بدون اتصال لا تُحمَّل الصفحة ولا محلّل الحركة. مستقبلاً: تطبيق جوّال يعمل الجلسة كاملة دون إنترنت بعد تحميل الخطة.": "This is a demo web build—without a connection the page and motion model do not load. Coming later: a mobile app that runs full sessions offline after downloading your plan.",
    "الموقع الآن (يحتاج إنترنت)": "Website now (needs internet)",
    "فتح الموقع وصفحة الجلسة": "Open the site and session page",
    "تحميل محلّل الحركة (MoveNet) من الشبكة": "Load the motion model (MoveNet) from the network",
    "الكاميرا والعدّ أثناء الاتصال": "Camera and rep counting while online",
    "حفظ محدود على الجهاز (localStorage)": "Limited on-device storage (localStorage)",
    "إرسال التقارير عند توفر الشبكة": "Send reports when the network is available",
    "مستقبلاً — التطبيق (دون إنترنت)": "Later — the app (offline)",
    "تحميل الخطة مرة ثم التمرين أياماً بدون إنترنت": "Download the plan once, then exercise for days offline",
    "الكاميرا والعدّ والتصحيح على الجهاز": "Camera, counting, and corrections on device",
    "تنبيهات محلية ووضع الطفل الآمن": "Local alerts and safe child mode",
    "حفظ مشفّر على الهاتف": "Encrypted storage on the phone",
    "مزامنة النتائج لاحقاً عند الاتصال": "Sync results later when online",
    "هدفنا أن لا يتوقف التمرين بسبب انقطاع الشبكة — في التطبيق وليس في هذه النسخة من الموقع.": "Our goal is that exercise does not stop because the network drops—in the app, not in this website version.",
    "نموذج خفيف يعمل داخل الهاتف يستخرج نقاط الجسم ويحسب الزوايا محلياً. المحفوظ أرقام فقط: عدد التكرارات والمدى والمدة والالتزام.": "A lightweight on-phone model extracts body points and computes angles locally. Only numbers are stored: reps, range, duration, and adherence.",
    "تشفير وموافقة": "Encryption & consent",
    "البيانات المحفوظة مشفّرة، والموافقة مكتوبة، والإشعارات نصية فقط.": "Stored data is encrypted, consent is documented, and notifications are text-only.",
    "الأطفال ركن أساسي": "Children are central",
    "موافقة ولي الأمر والاستشارة القانونية جزء من الخطة من البداية.": "Parental consent and legal review are part of the plan from day one.",
    "علامات الخطر": "Red flags",
    "أي علامة خطر، مثل ألم حاد أو تورم أو دوار أو تدهور مفاجئ، توقف الجلسة وتُحوَّل فوراً إلى المختص.": "Any red flag—such as sharp pain, swelling, dizziness, or sudden decline—stops the session and you should contact your clinician immediately.",
    "التنظيم": "Regulation",
    "نبدأ كأداة التزام وتوثيق بادعاءات منضبطة، ونستشير هيئة الغذاء والدواء السعودية (SFDA) مبكراً. أي ميزة تقيس أو تعالج سريرياً خارج نطاقنا الحالي.": "We start as an adherence and documentation tool with careful claims, and consult Saudi SFDA early. Anything that measures or treats clinically is outside our current scope.",
    "ليس واجهة ملونة فقط، بل منظومة أمان للأسرة. إن توقف الطفل أو خرج من نطاق الكاميرا، تتوقف الجلسة ويُنبَّه المسؤول عنه، ولا يخرج من التطبيق دون علم أهله.": "Not just a colorful UI—a family safety system. If the child stops or leaves the camera frame, the session pauses and the caregiver is alerted; they cannot leave the app without the caregiver knowing.",
    "5 إلى 10 ثوانٍ: يتوقف التمرين تلقائياً بصوت لطيف: «أين ذهبت؟ نكمل معاً».": "5–10 seconds: exercise pauses automatically with a gentle voice: “Where did you go? Let’s continue together.”",
    "30 إلى 60 ثانية: تنبيه للمرافق: صوت عالٍ وإشارة بصرية على الجهاز نفسه.": "30–60 seconds: alert for the companion—loud sound and visual signal on the same device.",
    "عدة دقائق: تنتهي الجلسة وتُسجَّل «غير مكتملة» مع السبب.": "Several minutes: the session ends and is logged “incomplete” with the reason.",
    "قفل برمز المرافق. الخروج من وضع الطفل أو إنهاء الجلسة يحتاج رمزاً لا يعرفه إلا المسؤول.": "Companion PIN lock. Leaving child mode or ending a session requires a PIN only the caregiver knows.",
    "لا نحبس الطفل. زر كبير «أحتاج مساعدة» يوقف الجلسة وينبّه المرافق فوراً دون رمز.": "We do not trap the child. A large “I need help” button stops the session and alerts the companion immediately—no PIN.",
    "التوقف ليس فشلاً. رسائل لطيفة وعودة هادئة، بلا عقاب ولا شاشات حزينة.": "Stopping is not failure. Kind messages and calm return—no punishment or sad screens.",
    "حدّ لعدد الجلسات. يضع المرافق أو المختص جدولاً بأيام التمرين وعدد الجلسات في اليوم وفاصل بينها. وعند الوصول للحد يرى الطفل «وقت الراحة» ولا يكرّر التمرين أكثر من اللازم.": "Session limits. The companion or clinician sets days, sessions per day, and gaps. When the limit is reached the child sees “rest time” and cannot repeat beyond what is planned.",
    "فائدة للطبيب. يظهر في التقرير مثلاً: «6 من 7 جلسات اكتملت، وتوقفت واحدة بعد 3 دقائق».": "Useful for clinicians. The report might show: “6 of 7 sessions completed; one stopped after 3 minutes.”",
    "التنبيه والقفل بصدق": "Alerts and lock—honestly",
    "التنبيه": "Alerts",
    "الأساس تنبيه محلي على الجهاز نفسه، لأن الهاتف قد يكون هاتف المرافق. والإشعار على جهاز آخر إضافة عند توفر الشبكة، ويحمل نصاً فقط دون صور.": "The baseline is a local alert on the same device—the phone may be the companion’s. Notification on another device is an add-on when online; text only, no images.",
    "القفل": "Lock",
    "التطبيق وحده لا يمنع زر الرئيسية في الهاتف، لذلك نرشد الأهل عند الإعداد لتفعيل ميزة النظام (Guided Access على iOS، وتثبيت الشاشة على Android). نقول «قفل وضع الطفل برمز المرافق»، لا «يمنع الخروج من الهاتف».": "The app alone cannot block the phone’s home button, so at setup we guide parents to use system features (Guided Access on iOS, screen pinning on Android). We say “lock child mode with the companion PIN,” not “block leaving the phone.”",
    "الأوقات أعلاه نقطة بداية، وتُضبط باختبار مع أطفال وأخصائيين حقيقيين حتى لا تكثر الإنذارات الكاذبة. ولا ندّعي اكتشاف السقوط أو الألم، نقول فقط «توقفت الحركة أو خرج من الإطار».": "The timings above are a starting point and will be tuned with real children and clinicians to avoid false alarms. We do not claim fall or pain detection—only “movement stopped or left the frame.”",
    "اكتب بريداً إلكترونياً صحيحاً.": "Enter a valid email address.",
    "كلمة المرور 6 أحرف على الأقل.": "Password must be at least 6 characters.",
    "هذا المتصفح لا يدعم الحماية اللازمة لحفظ الحساب.": "This browser does not support the security needed to save an account.",
    "هذا البريد مسجّل. جرّب «دخول».": "This email is already registered. Try Sign in.",
    "اكتب اسمك (حرفان على الأقل).": "Enter your name (at least 2 characters).",
    "اختر دورك: مرافق لطفل، أو مرافق لبالغ، أو مريض بالغ.": "Choose your role: companion for a child, companion for an adult, or adult patient.",
    "اختر الحالة التي تتمرّن لها، أو «حالة أخرى أو لا أعرف بعد».": "Choose the condition you exercise for, or “Other / not sure yet”.",
    "اختر حالة من ترافقه، أو «حالة أخرى أو لا أعرف بعد».": "Choose their condition, or “Other / not sure yet”.",
    "اكتب اسم الطفل (حرفان على الأقل).": "Enter the child’s name (at least 2 characters).",
    "اكتب اسم البالغ الذي ترافقه (حرفان على الأقل).": "Enter the adult’s name (at least 2 characters).",
    "اختر رمز مرافق من 4 أرقام عند إنشاء الحساب. لا تخبر به الطفل.": "Choose a 4-digit companion PIN when creating the account. Do not tell the child.",
    "اكتب اسم المرافق.": "Enter the companion’s name.",
    "اكتب بريداً إلكترونياً صحيحاً للمرافق.": "Enter a valid email for the companion.",
    "لا يوجد حساب بهذا البريد على هذا الجهاز (جوال/لابتوب/آيباد). من الجهاز القديم: حسابي → إنشاء رمز النقل، ثم الصق الرمز في «استيراد الحساب» أسفل هذه الصفحة، أو أنشئ حساباً جديداً إن لم يكن لديك حساب بعد.": "No account with this email on this device. On the old device: My account → Create transfer code, then paste it in Import account below—or create a new account if you do not have one yet.",
    "كلمة المرور غير صحيحة. تأكد من الكتابة من جديد (بدون مسافات زائدة في البداية أو النهاية).": "Incorrect password. Type it again (no extra spaces at the start or end).",
    "تعذّر حفظ الحساب على هذا الجهاز.": "Could not save the account on this device.",
    "ألصق رمز النقل وأدخل كلمة المرور.": "Paste the transfer code and enter the password.",
    "هذا المتصفح لا يدعم استيراد الحساب (جرّب Chrome أو Safari حديثاً).": "This browser cannot import accounts (try recent Chrome or Safari).",
    "كلمة المرور لا تطابق الحساب داخل الرمز.": "Password does not match the account in the code.",
    "تم. ادخل الآن بالبريد وكلمة المرور على هذا الجهاز (جوال، لابتوب، أو آيباد).": "Done. Sign in with email and password on this device (phone, laptop, or iPad).",
    "الرمز غير صالح. انسخه كاملاً من «حسابي» على الجهاز الآخر.": "Invalid code. Copy it fully from My account on the other device.",
    "دخول كضيف": "Continue as guest",
    "أكمل كضيف": "Continue as guest",
}

pairs = ",".join(
    json.dumps(k, ensure_ascii=False) + ": " + json.dumps(v, ensure_ascii=False) for k, v in EXTRA.items()
)
anchor = '"بدّل لغة الموقع بين العربية والإنجليزية. يتغير النص والصوت معاً.": "Switch the site between Arabic and English. The text and the voice change together."'
if anchor not in text:
    raise SystemExit("D anchor missing")
D_block = text[text.find("var D={") + 6 : text.find("},K='daab-lang'")]
missing = [k for k in EXTRA if k not in D_block]
if missing:
    add_pairs = ",".join(
        json.dumps(k, ensure_ascii=False) + ": " + json.dumps(EXTRA[k], ensure_ascii=False) for k in missing
    )
    text = text.replace(anchor, anchor + ", " + add_pairs, 1)

js_repls = [
    (
        "$('cdT').textContent=v==='adult'?'الحالة التي تتمرّن لها':kid?'حالة الطفل الذي ترافقه':'حالة البالغ الذي ترافقه'",
        "$('cdT').textContent=v==='adult'?tx('الحالة التي تتمرّن لها'):kid?tx('حالة الطفل الذي ترافقه'):tx('حالة البالغ الذي ترافقه')",
    ),
    (
        "$('cpT').textContent=kid?'بيانات الطفل الذي ترافقه':comp?'بيانات البالغ الذي ترافقه':'بيانات من ترافقه';$('wNameL').textContent=kid?'اسم الطفل':comp?'اسم البالغ':'اسم من ترافقه';",
        "$('cpT').textContent=kid?tx('بيانات الطفل الذي ترافقه'):comp?tx('بيانات البالغ الذي ترافقه'):tx('بيانات من ترافقه');$('wNameL').textContent=kid?tx('اسم الطفل'):comp?tx('اسم البالغ'):tx('اسم من ترافقه');",
    ),
    (
        "$('roleNote').textContent=kid?'الطفل لا ينشئ حساباً بنفسه: يسجّله مرافقه البالغ، ويدخل واجهته من حسابك، وتقفلها برمز تختاره الآن ولا يعرفه.':comp?'اختر رمز مرافق من 4 أرقام — أنت وحدك من يعرفه. يُستخدم لقفل واجهة الطفل وإنهاء الجلسة والخروج من وضع الطفل.':v==='adult'?'حسابك لك أنت، ويمكنك إضافة مرافق اختياري.':'اختر دورك أولاً. الطفل لا ينشئ حساباً بنفسه: يسجّله مرافقه البالغ.';",
        "$('roleNote').textContent=kid?tx('الطفل لا ينشئ حساباً بنفسه: يسجّله مرافقه البالغ، ويدخل واجهته من حسابك، وتقفلها برمز تختاره الآن ولا يعرفه.'):comp?tx('اختر رمز مرافق من 4 أرقام — أنت وحدك من يعرفه. يُستخدم لقفل واجهة الطفل وإنهاء الجلسة والخروج من وضع الطفل.'):v==='adult'?tx('حسابك لك أنت، ويمكنك إضافة مرافق اختياري.'):tx('اختر دورك أولاً. الطفل لا ينشئ حساباً بنفسه: يسجّله مرافقه البالغ، ويدخل واجهته من حساب المرافق.');",
    ),
    (
        "$('mailLbl').textContent=su?'بريدك الإلكتروني (تصلك عليه التنبيهات)':'البريد الإلكتروني';",
        "$('mailLbl').textContent=su?tx('بريدك الإلكتروني (تصلك عليه التنبيهات)'):tx('البريد الإلكتروني');",
    ),
    (
        "$('aGo').textContent=t==='signup'?'إنشاء الحساب':'دخول';",
        "$('aGo').textContent=t==='signup'?tx('إنشاء الحساب'):tx('دخول');",
    ),
    (
        "function i18nDynRefresh(){try{if(typeof renderLib==='function')renderLib();if(typeof paintPlan==='function')paintPlan();if(typeof acctUI==='function')acctUI();if(typeof route==='function')route()}catch(e){}}",
        "function i18nDynRefresh(){try{if(typeof setTab==='function'&&typeof tab!=='undefined')setTab(tab);if(typeof renderLib==='function')renderLib();if(typeof paintPlan==='function')paintPlan();if(typeof acctUI==='function')acctUI();if(typeof route==='function')route()}catch(e){}}",
    ),
]
for old, new in js_repls:
    if old not in text:
        print("WARN js:", old[:40])
    else:
        text = text.replace(old, new, 1)


def wrap_amsg(m):
    q = m.group(1)
    if q.startswith("tx("):
        return m.group(0)
    return "aMsg.textContent=tx(" + json.dumps(q, ensure_ascii=False) + ")"


text = re.sub(r"aMsg\.textContent='((?:\\'|[^'])*)'", wrap_amsg, text)

PATH.write_text(text, encoding="utf-8")
(ROOT / "index.html").write_text(text, encoding="utf-8")
print("OK", len(EXTRA), "keys")
