/** MoveNet — عدّ تكرارات من دورة الحركة (رفع → أخضر → نزول = جولة) */
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
  var EST_MS = 120;
  var detectTimer = null;

  var KP_MIN = 0.28;
  var MIN_VIS = 6;

  var rep = {
    phase: "down",
    sawPeak: false,
    peakOk: false,
    lastRep: 0,
  };

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

  function resetRep() {
    rep.phase = "down";
    rep.sawPeak = false;
    rep.peakOk = false;
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
          return window.tf.setBackend("webgl").catch(function () {
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
    if (Math.abs(ls.y - rs.y) > 0.08 * (canvas.height || 240)) return false;
    return true;
  }

  function armLiftNorm(map) {
    var h = canvas.height || 240;
    var ls = kp(map, "left_shoulder"),
      rs = kp(map, "right_shoulder");
    var lw = kp(map, "left_wrist"),
      rw = kp(map, "right_wrist");
    var ref = ls && rs ? (ls.y + rs.y) / 2 : ls ? ls.y : rs ? rs.y : null;
    if (ref == null) return null;
    var best = 0;
    if (lw) best = Math.max(best, (ref - lw.y) / h);
    if (rw) best = Math.max(best, (ref - rw.y) / h);
    return best;
  }

  function kneeAngleVal(map) {
    var hip = kp(map, "left_hip") || kp(map, "right_hip");
    var knee = kp(map, "left_knee") || kp(map, "right_knee");
    var ankle = kp(map, "left_ankle") || kp(map, "right_ankle");
    return angle(hip, knee, ankle);
  }

  function countRepIfReady() {
    var n = performance.now();
    if (n - rep.lastRep < 900) return;
    rep.lastRep = n;
    if (onRep) onRep(0.22, true);
    rep.sawPeak = false;
    rep.peakOk = false;
    rep.phase = "down";
  }

  function repArmLift(lift) {
    if (lift == null) return;
    var PEAK = 0.11;
    var DOWN = 0.045;

    if (lift >= PEAK) {
      rep.phase = "peak";
      rep.sawPeak = true;
      rep.peakOk = true;
    } else if (lift <= DOWN) {
      if (rep.sawPeak && rep.peakOk) countRepIfReady();
      else if (rep.sawPeak && !rep.peakOk && onReject) {
        onReject(msg("لم تُحسب — ارفع أعلى حتى يصير أخضر", "Not counted — raise higher for green"));
        rep.sawPeak = false;
      }
      rep.phase = "down";
    } else {
      rep.phase = "up";
    }
  }

  function repKnee(ka) {
    if (ka == null) return;
    if (ka >= 152) {
      rep.phase = "peak";
      rep.sawPeak = true;
      rep.peakOk = true;
    } else if (ka <= 125) {
      if (rep.sawPeak && rep.peakOk) countRepIfReady();
      else if (rep.sawPeak && !rep.peakOk && onReject) {
        onReject(msg("لم تُحسب — مدّ الركبة أكثر في الأعلى", "Not counted — extend knee more at top"));
        rep.sawPeak = false;
      }
      rep.phase = "down";
    } else {
      rep.phase = "up";
    }
  }

  function analyzeAndRep(id, map) {
    var vis = 0;
    map._list.forEach(function (k) {
      if (k.score >= KP_MIN) vis++;
    });
    if (vis < MIN_VIS) {
      return { level: "warn", text: msg("اقتربي — أظهري الجسم بالكامل", "Show full body in frame") };
    }
    if (!torsoOk(map)) {
      return { level: "bad", text: msg("✗ عدّلي وضع الجذع", "✗ Straighten your torso") };
    }

    if (id === "e3") {
      var ka = kneeAngleVal(map);
      repKnee(ka);
      if (ka == null) return { level: "warn", text: msg("أظهري الركبة والكعب", "Show knee and ankle") };
      if (ka >= 150)
        return { level: "good", text: msg("✓ امتداد ممتاز — أنزلي ببطء", "✓ Great extension — lower slowly") };
      return { level: "warn", text: msg("↑ مدّي ثم ↓ ارجعي (جولة = مدّ + ثني)", "↑ Extend then ↓ return") };
    }

    if (id === "e1" || id === "e11" || id === "e7" || id === "e12") {
      var lift = armLiftNorm(map);
      repArmLift(lift);
      if (lift == null) return { level: "warn", text: msg("أظهري ذراعيك للكاميرا", "Show arms to camera") };
      if (lift >= 0.11)
        return { level: "good", text: msg("✓ ممتاز — أنزلي الذراع ببطء", "✓ Great — lower arm slowly") };
      if (lift >= 0.05)
        return { level: "warn", text: msg("↑ للأخضر ارفعي، أو ↓ أكملي النزول", "↑ Raise for green, or ↓ lower") };
      return { level: "warn", text: msg("↑ ارفعي الذراع", "↑ Raise your arm") };
    }

    if (id === "e2") {
      var lsh = kp(map, "left_shoulder"),
        le = kp(map, "left_elbow"),
        lw = kp(map, "left_wrist");
      var ea = angle(lsh, le, lw) || angle(kp(map, "right_shoulder"), kp(map, "right_elbow"), kp(map, "right_wrist"));
      if (ea == null) return { level: "warn", text: msg("أظهري الكوع", "Show elbow") };
      if (ea <= 55 || ea >= 155)
        return { level: "good", text: msg("✓ وضع الكوع — بدّلي الاتجاه", "✓ Switch direction") };
      return { level: "warn", text: msg("اثنِ أو افردِ الكوع", "Bend or straighten elbow") };
    }

    var lift2 = armLiftNorm(map);
    if (lift2 != null && lift2 >= 0.08)
      return { level: "good", text: msg("✓ حركة واضحة", "✓ Clear movement") };
    return { level: "warn", text: msg("↑ نفّذي الحركة كاملة", "↑ Do the full movement") };
  }

  function toMap(keypoints) {
    var map = { _list: keypoints };
    keypoints.forEach(function (k) {
      map[k.name] = k;
    });
    return map;
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
    var vw = video.videoWidth || canvas.width || 1;
    var vh = video.videoHeight || canvas.height || 1;
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

  function scheduleDetect() {
    if (!active || detecting || !detector || !video || video.readyState < 2) return;
    var now = performance.now();
    if (now - lastEst < EST_MS) return;
    lastEst = now;
    detecting = true;
    if (detectTimer) clearTimeout(detectTimer);
    detectTimer = setTimeout(function () {
      detecting = false;
    }, 2000);

    detector
      .estimatePoses(video, { flipHorizontal: true, maxPoses: 1 })
      .then(function (poses) {
        if (!active) return;
        resize();
        if (poses[0] && poses[0].keypoints) {
          var kps = scaleKeypoints(poses[0].keypoints);
          var map = toMap(kps);
          var r = analyzeAndRep(exId, map);
          drawPose(kps, r.level);
          if (onFeedback) onFeedback(r);
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
      resetRep();
      rep.lastRep = 0;
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
            { modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
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
      resetRep();
    },
    resize: resize,
    resetRep: resetRep,
  };
})();
