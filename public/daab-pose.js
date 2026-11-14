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
    sawMid: false,
    lastRep: 0,
    lastSide: "",
    baseY: null,
  };
  var counting = false;

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

  /* اللغة تُقرأ في كل رسالة — لو بدّل المستخدم اللغة أثناء الجلسة تتبدّل الرسائل فوراً */
  function msg(ar, en) {
    return document.documentElement.lang === "en" ? en : ar;
  }

  function resetRep() {
    rep.phase = "down";
    rep.sawPeak = false;
    rep.sawMid = false;
    rep.lastSide = "";
    rep.baseY = null;
  }

  /* بصمة SRI: لو تغيّر ملف المكتبة على الـCDN (اختراق مثلاً) يرفض المتصفح تشغيله */
  var SRI = {
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js":
      "sha384-vE8hbVJ4lezako5rlvE7bY0BVzWlFhZncPlckrqNwcUQpVtgbENTgZ8TBbnPjZre",
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js":
      "sha384-pjg3ZYfXdbqsHl42YTyNHeHMzvrwQUvEuQ7tTn6+tDmoUkSD3ItK1sBa73y1l0H3",
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      if (SRI[src]) {
        s.integrity = SRI[src];
        s.crossOrigin = "anonymous";
      }
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

  function mid(a, b) {
    if (a && b) return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    return a || b || null;
  }

  /* طول الجذع (كتف → ورك) — كل المقاييس نسبةً له، فلا تتأثر بقرب الشخص من الكاميرا */
  function torsoLen(map) {
    var sh = mid(kp(map, "left_shoulder"), kp(map, "right_shoulder"));
    var hp = mid(kp(map, "left_hip"), kp(map, "right_hip"));
    if (sh && hp && hp.y - sh.y > 10) return hp.y - sh.y;
    return 0.3 * (canvas.height || 240);
  }

  function torsoOk(map) {
    var ls = kp(map, "left_shoulder"),
      rs = kp(map, "right_shoulder");
    var lh = kp(map, "left_hip"),
      rh = kp(map, "right_hip");
    if (!ls || !rs || !lh || !rh) return false;
    if (Math.abs(ls.y - rs.y) > 0.3 * torsoLen(map)) return false;
    return true;
  }

  /* ارتفاع الرسغ: 0 ≈ عند الورك، 1 ≈ عند الكتف، أكبر من 1 = فوق الكتف */
  function wristElev(map, side) {
    var w = kp(map, side + "_wrist");
    var sh = kp(map, side + "_shoulder") || mid(kp(map, "left_shoulder"), kp(map, "right_shoulder"));
    if (!w || !sh) return null;
    var T = torsoLen(map);
    return (sh.y + T - w.y) / T;
  }

  function armElev(map) {
    var l = wristElev(map, "left"),
      r = wristElev(map, "right");
    if (l == null && r == null) return null;
    return Math.max(l == null ? -9 : l, r == null ? -9 : r);
  }

  /* زاوية مفصل من نفس الجهة فقط (لا نخلط ورك اليسار مع ركبة اليمين) */
  function sideAngle(map, a, b, c, pick) {
    var L = angle(kp(map, "left_" + a), kp(map, "left_" + b), kp(map, "left_" + c));
    var R = angle(kp(map, "right_" + a), kp(map, "right_" + b), kp(map, "right_" + c));
    if (L == null) return R;
    if (R == null) return L;
    return pick(L, R);
  }

  function countRepIfReady() {
    if (!counting) return;
    var n = performance.now();
    if (n - rep.lastRep < 900) return;
    rep.lastRep = n;
    if (onRep) onRep(0.22, true);
  }

  /* دورة عامة: نزول → قمة (أخضر) → نزول = تكرار. حركة ناقصة تُبلَّغ ولا تُحسب */
  function repCycle(v, peak, down, invert, rejectMsg) {
    if (v == null) return;
    var d = invert ? -1 : 1;
    var mid2 = down + 0.6 * (peak - down);
    if ((v - peak) * d >= 0) {
      rep.phase = "peak";
      rep.sawPeak = true;
    } else if ((v - down) * d <= 0) {
      if (rep.sawPeak) countRepIfReady();
      else if (rep.sawMid && counting && onReject) onReject(rejectMsg);
      rep.sawPeak = false;
      rep.sawMid = false;
      rep.phase = "down";
    } else {
      if ((v - mid2) * d >= 0) rep.sawMid = true;
      rep.phase = "up";
    }
  }

  function legAlignOk(map) {
    function side(a, b, c) {
      return !!(kp(map, a) && kp(map, b) && kp(map, c));
    }
    return (
      side("left_hip", "left_knee", "left_ankle") ||
      side("right_hip", "right_knee", "right_ankle")
    );
  }

  function armAlignOk(map) {
    function arm(sh, el, wr) {
      return !!(kp(map, sh) && kp(map, el) && kp(map, wr));
    }
    return (
      arm("left_shoulder", "left_elbow", "left_wrist") ||
      arm("right_shoulder", "right_elbow", "right_wrist")
    );
  }

  function alignBlock(id, map, vis) {
    if (id !== "e6" && !torsoOk(map)) {
      return {
        level: "bad",
        text: msg("✗ عدّل وضع الجذع", "✗ Straighten your torso"),
        alignReady: false,
      };
    }
    if (id === "e3" || id === "e4") {
      if (!legAlignOk(map))
        return {
          level: "warn",
          text: msg("أظهر الساق والقدم للكاميرا", "Show leg and foot to camera"),
          alignReady: false,
        };
      return null;
    }
    if (id === "e2") {
      if (!armAlignOk(map))
        return {
          level: "warn",
          text: msg("أظهر الذراع والكوع للكاميرا", "Show arm and elbow to camera"),
          alignReady: false,
        };
      return null;
    }
    if (id === "e5" || id === "e6" || id === "e8") {
      if (vis < MIN_VIS || !legAlignOk(map))
        return {
          level: "warn",
          text: msg("ابتعد قليلاً — أظهر جسمك كاملاً", "Show full body in frame"),
          alignReady: false,
        };
      return null;
    }
    if (vis < MIN_VIS && !armAlignOk(map))
      return {
        level: "warn",
        text: msg("أظهر جسمك أو ذراعيك للكاميرا", "Show your body or both arms"),
        alignReady: false,
      };
    return null;
  }

  function good(ar, en) {
    return { level: "good", text: msg(ar, en), alignReady: true };
  }
  function warn(ar, en, ready) {
    return { level: "warn", text: msg(ar, en), alignReady: ready !== false };
  }

  function analyzeAndRep(id, map) {
    var vis = 0;
    map._list.forEach(function (k) {
      if (k.score >= KP_MIN) vis++;
    });
    var block = alignBlock(id, map, vis);
    if (block) return block;
    var T = torsoLen(map);
    var NO = msg("لم تُحسب — أكمل الحركة حتى يصير أخضر", "Not counted — complete the movement until green");

    /* بسط الركبة جالساً: الزاوية تكبر عند المدّ */
    if (id === "e3") {
      var ka = sideAngle(map, "hip", "knee", "ankle", Math.max);
      if (counting) repCycle(ka, 152, 125, false, msg("لم تُحسب — مدّ الركبة أكثر", "Not counted — extend the knee more"));
      if (ka == null) return warn("أظهر الركبة والكاحل", "Show knee and ankle", false);
      if (ka >= 152) return good("✓ امتداد ممتاز — أنزل ببطء", "✓ Great extension — lower slowly");
      return warn("↑ مدّ ركبتك ثم ↓ ارجع (جولة = مدّ + ثني)", "↑ Extend then ↓ return");
    }

    /* ثني الكوع وبسطه: القمة = ثني كامل (زاوية صغيرة) */
    if (id === "e2") {
      var ea = sideAngle(map, "shoulder", "elbow", "wrist", Math.min);
      if (counting) repCycle(ea, 60, 145, true, msg("لم تُحسب — اثنِ الكوع أكثر", "Not counted — bend the elbow more"));
      if (ea == null) return warn("أظهر الكوع", "Show elbow", false);
      if (ea <= 60) return good("✓ ثني ممتاز — افرد ذراعك ببطء", "✓ Good bend — straighten slowly");
      if (ea >= 145) return warn("↑ اثنِ كوعك ليقترب كفّك من كتفك", "↑ Bend your elbow toward your shoulder");
      return warn("اثنِ أو افرد الكوع", "Bend or straighten elbow");
    }

    /* رفع الكعبين: يرتفع الكتفان قليلاً عن وضع الوقوف */
    if (id === "e4") {
      var sh = mid(kp(map, "left_shoulder"), kp(map, "right_shoulder"));
      if (!sh) return warn("أظهر كتفيك للكاميرا", "Show your shoulders", false);
      if (rep.baseY == null || sh.y > rep.baseY) rep.baseY = sh.y;
      else if (rep.phase === "down") rep.baseY += (sh.y - rep.baseY) * 0.02;
      var rise = (rep.baseY - sh.y) / T;
      if (counting) repCycle(rise, 0.08, 0.03, false, msg("لم تُحسب — ارفع كعبيك أعلى", "Not counted — rise higher on your toes"));
      if (rise >= 0.08) return good("✓ ممتاز — أنزل كعبيك ببطء", "✓ Great — lower your heels slowly");
      return warn("↑ ارفع كعبيك", "↑ Rise onto your toes");
    }

    /* الجلوس والوقوف: ارتفاع الورك عن الكاحل نسبةً للجذع */
    if (id === "e5") {
      var hp = mid(kp(map, "left_hip"), kp(map, "right_hip"));
      var an = mid(kp(map, "left_ankle"), kp(map, "right_ankle"));
      if (!hp || !an) return warn("أظهر الورك والقدمين", "Show hips and feet", false);
      var hh = (an.y - hp.y) / T;
      if (counting) repCycle(hh, 1.45, 1.15, false, msg("لم تُحسب — قف باستقامة كاملة", "Not counted — stand fully upright"));
      if (hh >= 1.45) return good("✓ وقفة ممتازة — اجلس ببطء", "✓ Great stand — sit down slowly");
      return warn("↑ قف دون الاعتماد على يديك", "↑ Stand up without using your hands");
    }

    /* المشي في المكان: فرق ارتفاع الركبتين */
    if (id === "e8") {
      var lk = kp(map, "left_knee"),
        rk = kp(map, "right_knee");
      if (!lk || !rk) return warn("أظهر ركبتيك للكاميرا", "Show both knees", false);
      var kd = Math.abs(lk.y - rk.y) / T;
      if (counting) repCycle(kd, 0.45, 0.15, false, msg("لم تُحسب — ارفع ركبتك أعلى", "Not counted — lift your knee higher"));
      if (kd >= 0.45) return good("✓ ركبة عالية — بدّل الرجل", "✓ High knee — switch legs");
      return warn("↑ ارفع ركبتك", "↑ Lift your knee");
    }

    /* الوقوف على قدم / نقل الوزن: رفع قدم أو ميل الورك فوق قدم واحدة */
    if (id === "e6") {
      var la = kp(map, "left_ankle"),
        ra = kp(map, "right_ankle");
      var hp2 = mid(kp(map, "left_hip"), kp(map, "right_hip"));
      var ls = kp(map, "left_shoulder"),
        rs = kp(map, "right_shoulder");
      if (!la || !ra || !hp2) return warn("أظهر قدميك ووركك", "Show your feet and hips", false);
      var sw = ls && rs ? Math.abs(ls.x - rs.x) : T * 0.8;
      var lift2 = Math.abs(la.y - ra.y) / T / 0.25;
      var shift = Math.abs(hp2.x - (la.x + ra.x) / 2) / (sw || 1) / 0.3;
      var bv = Math.max(lift2, shift);
      if (counting) repCycle(bv, 1, 0.4, false, msg("لم تُحسب — انقل وزنك أكثر", "Not counted — shift your weight further"));
      if (bv >= 1) return good("✓ ثبات جيد — ارجع للوسط", "✓ Good — return to centre");
      return warn("انقل وزنك إلى قدم واحدة", "Shift your weight onto one foot");
    }

    /* رفع الذراعين بالتناوب: تكرار عند تبدّل الذراع المرفوعة فوق الرأس */
    if (id === "e12") {
      var el = wristElev(map, "left"),
        er = wristElev(map, "right");
      if (el == null && er == null) return warn("أظهر ذراعيك للكاميرا", "Show arms to camera", false);
      var up = (el != null && el >= 1.4) ? "l" : (er != null && er >= 1.4) ? "r" : "";
      if (up && up !== rep.lastSide) {
        if (rep.lastSide && counting) countRepIfReady();
        rep.lastSide = up;
      }
      if (up) return good("✓ ممتاز — بدّل الذراع", "✓ Great — switch arms");
      return warn("↑ ارفع ذراعاً فوق رأسك", "↑ Raise one arm overhead");
    }

    /* رفع الذراع للأمام / جانباً حتى الكتف، التصفيق فوق الرأس، دوائر الذراعين */
    var peak = id === "e7" ? 1.4 : 0.85;
    var down = id === "e7" ? 0.6 : 0.4;
    var lift = armElev(map);
    if (counting) repCycle(lift, peak, down, false, msg("لم تُحسب — ارفع أعلى حتى يصير أخضر", "Not counted — raise higher for green"));
    if (lift == null) return warn("أظهر ذراعيك للكاميرا", "Show arms to camera", false);
    if (lift >= peak) return good("✓ ممتاز — أنزل الذراع ببطء", "✓ Great — lower arm slowly");
    if (lift >= (peak + down) / 2) return warn("↑ ارفع أعلى قليلاً للأخضر", "↑ A little higher for green");
    return warn(id === "e7" ? "↑ ارفع ذراعيك فوق رأسك" : "↑ ارفع الذراع حتى مستوى الكتف", id === "e7" ? "↑ Raise both arms overhead" : "↑ Raise your arm to shoulder level");
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

  /* الفيديو معروض بـ object-fit: cover — نطبّق نفس القصّ والتكبير على النقاط
     وإلا ينزاح الهيكل عن الجسم كلما اختلفت نسبة الشاشة عن نسبة الكاميرا */
  function scaleKeypoints(kps) {
    var vw = video.videoWidth || canvas.width || 1;
    var vh = video.videoHeight || canvas.height || 1;
    var s = Math.max(canvas.width / vw, canvas.height / vh);
    var ox = (canvas.width - vw * s) / 2;
    var oy = (canvas.height - vh * s) / 2;
    return kps.map(function (k) {
      return { name: k.name, score: k.score, x: k.x * s + ox, y: k.y * s + oy };
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

    /* flipHorizontal: false — اللوحة نفسها معكوسة بالـ CSS مثل الفيديو؛
       القلب هنا كان يعكس الهيكل مرتين فيظهر على الجهة الخطأ */
    detector
      .estimatePoses(video, { flipHorizontal: false, maxPoses: 1 })
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
      onFeedback = opts.onFeedback;
      onRep = opts.onRep;
      onReject = opts.onReject;
      active = true;
      counting = false;
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
    setCounting: function (on) {
      counting = !!on;
      if (on) resetRep();
    },
  };
})();
