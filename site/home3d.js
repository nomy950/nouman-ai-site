// Home page 3D scene: a stylized Nouman at his desk.
// Poses, facial expressions, the wall screen and a speech bubble change with the section in view;
// lighting runs from morning to night as the visitor scrolls down the page.
import * as THREE from 'three';

const stageEl = document.getElementById('desk3d');
const canvas = document.getElementById('stageCanvas');
const bubble = document.getElementById('bubble');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  document.body.classList.remove('has3d');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 50);

/* ---------- materials ---------- */
const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0, ...o });
const mat = {
  skin: M(0xc28a5f, { roughness: 0.6 }),
  skinDark: M(0xb07a52, { roughness: 0.6 }),
  hair: M(0x15100c, { roughness: 0.9 }),
  beard: new THREE.MeshStandardMaterial({ color: 0x1d1510, roughness: 1, transparent: true, opacity: 0.45, depthWrite: false }),
  shirt: M(0x2e4a6b),
  shirtDark: M(0x243a55),
  pants: M(0x1e2129),
  shoe: M(0x0f1013),
  white: M(0xf4f1ea, { roughness: 0.3 }),
  pupil: M(0x1a120d, { roughness: 0.2 }),
  mouth: M(0x5b1f22, { roughness: 0.5 }),
  teeth: M(0xf6f3ee, { roughness: 0.4 }),
  desk: M(0x6b4a33, { roughness: 0.65 }),
  deskTop: M(0x7a5639, { roughness: 0.55 }),
  metal: M(0x2a2e36, { roughness: 0.4, metalness: 0.6 }),
  dark: M(0x14161b, { roughness: 0.5 }),
  chair: M(0x23262e, { roughness: 0.8 }),
  wall: M(0x2a303c, { roughness: 1 }),
  floor: M(0x22252d, { roughness: 1 }),
  accent: M(0xd4ff3a, { roughness: 0.4, emissive: 0xd4ff3a, emissiveIntensity: 0.4 }),
  pot: M(0xd9d2c3),
  leaf: M(0x3f7d4e, { roughness: 0.8 }),
  mug: M(0xeceef2, { roughness: 0.35 }),
};
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const cyl = (rt, rb, h, m, s = 20) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m);
const sph = (r, m, ws = 24, hs = 16) => new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m);
const cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 16), m);
const at = (o, x, y, z) => (o.position.set(x, y, z), o);

/* ---------- room ---------- */
const room = new THREE.Group(); scene.add(room);
const floor = new THREE.Mesh(new THREE.CircleGeometry(3.4, 48), mat.floor);
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; room.add(floor);
const rug = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), M(0x232836));
rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.002, 0.35); rug.receiveShadow = true; room.add(rug);
const wall = at(box(6, 3.4, 0.08, mat.wall), 0, 1.7, -1.55); wall.receiveShadow = true; room.add(wall);

// window with a sky that moves from morning to night
const skyMat = new THREE.MeshBasicMaterial({ color: 0xffd59e });
const win = new THREE.Group(); win.position.set(1.55, 1.75, -1.5); room.add(win);
win.add(at(box(1.0, 1.25, 0.04, mat.metal), 0, 0, 0));
win.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.15), skyMat), 0, 0, 0.025));
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff2c4 });
const sun = at(new THREE.Mesh(new THREE.CircleGeometry(0.09, 32), sunMat), 0.15, 0.3, 0.03); win.add(sun);
win.add(at(box(0.9, 0.025, 0.03, mat.metal), 0, 0, 0.04));
win.add(at(box(0.025, 1.15, 0.03, mat.metal), 0, 0, 0.04));

// wall screen: the storytelling display
const SW = 1024, SH = 576;
const scr = document.createElement('canvas'); scr.width = SW; scr.height = SH;
const sx = scr.getContext('2d');
const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.anisotropy = 4;
const display = new THREE.Group(); display.position.set(-0.45, 1.78, -1.5); room.add(display);
display.add(at(box(1.78, 1.02, 0.05, mat.dark), 0, 0, 0));
display.add(at(new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.956), new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false })), 0, 0, 0.03));
const displayGlow = new THREE.PointLight(0x88aaff, 0.6, 3.2, 2); displayGlow.position.set(-0.45, 1.7, -1.0); room.add(displayGlow);

// shelf + plant
const shelf = at(box(0.7, 0.04, 0.22, mat.desk), 1.55, 0.95, -1.4); room.add(shelf);
for (let i = 0; i < 4; i++) room.add(at(box(0.05, 0.2 + (i % 2) * 0.04, 0.16, M([0xd4ff3a, 0x5b7cfa, 0xff7a59, 0xeceef2][i])), 1.33 + i * 0.065, 1.07 + (i % 2) * 0.02, -1.4));

