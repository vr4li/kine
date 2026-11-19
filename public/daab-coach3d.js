/**
 * دأب — شخصيات Mixamo ثلاثية الأبعاد (X Bot أنثى · Y Bot ذكر)
 * تحل محل الرسم الـ SVG في الجلسة والصفحة الرئيسية.
 */
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { SkeletonUtils } from "three/addons/utils/SkeletonUtils.js";

const MODELS = {
  female: "models/x-bot.fbx",
  male: "models/y-bot.fbx",
};

const loader = new FBXLoader();
const masters = { female: null, male: null };

export function pose3d(id, t, amp) {
  var T = 3,
    ph = (t % T) / T,
    s = Math.min(1, ((1 - Math.cos(ph * 2 * Math.PI)) / 2) * amp),
    q = 1 - s,
    p = { a: 0, b: 0, ea: 0, eb: 0, l: 0, m: 0, k: 0, k2: 0, dy: 0, sp: 18 },
    u,
    v,
    w,
    l,
    k,
    h;
  switch (id) {
    case "e1":
      p.a = s * 165;
      break;
    case "e2":
      p.a = 20;
      p.ea = s * 125;
      break;
    case "e3":
      p.sp = 0;
      p.l = 90;
      p.m = 90;
      p.k = 90 * q;
      p.k2 = 90;
      break;
    case "e4":
      p.dy = -s * 7;
      break;
    case "e5":
      p.sp = 0;
      l = 80 * q;
      k = 95 * q;
      h =
        20 * Math.cos((l * Math.PI) / 180) +
        20 * Math.cos(((l - k) * Math.PI) / 180);
      p.l = p.m = l;
      p.k = p.k2 = k;
      p.dy = 40 - h;
      p.a = p.b = s * 60;
      break;
    case "e6":
      p.m = s * 70;
      p.k2 = s * 80;
      p.a = 25;
      p.b = -25;
      break;
    case "e7":
      p.a = s * 170;
      p.b = -s * 170;
      break;
    case "e8":
      u = Math.sin(ph * 2 * Math.PI);
      v = Math.max(u, 0) * amp;
      w = Math.max(-u, 0) * amp;
      p.l = v * 60;
      p.k = v * 70;
      p.m = w * 60;
      p.k2 = w * 70;
      p.a = -w * 30;
      p.b = -v * 30;
      break;
    case "e9":
      p.a = ((t / 2) * 360) % 360;
      p.b = -p.a;
      break;
    case "e11":
      p.a = s * 90;
      p.b = -s * 90;
      break;
    case "e12":
      u = Math.sin(ph * 2 * Math.PI);
      p.a = Math.max(u, 0) * amp * 170;
      p.b = -Math.max(-u, 0) * amp * 170;
      break;
    default:
      break;
  }
  return p;
}

function prepMeshes(obj) {
  obj.traverse((ch) => {
    if (ch.isSkinnedMesh || ch.isMesh) {
      ch.castShadow = ch.receiveShadow = true;
      ch.frustumCulled = false;
      const mats = ch.material
        ? Array.isArray(ch.material)
          ? ch.material
          : [ch.material]
        : [];
      mats.forEach((m) => {
        if (!m) return;
        m.side = THREE.DoubleSide;
        if (m.metalness > 0.4) m.metalness = 0.15;
        m.roughness = Math.min(m.roughness || 0.6, 0.85);
      });
    }
  });
}

function scaleToMeters(obj) {
  let box = new THREE.Box3().setFromObject(obj);
  if (box.isEmpty()) return 1;
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  if (maxDim > 10) obj.scale.multiplyScalar(0.01);
  else if (maxDim < 0.05) obj.scale.multiplyScalar(50);
  obj.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());
  obj.position.x -= center.x;
  obj.position.z -= center.z;
  obj.position.y -= box.min.y;
  return box.max.y - box.min.y;
}

async function loadMaster(gender) {
  if (masters[gender]) return masters[gender];
  const root = await loader.loadAsync(MODELS[gender]);
  prepMeshes(root);
  scaleToMeters(root);
  root.traverse((c) => {
    if (c.animations) c.animations = [];
  });
  masters[gender] = root;
  return root;
}

