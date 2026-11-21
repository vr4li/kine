/**
 * دأب — شخصيات Mixamo (تحميل كسول، جلسة فقط)
 */
import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

const MODELS = {
  female: "/models/x-bot.fbx",
  male: "/models/y-bot.fbx",
};

const loader = new FBXLoader();
const masters = { female: null, male: null, femaleLoading: null, maleLoading: null };

function pose3d(id, t, amp) {
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
      ch.castShadow = false;
      ch.receiveShadow = false;
      ch.frustumCulled = true;
      const mats = ch.material
        ? Array.isArray(ch.material)
          ? ch.material
          : [ch.material]
        : [];
      mats.forEach((m) => {
        if (!m) return;
        m.side = THREE.DoubleSide;
        if (m.metalness > 0.4) m.metalness = 0.15;
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

function loadMaster(gender) {
  if (masters[gender]) return Promise.resolve(masters[gender]);
  const lk = gender + "Loading";
  if (masters[lk]) return masters[lk];
  masters[lk] = loader
    .loadAsync(MODELS[gender])
    .then((root) => {
      prepMeshes(root);
      scaleToMeters(root);
      root.traverse((c) => {
        if (c.animations) c.animations = [];
      });
      masters[gender] = root;
      masters[lk] = null;
      return root;
    })
    .catch((err) => {
      masters[lk] = null;
      throw err;
    });
  return masters[lk];
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

/** تدوير على X فقط — يمنع انقلاب اليد من Y/Z */
function rotBoneX(short, dx, bones, bindEuler) {
  const key = boneKey(short, bones);
  const b = key && bones[key];
  const e = key && bindEuler[key];
  if (!b || !e) return;
  b.rotation.set(e.x + dx, e.y, e.z);
}

/** زاوية SVG من الرأسي: 0=للأسفل، 90=أفقي (T-pose)، فوق 90=للأعلى */
function armDeltaX(deg) {
  const D = Math.PI / 180;
  if (deg <= 90) return (90 - deg) * D;
  return (deg - 90) * D;
}

function applyDaabPose(p, exId, model, bones, bindEuler, bindPos) {
  resetBones(bones, bindEuler, bindPos);
  const D = Math.PI / 180;
  const off = (a, b) => b * Math.max(0, 1 - Math.abs(a) / 25);
  const aa = p.a + off(p.a, -26);
  const bb = p.b + off(p.b, 26);

  if (exId === "e9") {
    const w = p.a * D;
    rotBone("LeftArm", 0, w, w * 0.45, bones, bindEuler);
    rotBone("RightArm", 0, -w, -w * 0.45, bones, bindEuler);
  } else if (exId === "e11") {
    const s = (90 - aa) * D;
    rotBone("LeftArm", 0, 0, s, bones, bindEuler);
    rotBone("RightArm", 0, 0, -s, bones, bindEuler);
  } else {
    rotBoneX("LeftArm", armDeltaX(aa), bones, bindEuler);
    rotBoneX("RightArm", -armDeltaX(-bb), bones, bindEuler);
    rotBoneX("LeftForeArm", -(p.ea * D), bones, bindEuler);
    rotBoneX("RightForeArm", -(p.eb * D), bones, bindEuler);
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
    this.visible = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(bgHex);

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.shadowMap.enabled = false;
    mount.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xfff5e8, 0.95);
    key.position.set(2, 5, 3);
    this.scene.add(key);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x2a3744, roughness: 0.92 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    this._resizeTimer = null;
    this._onResize = () => {
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.resize(), 120);
    };
    window.addEventListener("resize", this._onResize);
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(this.mount);
    }
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
    this.model = cloneSkinned(master);
    this.model.rotation.y = Math.PI;
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
    if (!this.model || !this.visible) return;
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

  setVisible(on) {
    this.visible = !!on;
    if (!on) this.renderer.clear();
  }

  dispose() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    window.removeEventListener("resize", this._onResize);
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

const views = { coach: null, user: null };
let userMount = null;
let userBg = 0x2a3744;
let readyCoach = false;
let active = false;
let renderRaf = 0;
const pending = { coach: null, user: null, needUser: false };

function scheduleRender() {
  if (renderRaf) return;
  renderRaf = requestAnimationFrame(() => {
    renderRaf = 0;
    if (pending.coach && views.coach) {
      const c = pending.coach;
      views.coach.setExercise(c.id);
      views.coach.applyTime(c.t, c.amp);
      views.coach.render();
    }
    if (pending.needUser && pending.user && views.user) {
      const u = pending.user;
      views.user.setExercise(u.id);
      views.user.applyTime(u.t, u.amp);
      views.user.render();
    }
  });
}

async function ensureUserView() {
  if (views.user || !userMount) return !!views.user;
  views.user = new CoachView(userMount, "male", userBg);
  views.user.setVisible(true);
  await views.user.attach("male");
  return true;
}

const api = {
  get ready() {
    return readyCoach;
  },
  get active() {
    return active;
  },
  set active(v) {
    active = !!v;
  },
  releaseExtras() {
    if (heroViews) {
      if (heroViews.raf) cancelAnimationFrame(heroViews.raf);
      heroViews.c.dispose();
      heroViews.u.dispose();
      heroViews = null;
    }
    abortThumbs();
  },
  sessionOff() {
    sessionLocked = false;
    if (renderRaf) cancelAnimationFrame(renderRaf);
    renderRaf = 0;
    if (views.coach) {
      views.coach.dispose();
      views.coach = null;
    }
    if (views.user) {
      views.user.dispose();
      views.user = null;
    }
    readyCoach = false;
    active = false;
    pending.coach = pending.user = null;
    pending.needUser = false;
  },
  async mountSession(coachEl, userEl) {
    if (!coachEl) return false;
  if (readyCoach && views.coach && views.coach.mount === coachEl) {
    coachEl.hidden = false;
    coachEl.removeAttribute("aria-hidden");
    if (userEl) {
      userEl.hidden = false;
      userEl.removeAttribute("aria-hidden");
    }
    active = true;
    sessionLocked = true;
    views.coach.setVisible(true);
    views.coach.resize();
    return true;
  }
    sessionLocked = true;
    abortThumbs();
    this.releaseExtras();
    userMount = userEl;
    coachEl.hidden = false;
    coachEl.removeAttribute("aria-hidden");
    if (userEl) {
      userEl.hidden = false;
      userEl.removeAttribute("aria-hidden");
    }
    try {
      await loadMaster("female");
      if (views.coach) {
        views.coach.dispose();
        views.coach = null;
      }
      if (views.user) {
        views.user.dispose();
        views.user = null;
      }
      views.coach = new CoachView(coachEl, "female", 0x0c3d31);
      views.coach.setVisible(true);
      await views.coach.attach("female");
      readyCoach = true;
      active = true;
      views.coach.resize();
      setTimeout(() => views.coach && views.coach.resize(), 150);
      setTimeout(() => views.coach && views.coach.resize(), 500);
      return true;
    } catch (err) {
      sessionLocked = false;
      throw err;
    }
  },
  async ensureSimUser() {
    if (!readyCoach || !views.coach || !active) return false;
    try {
      return await ensureUserView();
    } catch (e) {
      console.warn("DaabCoach3D: user view", e);
      return false;
    }
  },
  showBody(use3d) {
    active = !!use3d && readyCoach;
  },
  setCoach(exId, t, amp) {
    if (!readyCoach || !views.coach) return;
    pending.coach = { id: exId, t, amp: amp == null ? 1 : amp };
    scheduleRender();
  },
  setUser(exId, t, amp) {
    if (!readyCoach) return;
    pending.user = { id: exId, t, amp: amp == null ? 1 : amp };
    pending.needUser = true;
    if (!views.user) api.ensureSimUser();
    scheduleRender();
  },
  clearUserPending() {
    pending.needUser = false;
    pending.user = null;
  },
  resizeAll() {
    if (views.coach) views.coach.resize();
    if (views.user) views.user.resize();
  },
  dispose() {
    if (renderRaf) cancelAnimationFrame(renderRaf);
    renderRaf = 0;
    views.coach && views.coach.dispose();
    views.user && views.user.dispose();
    views.coach = views.user = null;
    readyCoach = false;
    active = false;
  },
  async paintLibraryThumbs(root) {
    if (!root || views.coach || sessionLocked || active) return;
    await loadMaster("female");
    if (views.coach || sessionLocked || active) return;
    const slots = root.querySelectorAll(".ex-coach3d[data-rig]");
    if (!slots.length) return;
    if (views.coach || sessionLocked || active) return;
    const thumb = await ensureThumbView();
    if (views.coach || sessionLocked || active) {
      abortThumbs();
      return;
    }
    const rigs = {};
    slots.forEach((el) => {
      const r = el.dataset.rig || "e1";
      rigs[r] = true;
    });
    for (const rig in rigs) {
      thumb.setExercise(rig);
      thumb.applyTime(0.75, 0.9);
      thumb.resize();
      thumb.render();
      thumbCache[rig] = thumb.renderer.domElement.toDataURL("image/png");
    }
    slots.forEach((el) => {
      const u = thumbCache[el.dataset.rig || "e1"];
      if (u) {
        el.style.backgroundImage = "url(" + u + ")";
        el.classList.add("has-thumb");
      }
    });
    if (thumbView) {
      thumbView.dispose();
      thumbView = null;
    }
  },
  async paintHeroPeek(root) {
    if (!root) return;
    await this.paintLibraryThumbs(root);
  },
};

let thumbView = null;
let thumbCache = {};
let heroViews = null;
let sessionLocked = false;

function abortThumbs() {
  if (thumbView) {
    thumbView.dispose();
    thumbView = null;
  }
}

async function ensureThumbView() {
  if (thumbView) return thumbView;
  const mount = document.createElement("div");
  mount.style.cssText =
    "position:fixed;left:-9999px;top:0;width:220px;height:260px;pointer-events:none;opacity:0";
  document.body.appendChild(mount);
  thumbView = new CoachView(mount, "female", 0x0c3d31);
  thumbView.setVisible(true);
  await thumbView.attach("female");
  return thumbView;
}

window.DaabCoach3D = api;