/* ---------- desk ---------- */
const desk = new THREE.Group(); scene.add(desk);
const top = at(box(1.6, 0.05, 0.72, mat.deskTop), 0, 0.74, 0.58); top.castShadow = top.receiveShadow = true; desk.add(top);
for (const [x, z] of [[-0.74, 0.27], [0.74, 0.27], [-0.74, 0.89], [0.74, 0.89]]) { const l = at(box(0.05, 0.72, 0.05, mat.desk), x, 0.36, z); l.castShadow = true; desk.add(l); }
// monitor (faces the character)
const mon = new THREE.Group(); mon.position.set(-0.12, 0.765, 0.8); mon.rotation.y = Math.PI + 0.12; desk.add(mon);
mon.add(at(box(0.2, 0.015, 0.14, mat.metal), 0, 0.008, 0));
mon.add(at(box(0.04, 0.22, 0.03, mat.metal), 0, 0.12, 0.02));
const monBody = at(box(0.66, 0.4, 0.035, mat.dark), 0, 0.33, 0.0); monBody.castShadow = true; mon.add(monBody);
const monScreenMat = new THREE.MeshBasicMaterial({ map: scrTex, toneMapped: false });
const monScreen = at(new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), monScreenMat), 0, 0.33, 0.019); mon.add(monScreen);
// back of monitor faces the camera: give it a small accent logo
const logo = at(new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), mat.accent), 0, 0.36, -0.019); logo.rotation.y = Math.PI; mon.add(logo);
const monGlow = new THREE.PointLight(0x9fc3ff, 0.5, 1.6, 2); monGlow.position.set(-0.1, 1.1, 0.55); desk.add(monGlow);
// keyboard, mouse
const kb = at(box(0.42, 0.018, 0.13, mat.dark), -0.05, 0.773, 0.44); kb.castShadow = true; desk.add(kb);
for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) desk.add(at(box(0.03, 0.008, 0.028, mat.metal), -0.23 + c * 0.04, 0.785, 0.4 + r * 0.035));
desk.add(at(box(0.05, 0.02, 0.08, mat.dark), 0.25, 0.773, 0.44));
// mug on desk
const deskMug = new THREE.Group(); deskMug.position.set(0.42, 0.765, 0.5); desk.add(deskMug);
const mugBody = cyl(0.035, 0.032, 0.09, mat.mug); mugBody.position.y = 0.045; mugBody.castShadow = true; deskMug.add(mugBody);
const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.007, 8, 16), mat.mug); mugHandle.position.set(0.04, 0.05, 0); deskMug.add(mugHandle);
// lamp
const lamp = new THREE.Group(); lamp.position.set(-0.68, 0.765, 0.36); lamp.rotation.y = Math.PI * 0.85; desk.add(lamp);
lamp.add(at(cyl(0.07, 0.08, 0.02, mat.metal), 0, 0.01, 0));
const arm1 = at(cyl(0.012, 0.012, 0.42, mat.metal), 0, 0.22, 0); arm1.rotation.z = 0.2; lamp.add(arm1);
const shade = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.1, 24, 1, true), M(0x2a2e36, { side: THREE.DoubleSide, roughness: 0.4, metalness: 0.5 }));
shade.position.set(-0.1, 0.42, -0.04); shade.rotation.z = 2.2; lamp.add(shade);
const bulbMat = new THREE.MeshBasicMaterial({ color: 0x444033 });
lamp.add(at(sph(0.03, bulbMat), -0.12, 0.39, -0.04));
const lampLight = new THREE.PointLight(0xffc77a, 0, 2.6, 1.6); lampLight.position.set(-0.55, 1.12, 0.45); lampLight.castShadow = true; lampLight.shadow.mapSize.set(512, 512); desk.add(lampLight);
// plant
const plant = new THREE.Group(); plant.position.set(0.74, 0.765, 0.9); plant.scale.setScalar(0.85); desk.add(plant);
plant.add(at(cyl(0.06, 0.045, 0.1, mat.pot), 0, 0.05, 0));
for (let i = 0; i < 7; i++) { const lf = sph(0.045, mat.leaf, 10, 8); const a = i / 7 * Math.PI * 2; lf.scale.set(0.6, 1.4, 0.6); lf.position.set(Math.cos(a) * 0.04, 0.15 + (i % 3) * 0.03, Math.sin(a) * 0.04); lf.rotation.set(Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5); plant.add(lf); }

/* ---------- chair ---------- */
const chair = new THREE.Group(); scene.add(chair);
chair.add(at(box(0.48, 0.07, 0.46, mat.chair), 0, 0.46, -0.02));
const back = at(box(0.46, 0.55, 0.06, mat.chair), 0, 0.8, -0.27); back.rotation.x = -0.1; chair.add(back);
chair.add(at(cyl(0.025, 0.025, 0.36, mat.metal), 0, 0.26, -0.02));
for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const leg = at(box(0.3, 0.025, 0.04, mat.metal), Math.cos(a) * 0.14, 0.06, -0.02 + Math.sin(a) * 0.14); leg.rotation.y = -a; chair.add(leg); }
chair.traverse(o => { if (o.isMesh) o.castShadow = true; });

