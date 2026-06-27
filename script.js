const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---- Header scroll ---- */
const header = document.getElementById("header");
window.addEventListener("scroll", () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 20);
}, { passive: true });

/* ---- Mobile menu ---- */
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.getElementById("main-nav");

menuToggle?.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  menuToggle.classList.toggle("is-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.classList.toggle("is-locked", isOpen);
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    menuToggle?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-locked");
  });
});

/* ---- Scroll animations ---- */
const fadeEls = document.querySelectorAll(".fade-in");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
fadeEls.forEach((el) => observer.observe(el));

/* ---- Form ---- */
const form = document.getElementById("interest-form");
const formSuccess = document.getElementById("form-success");

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  formSuccess.hidden = false;
  form.reset();
  setTimeout(() => { formSuccess.hidden = true; }, 5000);
});

/* ---- i18n ---- */
const translations = {
  ar: {
    navProblem: "المشكلة",
    navSolution: "الحل",
    navHow: "كيف يعمل",
    navCamera: "جرب الكاميرا",
    navRoadmap: "خارطة الطريق",
    navPricing: "الباقات",
    navCta: "انضم مبكراً",
    heroBadge: "منصة طبية ذكية — MVP قريباً",
    heroTitle1: "تعافي ذكي",
    heroTitle2: "في منزلك",
    heroDesc: "KineAI تحوّل كاميرا جوالك إلى مساعد طبيعي رقمي يراقب حركتك، يصحّح وضعياتك فوراً، ويحميك من الإصابات الارتدادية — دون تحميل أي تطبيق.",
    heroCtaCamera: "جرب الكاميرا",
    heroCta: "سجّل اهتمامك",
    statJoints: "نقطة حركية",
    statRealtime: "فوري",
    statFeedback: "تغذية راجعة",
    statExercises: "تمارين MVP",
    statusSafe: "● آمن",
    statusExercise: "تمرين الركبة",
    angleLabel: "زاوية الركبة",
    alertSafe: "أداء ممتاز — ضمن المدى الآمن",
    floatAlertTitle: "تنبيه فوري",
    floatAlertDesc: "استقِمْ — حماية الفقرات",
    floatSafeTitle: "مدى آمن",
    floatSafeDesc: "92° — ضمن الحد المسموح",
    problemTag: "المشكلة",
    problemTitle: "لماذا يتردّد المرضى في التأهيل المنزلي؟",
    problemDesc: "ثلاثة تحديات رئيسية تعرقل رحلة التعافي لملايين المرضى في المنطقة والعالم.",
    problem1Title: "الخوف من الإصابة",
    problem1Desc: "يشعر المصابون بالتردد أثناء أداء التمارين بمفردهم، خشية الحركة الخاطئة التي تفاقم الإصابة أو تسبب تمزقاً جديداً.",
    problem2Title: "ضعف المتابعة الطبية",
    problem2Desc: "يواجه الأطباء صعوبة في التأكد من التزام المريض بخطته العلاجية وصحة أدائه بين الزيارات العيادية.",
    problem3Title: "تكلفة التنقل والجهد",
    problem3Desc: "مشقة التنقل المستمر لعيادات العلاج الطبيعي، خاصة للمصابين بآلام حادة أو كبار السن.",
    solutionTag: "الحل",
    solutionTitle: "KineAI — عين الطبيب في منزلك",
    solutionDesc: "حل طبي-تقني آمن يمنح المريض توجيهاً حركياً فورياً (Biofeedback) مبنياً على قواعد سريرية دقيقة، يضمن عدم تجاوز الزوايا الحركية المسموحة.",
    solution1: "تحليل 33 نقطة حركية في الوقت الفعلي",
    solution2: "تنبيهات بصرية وصوتية فورية",
    solution3: "قواعد طبية سريرية مدمجة في الذكاء الاصطناعي",
    solution4: "يعمل عبر المتصفح — بدون تطبيق",
    demoGreen: "● أخضر — آمن",
    demoGreenDesc: "الحركة ضمن المدى العلاجي الصحيح",
    demoRed: "● أحمر — تنبيه",
    demoRedDesc: '"تنبيه: يرجى استقامة الظهر لحماية الفقرات"',
    demoAudio: "🔊 تنبيه صوتي",
    demoAudioDesc: "إرشاد فوري على الشاشة عند أي انحراف خطر",
    howTag: "كيف يعمل",
    howTitle: "ثلاث خطوات نحو تعافٍ آمن",
    step1Title: "افتح الكاميرا",
    step1Desc: "ادخل المنصة من متصفح جوالك — لا حاجة لتحميل تطبيق. شغّل الكاميرا واختر تمرينك العلاجي.",
    step2Title: "تحليل الهيكل الحركي",
    step2Desc: "يتعرّف النظام فورياً على 33 نقطة حركية: المفاصل المصابة، زوايا الظهر، وامتداد الأطراف.",
    step3Title: "تغذية راجعة فورية",
    step3Desc: "احصل على تنبيهات لحظية — أخضر للأداء الصحيح، أحمر مع إرشاد فوري عند أي خطر.",
    conditionsTag: "المرحلة الأولى — MVP",
    conditionsTitle: "تمارين علاجية لحالات محددة",
    conditionsDesc: "يبدأ النموذج الأولي بثلاثة تمارين رئيسية لأشهر حالات إعادة التأهيل.",
    condition1Badge: "الركبة",
    condition1Title: "إعادة تأهيل الركبة",
    condition1Desc: "بعد عمليات الرباط الصليبي أو تغيير المفصل — تمارين مراقبة الزاوية والامتداد.",
    condition1Tag1: "ACL Recovery",
    condition1Tag2: "Range of Motion",
    condition1Tag3: "Quadriceps",
    condition2Badge: "أسفل الظهر",
    condition2Title: "تأهيل أسفل الظهر",
    condition2Desc: "لمرضى الديسك والانزلاق الغضروفي — مراقبة انحناء العمود الفقري والوضعية.",
    condition2Tag1: "Disc Herniation",
    condition2Tag2: "Posture Control",
    condition2Tag3: "Core Stability",
    advTag: "ميزتنا التنافسية",
    advTitle: "برمجة + خلفية صحية = ثقة طبية",
    advDesc: "التقنيون وحدهم يبنون خوارزميات تتعرف على الحركة، لكنهم لا يدركون الفارق بين حركة رياضية وحركة علاجية لمريض مصاب. وجود الخلفية الصحية في فريقنا يضمن تغذية الذكاء الاصطناعي بقواعد سريرية دقيقة.",
    advTech: "تقنية",
    advMedical: "طب",
    advQuote: '"KineAI ليست مجرد تطبيق حركة — إنها عين الطبيب داخل منزل المريض."',
    roadmapTag: "خارطة الطريق",
    roadmapTitle: "رحلة تطوير المنتج",
    phase1Label: "المرحلة الأولى — MVP",
    phase1Title: "موقع ويب + 3 تمارين",
    phase1Desc: "تحليل تمارين الركبة والظهر عبر المتصفح. إثبات الكفاءة الطبية ومستوى الأمان.",
    phase1Status: "● جاري التطوير",
    phase2Label: "المرحلة الثانية — التوسع",
    phase2Title: "تطبيق + 50+ تمرين",
    phase2Desc: "تطبيق هاتف متكامل مع نظام تحفيزي (Gamification) لزيادة التزام المريض.",
    phase3Label: "المرحلة الثالثة — B2B",
    phase3Title: "ربط المستشفيات",
    phase3Desc: "تمكين الطبيب من متابعة حالة المريض ومدى تحسنه عن بُعد عبر أنظمة المستشفيات.",
    pricingTag: "نموذج العمل",
    pricingTitle: "باقات تناسب الجميع",
    pricingB2C: "B2C — الأفراد",
    pricingB2CTitle: "باقة المريض",
    pricingB2CDesc: "اشتراك شهري للمرضى يتيح الوصول للتمارين الذكية وتتبع الحالة اليومية أثناء فترة التأهيل.",
    pricingB2CF1: "تمارين ذكية بمراقبة حركية",
    pricingB2CF2: "تتبع يومي للتقدم",
    pricingB2CF3: "تنبيهات فورية للأمان",
    pricingB2CF4: "تقارير أسبوعية",
    pricingB2CCta: "سجّل اهتمامك",
    pricingB2B: "B2B — العيادات",
    pricingB2BTitle: "باقة المؤسسات",
    pricingB2BDesc: "ترخيص للمراكز الطبية لربط مرضاهم بالمنصة، مما يرفع كفاءة المتابعة ويقلّل مواعيد الانتظار.",
    pricingB2BF1: "لوحة متابعة للأطباء",
    pricingB2BF2: "ربط المرضى بالمنصة",
    pricingB2BF3: "تقارير التزام المريض",
    pricingB2BF4: "دعم فني وتدريب",
    pricingB2BCta: "تواصل معنا",
    ctaTitle: "كن من أوائل المستخدمين",
    ctaDesc: "سجّل اهتمامك الآن واحصل على وصول مبكر لمنصة KineAI عند إطلاق النموذج الأولي.",
    formName: "الاسم الكامل",
    formEmail: "البريد الإلكتروني",
    formTypeDefault: "أنا...",
    formTypePatient: "مريض / مصاب",
    formTypeDoctor: "طبيب / معالج",
    formTypeClinic: "عيادة / مستشفى",
    formTypeInvestor: "مستثمر",
    formSubmit: "انضم للقائمة",
    formSuccess: "✓ تم تسجيلك بنجاح — سنتواصل معك قريباً!",
    footerTagline: "تعافي ذكي — في منزلك",
    footerRights: "جميع الحقوق محفوظة",
    cameraTag: "جرب الآن",
    cameraTitle: "اختبر الكاميرا الذكية",
    cameraDesc: "اضغط على الزر لتشغيل الكاميرا — سيتعرّف النظام على وضعيتك ويعرض نقاط الحركة على الشاشة.",
    cameraIdleText: "اضغط لتشغيل الكاميرا",
    cameraIdleHint: "يُفضّل استخدام الجوال — سيطلب المتصفح إذن الكامéra",
    cameraActive: "الكامéra نشطة",
    cameraExercise: "تمرين الركبة — تجربة",
    cameraAlertWaiting: "جاري تحليل وضعيتك...",
    cameraLoadingPermission: "انتظر — سيظهر طلب إذن الكامéra. اضغط «سماح»",
    cameraLoading: "جاري تحميل محلل الحركة...",
    permHelpTitle: "كيف تسمح بالكامéra؟ (Mac + Chrome)",
    permStepMac: "Mac: إعدادات النظام ← الخصوصية ← الكاميرا ← فعّل Google Chrome",
    permStep1: "اضغط Allow في أعلى Chrome عندما يطلب الإذن",
    permStepChrome: "Chrome: 🔒 يسار العنوان ← Camera ← Allow",
    permStep4: "حدّث ⌘+R ثم اضغط زر الكاميرا",
    permRetry: "حاول مرة أخرى",
    cameraFlip: "قلب الكامéra",
    cameraStop: "إيقاف",
    retryModel: "إعادة تحميل المحلل",
  },
  en: {
    navProblem: "Problem",
    navSolution: "Solution",
    navHow: "How It Works",
    navCamera: "Try Camera",
    navRoadmap: "Roadmap",
    navPricing: "Pricing",
    navCta: "Join Early",
    heroBadge: "Smart Medical Platform — MVP Coming Soon",
    heroTitle1: "Smart Recovery",
    heroTitle2: "At Home",
    heroDesc: "KineAI turns your phone camera into a digital physiotherapist — monitoring your movement, correcting your posture instantly, and protecting you from re-injury. No app download needed.",
    heroCtaCamera: "Try Camera",
    heroCta: "Register Interest",
    statJoints: "Body Joints",
    statRealtime: "Real-time",
    statFeedback: "Biofeedback",
    statExercises: "MVP Exercises",
    statusSafe: "● Safe",
    statusExercise: "Knee Exercise",
    angleLabel: "Knee Angle",
    alertSafe: "Excellent — within safe range",
    floatAlertTitle: "Instant Alert",
    floatAlertDesc: "Straighten up — protect your spine",
    floatSafeTitle: "Safe Range",
    floatSafeDesc: "92° — within allowed limit",
    problemTag: "The Problem",
    problemTitle: "Why Do Patients Hesitate with Home Rehab?",
    problemDesc: "Three major challenges that hinder recovery for millions of patients worldwide.",
    problem1Title: "Fear of Re-injury",
    problem1Desc: "Patients hesitate to exercise alone at home, fearing incorrect movements that worsen their injury or cause new tears.",
    problem2Title: "Weak Medical Follow-up",
    problem2Desc: "Doctors struggle to verify patient adherence to their treatment plan and exercise correctness between clinic visits.",
    problem3Title: "Travel Cost & Effort",
    problem3Desc: "The burden of frequent travel to physiotherapy clinics, especially for patients with acute pain or elderly patients.",
    solutionTag: "The Solution",
    solutionTitle: "KineAI — The Doctor's Eye in Your Home",
    solutionDesc: "A safe medical-tech solution providing instant movement guidance (Biofeedback) built on precise clinical rules, ensuring patients never exceed safe movement angles.",
    solution1: "Real-time analysis of 33 body joints",
    solution2: "Instant visual and audio alerts",
    solution3: "Clinical rules embedded in AI",
    solution4: "Works in browser — no app needed",
    demoGreen: "● Green — Safe",
    demoGreenDesc: "Movement within the correct therapeutic range",
    demoRed: "● Red — Alert",
    demoRedDesc: '"Alert: Please straighten your back to protect your spine"',
    demoAudio: "🔊 Audio Alert",
    demoAudioDesc: "Instant on-screen guidance when any dangerous deviation occurs",
    howTag: "How It Works",
    howTitle: "Three Steps to Safe Recovery",
    step1Title: "Open Your Camera",
    step1Desc: "Access the platform from your mobile browser — no app needed. Turn on your camera and select your therapeutic exercise.",
    step2Title: "Pose Estimation",
    step2Desc: "The system instantly recognizes 33 body joints: injured joints, back angles, and limb extension.",
    step3Title: "Instant Feedback",
    step3Desc: "Get real-time alerts — green for correct performance, red with instant guidance when danger is detected.",
    conditionsTag: "Phase 1 — MVP",
    conditionsTitle: "Therapeutic Exercises for Specific Conditions",
    conditionsDesc: "The MVP starts with three main exercises for the most common rehabilitation cases.",
    condition1Badge: "Knee",
    condition1Title: "Knee Rehabilitation",
    condition1Desc: "After ACL surgery or joint replacement — angle and extension monitoring exercises.",
    condition1Tag1: "ACL Recovery",
    condition1Tag2: "Range of Motion",
    condition1Tag3: "Quadriceps",
    condition2Badge: "Lower Back",
    condition2Title: "Lower Back Rehabilitation",
    condition2Desc: "For disc herniation patients — spine bending and posture monitoring.",
    condition2Tag1: "Disc Herniation",
    condition2Tag2: "Posture Control",
    condition2Tag3: "Core Stability",
    advTag: "Our Advantage",
    advTitle: "Tech + Medical Background = Clinical Trust",
    advDesc: "Technologists alone build movement recognition algorithms, but can't distinguish between athletic movement and therapeutic movement for an injured patient. Our medical background ensures AI is fed with precise clinical rules.",
    advTech: "Tech",
    advMedical: "Medical",
    advQuote: '"KineAI is not just a movement app — it\'s the doctor\'s eye inside the patient\'s home."',
    roadmapTag: "Roadmap",
    roadmapTitle: "Product Development Journey",
    phase1Label: "Phase 1 — MVP",
    phase1Title: "Web Platform + 3 Exercises",
    phase1Desc: "Knee and back exercise analysis via browser. Proving medical efficacy and safety.",
    phase1Status: "● In Development",
    phase2Label: "Phase 2 — Expansion",
    phase2Title: "App + 50+ Exercises",
    phase2Desc: "Full mobile app with gamification system to increase patient adherence.",
    phase3Label: "Phase 3 — B2B",
    phase3Title: "Hospital Integration",
    phase3Desc: "Enable doctors to remotely monitor patient progress via hospital systems.",
    pricingTag: "Business Model",
    pricingTitle: "Plans for Everyone",
    pricingB2C: "B2C — Individuals",
    pricingB2CTitle: "Patient Plan",
    pricingB2CDesc: "Monthly subscription for patients providing access to smart exercises and daily progress tracking during rehabilitation.",
    pricingB2CF1: "Smart exercises with motion monitoring",
    pricingB2CF2: "Daily progress tracking",
    pricingB2CF3: "Instant safety alerts",
    pricingB2CF4: "Weekly reports",
    pricingB2CCta: "Register Interest",
    pricingB2B: "B2B — Clinics",
    pricingB2BTitle: "Institutional Plan",
    pricingB2BDesc: "License for medical centers to connect their patients to the platform, improving follow-up efficiency and reducing wait times.",
    pricingB2BF1: "Doctor monitoring dashboard",
    pricingB2BF2: "Patient platform connection",
    pricingB2BF3: "Patient adherence reports",
    pricingB2BF4: "Technical support & training",
    pricingB2BCta: "Contact Us",
    ctaTitle: "Be Among the First Users",
    ctaDesc: "Register your interest now and get early access to KineAI when the MVP launches.",
    formName: "Full Name",
    formEmail: "Email Address",
    formTypeDefault: "I am a...",
    formTypePatient: "Patient",
    formTypeDoctor: "Doctor / Therapist",
    formTypeClinic: "Clinic / Hospital",
    formTypeInvestor: "Investor",
    formSubmit: "Join the List",
    formSuccess: "✓ Successfully registered — we'll be in touch soon!",
    footerTagline: "Smart Recovery — At Home",
    footerRights: "All rights reserved",
    cameraTag: "Try Now",
    cameraTitle: "Test the Smart Camera",
    cameraDesc: "Press the button to start the camera — the system will detect your posture and display movement points on screen.",
    cameraIdleText: "Tap to start camera",
    cameraLaunch: "Start Camera",
    cameraIdleHint: "Best on mobile — your browser will ask for camera permission",
    cameraActive: "Camera Active",
    cameraExercise: "Knee Exercise — Demo",
    cameraAlertWaiting: "Analyzing your posture...",
    cameraLoadingPermission: "Wait — browser will ask for camera permission. Tap Allow",
    cameraLoading: "Loading motion analyzer...",
    permHelpTitle: "How to allow camera? (Mac + Chrome)",
    permStepMac: "Mac:  → System Settings → Privacy & Security → Camera → enable Google Chrome",
    permStep1: 'Tap "Allow" when the permission popup appears at the top of the page',
    permStepChrome: "Chrome: click 🔒 left of address bar → Camera → Allow → refresh",
    permStep4: "Refresh page (⌘+R) then tap the camera button again",
    permRetry: "Try Again",
    cameraFlip: "Flip Camera",
    cameraStop: "Stop",
    retryModel: "Retry Analyzer",
  },
};

let currentLang = "ar";

const applyTranslations = (lang) => {
  const t = translations[lang];
  if (!t) return;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = lang === "ar"
    ? "KineAI — تعافي الذكي | إعادة التأهيل بالذكاء الاصطناعي"
    : "KineAI — Smart Recovery | AI-Powered Rehabilitation";

  const langBtn = document.querySelector("[data-lang-toggle]");
  if (langBtn) langBtn.textContent = lang === "ar" ? "EN" : "AR";
};

document.querySelector("[data-lang-toggle]")?.addEventListener("click", () => {
  currentLang = currentLang === "ar" ? "en" : "ar";
  applyTranslations(currentLang);
  window.dispatchEvent(new CustomEvent("langchange", { detail: { lang: currentLang } }));
});

applyTranslations(currentLang);
