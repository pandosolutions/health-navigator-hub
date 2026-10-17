/**
 * Geometry for the home-page anatomy figures.
 *
 * Each figure is described in "figure units": the body is 1 unit tall, feet at
 * y = 1, head top near y = 0, centred on x = 0 (positive x is the viewer's
 * right). The renderer scales units to pixels. A body is a union of simple
 * shapes (ellipses, capsules, a torso polygon); the constellation of nodes is
 * sampled from that union, and every system overlay is placed from the same
 * keypoints so it lines up with the body.
 */

export type Region = "head" | "torso" | "armL" | "armR" | "legL" | "legR";
export type Pt = { x: number; y: number };

type Ellipse = { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; region: Region };
type Capsule = { kind: "capsule"; a: Pt; b: Pt; r: number; region: Region };
/** A capsule whose radius tapers from r1 at a to r2 at b (limbs). */
type Cone = { kind: "cone"; a: Pt; b: Pt; r1: number; r2: number; region: Region };
type Poly = { kind: "poly"; pts: Pt[]; region: Region };
type Shape = Ellipse | Capsule | Cone | Poly;

export type Keypoints = {
  head: Pt;
  headRx: number;
  headRy: number;
  neck: Pt;
  shoulderL: Pt;
  shoulderR: Pt;
  elbowL: Pt;
  elbowR: Pt;
  wristL: Pt;
  wristR: Pt;
  handL: Pt;
  handR: Pt;
  chestY: number;
  chestX: number;
  waistY: number;
  waistX: number;
  hipY: number;
  hipX: number;
  hipL: Pt;
  hipR: Pt;
  kneeL: Pt;
  kneeR: Pt;
  ankleL: Pt;
  ankleR: Pt;
  footL: Pt;
  footR: Pt;
  thighR: number;
  shinR: number;
  upperArmR: number;
  forearmR: number;
};

export type Node = {
  x: number;
  y: number;
  region: Region;
  phase: number;
  speed: number;
  size: number;
  star: boolean;
};

export type Figure = {
  sex: "male" | "female";
  kp: Keypoints;
  shapes: Shape[];
  nodes: Node[];
  edges: [number, number][];
  /** Extra-dense nodes inside the brain, for the Neuro view. */
  brain: Node[];
  brainEdges: [number, number][];
};

// ---------------------------------------------------------------- random