/* ---------- character ---------- */
const me = new THREE.Group(); scene.add(me);
const hips = new THREE.Group(); hips.position.set(0, 0.55, 0); me.add(hips);
// legs (seated)
for (const s of [-1, 1]) {
  const thigh = cap(0.058, 0.36, mat.pants); thigh.rotation.x = Math.PI / 2; thigh.position.set(s * 0.085, 0, 0.2); me.add(at(thigh, s * 0.085, 0.55, 0.2));
  me.add(at(cap(0.05, 0.4, mat.pants), s * 0.085, 0.3, 0.42));
  const shoe = at(box(0.09, 0.06, 0.18, mat.shoe), s * 0.085, 0.03, 0.47); me.add(shoe);
}
const torso = new THREE.Group(); hips.add(torso);
const chest = cap(0.145, 0.3, mat.shirt); chest.scale.set(1.02, 1, 0.72); chest.position.y = 0.3; torso.add(chest);
const collar = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 20), mat.shirtDark); collar.rotation.x = Math.PI / 2; collar.position.y = 0.5; torso.add(collar);
torso.add(at(cyl(0.045, 0.05, 0.1, mat.skin), 0, 0.53, 0));
// head
const head = new THREE.Group(); head.position.set(0, 0.66, 0.01); torso.add(head);
const skull = sph(0.13, mat.skin, 32, 24); skull.scale.set(0.9, 1.06, 0.95); head.add(skull);
for (const s of [-1, 1]) { const ear = sph(0.028, mat.skin); ear.scale.set(0.6, 1, 0.8); head.add(at(ear, s * 0.118, 0.0, -0.005)); }
const nose = sph(0.02, mat.skinDark); nose.scale.set(0.9, 1.1, 1.1); head.add(at(nose, 0, -0.012, 0.124));
// hair: tilted cap leaves the forehead clear
const hair = new THREE.Mesh(new THREE.SphereGeometry(0.137, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), mat.hair);
hair.scale.set(0.92, 1.0, 0.98); hair.rotation.x = -0.42; hair.position.set(0, 0.022, -0.006); head.add(hair);
const quiff = sph(0.07, mat.hair); quiff.scale.set(1.5, 0.55, 1); head.add(at(quiff, 0.01, 0.12, 0.05));
for (const s of [-1, 1]) { const side = sph(0.05, mat.hair); side.scale.set(0.35, 1, 1.1); head.add(at(side, s * 0.112, 0.045, -0.02)); }
// subtle beard + moustache
const beardGeo = new THREE.SphereGeometry(0.1332, 32, 16, Math.PI / 2 - 1.35, 2.7, Math.PI * 0.63, Math.PI * 0.33);
const beard = new THREE.Mesh(beardGeo, mat.beard); beard.scale.set(0.9, 1.06, 0.95); beard.renderOrder = 2; head.add(beard);
const stache = cap(0.007, 0.04, mat.beard); stache.rotation.z = Math.PI / 2; head.add(at(stache, 0, -0.04, 0.122));
// eyes
const eyes = [];
for (const s of [-1, 1]) {
  const eg = new THREE.Group(); eg.position.set(s * 0.043, 0.022, 0.108); head.add(eg);
  const white = sph(0.021, mat.white); white.scale.set(1.1, 1, 0.6); eg.add(white);
  const pupil = sph(0.012, mat.pupil); pupil.position.z = 0.011; eg.add(pupil);
  const brow = box(0.048, 0.009, 0.012, mat.hair); brow.position.set(s * 0.043, 0.062, 0.117); head.add(brow);
  eyes.push({ g: eg, pupil, brow, s });
}
// mouths: one mesh per expression, cross-faded by scale
const mouthG = new THREE.Group(); mouthG.position.set(0, -0.062, 0.118); head.add(mouthG);
const mouths = {
  smile: new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0055, 8, 20, Math.PI), mat.mouth),
  flat: new THREE.Mesh(new THREE.CapsuleGeometry(0.005, 0.034, 4, 8), mat.mouth),
  open: new THREE.Group(),
  o: new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.005, 8, 16), mat.mouth),
};
mouths.smile.rotation.z = Math.PI; mouths.smile.position.y = 0.012;
mouths.flat.rotation.z = Math.PI / 2;
{ const d = new THREE.Mesh(new THREE.CircleGeometry(0.032, 24, Math.PI, Math.PI), mat.mouth); mouths.open.add(d);
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.008), mat.teeth); t.position.set(0, -0.005, 0.001); mouths.open.add(t); }
for (const k in mouths) { mouths[k].scale.setScalar(0.001); mouthG.add(mouths[k]); }

// arms: shoulder -> elbow -> hand
function makeArm(s) {
  const sh = new THREE.Group(); sh.position.set(s * 0.18, 0.46, 0); torso.add(sh);
  const up = cap(0.045, 0.2, mat.shirt); up.position.y = -0.13; sh.add(up);
  const el = new THREE.Group(); el.position.y = -0.27; sh.add(el);
  const fore = cap(0.036, 0.19, mat.skin); fore.position.y = -0.12; el.add(fore);
  const cuff = cyl(0.043, 0.043, 0.04, mat.shirtDark); cuff.position.y = -0.02; el.add(cuff);
  const hand = sph(0.042, mat.skin); hand.scale.set(0.9, 1.1, 0.75); hand.position.y = -0.255; el.add(hand);
  const thumb = cap(0.013, 0.035, mat.skin); thumb.position.set(-s * 0.0, -0.22, 0.05); thumb.rotation.x = -0.3; thumb.scale.setScalar(0.001); el.add(thumb);
  return { sh, el, hand, thumb };
}
const R = makeArm(-1), L = makeArm(1);
const handMug = deskMug.clone(); handMug.position.set(0, -0.27, 0.05); handMug.rotation.x = Math.PI / 2; handMug.scale.setScalar(0.001); L.el.add(handMug);
me.traverse(o => { if (o.isMesh) o.castShadow = true; });
beard.castShadow = false;

