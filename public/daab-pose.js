/** MoveNet — تكرار فقط عند الخطوط الخضراء (خفيف على الجوال) */
(function () {
  "use strict";

  var detector = null;
  var loading = false;
  var active = false;
  var video = null;
  var canvas = null;
  var ctx = null;
  var exId = "";
  var langEn = false;
  var onFeedback = null;
  var onRep = null;
  var onReject = null;
  var raf = 0;
  var detecting = false;
  var lastEst = 0;
  var EST_MS = 150;
  var detectTimer = null;

  var KP_MIN = 0.32;
  var MIN_VIS = 7;

  var CONN = [
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_elbow"],
    ["left_elbow", "left_wrist"],
    ["right_shoulder", "right_elbow"],
    ["right_elbow", "right_wrist"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    ["left_hip", "left_knee"],
    ["left_knee", "left_ankle"],
    ["right_hip", "right_knee"],
    ["right_knee", "right_ankle"],
  ];

  function msg(ar, en) {
    return langEn ? en : ar;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureLibs() {
    return loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js")
      .then(function () {
        return loadScript(
          "https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js"
        );
      })
      .then(function () {
        if (!window.tf || !window.poseDetection) throw new Error("libs");
        return window.tf.ready().then(function () {
          return window.tf
            .setBackend("webgl")
            .catch(function () {
              return window.tf.setBackend("cpu");
            });
        });
      });
  }

  function kp(map, name, min) {
    min = min == null ? KP_MIN : min;
    var p = map[name];
    return p && p.score >= min ? p : null;
  }

  function angle(a, b, c) {
    if (!a || !b || !c) return null;
    var abx = a.x - b.x,
      aby = a.y - b.y,
      cbx = c.x - b.x,
      cby = c.y - b.y;
    var dot = abx * cbx + aby * cby;
    var mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
    if (!mag) return null;
    return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
  }

  function torsoOk(map) {
    var ls = kp(map, "left_shoulder"),
      rs = kp(map, "right_shoulder");
    var lh = kp(map, "left_hip"),
      rh = kp(map, "right_hip");
    if (!ls || !rs || !lh || !rh) return false;
    if (Math.abs(ls.y - rs.y) > 30) return false;
    if (Math.abs(lh.y - rh.y) > 30) return false;
    return true;
  }

  function result(level, text, motion) {
    return {
      level: level,
      text: text,
      motion: level === "good" ? motion || 0.18 : 0,
    };
  }

  function analyze(id, keypoints) {
    var map = {};
    keypoints.forEach(function (k) {
      map[k.name] = k;
    });
    var vis = keypoints.filter(function (k) {
      return k.score >= KP_MIN;
    }).length;
    if (vis < MIN_VIS) {
      return result("warn", msg("قف أمام الكاميرا — جسمك بالإطار", "Stand in frame"));
    }
    if (!torsoOk(map)) {
      return result("bad", msg("✗ عدّل وضعيتك — كتفاك مستويين", "✗ Level your shoulders"));
    }

    if (id === "e3") {
      var hip = kp(map, "left_hip") || kp(map, "right_hip");
      var knee = kp(map, "left_knee") || kp(map, "right_knee");
      var ankle = kp(map, "left_ankle") || kp(map, "right_ankle");
      var ka = angle(hip, knee, ankle);
      if (ka == null) return result("warn", msg("أظهر الركبة", "Show your knee"));
      if (ka >= 156) return result("good", msg("✓ ركبة مستقيمة", "✓ Straight knee"), 0.22);
      if (ka >= 142) return result("warn", msg("⚠ مدّ أكثر للأخضر", "⚠ Extend for green"));
      return result("bad", msg("✗ مدّ الرجل", "✗ Extend leg"));
    }

    if (id === "e1" || id === "e11") {
      var ls2 = kp(map, "left_shoulder"),
        rs2 = kp(map, "right_shoulder");
      var lw = kp(map, "left_wrist"),
        rw = kp(map, "right_wrist");
      var ref = ls2 && rs2 ? (ls2.y + rs2.y) / 2 : ls2 ? ls2.y : rs2 ? rs2.y : null;
      var best = null;
      if (lw && ref != null) best = Math.max(best || 0, ref - lw.y);
      if (rw && ref != null) best = Math.max(best || 0, ref - rw.y);
      if (best == null) return result("warn", msg("أظهر ذراعيك", "Show arms"));
      if (best >= 40) return result("good", msg("✓ ارتفاع صحيح", "✓ Good height"), 0.24);
      if (best >= 20) return result("warn", msg("⚠ ارفع للأخضر", "⚠ Raise higher"));
      return result("bad", msg("✗ ارفع الذراع", "✗ Raise arm"));
    }

    if (id === "e2") {
      var lsh = kp(map, "left_shoulder"),
        le = kp(map, "left_elbow"),
        lw2 = kp(map, "left_wrist");
      var ea = angle(lsh, le, lw2) || angle(kp(map, "right_shoulder"), kp(map, "right_elbow"), kp(map, "right_wrist"));
      if (ea == null) return result("warn", msg("أظهر الكوع", "Show elbow"));
      if (ea <= 58 || ea >= 152) return result("good", msg("✓ زاوية الكوع", "✓ Elbow angle OK"), 0.2);
      return result("warn", msg("⚠ اثنِ أو افرد أكثر", "⚠ Bend or extend more"));
    }

    if (id === "e4" || id === "e5" || id === "e6" || id === "e7" || id === "e8" || id === "e9" || id === "e12") {
      var ls3 = kp(map, "left_shoulder"),
        rs3 = kp(map, "right_shoulder");
      var lw3 = kp(map, "left_wrist"),
        rw3 = kp(map, "right_wrist");
      if (!ls3 || !rs3) return result("warn", msg("أظهر جذعك", "Show upper body"));
      var up =
        (lw3 && lw3.y < ls3.y - 20) || (rw3 && rw3.y < rs3.y - 20);
      if (up) return result("good", msg("✓ حركة واضحة", "✓ Clear movement"), 0.2);
      return result("warn", msg("⚠ أكمل الحركة للأخضر", "⚠ Complete move for green"));
    }

    return result("warn", msg("⚠ الخطوط خضراء = يُحسب التكرار", "⚠ Green lines = rep counts"));
  }

  function drawPose(keypoints, level) {
    if (!ctx || !canvas.width) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var map = {};
    keypoints.forEach(function (k) {
      map[k.name] = k;
    });
    var color = level === "bad" ? "#FF4D6A" : level === "warn" ? "#FFB020" : "#00FFAA";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    CONN.forEach(function (pair) {
      var p1 = map[pair[0]],
        p2 = map[pair[1]];
      if (!p1 || !p2 || p1.score < KP_MIN || p2.score < KP_MIN) return;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    keypoints.forEach(function (k) {
      if (k.score < KP_MIN) return;
      ctx.beginPath();
      ctx.arc(k.x, k.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  function scaleKeypoints(kps) {
    var vw = video.videoWidth || 1;
    var vh = video.videoHeight || 1;
    var sx = canvas.width / vw;
    var sy = canvas.height / vh;
    return kps.map(function (k) {
      return { name: k.name, score: k.score, x: k.x * sx, y: k.y * sy };
    });
  }

  function resize() {
    if (!video || !canvas) return;
    var w = video.clientWidth || 320;
    var h = video.clientHeight || 240;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  var act = false,
    quiet = 0,
    peak = 0,
    lastRep = 0,
    goodFrames = 0,
    wasWarnDuring = false;

  function resetCycle() {
    act = false;
    quiet = 0;
    peak = 0;
    goodFrames = 0;
  }

  function motionTick(m, level) {
    if (level !== "good") {
      if (act) wasWarnDuring = true;
      return;
    }
    if (m < 0.1) {
      if (act && ++quiet >= 5) {
        if (!wasWarnDuring && goodFrames >= 4 && peak >= 0.16) {
          var n = performance.now();
          if (n - lastRep > 1300 && onRep) {
            lastRep = n;
            onRep(0.22, true);
          }
        } else if (wasWarnDuring && onReject) {
          onReject(msg("لم تُحسب — ابقَ على الخط الأخضر", "Not counted — stay green"));
        }
        resetCycle();
        wasWarnDuring = false;
      }
      return;
    }
    if (!act) act = true;
    quiet = 0;
    goodFrames++;
    peak = Math.max(peak, m);
  }

  function scheduleDetect() {
    if (!active || detecting || !detector || !video || video.readyState < 2) return;
    var now = performance.now();
    if (now - lastEst < EST_MS) return;
    lastEst = now;
    detecting = true;
    if (detectTimer) clearTimeout(detectTimer);
    detectTimer = setTimeout(function () {
      detecting = false;
    }, 2500);

    detector
      .estimatePoses(video, { flipHorizontal: true, maxPoses: 1 })
      .then(function (poses) {
        if (!active) return;
        resize();
        if (poses[0] && poses[0].keypoints) {
          var kps = scaleKeypoints(poses[0].keypoints);
          var r = analyze(exId, kps);
          drawPose(kps, r.level);
          if (onFeedback) onFeedback(r);
          motionTick(r.motion, r.level);
        }
      })
      .catch(function () {})
      .finally(function () {
        detecting = false;
        if (detectTimer) clearTimeout(detectTimer);
      });
  }

  function loop() {
    if (!active) return;
    raf = requestAnimationFrame(loop);
    scheduleDetect();
  }

  window.DaabPose = {
    isActive: function () {
      return active;
    },
    start: function (v, c, exerciseId, opts) {
      opts = opts || {};
      video = v;
      canvas = c;
      ctx = canvas.getContext("2d");
      exId = exerciseId || "";
      langEn = document.documentElement.lang === "en";
      onFeedback = opts.onFeedback;
      onRep = opts.onRep;
      onReject = opts.onReject;
      active = true;
      resetCycle();
      wasWarnDuring = false;
      lastRep = 0;
      lastEst = 0;
      canvas.hidden = false;
      resize();

      function go() {
        loop();
        return true;
      }

      if (detector) return Promise.resolve(go());

      if (loading) return Promise.resolve(false);
      loading = true;

      var loadTimeout = setTimeout(function () {
        loading = false;
      }, 20000);

      return ensureLibs()
        .then(function () {
          return window.poseDetection.createDetector(
            window.poseDetection.SupportedModels.MoveNet,
            {
              modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            }
          );
        })
        .then(function (d) {
          clearTimeout(loadTimeout);
          detector = d;
          loading = false;
          return go();
        })
        .catch(function () {
          clearTimeout(loadTimeout);
          loading = false;
          active = false;
          return false;
        });
    },
    stop: function () {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (detectTimer) clearTimeout(detectTimer);
      detecting = false;
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (canvas) canvas.hidden = true;
      resetCycle();
    },
    resize: resize,
  };
})();