/** Small seeded PRNG so the constellation looks the same on every visit. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- keypoints

const mirror = (p: Pt): Pt => ({ x: -p.x, y: p.y });

function keypoints(sex: "male" | "female"): Keypoints {
  const m = sex === "male";
  const shoulderR = m ? { x: 0.125, y: 0.18 } : { x: 0.106, y: 0.182 };
  const elbowR = m ? { x: 0.158, y: 0.335 } : { x: 0.138, y: 0.33 };
  const wristR = m ? { x: 0.172, y: 0.468 } : { x: 0.152, y: 0.458 };
  const handR = m ? { x: 0.178, y: 0.512 } : { x: 0.157, y: 0.5 };
  const hipR = m ? { x: 0.058, y: 0.505 } : { x: 0.064, y: 0.5 };
  const kneeR = m ? { x: 0.066, y: 0.72 } : { x: 0.058, y: 0.72 };
  const ankleR = m ? { x: 0.07, y: 0.935 } : { x: 0.062, y: 0.935 };
  const footR = m ? { x: 0.086, y: 0.972 } : { x: 0.076, y: 0.972 };
  return {
    head: { x: 0, y: m ? 0.068 : 0.072 },
    headRx: m ? 0.05 : 0.046,
    headRy: m ? 0.064 : 0.06,
    neck: { x: 0, y: 0.14 },
    shoulderR,
    shoulderL: mirror(shoulderR),
    elbowR,
    elbowL: mirror(elbowR),
    wristR,
    wristL: mirror(wristR),
    handR,
    handL: mirror(handR),
    chestY: 0.235,
    chestX: m ? 0.118 : 0.1,
    waistY: m ? 0.4 : 0.375,
    waistX: m ? 0.09 : 0.074,
    hipY: m ? 0.48 : 0.47,
    hipX: m ? 0.106 : 0.12,
    hipR,
    hipL: mirror(hipR),
    kneeR,
    kneeL: mirror(kneeR),
    ankleR,
    ankleL: mirror(ankleR),
    footR,
    footL: mirror(footR),
    thighR: m ? 0.052 : 0.054,
    shinR: m ? 0.034 : 0.032,
    upperArmR: m ? 0.03 : 0.025,
    forearmR: m ? 0.024 : 0.02,
  };
}

function shapesFor(kp: Keypoints, sex: "male" | "female"): Shape[] {
  const f = sex === "female";
  const { chestX, chestY, waistX, waistY, hipX, hipY } = kp;
  const sx = kp.shoulderR.x;
  // Right half of the torso outline, top to crotch; mirrored for the left.
  const right: Pt[] = [
    { x: 0.03, y: 0.156 },
    { x: sx - 0.03, y: 0.168 },
    { x: sx - 0.004, y: 0.18 },
    { x: chestX + 0.004, y: chestY },
    ...(f
      ? [
          { x: chestX + 0.008, y: 0.262 },
          { x: chestX - 0.004, y: 0.29 },
        ]
      : [{ x: chestX - 0.002, y: 0.29 }]),
    { x: waistX, y: waistY },
    { x: hipX * 0.96, y: hipY - 0.035 },
    { x: hipX, y: hipY },
    { x: kp.hipR.x + kp.thighR * 0.8, y: 0.535 },
    { x: 0.012, y: 0.552 },
  ];
  const torso = [...right, ...right.map(mirror).reverse()];
  const shapes: Shape[] = [
    { kind: "ellipse", cx: kp.head.x, cy: kp.head.y, rx: kp.headRx, ry: kp.headRy, region: "head" },
    {
      kind: "cone",
      a: { x: 0, y: 0.115 },
      b: { x: 0, y: 0.165 },
      r1: f ? 0.019 : 0.024,
      r2: f ? 0.024 : 0.03,
      region: "head",
    },
    { kind: "poly", pts: torso, region: "torso" },
    {
      kind: "ellipse",
      cx: kp.shoulderR.x - 0.012,
      cy: kp.shoulderR.y + 0.01,
      rx: 0.034,
      ry: 0.03,
      region: "armR",
    },
    {
      kind: "ellipse",
      cx: kp.shoulderL.x + 0.012,
      cy: kp.shoulderL.y + 0.01,
      rx: 0.034,
      ry: 0.03,
      region: "armL",
    },
  ];
  for (const side of ["L", "R"] as const) {
    const s = side === "L" ? kp.shoulderL : kp.shoulderR;
    const e = side === "L" ? kp.elbowL : kp.elbowR;
    const w = side === "L" ? kp.wristL : kp.wristR;
    const h = side === "L" ? kp.handL : kp.handR;
    const hp = side === "L" ? kp.hipL : kp.hipR;
    const k = side === "L" ? kp.kneeL : kp.kneeR;
    const a = side === "L" ? kp.ankleL : kp.ankleR;
    const ft = side === "L" ? kp.footL : kp.footR;
    const arm: Region = side === "L" ? "armL" : "armR";
    const leg: Region = side === "L" ? "legL" : "legR";
    shapes.push(
      { kind: "cone", a: s, b: e, r1: kp.upperArmR * 1.1, r2: kp.upperArmR * 0.8, region: arm },
      { kind: "cone", a: e, b: w, r1: kp.forearmR * 1.1, r2: kp.forearmR * 0.72, region: arm },
      { kind: "ellipse", cx: h.x, cy: h.y, rx: 0.02, ry: 0.038, region: arm },
      { kind: "cone", a: hp, b: k, r1: kp.thighR * 1.15, r2: kp.thighR * 0.68, region: leg },
      { kind: "cone", a: k, b: a, r1: kp.shinR * 1.05, r2: kp.shinR * 0.62, region: leg },
      { kind: "ellipse", cx: ft.x, cy: ft.y, rx: 0.038, ry: 0.016, region: leg },
    );
  }
  if (f) {
    // Hair: a soft volume around the head and a bun on top, as in the reference.
    shapes.push(
      {
        kind: "ellipse",
        cx: 0,
        cy: kp.head.y - 0.008,
        rx: kp.headRx + 0.008,
        ry: kp.headRy + 0.004,
        region: "head",
      },
      { kind: "ellipse", cx: 0, cy: 0.002, rx: 0.026, ry: 0.022, region: "head" },
    );
  }
  return shapes;
}

// ---------------------------------------------------------------- geometry

function distToSegment(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)),
  );
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function inPoly(p: Pt, pts: Pt[]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside;
  }
  return inside;
}

function inShape(p: Pt, s: Shape, margin = 0) {
  if (s.kind === "ellipse") {
    const rx = s.rx - margin;
    const ry = s.ry - margin;
    return ((p.x - s.cx) / rx) ** 2 + ((p.y - s.cy) / ry) ** 2 <= 1;
  }
  if (s.kind === "capsule") return distToSegment(p, s.a, s.b) <= s.r - margin;
  if (s.kind === "cone") {
    const dx = s.b.x - s.a.x;
    const dy = s.b.y - s.a.y;
    const t = Math.max(
      0,
      Math.min(1, ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / (dx * dx + dy * dy || 1)),
    );
    return distToSegment(p, s.a, s.b) <= s.r1 + (s.r2 - s.r1) * t - margin;
  }
  return inPoly(p, s.pts);
}

function boundary(s: Shape, step: number): Pt[] {
  const out: Pt[] = [];
  if (s.kind === "ellipse") {
    const n = Math.max(
      8,
      Math.round((2 * Math.PI * Math.sqrt((s.rx * s.rx + s.ry * s.ry) / 2)) / step),
    );
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      out.push({ x: s.cx + s.rx * Math.cos(t), y: s.cy + s.ry * Math.sin(t) });
    }
  } else if (s.kind === "capsule" || s.kind === "cone") {
    const dx = s.b.x - s.a.x;
    const dy = s.b.y - s.a.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const n = Math.max(2, Math.round(len / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = s.a.x + dx * t;
      const y = s.a.y + dy * t;
      const r = s.kind === "cone" ? s.r1 + (s.r2 - s.r1) * t : s.r;
      out.push({ x: x + nx * r, y: y + ny * r }, { x: x - nx * r, y: y - ny * r });
    }
  } else {
    for (let i = 0; i < s.pts.length; i++) {
      const a = s.pts[i];
      const b = s.pts[(i + 1) % s.pts.length];
      const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / step));
      for (let j = 0; j < n; j++)
        out.push({ x: a.x + ((b.x - a.x) * j) / n, y: a.y + ((b.y - a.y) * j) / n });
    }
  }
  return out;
}

function connect(nodes: Pt[], k: number, maxDist: number): [number, number][] {
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((p, i) => {
    const near = nodes
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .filter((o) => o.j !== i && o.d < maxDist)
      .sort((a, b) => a.d - b.d)
      .slice(0, k);
    for (const { j } of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([i, j]);
      }
    }
  });
  return edges;
}

function makeNode(p: Pt, region: Region, rand: () => number): Node {
  return {
    x: p.x,
    y: p.y,
    region,
    phase: rand() * Math.PI * 2,
    speed: 0.6 + rand() * 1.6,
    size: 0.55 + rand() * 0.9,
    star: rand() < 0.09,
  };
}

// ---------------------------------------------------------------- figures

export function buildFigure(sex: "male" | "female"): Figure {
  const rand = rng(sex === "male" ? 7 : 11);
  const kp = keypoints(sex);
  const shapes = shapesFor(kp, sex);
  const inside = (p: Pt, margin = 0) => shapes.some((s) => inShape(p, s, margin));
  const regionOf = (p: Pt): Region => (shapes.find((s) => inShape(p, s)) ?? shapes[0]).region;

  const nodes: Node[] = [];
  const tooClose = (p: Pt, d: number) => nodes.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < d);

  // Outline: boundary points of each shape that aren't buried inside another.
  for (const s of shapes) {
    for (const raw of boundary(s, 0.022)) {
      const buried = shapes.some((o) => o !== s && inShape(raw, o, 0.004));
      // A little jitter so the outline reads as hand-placed, not ruled.
      const p = { x: raw.x + (rand() - 0.5) * 0.006, y: raw.y + (rand() - 0.5) * 0.006 };
      if (!buried && !tooClose(p, 0.016)) nodes.push(makeNode(p, s.region, rand));
    }
  }
  // Interior: spaced-out random points.
  for (let tries = 0; tries < 9000 && nodes.length < 380; tries++) {
    const p = { x: -0.2 + rand() * 0.4, y: rand() };
    if (inside(p, 0.006) && !tooClose(p, 0.025)) nodes.push(makeNode(p, regionOf(p), rand));
  }

  // Brain: a denser cluster in the top of the head.
  const brain: Node[] = [];
  const bc = { x: kp.head.x, y: kp.head.y - kp.headRy * 0.22 };
  for (let tries = 0; tries < 3000 && brain.length < 46; tries++) {
    const p = {
      x: bc.x + (rand() * 2 - 1) * kp.headRx * 0.82,
      y: bc.y + (rand() * 2 - 1) * kp.headRy * 0.6,
    };
    const inBrain =
      ((p.x - bc.x) / (kp.headRx * 0.82)) ** 2 + ((p.y - bc.y) / (kp.headRy * 0.6)) ** 2 <= 1;
    if (inBrain && !brain.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 0.008))
      brain.push(makeNode(p, "head", rand));
  }

  return {
    sex,
    kp,
    shapes,
    nodes,
    edges: connect(nodes, 3, 0.07),
    brain,
    brainEdges: connect(brain, 3, 0.03),
  };
}

// ---------------------------------------------------------------- paths

/** A polyline with cumulative lengths, for particles that travel along it. */
export type Path = { pts: Pt[]; cum: number[]; len: number };