/* ---------- lights ---------- */
const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x2a2420, 0.9); scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xffe2b8, 1.6); sunLight.position.set(2.6, 4, 2.8);
sunLight.castShadow = true; sunLight.shadow.mapSize.set(1024, 1024);
Object.assign(sunLight.shadow.camera, { left: -2.2, right: 2.2, top: 2.6, bottom: -1, near: 0.5, far: 12 }); sunLight.shadow.bias = -0.0008;
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));
const rim = new THREE.DirectionalLight(0xd4ff3a, 0.35); rim.position.set(-3, 2.2, -2); scene.add(rim);

/* ---------- poses & expressions ---------- */
// joint angles: [shoulder.x, shoulder.z, elbow.x, elbow.z]
const P = {
  typing: { r: [-0.55, 0.12, -1.0, 0], l: [-0.55, -0.12, -1.0, 0], lean: 0.08, hx: 0.12, hy: 0, chair: 0 },
  wave:   { r: [0, -2.55, 0, -0.5], l: [-0.55, -0.12, -1.0, 0], lean: -0.02, hx: -0.04, hy: 0.25, chair: 0.12 },
  think:  { r: [-0.95, 0.3, -2.25, 0], l: [-0.6, -0.25, -1.3, 0.2], lean: 0.05, hx: -0.1, hy: 0.2, chair: 0.1 },
  point:  { r: [0.4, -2.0, 0, -0.35], l: [-0.55, -0.12, -1.0, 0], lean: -0.1, hx: -0.12, hy: 0.45, chair: 0.25 },
  coffee: { r: [-0.55, 0.12, -1.0, 0], l: [-0.75, -0.2, -2.05, 0], lean: -0.04, hx: 0.02, hy: 0.15, chair: 0.05 },
  focus:  { r: [-0.6, 0.12, -0.95, 0], l: [-0.6, -0.12, -0.95, 0], lean: 0.16, hx: 0.2, hy: 0, chair: 0 },
  excited:{ r: [0, -2.7, 0, -0.4], l: [0, 2.7, 0, 0.4], lean: -0.08, hx: -0.12, hy: 0.15, chair: 0.15 },
  thumbs: { r: [-1.05, -0.35, -1.25, 0], l: [-0.55, -0.12, -1.0, 0], lean: -0.04, hx: -0.06, hy: 0.25, chair: 0.12 },
};
// browY lift, browTilt (positive = worried/raised inner), eye openness, pupil look, mouth
const E = {
  happy:   { by: 0.004, bt: 0, eye: 1, lx: 0, ly: 0, mouth: 'smile', ms: 1 },
  big:     { by: 0.008, bt: 0.05, eye: 0.9, lx: 0, ly: 0, mouth: 'open', ms: 1 },
  think:   { by: 0.002, bt: -0.18, eye: 0.85, lx: 0.4, ly: 0.6, mouth: 'flat', ms: 0.8, mx: 0.012, mr: 0.18 },
  proud:   { by: 0.006, bt: 0.08, eye: 0.95, lx: -0.5, ly: 0.3, mouth: 'smile', ms: 1.15 },
  content: { by: 0.0, bt: 0, eye: 0.75, lx: 0, ly: -0.4, mouth: 'smile', ms: 0.75 },
  focus:   { by: -0.006, bt: -0.12, eye: 0.7, lx: 0, ly: -0.6, mouth: 'flat', ms: 0.9 },
  wow:     { by: 0.014, bt: 0.12, eye: 1.15, lx: 0, ly: 0.2, mouth: 'open', ms: 1.2 },
  o:       { by: 0.012, bt: 0.1, eye: 1.1, lx: 0, ly: 0, mouth: 'o', ms: 1 },
};
const SCENES = {
  hero:      { pose: 'wave', then: 'typing', expr: 'big', bubble: "Hey, I'm Nouman 👋", screen: 'terminal', glow: 0x9fe870 },
  about:     { pose: 'think', expr: 'think', bubble: 'Hmm… how should this scale?', screen: 'arch', glow: 0x7aa2ff },
  ibm:       { pose: 'point', expr: 'proud', bubble: 'Architecting at IBM ☁️ 99.9% uptime', screen: 'ibm', glow: 0x5b8cff },
  optum:     { pose: 'coffee', expr: 'content', bubble: 'Coffee + Kafka = 1M events a day ☕', screen: 'kafka', glow: 0xff9f5b },
  techlogix: { pose: 'focus', expr: 'focus', bubble: 'Where it started: Spring Boot 🌱', screen: 'logs', glow: 0x6be38a },
  skills:    { pose: 'typing', expr: 'happy', bubble: "My toolbox. Pick anything, I'll build it 🧰", screen: 'skills', glow: 0xd4ff3a },
  featured:  { pose: 'excited', expr: 'wow', bubble: 'AI agents built all of these! 🤖', screen: 'games', glow: 0xff5fa2 },
  contact:   { pose: 'thumbs', expr: 'big', bubble: "Let's build something together 👍", screen: 'contact', glow: 0xd4ff3a },
};
const cur = { r: [...P.typing.r], l: [...P.typing.l], lean: 0, hx: 0, hy: 0, chair: 0, by: 0, bt: 0, eye: 1, lx: 0, ly: 0, mx: 0, mr: 0, ms: 1, thumb: 0, mug: 0 };
const mouthW = { smile: 1, flat: 0, open: 0, o: 0 };
let sceneKey = null, poseKey = 'typing', exprKey = 'happy', sceneT = 0, blinkT = 2.5, blink = 0;
const glowColor = new THREE.Color(0x9fe870), glowTarget = new THREE.Color(0x9fe870);

