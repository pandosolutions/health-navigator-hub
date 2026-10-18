/**
 * Geometry for the home-page anatomy figures.
 *
 * Each figure is described in "figure units": the body is 1 unit tall (about
 * eight heads), the top of the head near y = 0 and the soles at y = 1,
 * centred on x = 0 (positive x is the viewer's right). The renderer scales
 * units to pixels.
 *
 * A figure is drawn like the reference artwork: one continuous silhouette
 * (head in profile, turned toward the other figure; frontal body with hands
 * and feet), anatomical contour lines inside it, bright "hub" nodes on the
 * joints and midline, and a triangulated mesh of nodes filling the body.
 */

export type Region = "head" | "torso" | "armL" | "armR" | "legL" | "legR";
export type Pt = { x: number; y: number };

export type Keypoints = {
  head: Pt;
  headRx: number;
  headRy: number;
  mouth: Pt;
  neck: Pt;
  shoulderL: Pt;
  shoulderR: Pt;
  elbowL: Pt;
  elbowR: Pt;
  wristL: Pt;
  wristR: Pt;
  handL: Pt;
  handR: Pt;
  chestX: number;
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
  hub: boolean;
};

export type Line = { pts: Pt[]; regions: Region[] };

export type Figure = {
  sex: "male" | "female";
  kp: Keypoints;
  /** Closed silhouette (smoothed), with the region of each point. */
  outline: Line;
  /** The woman's hair bun, drawn as its own closed contour. */
  bun: Line | null;
  /** Anatomical contour lines inside the body. */
  features: Line[];
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

// ---------------------------------------------------------------- drawings

type XY = [number, number];
/** "a" marks points that belong to the arm (they swing with it). */
type Tagged = [number, number, "a"?];

const P = (xy: XY): Pt => ({ x: xy[0], y: xy[1] });
const mirror = (p: Pt): Pt => ({ x: -p.x, y: p.y });

type Drawing = {
  /** Right half of the body outline (viewer's right), from the side of the
   *  neck under the jaw, down the arm and hand, up the inside of the arm,
   *  down the side and leg, around the foot and up to the crotch (x = 0). */
  half: Tagged[];
  /** Head in profile facing the viewer's right: from the nape round the
   *  crown and face to the throat. Mirrored for a figure facing left. */
  head: XY[];
  /** Lines on the right side of the body; mirrored to both sides. */
  paired: XY[][];
  /** Lines on the midline. */
  centre: XY[][];
  /** Ear and jaw, facing right like the head. */
  face: XY[][];
  /** Bright landmark nodes on the right side (mirrored) and midline. */
  hubsPaired: XY[];
  hubsCentre: XY[];
};

const MALE: Drawing = {
  half: [
    [0.024, 0.128],
    [0.027, 0.148],
    [0.05, 0.16],
    [0.085, 0.169],
    [0.112, 0.177],
    [0.132, 0.186, "a"],
    [0.144, 0.198, "a"],
    [0.151, 0.215, "a"],
    [0.153, 0.236, "a"],
    [0.152, 0.262, "a"],
    [0.153, 0.292, "a"],
    [0.155, 0.322, "a"],
    [0.157, 0.352, "a"],
    [0.159, 0.376, "a"],
    [0.165, 0.396, "a"],
    [0.17, 0.422, "a"],
    [0.172, 0.452, "a"],
    [0.171, 0.48, "a"],
    [0.17, 0.498, "a"],
    [0.173, 0.515, "a"],
    [0.177, 0.54, "a"],
    [0.178, 0.565, "a"],
    [0.175, 0.587, "a"],
    [0.169, 0.598, "a"],
    [0.162, 0.6, "a"],
    [0.156, 0.594, "a"],
    [0.153, 0.578, "a"],
    [0.15, 0.561, "a"],
    [0.144, 0.557, "a"],
    [0.14, 0.546, "a"],
    [0.141, 0.53, "a"],
    [0.144, 0.507, "a"],
    [0.143, 0.49, "a"],
    [0.139, 0.462, "a"],
    [0.133, 0.432, "a"],
    [0.128, 0.406, "a"],
    [0.123, 0.381, "a"],
    [0.12, 0.36, "a"],
    [0.116, 0.33, "a"],
    [0.111, 0.3, "a"],
    [0.107, 0.272, "a"],
    [0.102, 0.25],
    [0.101, 0.27],
    [0.099, 0.3],
    [0.094, 0.33],
    [0.087, 0.36],
    [0.082, 0.385],
    [0.084, 0.41],
    [0.091, 0.44],
    [0.097, 0.47],
    [0.099, 0.5],
    [0.098, 0.53],
    [0.095, 0.57],
    [0.091, 0.61],
    [0.085, 0.65],
    [0.078, 0.69],
    [0.074, 0.715],
    [0.073, 0.74],
    [0.077, 0.765],
    [0.079, 0.795],
    [0.075, 0.835],
    [0.067, 0.875],
    [0.06, 0.915],
    [0.056, 0.94],
    [0.057, 0.958],
    [0.067, 0.975],
    [0.076, 0.99],
    [0.072, 1.0],
    [0.045, 1.0],
    [0.03, 0.993],
    [0.029, 0.97],
    [0.031, 0.945],
    [0.03, 0.91],
    [0.029, 0.87],
    [0.031, 0.83],
    [0.032, 0.795],
    [0.029, 0.765],
    [0.026, 0.74],
    [0.024, 0.715],
    [0.022, 0.67],
    [0.019, 0.62],
    [0.014, 0.58],
    [0.008, 0.552],
    [0, 0.544],
  ],
  head: [
    [-0.024, 0.122],
    [-0.036, 0.104],
    [-0.046, 0.082],
    [-0.05, 0.056],
    [-0.046, 0.03],
    [-0.034, 0.011],
    [-0.015, 0.001],
    [0.006, 0],
    [0.024, 0.006],
    [0.037, 0.018],
    [0.044, 0.034],
    [0.046, 0.048],
    [0.044, 0.056],
    [0.049, 0.066],
    [0.056, 0.076],
    [0.05, 0.082],
    [0.05, 0.089],
    [0.047, 0.094],
    [0.049, 0.099],
    [0.045, 0.106],
    [0.046, 0.113],
    [0.04, 0.12],
    [0.028, 0.123],
    [0.024, 0.13],
  ],
  paired: [
    // collarbone
    [
      [0.01, 0.174],
      [0.05, 0.168],
      [0.085, 0.172],
      [0.112, 0.181],
    ],
    // deltoid front edge
    [
      [0.118, 0.188],
      [0.126, 0.215],
      [0.134, 0.25],
    ],
    // lower edge of the pectoral
    [
      [0.004, 0.258],
      [0.035, 0.272],
      [0.07, 0.266],
      [0.094, 0.248],
    ],
    // lower ribs
    [
      [0.012, 0.31],
      [0.05, 0.304],
      [0.085, 0.29],
    ],
    // abdominal segments
    [
      [0.004, 0.33],
      [0.03, 0.332],
    ],
    [
      [0.004, 0.36],
      [0.031, 0.362],
    ],
    // hip ("V") line
    [
      [0.078, 0.42],
      [0.06, 0.455],
      [0.035, 0.49],
      [0.012, 0.525],
    ],
    // elbow crease
    [
      [0.128, 0.372],
      [0.145, 0.378],
    ],
    // fingers
    [
      [0.158, 0.567],
      [0.158, 0.596],
    ],
    [
      [0.165, 0.566],
      [0.165, 0.599],
    ],
    [
      [0.171, 0.562],
      [0.171, 0.593],
    ],
    // below the kneecap
    [
      [0.038, 0.738],
      [0.05, 0.746],
      [0.063, 0.737],
    ],
    // inner thigh muscle
    [
      [0.03, 0.58],
      [0.045, 0.64],
      [0.05, 0.69],
    ],
  ],
  centre: [
    [
      [0, 0.176],
      [0, 0.26],
      [0, 0.33],
      [0, 0.39],
      [0, 0.47],
    ],
  ],
  face: [
    [
      [-0.002, 0.05],
      [-0.011, 0.055],
      [-0.013, 0.066],
      [-0.008, 0.077],
      [0, 0.081],
    ],
    [
      [0.001, 0.084],
      [0.012, 0.104],
      [0.03, 0.117],
    ],
  ],
  hubsPaired: [
    [0.112, 0.18],
    [0.142, 0.205],
    [0.045, 0.255],
    [0.14, 0.375],
    [0.156, 0.5],
    [0.072, 0.47],
    [0.05, 0.725],
    [0.044, 0.945],
    [0.085, 0.3],
  ],
  hubsCentre: [
    [0, 0.176],
    [0, 0.255],
    [0, 0.31],
    [0, 0.39],
    [0, 0.47],
  ],
};

const FEMALE: Drawing = {
  half: [
    [0.02, 0.128],
    [0.022, 0.15],
    [0.045, 0.163],
    [0.078, 0.172],
    [0.1, 0.18],
    [0.118, 0.19, "a"],
    [0.127, 0.205, "a"],
    [0.131, 0.225, "a"],
    [0.132, 0.247, "a"],
    [0.132, 0.272, "a"],
    [0.134, 0.302, "a"],
    [0.137, 0.33, "a"],
    [0.14, 0.355, "a"],
    [0.143, 0.376, "a"],
    [0.149, 0.4, "a"],
    [0.153, 0.426, "a"],
    [0.156, 0.455, "a"],
    [0.157, 0.48, "a"],
    [0.158, 0.495, "a"],
    [0.162, 0.51, "a"],
    [0.166, 0.535, "a"],
    [0.168, 0.56, "a"],
    [0.166, 0.58, "a"],
    [0.161, 0.59, "a"],
    [0.154, 0.592, "a"],
    [0.149, 0.585, "a"],
    [0.147, 0.568, "a"],
    [0.143, 0.553, "a"],
    [0.138, 0.548, "a"],
    [0.135, 0.537, "a"],
    [0.137, 0.522, "a"],
    [0.138, 0.505, "a"],
    [0.137, 0.49, "a"],
    [0.133, 0.46, "a"],
    [0.127, 0.43, "a"],
    [0.121, 0.405, "a"],
    [0.116, 0.38, "a"],
    [0.112, 0.36, "a"],
    [0.107, 0.33, "a"],
    [0.102, 0.3, "a"],
    [0.097, 0.272, "a"],
    [0.092, 0.252],
    [0.095, 0.268],
    [0.094, 0.292],
    [0.087, 0.32],
    [0.077, 0.345],
    [0.07, 0.37],
    [0.073, 0.395],
    [0.086, 0.42],
    [0.1, 0.45],
    [0.107, 0.48],
    [0.108, 0.51],
    [0.105, 0.545],
    [0.099, 0.585],
    [0.092, 0.625],
    [0.083, 0.665],
    [0.074, 0.7],
    [0.069, 0.725],
    [0.068, 0.75],
    [0.072, 0.775],
    [0.073, 0.8],
    [0.068, 0.84],
    [0.06, 0.88],
    [0.053, 0.915],
    [0.049, 0.94],
    [0.05, 0.958],
    [0.059, 0.975],
    [0.067, 0.99],
    [0.063, 1.0],
    [0.04, 1.0],
    [0.027, 0.993],
    [0.026, 0.97],
    [0.028, 0.945],
    [0.027, 0.91],
    [0.026, 0.87],
    [0.028, 0.83],
    [0.029, 0.8],
    [0.025, 0.77],
    [0.021, 0.745],
    [0.019, 0.72],
    [0.016, 0.67],
    [0.012, 0.62],
    [0.008, 0.58],
    [0.004, 0.556],
    [0, 0.55],
  ],
  head: [
    [-0.02, 0.124],
    [-0.032, 0.105],
    [-0.042, 0.085],
    [-0.046, 0.06],
    [-0.043, 0.036],
    [-0.032, 0.017],
    [-0.014, 0.007],
    [0.005, 0.006],
    [0.022, 0.012],
    [0.034, 0.024],
    [0.04, 0.038],
    [0.042, 0.05],
    [0.04, 0.057],
    [0.044, 0.066],
    [0.05, 0.075],
    [0.045, 0.08],
    [0.045, 0.087],
    [0.042, 0.092],
    [0.044, 0.096],
    [0.04, 0.102],
    [0.041, 0.108],
    [0.035, 0.115],
    [0.024, 0.118],
    [0.02, 0.128],
  ],
  paired: [
    // collarbone
    [
      [0.008, 0.176],
      [0.045, 0.17],
      [0.078, 0.175],
      [0.1, 0.184],
    ],
    // shoulder front edge
    [
      [0.106, 0.192],
      [0.114, 0.22],
      [0.12, 0.252],
    ],
    // breast
    [
      [0.012, 0.262],
      [0.024, 0.285],
      [0.048, 0.296],
      [0.075, 0.288],
      [0.09, 0.268],
    ],
    // waist / lower ribs
    [
      [0.01, 0.33],
      [0.045, 0.325],
      [0.07, 0.315],
    ],
    // hip line
    [
      [0.074, 0.41],
      [0.058, 0.45],
      [0.034, 0.49],
      [0.01, 0.53],
    ],
    // elbow crease
    [
      [0.114, 0.372],
      [0.13, 0.378],
    ],
    // fingers
    [
      [0.15, 0.562],
      [0.151, 0.588],
    ],
    [
      [0.156, 0.561],
      [0.157, 0.591],
    ],
    [
      [0.162, 0.558],
      [0.162, 0.584],
    ],
    // below the kneecap
    [
      [0.032, 0.743],
      [0.044, 0.751],
      [0.057, 0.742],
    ],
    // inner thigh muscle
    [
      [0.026, 0.59],
      [0.04, 0.645],
      [0.045, 0.695],
    ],
  ],
  centre: [
    [
      [0, 0.178],
      [0, 0.26],
      [0, 0.33],
      [0, 0.385],
      [0, 0.47],
    ],
  ],
  face: [
    [
      [-0.002, 0.052],
      [-0.01, 0.057],
      [-0.012, 0.067],
      [-0.007, 0.077],
      [0, 0.08],
    ],
    [
      [0.001, 0.083],
      [0.012, 0.102],
      [0.028, 0.113],
    ],
  ],
  hubsPaired: [
    [0.1, 0.182],
    [0.124, 0.21],
    [0.05, 0.296],
    [0.128, 0.375],
    [0.147, 0.497],
    [0.075, 0.46],
    [0.044, 0.73],
    [0.038, 0.945],
    [0.075, 0.33],
  ],
  hubsCentre: [
    [0, 0.178],
    [0, 0.26],
    [0, 0.33],
    [0, 0.385],
    [0, 0.47],
  ],
};

/** Hair bun at the back of the head, in facing-right coordinates. */
const BUN = { cx: -0.047, cy: 0.024, r: 0.021 };

// ---------------------------------------------------------------- curves

/** Catmull-Rom resampling: smooth curve through the points, every `step`. */
function smooth(pts: Pt[], step: number, closed: boolean): Pt[] {
  return smoothWithSource(pts, step, closed).pts;
}

/** As smooth(), plus the index of the source segment behind each point. */
function smoothWithSource(pts: Pt[], step: number, closed: boolean) {
  const n = pts.length;
  const src: number[] = [];
  if (n < 3) return { pts, src: pts.map((_, i) => i) };
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out: Pt[] = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const k = Math.max(1, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
    for (let j = 0; j < k; j++) {
      src.push(i);
      const t = j / k;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  if (!closed) {
    out.push(pts[n - 1]);
    src.push(n - 1);
  }
  return { pts: out, src };
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

/** Points every `step` along a polyline (already smooth). */
function spaced(pts: Pt[], step: number, closed: boolean): Pt[] {
  const out: Pt[] = [pts[0]];
  let acc = 0;
  const list = closed ? [...pts, pts[0]] : pts;
  for (let i = 1; i < list.length; i++) {
    acc += Math.hypot(list[i].x - list[i - 1].x, list[i].y - list[i - 1].y);
    if (acc >= step) {
      out.push(list[i]);
      acc = 0;
    }
  }
  return out;
}

// ---------------------------------------------------------------- mesh

/** Bowyer-Watson Delaunay triangulation; returns unique edges. */
function delaunayEdges(pts: Pt[]): [number, number][] {
  const minX = Math.min(...pts.map((p) => p.x)) - 1;
  const minY = Math.min(...pts.map((p) => p.y)) - 1;
  const maxX = Math.max(...pts.map((p) => p.x)) + 1;
  const maxY = Math.max(...pts.map((p) => p.y)) + 1;
  const d = Math.max(maxX - minX, maxY - minY) * 10;
  const all = [
    ...pts,
    { x: minX - d, y: minY - d },
    { x: minX + d * 2, y: minY - d },
    { x: minX - d, y: minY + d * 2 },
  ];
  const n = pts.length;
  type Tri = { a: number; b: number; c: number; cx: number; cy: number; r2: number };
  const make = (a: number, b: number, c: number): Tri => {
    const A = all[a];
    const B = all[b];
    const C = all[c];
    const D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) || 1e-12;
    const a2 = A.x * A.x + A.y * A.y;
    const b2 = B.x * B.x + B.y * B.y;
    const c2 = C.x * C.x + C.y * C.y;
    const cx = (a2 * (B.y - C.y) + b2 * (C.y - A.y) + c2 * (A.y - B.y)) / D;
    const cy = (a2 * (C.x - B.x) + b2 * (A.x - C.x) + c2 * (B.x - A.x)) / D;
    return { a, b, c, cx, cy, r2: (A.x - cx) ** 2 + (A.y - cy) ** 2 };
  };
  let tris: Tri[] = [make(n, n + 1, n + 2)];
  for (let i = 0; i < n; i++) {
    const p = all[i];
    const bad: Tri[] = [];
    const keep: Tri[] = [];
    for (const t of tris) ((p.x - t.cx) ** 2 + (p.y - t.cy) ** 2 < t.r2 ? bad : keep).push(t);
    const edgeCount = new Map<string, [number, number]>();
    const seen = new Map<string, number>();
    for (const t of bad)
      for (const [u, v] of [
        [t.a, t.b],
        [t.b, t.c],
        [t.c, t.a],
      ]) {
        const key = u < v ? `${u},${v}` : `${v},${u}`;
        seen.set(key, (seen.get(key) ?? 0) + 1);
        edgeCount.set(key, [u, v]);
      }
    for (const [key, [u, v]] of edgeCount) if (seen.get(key) === 1) keep.push(make(u, v, i));
    tris = keep;
  }
  const edges = new Map<string, [number, number]>();
  for (const t of tris)
    for (const [u, v] of [
      [t.a, t.b],
      [t.b, t.c],
      [t.c, t.a],
    ]) {
      if (u >= n || v >= n) continue;
      const key = u < v ? `${u},${v}` : `${v},${u}`;
      edges.set(key, u < v ? [u, v] : [v, u]);
    }
  return [...edges.values()];
}

function makeNode(p: Pt, region: Region, rand: () => number, hub = false): Node {
  return {
    x: p.x,
    y: p.y,
    region,
    phase: rand() * Math.PI * 2,
    speed: 0.6 + rand() * 1.6,
    size: hub ? 1.9 + rand() * 0.5 : 0.5 + rand() * 0.8,
    star: !hub && rand() < 0.06,
    hub,
  };
}

// ---------------------------------------------------------------- figures

function keypoints(sex: "male" | "female", facesRight: boolean): Keypoints {
  const m = sex === "male";
  const dir = facesRight ? 1 : -1;
  const R = (x: number, y: number): Pt => ({ x, y });
  const shoulderR = m ? R(0.13, 0.198) : R(0.113, 0.203);
  const elbowR = m ? R(0.14, 0.378) : R(0.128, 0.377);
  const wristR = m ? R(0.157, 0.498) : R(0.147, 0.495);
  const handR = m ? R(0.163, 0.55) : R(0.152, 0.545);
  const hipR = m ? R(0.058, 0.505) : R(0.06, 0.505);
  const kneeR = m ? R(0.05, 0.725) : R(0.044, 0.73);
  const ankleR = m ? R(0.044, 0.945) : R(0.038, 0.945);
  const footR = m ? R(0.054, 0.985) : R(0.046, 0.985);
  return {
    head: { x: -0.002 * dir, y: m ? 0.056 : 0.06 },
    headRx: m ? 0.046 : 0.042,
    headRy: m ? 0.056 : 0.052,
    mouth: { x: (m ? 0.044 : 0.039) * dir, y: m ? 0.094 : 0.091 },
    neck: { x: 0, y: 0.14 },
    shoulderR,
    shoulderL: mirror(shoulderR),
    elbowR,
    elbowL: mirror(elbowR),
    wristR,
    wristL: mirror(wristR),
    handR,
    handL: mirror(handR),
    chestX: m ? 0.1 : 0.092,
    hipR,
    hipL: mirror(hipR),
    kneeR,
    kneeL: mirror(kneeR),
    ankleR,
    ankleL: mirror(ankleR),
    footR,
    footL: mirror(footR),
    thighR: m ? 0.038 : 0.04,
    shinR: m ? 0.024 : 0.022,
    upperArmR: m ? 0.022 : 0.018,
    forearmR: m ? 0.019 : 0.016,
  };
}

export function buildFigure(sex: "male" | "female"): Figure {
  const D = sex === "male" ? MALE : FEMALE;
  // The two figures turn toward each other: the man (left) faces right.
  const facesRight = sex === "male";
  const rand = rng(sex === "male" ? 7 : 11);
  const kp = keypoints(sex, facesRight);
  const flip = (p: Pt) => (facesRight ? p : mirror(p));

  // Silhouette: head, then the body loop starting at the throat side.
  const half = D.half.map(([x, y]) => ({ x, y }));
  const halfArm = D.half.map((t) => t[2] === "a");
  const bodyLoop = [...half, ...half.slice(0, -1).reverse().map(mirror)];
  const loopArm = [...halfArm, ...halfArm.slice(0, -1).reverse()];
  const head = D.head.map(P).map(flip);
  const body = facesRight ? bodyLoop : [...bodyLoop].reverse();
  const bodyArm = facesRight ? loopArm : [...loopArm].reverse();
  const contourRaw = [...head, ...body.slice(1)];
  const rawArm = [...head.map(() => false), ...bodyArm.slice(1)];
  const smoothed = smoothWithSource(contourRaw, 0.004, true);
  const contour = smoothed.pts;
  const hitTest = smooth(contourRaw, 0.01, true);

  const bunC = facesRight ? { x: BUN.cx, y: BUN.cy } : { x: -BUN.cx, y: BUN.cy };
  const bunPts =
    sex === "female"
      ? Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          return { x: bunC.x + BUN.r * Math.cos(a), y: bunC.y + BUN.r * Math.sin(a) };
        })
      : null;

  const armR = D.half.filter((t) => t[2] === "a").map(([x, y]) => ({ x, y }));
  const armL = armR.map(mirror);
  const inside = (p: Pt) =>
    inPoly(p, hitTest) || (!!bunPts && Math.hypot(p.x - bunC.x, p.y - bunC.y) < BUN.r);
  const bodyRegion = (p: Pt): Region => {
    if (p.y < 0.135) return "head";
    if (p.y > 0.535) return p.x < 0 ? "legL" : "legR";
    return "torso";
  };
  const regionOf = (p: Pt): Region => {
    if (inPoly(p, armR)) return "armR";
    if (inPoly(p, armL)) return "armL";
    return bodyRegion(p);
  };
  // Outline points take the arm/body side of the drawing they came from, so
  // an edge never flickers between swinging with the arm and staying put.
  const outlineRegions = contour.map((p, i): Region => {
    const s0 = smoothed.src[i];
    const isArm = rawArm[s0] && rawArm[(s0 + 1) % contourRaw.length];
    return isArm ? (p.x < 0 ? "armL" : "armR") : bodyRegion(p);
  });
  const line = (pts: Pt[]): Line => ({ pts, regions: pts.map(regionOf) });

  const features: Line[] = [
    ...D.paired.flatMap((l) => {
      const r = smooth(l.map(P), 0.004, false);
      return [line(r), line(r.map(mirror))];
    }),
    ...D.centre.map((l) => line(smooth(l.map(P), 0.004, false))),
    ...D.face.map((l) => line(smooth(l.map(P).map(flip), 0.004, false))),
  ];

  // Nodes: landmark hubs, then contour lines, outline, and the interior.
  const nodes: Node[] = [];
  const grid = new Map<string, number[]>();
  const cell = 0.03;
  const key = (x: number, y: number) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  const tooClose = (p: Pt, d: number) => {
    const gx = Math.floor(p.x / cell);
    const gy = Math.floor(p.y / cell);
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (const k of grid.get(`${gx + i},${gy + j}`) ?? [])
          if (Math.hypot(nodes[k].x - p.x, nodes[k].y - p.y) < d) return true;
    return false;
  };
  const add = (p: Pt, hub = false, minGap = 0) => {
    if (minGap && tooClose(p, minGap)) return;
    const k = key(p.x, p.y);
    grid.set(k, [...(grid.get(k) ?? []), nodes.length]);
    nodes.push(makeNode(p, regionOf(p), rand, hub));
  };

  for (const h of D.hubsPaired) {
    add(P(h), true);
    add(mirror(P(h)), true);
  }
  for (const h of D.hubsCentre) add(P(h), true);
  for (const f of features) for (const p of spaced(f.pts, 0.02, false)) add(p, false, 0.012);
  for (const p of spaced(contour, 0.016, true)) add(p, false, 0.011);
  if (bunPts) for (const p of spaced(bunPts, 0.016, true)) add(p, false, 0.011);
  for (let tries = 0; tries < 16000; tries++) {
    const p = { x: -0.2 + rand() * 0.4, y: rand() };
    if (inside(p) && !tooClose(p, 0.021)) add(p);
  }

  // Mesh: Delaunay, keeping only short edges that stay inside the body.
  const edges = delaunayEdges(nodes).filter(([a, b]) => {
    const A = nodes[a];
    const B = nodes[b];
    if (Math.hypot(A.x - B.x, A.y - B.y) > 0.05) return false;
    return inside({ x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 });
  });

  // Brain: a denser cluster in the cranium.
  const brain: Node[] = [];
  const bc = { x: kp.head.x, y: kp.head.y - kp.headRy * 0.2 };
  const brx = kp.headRx * 0.8;
  const bry = kp.headRy * 0.62;
  for (let tries = 0; tries < 4000 && brain.length < 60; tries++) {
    const p = { x: bc.x + (rand() * 2 - 1) * brx, y: bc.y + (rand() * 2 - 1) * bry };
    const inBrain = ((p.x - bc.x) / brx) ** 2 + ((p.y - bc.y) / bry) ** 2 <= 1;
    if (inBrain && !brain.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 0.0075))
      brain.push(makeNode(p, "head", rand));
  }
  const brainEdges = delaunayEdges(brain).filter(
    ([a, b]) => Math.hypot(brain[a].x - brain[b].x, brain[a].y - brain[b].y) < 0.025,
  );

  return {
    sex,
    kp,
    outline: { pts: contour, regions: outlineRegions },
    bun: bunPts ? line(smooth(bunPts, 0.004, true)) : null,
    features,
    nodes,
    edges,
    brain,
    brainEdges,
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

// ---------------------------------------------------------------- lungs

/** Lung outline in local units: x = -1 lateral … +1 medial, y = -1 apex … +1 base. */
const LUNG_RIGHT: XY[] = [
  [0.15, -1],
  [-0.25, -0.85],
  [-0.6, -0.45],
  [-0.85, 0.1],
  [-0.95, 0.55],
  [-0.88, 0.9],
  [-0.6, 0.98],
  [-0.2, 0.88],
  [0.25, 0.82],
  [0.62, 0.9],
  [0.72, 0.6],
  [0.64, 0.25],
  [0.56, -0.1],
  [0.5, -0.5],
  [0.4, -0.85],
];
/** The left lung has a notch on its medial side where the heart sits. */
const LUNG_LEFT: XY[] = [
  [0.15, -1],
  [-0.25, -0.85],
  [-0.6, -0.45],
  [-0.85, 0.1],
  [-0.95, 0.55],
  [-0.88, 0.9],
  [-0.6, 0.98],
  [-0.2, 0.9],
  [0.2, 0.85],
  [0.48, 0.8],
  [0.3, 0.55],
  [0.22, 0.3],
  [0.42, 0.05],
  [0.5, -0.4],
  [0.4, -0.85],
];

export type Lung = {
  side: -1 | 1;
  cx: number;
  cy: number;
  w: number;
  h: number;
  outline: Pt[];
  fissures: Pt[][];
};

function lung(side: -1 | 1, cx: number, cy: number, w: number, h: number): Lung {
  // Local → figure: medial (+x local) points toward the midline.
  const to = ([lx, ly]: XY): Pt => ({ x: cx + lx * (w / 2) * -side, y: cy + ly * (h / 2) });
  const outline = smooth((side < 0 ? LUNG_RIGHT : LUNG_LEFT).map(to), 0.003, true);
  const oblique: XY[] = [
    [0.45, -0.5],
    [-0.1, 0.05],
    [-0.55, 0.45],
    [-0.88, 0.7],
  ];
  const horizontal: XY[] = [
    [-0.78, -0.05],
    [-0.2, -0.06],
    [0.5, -0.02],
  ];
  const fissures = [smooth(oblique.map(to), 0.003, false)];
  if (side < 0) fissures.push(smooth(horizontal.map(to), 0.003, false));
  return { side, cx, cy, w, h, outline, fissures };
}

export type Branch = { a: Pt; b: Pt; depth: number };

/** A branching airway tree inside one lung. */
function airwayTree(L: Lung, start: Pt, rand: () => number) {
  const branches: Branch[] = [];
  const leaves: Pt[] = [];
  const routes: Pt[][] = [];
  const grow = (p: Pt, angle: number, len: number, depth: number, route: Pt[]) => {
    const b = { x: p.x + Math.cos(angle) * len, y: p.y + Math.sin(angle) * len };
    if (depth > 0 && !inPoly(b, L.outline)) {
      leaves.push(p);
      routes.push(route);
      return;
    }
    branches.push({ a: p, b, depth });
    const next = [...route, b];
    if (depth >= 7) {
      leaves.push(b);
      routes.push(next);
      return;
    }
    const spread = 0.32 + rand() * 0.28;
    grow(b, angle - spread, len * (0.68 + rand() * 0.1), depth + 1, next);
    grow(b, angle + spread, len * (0.68 + rand() * 0.1), depth + 1, next);
  };
  // Main bronchus heads down and out toward the lung's hilum.
  const hilum = { x: L.cx + (L.w / 2) * 0.45 * -L.side, y: L.cy - L.h * 0.05 };
  branches.push({ a: start, b: hilum, depth: 0 });
  // Direction from (lateral, down) components; lateral is outward for this lung.
  const ang = (lateral: number, down: number) => Math.atan2(down, lateral * L.side);
  grow(hilum, ang(0.75, 0.65), L.h * 0.17, 1, [start, hilum]); // lower lobe, outward
  grow(hilum, ang(0.15, 1), L.h * 0.2, 1, [start, hilum]); // lower lobe, down
  grow(hilum, ang(0.85, 0.05), L.h * 0.14, 1, [start, hilum]); // middle
  grow(hilum, ang(0.55, -0.85), L.h * 0.16, 1, [start, hilum]); // upper lobe
  // Air sacs scattered through the tissue.
  const sacs: Pt[] = [];
  for (let tries = 0; tries < 2000 && sacs.length < 70; tries++) {
    const p = { x: L.cx + (rand() - 0.5) * L.w, y: L.cy + (rand() - 0.5) * L.h };
    if (inPoly(p, L.outline)) sacs.push(p);
  }
  return { branches, leaves, routes, sacs };
}

// ---------------------------------------------------------------- systems

/** Everything each system view needs, placed from a figure's keypoints. */
export function systemGeometry(f: Figure) {
  const kp = f.kp;
  const rand = rng(f.sex === "male" ? 31 : 37);
  const heart = { x: 0.012, y: 0.258, h: f.sex === "male" ? 0.084 : 0.077 };
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
  const spineTop = { x: kp.head.x * 0.5, y: kp.head.y + kp.headRy * 0.6 };
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

  // Cardiovascular: arteries from the aortic arch to head, arms and legs.
  const arch = { x: 0.01, y: heart.y - heart.h * 0.62 };
  const vArms = limbs(arch, arch);
  const vLegs = legs({ x: 0, y: 0.47 });
  const arteries = [
    path([
      arch,
      { x: 0.014, y: 0.14 },
      { x: 0.016, y: kp.head.y + 0.03 },
      { x: 0.012, y: kp.head.y - 0.015 },
    ]),
    path([
      arch,
      { x: -0.014, y: 0.14 },
      { x: -0.016, y: kp.head.y + 0.03 },
      { x: -0.012, y: kp.head.y - 0.015 },
    ]),
    path(vArms.armL),
    path(vArms.armR),
    path([arch, { x: 0.006, y: 0.33 }, ...vLegs.legL]),
    path([arch, { x: 0.006, y: 0.33 }, ...vLegs.legR]),
  ];

  // Respiratory: anatomical lungs, trachea and a branching airway tree.
  const lungs = [
    lung(-1, -0.049, 0.262, f.sex === "male" ? 0.084 : 0.074, f.sex === "male" ? 0.148 : 0.134),
    lung(1, 0.051, 0.266, f.sex === "male" ? 0.08 : 0.07, f.sex === "male" ? 0.142 : 0.128),
  ];
  const carina = { x: 0, y: 0.203 };
  const trachea = path([{ x: 0, y: 0.128 }, carina]);
  const airIn = path([kp.mouth, { x: kp.mouth.x * 0.4, y: 0.112 }, { x: 0, y: 0.128 }, carina]);
  const trees = lungs.map((L) => airwayTree(L, carina, rand));

  // Digestive: mouth, oesophagus, stomach, small intestine coil, colon.
  const coil: Pt[] = [];
  for (let i = 0; i <= 64; i++) {
    const u = i / 64;
    coil.push({
      x: 0.032 * Math.sin(u * Math.PI * 7) * (0.75 + 0.25 * Math.sin(u * Math.PI)),
      y: 0.375 + u * 0.075,
    });
  }
  const gut = path([
    kp.mouth,
    { x: kp.mouth.x * 0.4, y: 0.112 },
    { x: 0, y: 0.2 },
    { x: 0.008, y: 0.29 },
    { x: 0.035, y: 0.3 },
    { x: 0.055, y: 0.318 },
    { x: 0.048, y: 0.342 },
    { x: 0.02, y: 0.35 },
    { x: 0, y: 0.366 },
    ...coil,
    { x: -0.048, y: 0.474 },
    { x: -0.058, y: 0.43 },
    { x: -0.056, y: 0.39 },
    { x: -0.043, y: 0.37 },
    { x: 0, y: 0.364 },
    { x: 0.043, y: 0.37 },
    { x: 0.056, y: 0.39 },
    { x: 0.058, y: 0.43 },
    { x: 0.052, y: 0.474 },
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
    const bi = mid(sh, el, 0.5);
    const fo = mid(el, wr, 0.38);
    const q = mid(hp, kn, 0.5);
    const c = mid(kn, an, 0.3);
    muscles.push(
      { cx: s * kp.chestX * 0.45, cy: 0.238, rx: kp.chestX * 0.42, ry: 0.03, a: s * 0.15 },
      { cx: sh.x + s * 0.008, cy: sh.y + 0.01, rx: 0.021, ry: 0.032, a: s * 0.2 },
      { cx: bi.x, cy: bi.y, rx: kp.upperArmR * 0.95, ry: 0.06, a: along(sh, el) },
      { cx: fo.x, cy: fo.y, rx: kp.forearmR * 0.95, ry: 0.05, a: along(el, wr) },
      { cx: q.x + s * 0.008, cy: q.y, rx: kp.thighR * 0.95, ry: 0.1, a: along(hp, kn) },
      { cx: c.x + s * 0.006, cy: c.y + 0.02, rx: kp.shinR * 1.05, ry: 0.065, a: along(kn, an) },
    );
  }
  for (const y of [0.315, 0.346, 0.378])
    for (const s of [-1, 1]) muscles.push({ cx: s * 0.017, cy: y, rx: 0.014, ry: 0.013, a: 0 });
  const bones = [
    path([
      { x: 0, y: kp.head.y + kp.headRy * 0.8 },
      { x: 0, y: 0.5 },
    ]),
    path([kp.shoulderL, { x: 0, y: 0.176 }, kp.shoulderR]),
    path([kp.shoulderL, kp.elbowL, kp.wristL]),
    path([kp.shoulderR, kp.elbowR, kp.wristR]),
    path([kp.hipL, { x: 0, y: 0.49 }, kp.hipR]),
    path([kp.hipL, kp.kneeL, kp.ankleL]),
    path([kp.hipR, kp.kneeR, kp.ankleR]),
  ];

  // Endocrine glands.
  const glands = [
    { x: kp.head.x, y: kp.head.y + 0.006, r: 0.011 }, // pituitary / hypothalamus
    { x: 0, y: 0.152, r: 0.012 }, // thyroid
    { x: 0, y: 0.205, r: 0.01 }, // thymus
    { x: 0.016, y: 0.356, r: 0.012 }, // pancreas
    { x: -0.034, y: 0.37, r: 0.009 }, // adrenals
    { x: 0.034, y: 0.37, r: 0.009 },
    ...(f.sex === "male"
      ? [
          { x: -0.016, y: 0.54, r: 0.01 }, // testes
          { x: 0.016, y: 0.54, r: 0.01 },
        ]
      : [
          { x: -0.05, y: 0.455, r: 0.01 }, // ovaries
          { x: 0.05, y: 0.455, r: 0.01 },
        ]),
  ];

  return {
    heart,
    nerves,
    arteries,
    lungs,
    trachea,
    airIn,
    trees,
    gut,
    stomach,
    muscles,
    bones,
    glands,
  };
}
