/** MoveNet + تصحيح وضعية — يُحسب التكرار فقط عند level: good (خطوط خضراء) */
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

  var KP_MIN = 0.35;
  var MIN_VIS = 8;

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
    if (Math.abs(ls.y - rs.y) > 28) return false;
    if (Math.abs(lh.y - rh.y) > 28) return false;
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
      return result(
        "warn",
        msg("قف أمام الكاميرا — ظهرك وجذعك كامل بالإطار", "Full body in frame, face the camera")
      );
    }
    if (!torsoOk(map)) {
      return result(
        "bad",
        msg("✗ عدّل وضعيتك — كتفاك أو hips غير مستويين", "✗ Level shoulders and hips")
      );
    }

    if (id === "e3") {
      var hip = kp(map, "left_hip") || kp(map, "right_hip");
      var knee = kp(map, "left_knee") || kp(map, "right_knee");
      var ankle = kp(map, "left_ankle") || kp(map, "right_ankle");
      var ka = angle(hip, knee, ankle);
      if (ka == null)
        return result("warn", msg("أظهر الركبة والكعب", "Show knee and ankle"));
      if (ka >= 158)
        return result("good", msg("✓ ركبة مستقيمة — ممتاز", "✓ Knee straight — great"), 0.22);
      if (ka >= 145)
        return result("warn", msg("⚠ مدّ الركبة أكثر للوصول للأخضر", "⚠ Straighten more for green"));
      return result("bad", msg("✗ الركبة مثنية — مدّ الرجل", "✗ Knee bent — extend leg"));
    }

    if (id === "e4") {
      var ls = kp(map, "left_shoulder"),
        rs = kp(map, "right_shoulder");
      var la = kp(map, "left_ankle"),
        ra = kp(map, "right_ankle");
      if (!la && !ra) return result("warn", msg("أظهر قدميك", "Show your feet"));
      var sy = ls && rs ? (ls.y + rs.y) / 2 : null;
      var ay = la && ra ? (la.y + ra.y) / 2 : la ? la.y : ra.y;
      if (sy == null) return result("warn", msg("أظهر كتفيك", "Show shoulders"));
      var lift = sy - ay;
      if (lift > 12)
        return result("good", msg("✓ رفع الكعب صحيح", "✓ Heel raise looks good"), 0.2);
      return result("warn", msg("⚠ ارفع الكعبين أعلى", "⚠ Raise heels higher"));
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
      if (best == null)
        return result("warn", msg("أظهر ذراعيك للكاميرا", "Show arms to camera"));
      if (best >= 42)
        return result("good", msg("✓ ارتفاع الذراع صحيح", "✓ Arm height correct"), 0.24);
      if (best >= 22)
        return result("warn", msg("⚠ ارفع للمستوى الأخضر (كتف)", "⚠ Raise to shoulder — green"));
      return result("bad", msg("✗ الذراع منخفض — ارفع أكثر", "✗ Arm too low"));
    }

    if (id === "e2") {
      var lsh = kp(map, "left_shoulder"),
        le = kp(map, "left_elbow"),
        lw2 = kp(map, "left_wrist");
      var rsh = kp(map, "right_shoulder"),
        re = kp(map, "right_elbow"),
        rw2 = kp(map, "right_wrist");
      var eaL = angle(lsh, le, lw2),
        eaR = angle(rsh, re, rw2);
      var ea = eaL != null ? eaL : eaR;
      if (ea == null) return result("warn", msg("أظهر الكوع والرسغ", "Show elbow and wrist"));
      if (ea <= 55 || ea >= 155)
        return result("good", msg("✓ زاوية الكوع في النطاق", "✓ Elbow angle in range"), 0.2);
      return result("warn", msg("⚠ اثنِ أو افرد الكوع أكثر", "⚠ Bend or extend elbow more"));
    }

    if (id === "e5" || id === "e6") {
      var lk = kp(map, "left_knee"),
        rk = kp(map, "right_knee");
      var lh2 = kp(map, "left_hip"),
        rh2 = kp(map, "right_hip");
      if (!lk || !rk || !lh2 || !rh2)
        return result("warn", msg("أظهر ساقيك كاملتين", "Show both legs"));
      var sep = Math.abs(lk.x - rk.x);
      if (id === "e6" && sep > 45)
        return result("good", msg("✓ توازن جيد على قدم", "✓ Good single-leg balance"), 0.18);
      if (id === "e5")
        return result("good", msg("✓ وضعية الجلوس/الوقوف واضحة", "✓ Sit/stand posture clear"), 0.18);
      return result("warn", msg("⚠ افتح قدمك عن الأخرى للتوازن", "⚠ Separate feet for balance"));
    }

    if (id === "e7" || id === "e8" || id === "e9" || id === "e12") {
      var ls3 = kp(map, "left_shoulder"),
        rs3 = kp(map, "right_shoulder");
      var lw3 = kp(map, "left_wrist"),
        rw3 = kp(map, "right_wrist");
      if (!ls3 || !rs3) return result("warn", msg("أظهر جذعك", "Show upper body"));
      var up =
        (lw3 && ls3 && lw3.y < ls3.y - 25) || (rw3 && rs3 && rw3.y < rs3.y - 25);
      if (up) return result("good", msg("✓ حركة واضحة — استمر", "✓ Clear movement — keep going"), 0.22);
      return result("warn", msg("⚠ نفّذ الحركة كاملة للأخضر", "⚠ Complete the move for green"));
    }

    return result("warn", msg("⚠ صحّح الوضعية حتى تصبح الخطوط خضراء", "⚠ Fix form until lines turn green"));
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
      ctx.arc(k.x, k.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }

  function resize() {
    if (!video || !canvas) return;
    var w = video.clientWidth || 320;
    var h = video.clientHeight || 240;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
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
      if (act && ++quiet >= 8) {
        if (!wasWarnDuring && goodFrames >= 10 && peak >= 0.16) {
          var n = performance.now();
          if (n - lastRep > 1300 && onRep) {
            lastRep = n;
            onRep(0.22, true);
          }
        } else if (wasWarnDuring && onReject) {
          onReject(
            msg(
              "لم تُحسب — الخطوط يجب أن تبقى خضراء أثناء الحركة",
              "Not counted — keep green lines during the move"
            )
          );
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

  function loop() {
    if (!active) return;
    raf = requestAnimationFrame(loop);
    if (!detector || !video || video.readyState < 2 || detecting) return;
    detecting = true;
    detector
      .estimatePoses(video, { flipHorizontal: true, maxPoses: 1 })
      .then(function (poses) {
        if (!active) return;
        if (poses[0] && poses[0].keypoints) {
          var kps = poses[0].keypoints;
          var scaleX = canvas.width / (video.videoWidth || canvas.width);
          var scaleY = canvas.height / (video.videoHeight || canvas.height);
          kps = kps.map(function (k) {
            return { name: k.name, score: k.score, x: k.x * scaleX, y: k.y * scaleY };
          });
          var r = analyze(exId, kps);
          drawPose(kps, r.level);
          if (onFeedback) onFeedback(r);
          motionTick(r.motion, r.level);
        } else if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      })
      .catch(function () {})
      .finally(function () {
        detecting = false;
      });
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
      canvas.hidden = false;
      resize();
      if (detector) {
        loop();
        return Promise.resolve(true);
      }
      if (loading) return Promise.resolve(false);
      loading = true;
      return ensureLibs()
        .then(function () {
          var mt = window.poseDetection.movenet.modelType;
          return window.poseDetection.createDetector(
            window.poseDetection.SupportedModels.MoveNet,
            { modelType: mt.SINGLEPOSE_THUNDER || mt.SINGLEPOSE_LIGHTNING }
          );
        })
        .then(function (d) {
          detector = d;
          loading = false;
          loop();
          return true;
        })
        .catch(function () {
          loading = false;
          active = false;
          return false;
        });
    },
    stop: function () {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (canvas) canvas.hidden = true;
      resetCycle();
    },
    resize: resize,
  };
})();