/* ---------- wall screen drawing ---------- */
const thumbs = (window.PROJECTS || []).filter(p => p.thumb).map(p => { const i = new Image(); i.src = p.thumb; return { img: i, title: p.title }; });
const SK = ['Java', 'Spring Boot', 'Python', 'FastAPI', 'React', 'TypeScript', 'Kafka', 'Redis', 'IBM Cloud', 'AWS', 'Docker', 'LangChain', 'LangGraph', 'CrewAI', 'MCP', 'A2A', 'RAG', 'Microservices'];
const font = (s, w = 600, f = 'JetBrains Mono, monospace') => `${w} ${s}px ${f}`;
function chrome(title, bg = '#0d1117') {
  sx.fillStyle = bg; sx.fillRect(0, 0, SW, SH);
  sx.fillStyle = '#161b22'; sx.fillRect(0, 0, SW, 46);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { sx.fillStyle = c; sx.beginPath(); sx.arc(28 + i * 24, 23, 7, 0, 7); sx.fill(); });
  sx.fillStyle = '#8c93a1'; sx.font = font(18, 400); sx.fillText(title, 110, 30);
}
function drawScreen(kind, t) {
  sx.textBaseline = 'alphabetic';
  if (kind === 'terminal') {
    chrome('~/nouman — zsh');
    const lines = [['$ ', 'whoami', '#d4ff3a'], ['', 'Nouman Syed Naseer · Software Architect', '#eceef2'], ['$ ', 'cat focus.txt', '#d4ff3a'], ['', 'distributed systems · cloud · agentic AI', '#9fb3c8'], ['$ ', 'ls ./playground | wc -l', '#d4ff3a'], ['', String((window.PROJECTS || []).length), '#eceef2']];
    let chars = Math.floor(t * 28); let y = 110;
    sx.font = font(30, 500);
    for (const [pr, txt, col] of lines) {
      if (chars <= 0) break;
      const show = txt.slice(0, chars); chars -= txt.length + 6;
      sx.fillStyle = '#5b6472'; sx.fillText(pr, 40, y);
      sx.fillStyle = col; sx.fillText(show, 40 + sx.measureText(pr).width, y);
      y += 62;
    }
    if (Math.floor(t * 2) % 2 === 0) { sx.fillStyle = '#d4ff3a'; sx.fillRect(40, y - 26, 16, 30); }
  } else if (kind === 'arch') {
    chrome('system-design.excalidraw', '#0f1320');
    const nodes = [['Client', 90, 260], ['API Gateway', 300, 260], ['Service A', 560, 150], ['Service B', 560, 370], ['Event Bus', 800, 260]];
    sx.strokeStyle = '#3a4a6b'; sx.lineWidth = 4;
    const edges = [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4]];
    for (const [a, b] of edges) { sx.beginPath(); sx.moveTo(nodes[a][1] + 70, nodes[a][2]); sx.lineTo(nodes[b][1] - 70, nodes[b][2]); sx.stroke(); }
    edges.forEach(([a, b], i) => { const k = (t * 0.8 + i * 0.27) % 1; sx.fillStyle = '#d4ff3a'; sx.beginPath(); sx.arc(nodes[a][1] + 70 + (nodes[b][1] - nodes[a][1] - 140) * k, nodes[a][2] + (nodes[b][2] - nodes[a][2]) * k, 8, 0, 7); sx.fill(); });
    for (const [n, x, y] of nodes) { sx.fillStyle = '#1a2236'; sx.strokeStyle = '#7aa2ff'; sx.lineWidth = 3; sx.beginPath(); sx.roundRect(x - 80, y - 36, 160, 72, 14); sx.fill(); sx.stroke(); sx.fillStyle = '#eceef2'; sx.font = font(22, 600, 'Inter, sans-serif'); sx.textAlign = 'center'; sx.fillText(n, x, y + 8); sx.textAlign = 'left'; }
    sx.fillStyle = '#8c93a1'; sx.font = font(20, 400); sx.fillText('event-driven · domain-driven · highly available', 40, 530);
  } else if (kind === 'ibm') {
    chrome('ibm-cloud / automation-platform', '#0b1220');
    sx.fillStyle = '#8c93a1'; sx.font = font(20, 400); sx.fillText('UPTIME (30d)', 50, 110);
    sx.fillStyle = '#6ea8ff'; sx.font = font(110, 700, 'Space Grotesk, sans-serif'); sx.fillText('99.9%', 44, 220);
    sx.fillStyle = '#8c93a1'; sx.font = font(20, 400); sx.fillText('API LATENCY  800ms → 150ms', 50, 300);
    sx.strokeStyle = '#6ea8ff'; sx.lineWidth = 5; sx.beginPath();
    const k = Math.min(1, (t % 6) / 3);
    for (let i = 0; i <= 60; i++) { const x = 50 + i * 15.5, f = i / 60; if (f > k) break; const y = 330 + 160 * (f < 0.45 ? 0.05 + Math.sin(f * 40) * 0.03 : 0.8 + Math.sin(f * 50) * 0.04); i ? sx.lineTo(x, y) : sx.moveTo(x, y); }
    sx.stroke();
    ['Cloudant', 'Event Streams', 'MQ', 'Code Engine'].forEach((s, i) => { sx.fillStyle = '#16233a'; sx.beginPath(); sx.roundRect(560 + (i % 2) * 210, 90 + Math.floor(i / 2) * 80, 195, 60, 10); sx.fill(); sx.fillStyle = '#cfe0ff'; sx.font = font(20, 600, 'Inter, sans-serif'); sx.fillText(s, 578 + (i % 2) * 210, 128 + Math.floor(i / 2) * 80); });
  } else if (kind === 'kafka') {
    chrome('kafka-consumer — tail -f', '#120d0a');
    sx.font = font(20, 400);
    for (let i = 0; i < 12; i++) {
      const n = Math.floor(t * 6) + i, y = 90 + i * 38;
      sx.fillStyle = i === 11 ? '#ffb27a' : '#a8806a';
      sx.fillText(`event.processed  partition=${n % 8}  offset=${1048000 + n * 37}  ${['claim', 'member', 'eligibility', 'payment'][n % 4]}.updated`, 30, y);
    }
    sx.fillStyle = '#1f1612'; sx.fillRect(700, 470, 300, 80); sx.fillStyle = '#ffb27a'; sx.font = font(40, 700, 'Space Grotesk, sans-serif'); sx.fillText('1M+ / day', 720, 525);
  } else if (kind === 'logs') {
    chrome('reporting-service — spring boot', '#07110a');
    const L = ['  .   ____          _            __ _ _', ' /\\\\ / ___\'_ __ _ _(_)_ __  __ _ \\ \\ \\ \\', '( ( )\\___ | \'_ | \'_| | \'_ \\/ _` | \\ \\ \\ \\', ' =========|_|==============|___/=/_/_/_/', 'INFO  Starting ReportingApplication', 'INFO  Mapped "{[/api/reports],methods=[GET]}"', 'INFO  ActiveMQ connection established', 'INFO  OAuth2 resource server configured', 'INFO  Tests: 92% coverage ✓', 'INFO  Started ReportingApplication in 2.31s'];
    sx.font = font(21, 400); const n = Math.min(L.length, Math.floor(t * 3) + 1);
    for (let i = 0; i < n; i++) { sx.fillStyle = i < 4 ? '#6be38a' : (i === L.length - 1 ? '#d4ff3a' : '#9ad8a8'); sx.fillText(L[i], 34, 92 + i * 44); }
  } else if (kind === 'skills') {
    chrome('toolbox.json', '#0f1110');
    SK.forEach((s, i) => {
      const col = i % 4, row = Math.floor(i / 4), x = 40 + col * 245, y = 80 + row * 92 + Math.sin(t * 2 + i) * 6;
      const ai = i >= 11; sx.fillStyle = ai ? 'rgba(212,255,58,.14)' : '#1a1d24'; sx.strokeStyle = ai ? '#d4ff3a' : '#3a3f4a'; sx.lineWidth = 2;
      sx.beginPath(); sx.roundRect(x, y, 220, 64, 14); sx.fill(); sx.stroke();
      sx.fillStyle = ai ? '#e8ff9a' : '#eceef2'; sx.font = font(24, 600, 'Inter, sans-serif'); sx.fillText(s, x + 20, y + 41);
    });
  } else if (kind === 'games') {
    sx.fillStyle = '#0b0c0f'; sx.fillRect(0, 0, SW, SH);
    if (thumbs.length) {
      const i = Math.floor(t / 2.2) % thumbs.length, th = thumbs[i];
      if (th.img.complete && th.img.naturalWidth) sx.drawImage(th.img, 0, 0, SW, SH);
      const g = sx.createLinearGradient(0, SH - 160, 0, SH); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.85)'); sx.fillStyle = g; sx.fillRect(0, SH - 160, SW, 160);
      sx.fillStyle = '#d4ff3a'; sx.font = font(20, 600); sx.fillText('PLAYGROUND · BUILT BY AI AGENTS', 36, SH - 80);
      sx.fillStyle = '#fff'; sx.font = font(46, 700, 'Space Grotesk, sans-serif'); sx.fillText(th.title, 36, SH - 30);
    }
  } else if (kind === 'contact') {
    sx.fillStyle = '#0f1208'; sx.fillRect(0, 0, SW, SH);
    sx.fillStyle = '#d4ff3a'; sx.font = font(92, 700, 'Space Grotesk, sans-serif'); sx.fillText("Let's talk.", 60, 250);
    sx.fillStyle = '#eceef2'; sx.font = font(30, 500, 'Inter, sans-serif'); sx.fillText('Architecture · Platforms · Applied AI', 64, 320);
    sx.fillStyle = '#8c93a1'; sx.font = font(26, 400); sx.fillText('noumannsyed@gmail.com', 64, 400);
    sx.fillStyle = `rgba(212,255,58,${0.4 + Math.sin(t * 3) * 0.3})`; sx.beginPath(); sx.arc(900, 140, 26, 0, 7); sx.fill();
  }
  scrTex.needsUpdate = true;
}

