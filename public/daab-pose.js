/** MoveNet + تصحيح وضعية — يُربط بجلسة دأب (video#cam) */
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
  var raf = 0;
  var detecting = false;

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
    min = min == null ? 0.25 : min;
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

  function analyze(id, keypoints) {
    var map = {};
    keypoints.forEach(function (k) {
      map[k.name] = k;
    });
    var vis = keypoints.filter(function (k) {
      return k.score >= 0.25;
    }).length;
    if (vis < 5) {
      return {
        level: "warn",
        text: msg("قف أمام الكاميرا — جسمك كامل بالإطار", "Stand fully in camera frame"),
        motion: 0,
      };
    }

    if (id === "e3" || id === "e4") {
      var hip = kp(map, "left_hip") || kp(map, "right_hip");
      var knee = kp(map, "left_knee") || kp(map, "right_knee");
      var ankle = kp(map, "left_ankle") || kp(map, "right_ankle");
      var ka = angle(hip, knee, ankle);
      if (ka == null)
        return { level: "warn", text: msg("اقترب — لا أرى الركبة", "Move so knee is visible"), motion: 0 };
      var m = ka >= 155 ? 0.22 : ka >= 130 ? 0.14 : 0.06;
      if (ka >= 155)
        return { level: "good", text: msg("✓ ممتاز — استمر", "✓ Great — keep going"), motion: m };
      if (ka >= 130)
        return { level: "warn", text: msg("⚠ مدّ الركبة أكثر", "⚠ Straighten knee more"), motion: m };
      return { level: "bad", text: msg("✗ مدّ رجلتك", "✗ Straighten your leg"), motion: m };
    }

    if (id === "e1" || id === "e11") {
      var ls = kp(map, "left_shoulder"),
        rs = kp(map, "right_shoulder");
      var lw = kp(map, "left_wrist"),
        rw = kp(map, "right_wrist");
      var ref = ls && rs ? (ls.y + rs.y) / 2 : ls ? ls.y : rs ? rs.y : null;
      var wy = lw && rw ? Math.min(lw.y, rw.y) : lw ? lw.y : rw ? rw.y : null;
      if (ref == null || wy == null)
        return { level: "warn", text: msg("أظهر ذراعيك", "Show both arms"), motion: 0 };
      var raised = ref - wy;
      var m = raised > 35 ? 0.24 : raised > 15 ? 0.12 : 0.04;
      if (raised > 35)
        return { level: "good", text: msg("✓ ارتفاع جيد", "✓ Good height"), motion: m };
      return { level: "warn", text: msg("⚠ ارفع ذراعك أكثر", "⚠ Raise your arm higher"), motion: m };
    }

    if (id === "e2") {
      var le = kp(map, "left_elbow"),
        re = kp(map, "right_elbow");
      var lsh = kp(map, "left_shoulder"),
        rsh = kp(map, "right_shoulder");
      var lw2 = kp(map, "left_wrist"),
        rw2 = kp(map, "right_wrist");
      var ea = angle(lsh, le, lw2) || angle(rsh, re, rw2);
      if (ea == null)
        return { level: "warn", text: msg("أظهر كوعك", "Show your elbow"), motion: 0 };
      var m2 = ea < 55 ? 0.2 : ea > 130 ? 0.18 : 0.05;
      return {
        level: "good",
        text: msg("✓ حركة الكوع واضحة", "✓ Elbow movement clear"),
        motion: m2,
      };
    }

    return {
      level: "good",
      text: msg("✓ أتابع حركتك", "✓ Tracking your movement"),
      motion: 0.12,
    };
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
      if (!p1 || !p2 || p1.score < 0.25 || p2.score < 0.25) return;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    keypoints.forEach(function (k) {
      if (k.score < 0.25) return;
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
    lastRep = 0;

  function motionTick(m) {
    if (m > 0.06) {
      if (!act) act = true;
      peak = Math.max(peak, m);
      quiet = 0;
    } else if (act && ++quiet >= 4) {
      act = false;
      var n = performance.now();
      if (n - lastRep > 1000 && onRep) {
        lastRep = n;
        onRep(peak);
      }
      peak = 0;
    }
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
          var r = analyze(exId, poses[0].keypoints);
          drawPose(poses[0].keypoints, r.level);
          if (onFeedback) onFeedback(r);
          motionTick(r.motion || 0);
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
      active = true;
      act = false;
      quiet = 0;
      peak = 0;
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
          return window.poseDetection.createDetector(
            window.poseDetection.SupportedModels.MoveNet,
            { modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
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
    },
    resize: resize,
  };
})();
