/**
 * KineAI — كaméra + محلل + تصحيح التمارين
 */
import { getSelectedExercise } from "./therapy.js";
import { analyzeExercise } from "./therapy-data.js";

const video = document.getElementById("camera-video");
const canvas = document.getElementById("camera-canvas");
const ctx = canvas?.getContext("2d");
const viewport = document.getElementById("camera-viewport");
const wrapper = document.querySelector(".camera-wrapper");
const idleEl = document.getElementById("camera-idle");
const loadingEl = document.getElementById("camera-loading");
const liveUi = document.getElementById("camera-live-ui");
const permissionHelp = document.getElementById("camera-permission-help");
const errorEl = document.getElementById("camera-error");
const alertEl = document.getElementById("camera-alert");
const exerciseLabel = document.querySelector(".camera-exercise");
const modelStatusEl = document.getElementById("camera-model-status");
const idleModelStatus = document.getElementById("camera-model-idle-status");
const pointsEl = document.getElementById("camera-points");
const controlsEl = document.getElementById("camera-controls");
const startBtn = document.getElementById("camera-start");
const launchBtn = document.getElementById("camera-launch");
const stopBtn = document.getElementById("camera-stop");
const flipBtn = document.getElementById("camera-flip");
const retryBtn = document.getElementById("camera-retry");
const startAnalyzerBtn = document.getElementById("camera-start-analyzer");
const retryModelBtn = document.getElementById("camera-retry-model");

let stream = null;
let detector = null;
let animationId = null;
let facingMode = "user";
let isRunning = false;
let isDetecting = false;
let analyzerLoading = false;
let tfReady = false;
let viewState = "idle";

const msg = (ar, en) => (document.documentElement.lang === "en" ? en : ar);

const POSE_CONNECTIONS = [
  ["nose", "left_eye"], ["nose", "right_eye"],
  ["left_eye", "left_ear"], ["right_eye", "right_ear"],
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"], ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"], ["right_knee", "right_ankle"],
];

const setView = (state) => {
  viewState = state;
  const live = state === "live";
  const loading = state === "loading";
  const err = state === "error";
  const idle = state === "idle";

  viewport?.classList.toggle("is-live", live);
  wrapper?.classList.toggle("is-live", live);
  if (idleEl) idleEl.hidden = !idle;
  if (loadingEl) loadingEl.hidden = !loading;
  if (liveUi) liveUi.hidden = !live;
  if (controlsEl) controlsEl.hidden = !live;
  if (launchBtn) launchBtn.hidden = live || loading;
  if (permissionHelp) permissionHelp.hidden = !err;
  if (errorEl && !err) errorEl.hidden = true;
};

const setFeedback = (result) => {
  const text = document.documentElement.lang === "en" ? result.textEn : result.textAr;
  const span = alertEl?.querySelector("span");
  if (span) span.textContent = text;
  if (alertEl) {
    alertEl.className = "camera-alert";
    if (result.level === "good") alertEl.classList.add("camera-alert--safe");
    else if (result.level === "bad") alertEl.classList.add("camera-alert--danger");
    else alertEl.classList.add("camera-alert--waiting");
  }
};

const setStatus = (text, type = "ready") => {
  if (modelStatusEl) {
    modelStatusEl.hidden = viewState !== "live";
    modelStatusEl.textContent = text;
    modelStatusEl.className = `camera-model-status camera-model-status--${type}`;
  }
  if (idleModelStatus && viewState === "idle") {
    idleModelStatus.textContent = text;
    idleModelStatus.className = `camera-model-idle${type === "ready" ? " is-ready" : type === "failed" ? " is-failed" : ""}`;
  }
};

const showError = (text) => {
  if (errorEl) { errorEl.textContent = text; errorEl.hidden = false; }
};

const hideError = () => {
  if (errorEl) errorEl.hidden = true;
};