/* ---------- scroll → scene ---------- */
const markers = [...document.querySelectorAll('[data-scene]')];
let progress = 0, mouseX = 0, mouseY = 0, dirty = true;
function pickScene() {
  const line = innerHeight * 0.5; let key = 'hero';
  for (const el of markers) if (el.getBoundingClientRect().top < line) key = el.dataset.scene;
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) key = 'contact';
  const h = document.documentElement.scrollHeight - innerHeight;
  progress = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
  if (key !== sceneKey) setScene(key);
  dirty = true;
}
function setScene(key) {
  sceneKey = key; sceneT = 0; const s = SCENES[key];
  poseKey = s.pose; exprKey = s.expr; glowTarget.setHex(s.glow);
  bubble.classList.remove('show');
  clearTimeout(setScene.tm);
  setScene.tm = setTimeout(() => {
    bubble.textContent = s.bubble; bubble.classList.add('show');
    // On phones the companion sits over the content, so the bubble only pops up briefly.
    if (compact) setScene.tm = setTimeout(() => bubble.classList.remove('show'), 3200);
  }, reduceMotion ? 0 : 180);
  stageEl.dataset.scene = key;
}
addEventListener('scroll', pickScene, { passive: true });
addEventListener('resize', () => { resize(); pickScene(); });
addEventListener('pointermove', e => { mouseX = e.clientX / innerWidth * 2 - 1; mouseY = e.clientY / innerHeight * 2 - 1; dirty = true; }, { passive: true });
stageEl.addEventListener('click', () => { if (sceneKey === 'featured' || sceneKey === 'hero') location.hash = 'playground'; });