export function path(pts: Pt[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
}

export function pointAt(p: Path, f: number): Pt {
  const d = Math.max(0, Math.min(1, f)) * p.len;
  let i = 1;
  while (i < p.cum.length - 1 && p.cum[i] < d) i++;
  const seg = p.cum[i] - p.cum[i - 1] || 1;
  const t = (d - p.cum[i - 1]) / seg;
  const a = p.pts[i - 1];
  const b = p.pts[i];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

const mid = (a: Pt, b: Pt, t = 0.5): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Everything each system view needs, placed from a figure's keypoints. */
export function systemGeometry(f: Figure) {
  const kp = f.kp;
  const heart = { x: 0.028, y: 0.255 };
  const pelvis = { x: 0, y: 0.5 };
  const limbs = (fromL: Pt, fromR: Pt) => ({
    armL: [fromL, kp.shoulderL, kp.elbowL, kp.wristL, kp.handL],
    armR: [fromR, kp.shoulderR, kp.elbowR, kp.wristR, kp.handR],
  });
  const legs = (from: Pt) => ({
    legL: [from, kp.hipL, kp.kneeL, kp.ankleL, kp.footL],
    legR: [from, kp.hipR, kp.kneeR, kp.ankleR, kp.footR],
  });

  // Neuro: brain stem down the spine, out to hands and feet.
  const spineTop = { x: 0, y: kp.head.y + kp.headRy * 0.6 };
  const neckBase = { x: 0, y: 0.17 };
  const nArms = limbs(neckBase, neckBase);
  const nLegs = legs(pelvis);
  const nerves = [
    path([spineTop, neckBase, { x: 0, y: 0.33 }, pelvis]),
    path([spineTop, ...nArms.armL]),
    path([spineTop, ...nArms.armR]),
    path([spineTop, neckBase, { x: 0, y: 0.33 }, ...nLegs.legL]),
    path([spineTop, neckBase, { x: 0, y: 0.33 }, ...nLegs.legR]),
  ];

  // Cardiovascular: arteries from the heart to head, arms and legs.
  const aortaTop = { x: 0.004, y: 0.2 };
  const vArms = limbs(aortaTop, aortaTop);
  const vLegs = legs({ x: 0, y: 0.47 });
  const arteries = [
    path([
      heart,
      aortaTop,
      { x: 0.012, y: 0.14 },
      { x: 0.018, y: kp.head.y + 0.02 },
      { x: 0.02, y: kp.head.y - 0.02 },
    ]),
    path([
      heart,
      aortaTop,
      { x: -0.012, y: 0.14 },
      { x: -0.018, y: kp.head.y + 0.02 },
      { x: -0.02, y: kp.head.y - 0.02 },
    ]),
    path([heart, ...vArms.armL]),
    path([heart, ...vArms.armR]),
    path([heart, { x: 0.006, y: 0.33 }, ...vLegs.legL]),
    path([heart, { x: 0.006, y: 0.33 }, ...vLegs.legR]),
  ];

  // Respiratory.
  const lungs = [
    { cx: -0.046, cy: 0.262, rx: 0.04, ry: 0.07 },
    { cx: 0.048, cy: 0.262, rx: 0.038, ry: 0.068 },
  ];
  const airway = path([
    { x: 0, y: kp.head.y + kp.headRy * 0.45 },
    { x: 0, y: 0.205 },
  ]);
  const bronchi = [
    path([
      { x: 0, y: 0.205 },
      { x: -0.025, y: 0.235 },
      { x: -0.045, y: 0.27 },
    ]),
    path([
      { x: 0, y: 0.205 },
      { x: 0.025, y: 0.235 },
      { x: 0.047, y: 0.27 },
    ]),
  ];

  // Digestive: mouth, oesophagus, stomach, small intestine coil, colon.
  // Small intestine: a smooth winding coil; then the colon frames it.
  const coil: Pt[] = [];
  for (let i = 0; i <= 64; i++) {
    const u = i / 64;
    coil.push({
      x: 0.034 * Math.sin(u * Math.PI * 7) * (0.75 + 0.25 * Math.sin(u * Math.PI)),
      y: 0.37 + u * 0.08,
    });
  }
  const gut = path([
    { x: 0, y: kp.head.y + kp.headRy * 0.5 },
    { x: 0, y: 0.2 },
    { x: 0.008, y: 0.29 },
    { x: 0.035, y: 0.3 },
    { x: 0.055, y: 0.318 },
    { x: 0.048, y: 0.342 },
    { x: 0.02, y: 0.35 },
    { x: 0, y: 0.362 },
    ...coil,
    { x: -0.05, y: 0.474 },
    { x: -0.062, y: 0.43 },
    { x: -0.06, y: 0.388 },
    { x: -0.045, y: 0.366 },
    { x: 0, y: 0.36 },
    { x: 0.045, y: 0.366 },
    { x: 0.06, y: 0.388 },
    { x: 0.062, y: 0.43 },
    { x: 0.055, y: 0.474 },
    { x: 0.012, y: 0.492 },
  ]);
  const stomach = { cx: 0.036, cy: 0.322, rx: 0.026, ry: 0.02 };

  // Musculoskeletal: muscle groups as soft ellipses (cx, cy, rx, ry, angle).
  const along = (a: Pt, b: Pt) => Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
  const muscles: { cx: number; cy: number; rx: number; ry: number; a: number }[] = [];
  for (const s of [-1, 1]) {
    const sh = s < 0 ? kp.shoulderL : kp.shoulderR;
    const el = s < 0 ? kp.elbowL : kp.elbowR;
    const wr = s < 0 ? kp.wristL : kp.wristR;
    const hp = s < 0 ? kp.hipL : kp.hipR;
    const kn = s < 0 ? kp.kneeL : kp.kneeR;
    const an = s < 0 ? kp.ankleL : kp.ankleR;
    const bi = mid(sh, el, 0.55);
    const fo = mid(el, wr, 0.4);
    const q = mid(hp, kn, 0.5);
    const c = mid(kn, an, 0.35);
    muscles.push(
      { cx: s * kp.chestX * 0.42, cy: 0.225, rx: kp.chestX * 0.4, ry: 0.032, a: s * 0.12 },
      { cx: sh.x - s * 0.006, cy: sh.y + 0.012, rx: 0.026, ry: 0.03, a: 0 },
      { cx: bi.x, cy: bi.y, rx: kp.upperArmR * 0.8, ry: 0.055, a: along(sh, el) },
      { cx: fo.x, cy: fo.y, rx: kp.forearmR * 0.8, ry: 0.05, a: along(el, wr) },
      { cx: q.x, cy: q.y, rx: kp.thighR * 0.8, ry: 0.095, a: along(hp, kn) },
      { cx: c.x, cy: c.y, rx: kp.shinR * 0.85, ry: 0.07, a: along(kn, an) },
    );
  }
  for (const y of [0.3, 0.335, 0.37])
    for (const s of [-1, 1]) muscles.push({ cx: s * 0.019, cy: y, rx: 0.016, ry: 0.014, a: 0 });
  const bones = [
    path([
      { x: 0, y: kp.head.y + kp.headRy * 0.7 },
      { x: 0, y: 0.5 },
    ]),
    path([kp.shoulderL, { x: 0, y: 0.172 }, kp.shoulderR]),
    path([kp.shoulderL, kp.elbowL, kp.wristL]),
    path([kp.shoulderR, kp.elbowR, kp.wristR]),
    path([kp.hipL, { x: 0, y: 0.49 }, kp.hipR]),
    path([kp.hipL, kp.kneeL, kp.ankleL]),
    path([kp.hipR, kp.kneeR, kp.ankleR]),
  ];

  // Endocrine glands.
  const glands = [
    { x: 0, y: kp.head.y + 0.004, r: 0.011 }, // pituitary / hypothalamus
    { x: 0, y: 0.152, r: 0.012 }, // thyroid
    { x: 0, y: 0.205, r: 0.01 }, // thymus
    { x: 0.016, y: 0.356, r: 0.012 }, // pancreas
    { x: -0.034, y: 0.37, r: 0.009 }, // adrenals
    { x: 0.034, y: 0.37, r: 0.009 },
    ...(f.sex === "male"
      ? [
          { x: -0.016, y: 0.535, r: 0.01 }, // testes
          { x: 0.016, y: 0.535, r: 0.01 },
        ]
      : [
          { x: -0.05, y: 0.455, r: 0.01 }, // ovaries
          { x: 0.05, y: 0.455, r: 0.01 },
        ]),
  ];

  return { heart, nerves, arteries, lungs, airway, bronchi, gut, stomach, muscles, bones, glands };
}
