/* شخصية 3D مبسّطة لشرح التمرين — تتبع نفس منطق pose/draw في index.html */
(function () {
  var THREE = window.THREE;
  var ready = false;
  var active = false;
  var canvas = null;
  var scene, camera, renderer, root, parts = {};
  var raf = 0;
  var matSkin, matJoint, matTrail;

  function lm(x, y, a, L) {
    var r = (a * Math.PI) / 180;
    return [x + L * Math.sin(r), y + L * Math.cos(r)];
  }

  function limb(x, y, a, b, l1, l2) {
    var m = lm(x, y, a, l1);
    var e = lm(m[0], m[1], b, l2);
    return { s: [x, y], m: m, e: e };
  }

  function skel(p) {
    var X = 50,
      SY = 42 + p.dy,
      HY = 72 + p.dy;
    function off(a, b) {
      return b * Math.max(0, 1 - Math.abs(a) / 25);
    }
    var sp = p.sp,
      aa = p.a + off(p.a, -26),
      bb = p.b + off(p.b, 26);
    return {
      head: [X, SY - 18],
      shoulder: [X, SY],
      hip: [X, HY],
      la: limb(X, SY, aa, aa + p.ea, 18, 16),
      ra: limb(X, SY, bb, bb + p.eb, 18, 16),
      ll: limb(X, HY, p.l - sp, p.l - sp - p.k, 20, 20),
      rl: limb(X, HY, p.m + sp, p.m + sp - p.k2, 20, 20),
    };
  }

  function to3(x, y) {
    return new THREE.Vector3((x - 50) * 0.07, -(y - 58) * 0.07, 0);
  }

  function cyl(a, b, r, mat) {
    var d = new THREE.Vector3().subVectors(b, a);
    var len = d.length();
    if (len < 0.001) return null;
    var m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r * 0.92, len, 10, 1),
      mat,
    );
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.clone().normalize(),
    );
    return m;
  }

  function ball(pos, r, mat) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), mat);
    m.position.copy(pos);
    return m;
  }

  function buildScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c3d31);
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.35, 2.35);
    camera.lookAt(0, 0.1, 0);

    matSkin = new THREE.MeshStandardMaterial({
      color: 0xf5f2ea,
      roughness: 0.55,
      metalness: 0.05,
    });
    matJoint = new THREE.MeshStandardMaterial({
      color: 0xe07a3f,
      roughness: 0.45,
      metalness: 0.08,
    });
    matTrail = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.8,
    });

    var amb = new THREE.AmbientLight(0xffffff, 0.55);
    var key = new THREE.DirectionalLight(0xfff8ee, 0.95);
    key.position.set(2, 3, 4);
    var fill = new THREE.DirectionalLight(0x8ab4ae, 0.35);
    fill.position.set(-2, 1, -1);
    scene.add(amb, key, fill);

    root = new THREE.Group();
    scene.add(root);
    parts.group = root;
  }

  function renderLoop() {
    if (!active || !renderer) return;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(renderLoop);
  }

  function resize() {
    if (!canvas || !renderer || !camera) return;
    var w = canvas.clientWidth || 320;
    var h = canvas.clientHeight || 400;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }

  function fromPose(p) {
    if (!ready || !active || !parts.group) return;
    var S = skel(p);
    while (parts.group.children.length) parts.group.remove(parts.group.children[0]);

    var head = to3(S.head[0], S.head[1]);
    var sh = to3(S.shoulder[0], S.shoulder[1]);
    var hip = to3(S.hip[0], S.hip[1]);
    var neck = new THREE.Vector3().lerpVectors(sh, head, 0.35);

    parts.group.add(ball(head, 0.11, matSkin));
    parts.group.add(cyl(neck, sh, 0.07, matSkin));
    parts.group.add(cyl(sh, hip, 0.1, matSkin));
    parts.group.add(ball(sh, 0.06, matJoint));
    parts.group.add(ball(hip, 0.07, matJoint));

    [
      [S.la, 0.05],
      [S.ra, 0.05],
      [S.ll, 0.06],
      [S.rl, 0.06],
    ].forEach(function (L) {
      var a = to3(L[0].s[0], L[0].s[1]);
      var m = to3(L[0].m[0], L[0].m[1]);
      var e = to3(L[0].e[0], L[0].e[1]);
      var c1 = cyl(a, m, L[1], matSkin);
      var c2 = cyl(m, e, L[1] * 0.88, matSkin);
      if (c1) parts.group.add(c1);
      if (c2) parts.group.add(c2);
      parts.group.add(ball(m, L[1] * 1.1, matJoint));
      parts.group.add(ball(e, L[1] * 0.95, matJoint));
    });
  }

  function loadThree() {
    if (window.THREE) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src =
        "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js";
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = function () {
        THREE = window.THREE;
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function init(el) {
    canvas = el;
    return loadThree()
      .then(function () {
        if (ready) return true;
        buildScene();
        renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          alpha: false,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        resize();
        ready = true;
        return true;
      })
      .catch(function () {
        return false;
      });
  }

  function show(on) {
    active = !!on;
    if (!canvas) return;
    canvas.hidden = !active;
    if (active && renderer) {
      resize();
      cancelAnimationFrame(raf);
      renderLoop();
    } else cancelAnimationFrame(raf);
  }

  function dispose() {
    active = false;
    cancelAnimationFrame(raf);
    if (renderer) {
      renderer.dispose();
      renderer = null;
    }
    ready = false;
    scene = null;
  }

  window.DaabCoach3d = {
    init: init,
    fromPose: fromPose,
    show: show,
    dispose: dispose,
    get active() {
      return active;
    },
  };
})();