/* ---------- layout ---------- */
let compact = false;
function resize() {
  const w = stageEl.clientWidth, h = stageEl.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  compact = w < 260;
  dirty = true;
}
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function frameCamera(snap) {
  let pos, look, W, d;
  if (compact) { pos = new THREE.Vector3(0.75, 1.35, 1.75); look = new THREE.Vector3(0.0, 1.13, 0.05); W = 0.75; }
  else {
    const swing = 1.0 - progress * 0.9; // orbit gently as the page scrolls
    pos = new THREE.Vector3(0.9 + swing * 0.8, 1.72, 2.85); look = new THREE.Vector3(-0.1, 1.2, 0.0); W = 1.85;
  }
  d = pos.distanceTo(look);
  const vfov = 2 * Math.atan(W / (2 * Math.max(camera.aspect, 0.4) * d)) * 180 / Math.PI;
  camera.fov = Math.min(62, Math.max(24, vfov)); camera.updateProjectionMatrix();
  if (snap) { camPos.copy(pos); camLook.copy(look); } else { camPos.lerp(pos, 0.08); camLook.lerp(look, 0.08); }
  camera.position.copy(camPos); camera.lookAt(camLook);
}

/* ---------- day → night ---------- */
const SKY = [[0, 0xffcf96], [0.3, 0x8fcfff], [0.62, 0xff8a5b], [0.82, 0x3a2e5c], [1, 0x101830]].map(([k, c]) => [k, new THREE.Color(c)]);
const tmpC = new THREE.Color();
function skyAt(p) { for (let i = 1; i < SKY.length; i++) if (p <= SKY[i][0]) { const a = SKY[i - 1], b = SKY[i]; return tmpC.copy(a[1]).lerp(b[1], (p - a[0]) / (b[0] - a[0])); } return tmpC.copy(SKY[SKY.length - 1][1]); }
function applyTime(p) {
  skyMat.color.copy(skyAt(p));
  const day = 1 - THREE.MathUtils.smoothstep(p, 0.45, 0.9);
  sunLight.intensity = 0.25 + 1.45 * day;
  sunLight.color.setHSL(0.09, 0.6 + (1 - day) * 0.3, 0.75 - (1 - day) * 0.15);
  sunLight.position.set(2.6 - p * 3.5, 4 - p * 1.6, 2.8);
  hemi.intensity = 0.6 + 0.7 * day;
  hemi.color.setHSL(0.6, 0.5, 0.75 - (1 - day) * 0.35);
  const night = THREE.MathUtils.smoothstep(p, 0.5, 0.85);
  lampLight.intensity = night * 2.2; bulbMat.color.setRGB(0.27 + night * 0.73, 0.25 + night * 0.62, 0.2 + night * 0.3);
  sun.position.y = 0.38 - p * 0.75; sunMat.color.setHSL(night > 0.6 ? 0.6 : 0.12, night > 0.6 ? 0.2 : 0.9, night > 0.6 ? 0.92 : 0.8);
  displayGlow.intensity = 0.4 + night * 0.9; monGlow.intensity = 0.35 + night * 0.8;
  renderer.toneMappingExposure = 1.05 - night * 0.12;
}