function regBone(b, bones, bindEuler, bindPos) {
  if (!b || !b.name || bones[b.name]) return;
  bones[b.name] = b;
  bindEuler[b.name] = { x: b.rotation.x, y: b.rotation.y, z: b.rotation.z };
  bindPos[b.name] = b.position.clone();
}

function cacheBones(obj) {
  const bones = {};
  const bindEuler = {};
  const bindPos = {};
  obj.traverse((o) => {
    if (o.isBone) regBone(o, bones, bindEuler, bindPos);
    if (o.isSkinnedMesh && o.skeleton && o.skeleton.bones) {
      o.skeleton.bones.forEach((b) => regBone(b, bones, bindEuler, bindPos));
    }
  });
  return { bones, bindEuler, bindPos };
}

function boneKey(short, bones) {
  const candidates = [short, "mixamorig:" + short];
  for (const c of candidates) if (bones[c]) return c;
  const keys = Object.keys(bones);
  return (
    keys.find((k) => k === short || k.endsWith(":" + short) || k.endsWith(short)) ||
    null
  );
}

function resetBones(bones, bindEuler, bindPos) {
  for (const n in bindEuler) {
    const b = bones[n];
    const e = bindEuler[n];
    if (b && e) {
      b.rotation.set(e.x, e.y, e.z);
      if (bindPos[n]) b.position.copy(bindPos[n]);
    }
  }
}

function rotBone(short, dx, dy, dz, bones, bindEuler) {
  const key = boneKey(short, bones);
  const b = key && bones[key];
  const e = key && bindEuler[key];
  if (!b || !e) return;
  b.rotation.set(e.x + dx, e.y + dy, e.z + dz);
}

function applyDaabPose(p, exId, model, bones, bindEuler, bindPos) {
  resetBones(bones, bindEuler, bindPos);
  const D = Math.PI / 180;
  const off = (a, b) => b * Math.max(0, 1 - Math.abs(a) / 25);
  const aa = p.a + off(p.a, -26);
  const bb = p.b + off(p.b, 26);
  const bb3d = -bb;

  if (exId === "e9") {
    const w = p.a * D;
    rotBone("LeftArm", 0, w, w * 0.45, bones, bindEuler);
    rotBone("RightArm", 0, -w, -w * 0.45, bones, bindEuler);
  } else if (exId === "e11") {
    const s = (90 - aa) * D;
    rotBone("LeftArm", 0, 0, s, bones, bindEuler);
    rotBone("RightArm", 0, 0, -s, bones, bindEuler);
  } else {
    const leftX = (aa - 90) * D;
    const rightX = (bb3d - 90) * D;
    rotBone("LeftArm", leftX, 0, 0, bones, bindEuler);
    rotBone("RightArm", rightX, 0, 0, bones, bindEuler);
    rotBone("LeftForeArm", -p.ea * D, 0, 0, bones, bindEuler);
    rotBone("RightForeArm", -p.eb * D, 0, 0, bones, bindEuler);
  }

  rotBone("LeftUpLeg", -(p.l - p.sp) * D, 0, 0, bones, bindEuler);
  rotBone("RightUpLeg", -(p.m + p.sp) * D, 0, 0, bones, bindEuler);
  rotBone("LeftLeg", -p.k * D, 0, 0, bones, bindEuler);
  rotBone("RightLeg", -p.k2 * D, 0, 0, bones, bindEuler);

  const hKey = boneKey("Hips", bones);
  const hips = hKey && bones[hKey];
  if (hips && bindPos[hKey]) {
    hips.position.y = bindPos[hKey].y - p.dy * 0.014;
  }
  model.traverse((o) => {
    if (o.isSkinnedMesh && o.skeleton) o.skeleton.update();
  });
}