const resizeCanvas = () => {
  if (video?.videoWidth > 0) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
};

const drawPose = (keypoints, level = "good") => {
  if (!ctx || !canvas.width) return 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const map = {};
  keypoints.forEach((kp) => { map[kp.name] = kp; });

  const color = level === "bad" ? "#FF4D6A" : level === "warn" ? "#FFB020" : "#00FFAA";
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  POSE_CONNECTIONS.forEach(([a, b]) => {
    const p1 = map[a], p2 = map[b];
    if (!p1 || !p2 || p1.score < 0.25 || p2.score < 0.25) return;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  });

  let count = 0;
  keypoints.forEach((kp) => {
    if (kp.score < 0.25) return;
    count++;
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  if (pointsEl) {
    pointsEl.hidden = false;
    pointsEl.textContent = `${count} ${msg("نقطة", "pts")}`;
  }
  return count;
};

const detectLoop = async () => {
  if (!isRunning) return;
  if (detector && !isDetecting && video.readyState >= 2) {
    isDetecting = true;
    try {
      const poses = await detector.estimatePoses(video, { flipHorizontal: false, maxPoses: 1 });
      const ex = getSelectedExercise();
      if (poses[0]?.keypoints?.length && ex) {
        const result = analyzeExercise(ex.id, poses[0].keypoints);
        drawPose(poses[0].keypoints, result.level === "good" ? "good" : result.level === "bad" ? "bad" : "warn");
        setFeedback(result);
      } else if (poses[0]?.keypoints?.length) {
        drawPose(poses[0].keypoints);
        setFeedback({ level: "warn", textAr: "✓ تم رصد وضعيتك", textEn: "✓ Pose detected" });
      } else {
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    } catch (e) { console.warn(e); }
    finally { isDetecting = false; }
  }
  animationId = requestAnimationFrame(detectLoop);
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("network"));
    document.head.appendChild(s);
  });

const ensureTfLibs = async () => {
  if (tfReady && window.tf && window.poseDetection) return;
  await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js");
  await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js");
  if (!window.tf || !window.poseDetection) throw new Error(msg("فشل تحميل المكتبات", "Library load failed"));
  await window.tf.ready();
  try { await window.tf.setBackend("webgl"); } catch { await window.tf.setBackend("cpu"); }
  tfReady = true;
};

const loadAnalyzer = async () => {
  if (detector || analyzerLoading || !isRunning) return;
  analyzerLoading = true;
  hideError();
  setStatus(msg("● جاري تحميل المحلل...", "● Loading..."), "loading");
  setFeedback({ level: "warn", textAr: "⏳ تحميل المحلل...", textEn: "⏳ Loading analyzer..." });
  if (startAnalyzerBtn) {
    startAnalyzerBtn.disabled = true;
    startAnalyzerBtn.textContent = msg("⏳ جاري التحميل...", "⏳ Loading...");
  }

  try {
    await ensureTfLibs();
    const pd = window.poseDetection;
    detector = await pd.createDetector(
      pd.SupportedModels.MoveNet,
      { modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
    resizeCanvas();
    setStatus(msg("● المحلل يحلّل وضعيتك ✅", "● Analyzing ✅"), "ready");
    setFeedback({ level: "good", textAr: "✓ ابدأي التمرين — راح أصحّحك", textEn: "✓ Start exercise — I'll correct you" });
    if (startAnalyzerBtn) startAnalyzerBtn.hidden = true;
    if (retryModelBtn) retryModelBtn.hidden = true;
  } catch (err) {
    console.error(err);
    detector = null;
    setStatus(msg("● المحلل فشل", "● Failed"), "failed");
    setFeedback({ level: "warn", textAr: "⚠ اضغط «تشغيل المحلل»", textEn: "⚠ Tap Start Analyzer" });
    showError(msg(`المحلل: ${err.message || "تحقق من الإنترنت"}`, `Analyzer: ${err.message}`));
    if (startAnalyzerBtn) {
      startAnalyzerBtn.hidden = false;
      startAnalyzerBtn.disabled = false;
      startAnalyzerBtn.textContent = msg("🧠 تشغيل المحلل", "🧠 Start Analyzer");
    }
    if (retryModelBtn) retryModelBtn.hidden = false;
  } finally {
    analyzerLoading = false;
  }
};

async function getCameraStream() {
  for (const c of [
    { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { facingMode: { ideal: facingMode } }, audio: false },
    { video: true, audio: false },
  ]) {
    try { return await navigator.mediaDevices.getUserMedia(c); } catch (e) { if (!c.video?.facingMode) throw e; }
  }
}

const startCamera = async () => {
  if (isRunning || viewState === "loading") return;

  const ex = getSelectedExercise();
  if (!ex) {
    showError(msg("اختاري تمريناً أولاً من القائمة فوق", "Select an exercise first"));
    document.getElementById("therapy-panel")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  hideError();
  setView("loading");

  if (location.protocol === "file:") {
    setView("error");
    showError(msg("افتح http://localhost:8080", "Open http://localhost:8080"));
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setView("error");
    showError(msg("المتصفح لا يدعم الكاميرا", "Unsupported"));
    return;
  }

  if (exerciseLabel) {
    exerciseLabel.textContent = document.documentElement.lang === "en" ? ex.nameEn : ex.nameAr;
  }

  try {
    stream = await getCameraStream();
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play().catch(() => {});

    isRunning = true;
    setView("live");
    setStatus(msg("● الكاميرا شغّال ✅", "● Camera on ✅"), "ready");
    setFeedback({ level: "warn", textAr: "⏳ جاري تشغيل المحلل...", textEn: "⏳ Starting analyzer..." });

    video.onloadedmetadata = resizeCanvas;
    setTimeout(resizeCanvas, 400);

    if (startAnalyzerBtn) {
      startAnalyzerBtn.hidden = false;
      startAnalyzerBtn.disabled = false;
      startAnalyzerBtn.textContent = msg("🧠 تشغيل المحلل", "🧠 Start Analyzer");
    }

    detectLoop();
    loadAnalyzer();
  } catch (err) {
    isRunning = false;
    console.error(err);
    if (err.name === "NotAllowedError") {
      setView("error");
      showError(msg("الكاميرا مرفوضة — اسمح من 🔒", "Camera denied"));
    } else if (err.name === "NotReadableError") {
      setView("error");
      showError(msg("الكاميرا مشغولة — أغلق برامج الكاميرا", "Camera busy"));
    } else {
      setView("idle");
      showError(msg(`خطأ: ${err.message}`, `Error: ${err.message}`));
    }
  }
};

const stopCamera = () => {
  isRunning = false;
  isDetecting = false;
  analyzerLoading = false;
  detector = null;
  if (animationId) cancelAnimationFrame(animationId);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  setView("idle");
  if (pointsEl) pointsEl.hidden = true;
  if (modelStatusEl) modelStatusEl.hidden = true;
  hideError();
  setStatus(msg("● اختاري تمريناً واضغطي ابدأ", "● Select exercise & start"), "loading");
};

const bind = (el, fn) => el?.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); fn(e); });

bind(startBtn, startCamera);
bind(launchBtn, startCamera);
bind(retryBtn, startCamera);
bind(stopBtn, stopCamera);
bind(startAnalyzerBtn, loadAnalyzer);
bind(retryModelBtn, () => { detector = null; loadAnalyzer(); });
bind(flipBtn, async () => {
  facingMode = facingMode === "user" ? "environment" : "user";
  stopCamera();
  await startCamera();
});

window.addEventListener("pagehide", stopCamera);

setView("idle");
setStatus(msg("● اختاري تمريناً أولاً", "● Select exercise first"), "loading");
ensureTfLibs().catch(() => {});