/* ---------- animation ---------- */
const lerp = (a, b, k) => a + (b - a) * k;
function update(dt, t) {
  sceneT += dt;
  const s = SCENES[sceneKey] || SCENES.hero;
  let pk = poseKey;
  if (s.then && sceneT > 2.4) pk = s.then;
  const pose = P[pk], ex = E[exprKey];
  const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 7);
  for (const side of ['r', 'l']) for (let i = 0; i < 4; i++) cur[side][i] = lerp(cur[side][i], pose[side][i], k);
  for (const key of ['lean', 'hx', 'hy', 'chair']) cur[key] = lerp(cur[key], pose[key], k);
  for (const key of ['by', 'bt', 'eye', 'lx', 'ly', 'ms']) cur[key] = lerp(cur[key], ex[key], k);
  cur.mx = lerp(cur.mx, ex.mx || 0, k); cur.mr = lerp(cur.mr, ex.mr || 0, k);
  cur.thumb = lerp(cur.thumb, pk === 'thumbs' ? 1 : 0, k);
  cur.mug = lerp(cur.mug, pk === 'coffee' ? 1 : 0, k);
  for (const m in mouths) mouthW[m] = lerp(mouthW[m], m === ex.mouth ? 1 : 0, reduceMotion ? 1 : 1 - Math.exp(-dt * 10));

  const anim = reduceMotion ? 0 : 1;
  const breathe = Math.sin(t * 1.6) * 0.012 * anim;
  // arms (+ live motion layered on top of the pose)
  const set = (A, v, side) => { A.sh.rotation.set(v[0], 0, v[1]); A.el.rotation.set(v[2], 0, v[3]); };
  const rv = [...cur.r], lv = [...cur.l];
  const typingAmt = (pk === 'typing' || pk === 'focus') ? 1 : 0;
  if (typingAmt && anim) { rv[2] += Math.sin(t * (pk === 'focus' ? 22 : 16)) * 0.06; lv[2] += Math.sin(t * (pk === 'focus' ? 19 : 14) + 1) * 0.06; }
  if (pk === 'wave' && anim) rv[3] += Math.sin(t * 9) * 0.45;
  if (pk === 'excited' && anim) { rv[3] += Math.sin(t * 7) * 0.25; lv[3] -= Math.sin(t * 7) * 0.25; }
  if (pk === 'coffee' && anim) lv[2] += Math.sin(t * 0.9) * 0.15;
  if (pk === 'think' && anim) rv[2] += Math.sin(t * 1.3) * 0.03;
  set(R, rv); set(L, lv);
  R.thumb.scale.setScalar(Math.max(0.001, cur.thumb));
  handMug.scale.setScalar(Math.max(0.001, cur.mug)); deskMug.visible = cur.mug < 0.5;

  torso.rotation.x = cur.lean + breathe; torso.position.y = breathe * 0.5;
  me.rotation.y = cur.chair; chair.rotation.y = cur.chair * 0.8;
  if (pk === 'excited' && anim) hips.position.y = 0.55 + Math.abs(Math.sin(t * 7)) * 0.02; else hips.position.y = 0.55;
  // head follows the pose, plus the visitor's cursor
  const look = compact ? 0.6 : 0.35;
  head.rotation.x = cur.hx + mouseY * 0.12 * look * anim + (pk === 'focus' && anim ? Math.sin(t * 2) * 0.02 : 0);
  head.rotation.y = cur.hy - mouseX * 0.35 * look * anim;
  head.rotation.z = (exprKey === 'think' ? 0.1 : 0) + Math.sin(t * 0.7) * 0.02 * anim;

  // blink
  blinkT -= dt; if (blinkT < 0 && anim) { blink = 0.14; blinkT = 2.2 + Math.random() * 3; }
  blink = Math.max(0, blink - dt); const b = blink > 0 ? Math.abs(Math.sin(blink / 0.14 * Math.PI)) : 0;
  for (const e of eyes) {
    e.g.scale.y = Math.max(0.08, cur.eye * (1 - b));
    e.pupil.position.x = (cur.lx * 0.006) + mouseX * 0.004 * anim; e.pupil.position.y = cur.ly * 0.006 - mouseY * 0.004 * anim;
    e.brow.position.y = 0.062 + cur.by; e.brow.rotation.z = e.s * cur.bt;
  }
  for (const m in mouths) { const w = Math.max(0.001, mouthW[m] * cur.ms); mouths[m].scale.set(w, m === 'open' ? w * (0.9 + Math.sin(t * 6) * 0.08 * anim) : w, w); }
  mouthG.position.x = cur.mx; mouthG.rotation.z = cur.mr;

  glowColor.lerp(glowTarget, k); monGlow.color.copy(glowColor); displayGlow.color.copy(glowColor);
  applyTime(progress);
}

const clock = new THREE.Clock();
let screenAcc = 1;
function loop() {
  requestAnimationFrame(loop);
  const active = document.body.classList.contains('v-home') && !document.hidden;
  if (!active) { clock.getDelta(); return; }
  const dt = Math.min(0.05, clock.getDelta()), t = clock.elapsedTime;
  if (reduceMotion && !dirty) return;
  update(reduceMotion ? 1 : dt, t);
  screenAcc += dt;
  if (screenAcc > 1 / 20 || reduceMotion) { screenAcc = 0; drawScreen(SCENES[sceneKey].screen, reduceMotion ? 99 : sceneT); }
  frameCamera(false);
  renderer.render(scene, camera);
  dirty = false;
}

resize(); pickScene(); update(1, 0); frameCamera(true);
new ResizeObserver(resize).observe(stageEl);
document.body.classList.add('scene-ready');
loop();