class CoachView {
  constructor(mount, gender, bgHex) {
    this.mount = mount;
    this.gender = gender;
    this.exId = "e1";
    this.model = null;
    this.bones = {};
    this.bindEuler = {};
    this.bindPos = {};
    this.bodyH = 1.6;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(bgHex);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    mount.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xfff5e8, 1.15);
    key.position.set(2, 5, 3);
    key.castShadow = true;
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x8ab4ae, 0.32);
    fill.position.set(-2, 2, -2);
    this.scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 40),
      new THREE.MeshStandardMaterial({ color: 0x2a3744, roughness: 0.92 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(mount);
    this.resize();
  }

  async attach(gender) {
    this.gender = gender;
    const master = await loadMaster(gender);
    if (this.model) {
      this.scene.remove(this.model);
      this.model.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
      });
    }
    this.model = SkeletonUtils.clone(master);
    this.scene.add(this.model);
    this.bodyH = scaleToMeters(this.model);
    const dist = Math.max(2.4, this.bodyH * 2.15);
    this.camera.position.set(0, Math.max(0.8, this.bodyH * 0.52), -dist);
    this.camera.lookAt(0, this.bodyH * 0.42, 0);
    const cached = cacheBones(this.model);
    this.bones = cached.bones;
    this.bindEuler = cached.bindEuler;
    this.bindPos = cached.bindPos;
  }

  setExercise(id) {
    this.exId = id || "e1";
  }

  applyTime(t, amp) {
    if (!this.model) return;
    applyDaabPose(
      pose3d(this.exId, t, amp),
      this.exId,
      this.model,
      this.bones,
      this.bindEuler,
      this.bindPos,
    );
  }

  render() {
    if (!this.model) return;
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = this.mount.clientWidth;
    const h = this.mount.clientHeight;
    if (w < 2 || h < 2) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose() {
    this._ro.disconnect();
    if (this.model) {
      this.scene.remove(this.model);
      this.model.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
      });
      this.model = null;
    }
    this.renderer.dispose();
    this.mount.innerHTML = "";
  }
}

const views = {
  coach: null,
  user: null,
  heroCoach: null,
  heroUser: null,
};

let heroRaf = 0;
let heroT0 = 0;
let ready = false;
let booting = null;
let active = false;

async function boot() {
  if (ready) return true;
  if (booting) return booting;
  booting = Promise.all([loadMaster("female"), loadMaster("male")])
    .then(() => {
      ready = true;
      return true;
    })
    .catch((err) => {
      console.warn("DaabCoach3D: تعذّر تحميل الشخصيات", err);
      booting = null;
      return false;
    });
  return booting;
}

async function ensureView(key, el, gender, bg) {
  if (!el) return null;
  if (!views[key]) {
    views[key] = new CoachView(el, gender, bg);
    await views[key].attach(gender);
  }
  return views[key];
}

function startHeroLoop() {
  if (heroRaf || !views.heroCoach || !views.heroUser) return;
  heroT0 = performance.now();
  const reduce =
    window.matchMedia &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  function frame(ts) {
    if (!views.heroCoach || !views.heroUser) {
      heroRaf = 0;
      return;
    }
    const w = views.heroCoach.mount.getBoundingClientRect().width;
    if (w > 0) {
      const t = reduce ? 1.5 : (ts - heroT0) / 1000;
      views.heroCoach.setExercise("e1");
      views.heroCoach.applyTime(t, 1);
      views.heroUser.setExercise("e1");
      views.heroUser.applyTime(Math.max(0, t - 0.4), 1);
      views.heroCoach.render();
      views.heroUser.render();
    }
    heroRaf = requestAnimationFrame(frame);
  }
  heroRaf = requestAnimationFrame(frame);
}

const api = {
  get ready() {
    return ready;
  },
  get active() {
    return active;
  },
  set active(v) {
    active = !!v;
  },
  boot,
  async mountHero(coachEl, userEl) {
    const ok = await boot();
    if (!ok) return false;
    await ensureView("heroCoach", coachEl, "female", 0x0c3d31);
    await ensureView("heroUser", userEl, "male", 0x2a3744);
    startHeroLoop();
    return true;
  },
  async mountSession(coachEl, userEl) {
    const ok = await boot();
    if (!ok) return false;
    await ensureView("coach", coachEl, "female", 0x0c3d31);
    await ensureView("user", userEl, "male", 0x2a3744);
    return true;
  },
  showBody(use3d) {
    active = !!use3d && ready;
  },
  setCoach(exId, t, amp) {
    if (!ready || !views.coach) return;
    views.coach.setExercise(exId);
    views.coach.applyTime(t, amp == null ? 1 : amp);
    views.coach.render();
  },
  setUser(exId, t, amp) {
    if (!ready || !views.user) return;
    views.user.setExercise(exId);
    views.user.applyTime(t, amp == null ? 1 : amp);
    views.user.render();
  },
  resizeAll() {
    Object.values(views).forEach((v) => v && v.resize());
  },
};

window.DaabCoach3D = api;