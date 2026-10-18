import { useEffect, useRef, useState } from "react";
import {
  buildFigure,
  pointAt,
  rng,
  systemGeometry,
  path,
  type Figure,
  type Keypoints,
  type Line,
  type Path,
  type Pt,
  type Region,
} from "./body";

/**
 * Home-page hero: a man and a woman drawn as glowing node constellations that
 * breathe, sway and twinkle. The six-node bar underneath highlights one body
 * system at a time with its own animation. On a visitor's first visit the
 * explorer tours all six once, then settles back to the baseline.
 */

export const SYSTEMS = [
  {
    id: "neuro",
    short: "Neuro",
    label: "Neuro",
    blurb: "Brain, spinal cord and nerves",
    rgb: [150, 220, 255],
  },
  {
    id: "cardio",
    short: "Cardio",
    label: "Cardio­vascular",
    blurb: "Heart and blood vessels",
    rgb: [255, 77, 94],
  },
  {
    id: "resp",
    short: "Lungs",
    label: "Respiratory",
    blurb: "Lungs and airways",
    rgb: [143, 211, 255],
  },
  {
    id: "digest",
    short: "Gut",
    label: "Digestive",
    blurb: "Stomach and intestines",
    rgb: [255, 179, 92],
  },
  {
    id: "musc",
    short: "Muscle",
    label: "Musculo­skeletal",
    blurb: "Muscles, bones and joints",
    rgb: [255, 122, 144],
  },
  {
    id: "endo",
    short: "Endo",
    label: "Endocrine",
    blurb: "Glands and hormones",
    rgb: [197, 155, 255],
  },
] as const;
export type SystemId = (typeof SYSTEMS)[number]["id"];

const TOUR_KEY = "moringa:anatomyTourSeen";
const TOUR_STEP_MS = 3000;
const BREATH_SECONDS = 4.8;

// ---------------------------------------------------------------- drawing helpers

type RGB = readonly [number, number, number] | readonly number[];
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a))})`;
const WHITE = [255, 255, 255] as const;

const spriteCache = new Map<string, HTMLCanvasElement>();
/** A soft round glow, drawn once per colour and reused with drawImage. */
function glow(c: RGB) {
  const key = c.join(",");
  let s = spriteCache.get(key);
  if (!s) {
    s = document.createElement("canvas");
    s.width = s.height = 64;
    const g = s.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, rgba(c, 1));
    grad.addColorStop(0.25, rgba(c, 0.45));
    grad.addColorStop(1, rgba(c, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    spriteCache.set(key, s);
  }
  return s;
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  c: RGB,
  x: number,
  y: number,
  size: number,
  alpha: number,
) {
  if (alpha <= 0.01 || size <= 0) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glow(c), x - size / 2, y - size / 2, size, size);
  ctx.globalAlpha = 1;
}

function dot(
  ctx: CanvasRenderingContext2D,
  c: RGB,
  x: number,
  y: number,
  r: number,
  alpha: number,
) {
  if (alpha <= 0.01) return;
  ctx.fillStyle = rgba(c, alpha);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Four-pointed twinkle. */
function star(
  ctx: CanvasRenderingContext2D,
  c: RGB,
  x: number,
  y: number,
  len: number,
  alpha: number,
) {
  if (alpha <= 0.01) return;
  ctx.strokeStyle = rgba(c, alpha);
  ctx.lineWidth = Math.max(0.6, len * 0.08);
  ctx.beginPath();
  ctx.moveTo(x - len, y);
  ctx.lineTo(x + len, y);
  ctx.moveTo(x, y - len);
  ctx.lineTo(x, y + len);
  ctx.stroke();
  drawGlow(ctx, c, x, y, len * 2.6, alpha * 0.8);
}

/** Heart-beat envelope: a strong "lub" then a softer "dub". */
function heartbeat(t: number) {
  const p = (t % 0.95) / 0.95;
  return Math.exp(-(((p - 0.06) / 0.045) ** 2)) + 0.6 * Math.exp(-(((p - 0.27) / 0.05) ** 2));
}

const ease = (f: number) => f * f * (3 - 2 * f);

// ---------------------------------------------------------------- scene

type Placed = { fig: Figure; cx: number; top: number; h: number; phase: number };
type Pose = { breath: number; sway: number; arm: number; head: number };

function poseAt(t: number, phase: number, still: boolean): Pose {
  if (still) return { breath: 0, sway: 0, arm: 0, head: 0 };
  return {
    breath: Math.sin((2 * Math.PI * t) / BREATH_SECONDS),
    sway: 0.005 * Math.sin(0.45 * t + phase),
    arm: 0.022 * Math.sin(0.7 * t + phase * 1.7),
    head: 0.0025 * Math.sin(0.9 * t + phase * 2.3),
  };
}

function regionFor(p: Pt, kp: Keypoints): Region {
  if (p.y < kp.neck.y - 0.01) return "head";
  if (p.y > 0.52) return p.x < 0 ? "legL" : "legR";
  if (Math.abs(p.x) > kp.shoulderR.x * 0.82) return p.x < 0 ? "armL" : "armR";
  return "torso";
}

/** Figure units → canvas pixels, including breathing, sway and arm swing. */
function project(P: Placed, pose: Pose, x: number, y: number, region: Region): Pt {
  const kp = P.fig.kp;
  if (region === "armL" || region === "armR") {
    const s = region === "armL" ? kp.shoulderL : kp.shoulderR;
    const a = region === "armL" ? -pose.arm : pose.arm;
    const dx = x - s.x;
    const dy = y - s.y;
    x = s.x + dx * Math.cos(a) - dy * Math.sin(a);
    y = s.y + dx * Math.sin(a) + dy * Math.cos(a);
  }
  const chest = Math.exp(-(((y - 0.27) / 0.12) ** 2));
  x *= 1 + 0.016 * pose.breath * chest;
  if (y < 0.55) y -= 0.0028 * pose.breath * (0.55 - y);
  x += pose.sway * (1 - y);
  if (region === "head") x += pose.head;
  return { x: P.cx + x * P.h, y: P.top + y * P.h };
}

function strokePath(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

type Geo = ReturnType<typeof systemGeometry> & { airPaths: Path[] };

function buildScene() {
  const figs = [buildFigure("male"), buildFigure("female")];
  const geos: Geo[] = figs.map((f, i) => {
    const r = rng(101 + i);
    const g = systemGeometry(f);
    // Air travels mouth → windpipe → a few routes down each airway tree.
    const airPaths = g.trees.flatMap((tree) =>
      Array.from({ length: 5 }, () => {
        const route = tree.routes[Math.floor(r() * tree.routes.length)];
        return path([...g.airIn.pts, ...route.slice(1)]);
      }),
    );
    return { ...g, airPaths };
  });
  return { figs, geos };
}

/** Project a whole line, honouring each point's region. */
function projectLine(P: Placed, pose: Pose, line: Line): Pt[] {
  return line.pts.map((p, i) => project(P, pose, p.x, p.y, line.regions[i]));
}

function tracePath(ctx: CanvasRenderingContext2D, pts: Pt[], closed: boolean) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  if (closed) ctx.closePath();
}

// ---------------------------------------------------------------- heart

type XY = [number, number];
const VENTRICLES: XY[] = [
  [-0.3, -0.25],
  [-0.46, -0.02],
  [-0.4, 0.25],
  [-0.15, 0.45],
  [0.12, 0.55],
  [0.32, 0.57],
  [0.42, 0.4],
  [0.44, 0.12],
  [0.36, -0.12],
  [0.18, -0.26],
  [-0.05, -0.3],
];
const LAD: XY[] = [
  [-0.04, -0.24],
  [0.04, 0.05],
  [0.18, 0.36],
  [0.3, 0.54],
];
const RCA: XY[] = [
  [-0.28, -0.22],
  [-0.42, 0.05],
  [-0.32, 0.32],
  [-0.12, 0.46],
];
const CIRC: XY[] = [
  [0.12, -0.24],
  [0.34, -0.06],
  [0.42, 0.22],
];

/** Smooth curve through local points (quadratic through midpoints). */
function curve(ctx: CanvasRenderingContext2D, pts: XY[], closed = false) {
  ctx.beginPath();
  const n = pts.length;
  if (closed) {
    const m0 = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
  } else {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
  }
}

function pointOn(pts: XY[], f: number): XY {
  const segs = pts.length - 1;
  const s = Math.min(segs - 1, Math.floor(f * segs));
  const u = f * segs - s;
  return [pts[s][0] + (pts[s + 1][0] - pts[s][0]) * u, pts[s][1] + (pts[s + 1][1] - pts[s][1]) * u];
}

/**
 * An anatomical heart in local units (1 = heart height, x toward the body's
 * left): ventricles with the apex down and out, the right atrium, left
 * auricle, aortic arch and its branches, pulmonary trunk, venae cavae and the
 * coronary arteries with blood moving along them.
 */
function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  unit: number,
  beat: number,
  t: number,
  a: number,
) {
  const k = unit * (1 + 0.075 * beat);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.12);
  ctx.scale(k, k);
  const px = 1 / k;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const tube = (pts: XY[], width: number, c: RGB, alpha: number) => {
    ctx.strokeStyle = rgba(c, alpha * a);
    ctx.lineWidth = width;
    curve(ctx, pts);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHITE, 0.28 * alpha * a);
    ctx.lineWidth = Math.max(px, width * 0.18);
    curve(
      ctx,
      pts.map(([px0, py0]) => [px0 - width * 0.22, py0] as XY),
    );
    ctx.stroke();
  };
  const blue = [112, 138, 214] as const;
  const purple = [138, 112, 240] as const;
  const red = [214, 38, 62] as const;

  // Veins and arteries behind the heart.
  tube(
    [
      [-0.37, -0.2],
      [-0.38, -0.55],
      [-0.36, -0.88],
    ],
    0.12,
    blue,
    0.65,
  ); // superior vena cava
  tube(
    [
      [-0.39, 0.16],
      [-0.42, 0.44],
    ],
    0.1,
    blue,
    0.5,
  ); // inferior vena cava
  tube(
    [
      [0.0, -0.66],
      [-0.05, -0.97],
    ],
    0.07,
    red,
    0.85,
  ); // brachiocephalic
  tube(
    [
      [0.13, -0.73],
      [0.13, -1.0],
    ],
    0.06,
    red,
    0.85,
  ); // left carotid
  tube(
    [
      [0.25, -0.69],
      [0.32, -0.95],
    ],
    0.06,
    red,
    0.85,
  ); // left subclavian
  tube(
    [
      [-0.04, -0.22],
      [-0.07, -0.5],
      [0.03, -0.71],
      [0.22, -0.73],
      [0.35, -0.57],
      [0.37, -0.3],
      [0.38, 0.02],
    ],
    0.17,
    red,
    0.92,
  ); // aorta
  tube(
    [
      [0.09, -0.18],
      [0.14, -0.4],
      [0.2, -0.5],
    ],
    0.15,
    purple,
    0.9,
  ); // pulmonary trunk
  tube(
    [
      [0.18, -0.46],
      [0.48, -0.45],
    ],
    0.09,
    purple,
    0.85,
  );
  tube(
    [
      [0.13, -0.44],
      [-0.16, -0.47],
    ],
    0.09,
    purple,
    0.75,
  );

  // Right atrium and left auricle.
  const atrium = ctx.createRadialGradient(-0.42, -0.16, 0.02, -0.38, -0.1, 0.24);
  atrium.addColorStop(0, rgba([255, 140, 150], 0.9 * a));
  atrium.addColorStop(1, rgba([150, 20, 40], 0.85 * a));
  ctx.fillStyle = atrium;
  ctx.beginPath();
  ctx.ellipse(-0.38, -0.1, 0.17, 0.22, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba([190, 40, 60], 0.9 * a);
  ctx.beginPath();
  ctx.ellipse(0.39, -0.2, 0.11, 0.065, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Ventricles with soft shading and a highlight.
  const body = ctx.createRadialGradient(-0.12, -0.08, 0.04, 0.02, 0.1, 0.72);
  body.addColorStop(0, rgba([255, 130, 140], 0.95 * a));
  body.addColorStop(0.55, rgba([205, 32, 55], 0.92 * a));
  body.addColorStop(1, rgba([110, 8, 28], 0.9 * a));
  ctx.fillStyle = body;
  curve(ctx, VENTRICLES, true);
  ctx.fill();
  ctx.strokeStyle = rgba([255, 190, 195], 0.55 * a);
  ctx.lineWidth = 1.2 * px;
  ctx.stroke();
  ctx.fillStyle = rgba(WHITE, 0.13 * a);
  ctx.beginPath();
  ctx.ellipse(-0.16, -0.08, 0.13, 0.07, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Coronary arteries, with blood pulses along them.
  for (const route of [LAD, RCA, CIRC]) {
    ctx.strokeStyle = rgba([255, 205, 175], 0.75 * a);
    ctx.lineWidth = 1.3 * px;
    curve(ctx, route);
    ctx.stroke();
    for (let i = 0; i < 2; i++) {
      const [qx, qy] = pointOn(route, (t * 0.7 + i / 2) % 1);
      drawGlow(ctx, [255, 220, 200], qx, qy, 9 * px, 0.9 * a);
    }
  }
  ctx.restore();
}
let sceneCache: ReturnType<typeof buildScene> | null = null;
const scene = () => (sceneCache ??= buildScene());

type Sparkle = { fig: number; node: number; born: number; brain: boolean };

// ---------------------------------------------------------------- component

export function AnatomyExplorer() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<SystemId | null>(null);
  const activeRef = useRef<SystemId | null>(null);
  activeRef.current = active;
  const tourTimers = useRef<number[]>([]);
  const drawOnce = useRef<() => void>(() => {});

  const stopTour = () => {
    tourTimers.current.forEach((id) => window.clearTimeout(id));
    tourTimers.current = [];
  };

  const select = (id: SystemId) => {
    stopTour();
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {
      /* storage unavailable: the tour may simply run again next visit */
    }
    setActive((cur) => (cur === id ? null : id));
  };

  // Render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { figs, geos } = scene();
    const amp: Record<string, number> = Object.fromEntries(SYSTEMS.map((s) => [s.id, 0]));
    const sparkles: Sparkle[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const t0 = last;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) render(0, 0);
    };

    const placed = (): Placed[] => {
      const fh = h * 0.9;
      return [
        { fig: figs[0], cx: w * 0.29, top: h * 0.035, h: fh, phase: 0 },
        { fig: figs[1], cx: w * 0.71, top: h * 0.035 + fh * 0.04, h: fh * 0.96, phase: 1.9 },
      ];
    };

    function render(t: number, dt: number) {
      const target = activeRef.current;
      for (const s of SYSTEMS) {
        const goal = s.id === target ? 1 : 0;
        amp[s.id] = reduce ? goal : amp[s.id] + (goal - amp[s.id]) * Math.min(1, dt * 3.2);
      }
      const focus = Math.max(...Object.values(amp));
      const base = 1 - 0.5 * focus;
      ctx.clearRect(0, 0, w, h);
      const places = placed();
      const px = h / 900; // size unit that scales with the canvas

      // New sparkles.
      if (!reduce && Math.random() < dt * 3.5) {
        const f = Math.floor(Math.random() * figs.length);
        sparkles.push({
          fig: f,
          node: Math.floor(Math.random() * figs[f].nodes.length),
          born: t,
          brain: false,
        });
      }
      if (!reduce && amp.neuro > 0.05 && Math.random() < dt * 14 * amp.neuro) {
        const f = Math.floor(Math.random() * figs.length);
        sparkles.push({
          fig: f,
          node: Math.floor(Math.random() * figs[f].brain.length),
          born: t,
          brain: true,
        });
      }
      while (sparkles.length && t - sparkles[0].born > 0.8) sparkles.shift();

      places.forEach((P, fi) => {
        const pose = poseAt(t, P.phase, reduce);
        const fig = P.fig;
        const geo = geos[fi];
        const at = (p: Pt) => project(P, pose, p.x, p.y, regionFor(p, fig.kp));
        const pts = fig.nodes.map((n) => project(P, pose, n.x, n.y, n.region));

        // Baseline: triangulated mesh, then the silhouette and anatomy lines.
        ctx.strokeStyle = rgba(WHITE, 0.15 * base);
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        for (const [a, b] of fig.edges) {
          ctx.moveTo(pts[a].x, pts[a].y);
          ctx.lineTo(pts[b].x, pts[b].y);
        }
        ctx.stroke();
        const outline = projectLine(P, pose, fig.outline);
        const bun = fig.bun ? projectLine(P, pose, fig.bun) : null;
        ctx.lineJoin = "round";
        for (const [width, alpha] of [
          [4.5 * px, 0.07],
          [1.15, 0.78],
        ] as const) {
          ctx.strokeStyle = rgba(WHITE, alpha * base);
          ctx.lineWidth = width;
          tracePath(ctx, outline, true);
          ctx.stroke();
          if (bun) {
            tracePath(ctx, bun, true);
            ctx.stroke();
          }
        }
        ctx.strokeStyle = rgba(WHITE, 0.42 * base);
        ctx.lineWidth = 0.8;
        for (const f of fig.features) {
          tracePath(ctx, projectLine(P, pose, f), false);
          ctx.stroke();
        }
        // Nodes, batched into a few brightness bands (one fill per band)
        // so hundreds of twinkling points stay cheap to draw.
        const BANDS = 5;
        const bands: Path2D[] = Array.from({ length: BANDS }, () => new Path2D());
        fig.nodes.forEach((n, i) => {
          const tw = reduce ? 0.7 : 0.5 + 0.5 * Math.sin(t * n.speed + n.phase);
          const r = n.size * (0.85 + 0.35 * tw) * px * 1.5;
          const level = n.hub ? 1 : 0.3 + 0.7 * tw;
          const band = bands[Math.min(BANDS - 1, Math.floor(level * BANDS))];
          band.moveTo(pts[i].x + r, pts[i].y);
          band.arc(pts[i].x, pts[i].y, r, 0, Math.PI * 2);
          if (n.hub) drawGlow(ctx, WHITE, pts[i].x, pts[i].y, r * 7, (0.35 + 0.3 * tw) * base);
          else if (n.star) drawGlow(ctx, WHITE, pts[i].x, pts[i].y, r * 9, 0.35 * tw * base);
        });
        bands.forEach((band, b) => {
          ctx.fillStyle = rgba(WHITE, ((b + 0.5) / BANDS) * base);
          ctx.fill(band);
        });
        for (const s of sparkles) {
          if (s.fig !== fi || s.brain) continue;
          const life = (t - s.born) / 0.8;
          star(
            ctx,
            WHITE,
            pts[s.node].x,
            pts[s.node].y,
            7 * px * Math.sin(Math.PI * life),
            0.9 * base,
          );
        }

        // ------------------------------------------------ Neuro
        const an = amp.neuro;
        if (an > 0.01) {
          const c = SYSTEMS[0].rgb;
          const bp = fig.brain.map((n) => project(P, pose, n.x, n.y, "head"));
          ctx.strokeStyle = rgba(c, 0.45 * an);
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          for (const [a, b] of fig.brainEdges) {
            ctx.moveTo(bp[a].x, bp[a].y);
            ctx.lineTo(bp[b].x, bp[b].y);
          }
          ctx.stroke();
          fig.brain.forEach((n, i) => {
            const tw = 0.5 + 0.5 * Math.sin(t * n.speed * 3 + n.phase);
            dot(ctx, c, bp[i].x, bp[i].y, (0.8 + tw) * px * 1.4, (0.4 + 0.6 * tw) * an);
          });
          drawGlow(ctx, c, bp[0]?.x ?? 0, at(fig.kp.head).y - 0.015 * P.h, 0.16 * P.h, 0.35 * an);
          for (const s of sparkles) {
            if (s.fig !== fi || !s.brain) continue;
            const life = (t - s.born) / 0.8;
            star(ctx, c, bp[s.node].x, bp[s.node].y, 6 * px * Math.sin(Math.PI * life), an);
          }
          geo.nerves.forEach((p: Path, pi) => {
            ctx.strokeStyle = rgba(c, 0.2 * an);
            ctx.lineWidth = 0.9;
            strokePath(ctx, p.pts.map(at));
            for (let k = 0; k < 3; k++) {
              const q = at(pointAt(p, (t * 0.32 + k / 3 + pi * 0.17) % 1));
              drawGlow(ctx, c, q.x, q.y, 12 * px, 0.9 * an);
              dot(ctx, WHITE, q.x, q.y, 1.3 * px, an);
            }
          });
        }

        // ------------------------------------------------ Cardiovascular
        const ac = amp.cardio;
        if (ac > 0.01) {
          const c = SYSTEMS[1].rgb;
          const beat = reduce ? 0.3 : heartbeat(t + fi * 0.13);
          geo.arteries.forEach((p: Path, pi) => {
            ctx.strokeStyle = rgba(c, (0.22 + 0.15 * beat) * ac);
            ctx.lineWidth = 1.1;
            strokePath(ctx, p.pts.map(at));
            for (let k = 0; k < 4; k++) {
              const f = (t * 0.42 + k / 4 + pi * 0.11 + 0.03 * beat) % 1;
              const q = at(pointAt(p, f));
              drawGlow(ctx, c, q.x, q.y, (9 + 6 * beat) * px, 0.85 * ac * (1 - f * 0.5));
              dot(ctx, c, q.x, q.y, 1.4 * px, ac);
            }
          });
          const hp = at(geo.heart);
          drawGlow(ctx, c, hp.x, hp.y, P.h * (0.15 + 0.06 * beat), (0.35 + 0.35 * beat) * ac);
          drawHeart(ctx, hp.x, hp.y, geo.heart.h * P.h, beat, t, ac);
        }

        // ------------------------------------------------ Respiratory
        const ar = amp.resp;
        if (ar > 0.01) {
          const c = SYSTEMS[2].rgb;
          const inhaling = Math.cos((2 * Math.PI * t) / BREATH_SECONDS) > 0;
          const carinaY = geo.trachea.pts[geo.trachea.pts.length - 1].y;
          // Lungs swell with the breath, a little more in height than width.
          const breathe = (p: Pt): Pt => {
            if (p.y <= carinaY) return p;
            const L = geo.lungs[p.x < 0 ? 0 : 1];
            return {
              x: L.cx + (p.x - L.cx) * (1 + 0.045 * pose.breath),
              y: L.cy + (p.y - L.cy) * (1 + 0.07 * pose.breath),
            };
          };
          const lat = (p: Pt) => at(breathe(p));
          const pink = [244, 168, 182] as const;

          // Windpipe with cartilage rings.
          const tr = geo.trachea.pts.map(at);
          ctx.lineCap = "round";
          ctx.strokeStyle = rgba(pink, 0.35 * ar);
          ctx.lineWidth = 0.014 * P.h;
          tracePath(ctx, tr, false);
          ctx.stroke();
          ctx.strokeStyle = rgba([255, 225, 230], 0.7 * ar);
          ctx.lineWidth = 0.9;
          const [ta, tb] = [tr[0], tr[tr.length - 1]];
          for (let i = 0; i <= 8; i++) {
            const yy = ta.y + ((tb.y - ta.y) * i) / 8;
            const xx = ta.x + ((tb.x - ta.x) * i) / 8;
            ctx.beginPath();
            ctx.moveTo(xx - 0.0068 * P.h, yy);
            ctx.lineTo(xx + 0.0068 * P.h, yy);
            ctx.stroke();
          }

          geo.lungs.forEach((L, li) => {
            const shape = L.outline.map(lat);
            const top = Math.min(...shape.map((p) => p.y));
            const bottom = Math.max(...shape.map((p) => p.y));
            const g = ctx.createLinearGradient(0, top, 0, bottom);
            g.addColorStop(0, rgba([250, 190, 200], 0.3 * ar));
            g.addColorStop(1, rgba([215, 105, 130], 0.32 * ar));
            ctx.fillStyle = g;
            tracePath(ctx, shape, true);
            ctx.fill();
            ctx.strokeStyle = rgba([255, 205, 215], 0.8 * ar);
            ctx.lineWidth = 1.1;
            ctx.stroke();
            ctx.strokeStyle = rgba([255, 200, 210], 0.45 * ar);
            ctx.lineWidth = 0.8;
            for (const fis of L.fissures) {
              tracePath(ctx, fis.map(lat), false);
              ctx.stroke();
            }
            // Airway tree: thick bronchi down to fine bronchioles.
            const tree = geo.trees[li];
            for (const b of tree.branches) {
              const A = lat(b.a);
              const B = lat(b.b);
              ctx.strokeStyle = rgba([235, 245, 255], (0.85 - b.depth * 0.1) * ar);
              ctx.lineWidth = Math.max(0.5, (2.8 - b.depth * 0.45) * px * 1.6);
              ctx.beginPath();
              ctx.moveTo(A.x, A.y);
              ctx.lineTo(B.x, B.y);
              ctx.stroke();
            }
            // Air sacs through the tissue and at the airway tips, twinkling as they fill.
            tree.sacs.forEach((sac, k) => {
              const q = lat(sac);
              const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + k * 2.1);
              dot(
                ctx,
                [255, 215, 222],
                q.x,
                q.y,
                (0.7 + 0.5 * tw) * px * 1.3,
                (0.25 + 0.45 * tw) * ar,
              );
            });
            tree.leaves.forEach((leaf, k) => {
              const q = lat(leaf);
              const tw = 0.5 + 0.5 * Math.sin(t * 2.4 + k * 1.3);
              const fill = 0.6 + 0.4 * pose.breath;
              drawGlow(ctx, pink, q.x, q.y, (5 + 3 * tw) * px * fill, 0.55 * ar);
              dot(ctx, WHITE, q.x, q.y, 1.1 * px, (0.5 + 0.5 * tw) * ar);
            });
          });

          // Air moving in on the inhale and out on the exhale.
          geo.airPaths.forEach((p, pi) => {
            for (let k = 0; k < 2; k++) {
              let f = (t * 0.32 + k / 2 + pi * 0.09) % 1;
              if (!inhaling) f = 1 - f;
              const q = lat(pointAt(p, f));
              drawGlow(ctx, c, q.x, q.y, 9 * px, 0.85 * ar);
              dot(ctx, WHITE, q.x, q.y, 1.1 * px, 0.9 * ar);
            }
          });
        }

        // ------------------------------------------------ Digestive
        const ad = amp.digest;
        if (ad > 0.01) {
          const c = SYSTEMS[3].rgb;
          const gp = geo.gut.pts.map(at);
          ctx.strokeStyle = rgba(c, 0.35 * ad);
          ctx.lineWidth = 1.6;
          ctx.lineJoin = "round";
          strokePath(ctx, gp);
          const st = at({ x: geo.stomach.cx, y: geo.stomach.cy });
          const churn = 1 + 0.07 * Math.sin(t * 3);
          ctx.beginPath();
          ctx.ellipse(
            st.x,
            st.y,
            geo.stomach.rx * P.h * churn,
            (geo.stomach.ry * P.h) / churn,
            -0.3,
            0,
            Math.PI * 2,
          );
          ctx.fillStyle = rgba(c, 0.18 * ad);
          ctx.fill();
          ctx.strokeStyle = rgba(c, 0.6 * ad);
          ctx.stroke();
          drawGlow(ctx, c, st.x, st.y, P.h * 0.08, 0.35 * ad);
          // A wave of contraction (peristalsis) followed by food particles.
          const wave = (t * 0.09) % 1;
          for (let k = -4; k <= 4; k++) {
            const q = at(pointAt(geo.gut, (wave + k * 0.006 + 1) % 1));
            drawGlow(ctx, c, q.x, q.y, 14 * px, (0.6 - Math.abs(k) * 0.12) * ad);
          }
          for (let k = 0; k < 9; k++) {
            const q = at(pointAt(geo.gut, (t * 0.05 + k / 9) % 1));
            dot(ctx, c, q.x, q.y, 1.6 * px, 0.9 * ad);
          }
        }

        // ------------------------------------------------ Musculoskeletal
        const am = amp.musc;
        if (am > 0.01) {
          const c = SYSTEMS[4].rgb;
          ctx.strokeStyle = rgba(WHITE, 0.28 * am);
          ctx.lineWidth = 1.4;
          ctx.lineCap = "round";
          for (const b of geo.bones) strokePath(ctx, b.pts.map(at));
          for (const m of geo.muscles) {
            const centre = at({ x: m.cx, y: m.cy });
            const flex = reduce ? 0.6 : 0.5 + 0.5 * Math.sin(t * 2.2 - m.cy * 9);
            ctx.save();
            ctx.translate(centre.x, centre.y);
            ctx.rotate(m.a);
            ctx.scale(m.rx * P.h * (1 + 0.06 * flex), m.ry * P.h);
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
            g.addColorStop(0, rgba(c, (0.35 + 0.45 * flex) * am));
            g.addColorStop(1, rgba(c, 0.05 * am));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // ------------------------------------------------ Endocrine
        const ae = amp.endo;
        if (ae > 0.01) {
          const c = SYSTEMS[5].rgb;
          geo.glands.forEach((gl, gi) => {
            const q = at(gl);
            const pulse = 0.5 + 0.5 * Math.sin(t * 2 + gi * 0.9);
            drawGlow(ctx, c, q.x, q.y, gl.r * P.h * (5 + 2 * pulse), (0.5 + 0.4 * pulse) * ae);
            dot(ctx, WHITE, q.x, q.y, 1.8 * px, ae);
            const ring = (t * 0.55 + gi * 0.17) % 1;
            ctx.strokeStyle = rgba(c, (1 - ring) * 0.55 * ae);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(q.x, q.y, gl.r * P.h * (1 + 5 * ring), 0, Math.PI * 2);
            ctx.stroke();
            // Hormones drifting out to the rest of the body.
            for (let k = 0; k < 3; k++) {
              const cyc = t * 0.3 + k / 3 + gi * 0.1;
              const f = cyc % 1;
              const target = pts[(Math.floor(cyc) * 37 + gi * 11 + k * 53) % pts.length];
              const x = q.x + (target.x - q.x) * ease(f);
              const y = q.y + (target.y - q.y) * ease(f);
              drawGlow(ctx, c, x, y, 7 * px, Math.sin(Math.PI * f) * 0.8 * ae);
            }
          });
        }
      });
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (visible && !document.hidden) render((now - t0) / 1000, dt);
      raf = requestAnimationFrame(frame);
    };

    drawOnce.current = () => {
      if (reduce) render(0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    resize();
    if (!reduce) raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  // Reduced motion draws one still frame per change instead of animating.
  useEffect(() => {
    drawOnce.current();
  }, [active]);

  // First visit: tour every system once, then return to the baseline.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (localStorage.getItem(TOUR_KEY)) return;
    } catch {
      return;
    }
    const steps = SYSTEMS.map((s, i) =>
      window.setTimeout(() => setActive(s.id), 1200 + i * TOUR_STEP_MS),
    );
    // Remember the tour only once it has played to the end (or the visitor
    // took over by clicking, see select()).
    steps.push(
      window.setTimeout(
        () => {
          setActive(null);
          try {
            localStorage.setItem(TOUR_KEY, "1");
          } catch {
            /* storage unavailable */
          }
        },
        1200 + SYSTEMS.length * TOUR_STEP_MS,
      ),
    );
    tourTimers.current = steps;
    return stopTour;
  }, []);

  const current = SYSTEMS.find((s) => s.id === active);

  return (
    <div ref={wrapRef} className="mx-auto w-full max-w-[560px]">
      <canvas
        ref={canvasRef}
        className="block aspect-[1/1.12] w-full"
        role="img"
        aria-label={
          current
            ? `Illustration of a man and a woman with the ${current.label.replace("­", "")} system highlighted`
            : "Illustration of a man and a woman drawn as networks of glowing points"
        }
      />
      <div className="relative mt-6">
        <div
          className="absolute left-[8.333%] right-[8.333%] top-[7px] h-px bg-white/25"
          aria-hidden
        />
        <ol className="relative grid grid-cols-6" aria-label="Body systems">
          {SYSTEMS.map((s) => {
            const on = s.id === active;
            return (
              <li key={s.id} className="flex justify-center">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => select(s.id)}
                  className="group flex w-full flex-col items-center gap-3 px-0.5 focus-visible:outline-none"
                >
                  <span
                    className="block h-[15px] w-[15px] rounded-full border transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-white/60"
                    style={{
                      borderColor: on ? rgba(s.rgb, 1) : "rgba(255,255,255,0.6)",
                      background: on ? rgba(s.rgb, 1) : "#000",
                      boxShadow: on ? `0 0 14px 2px ${rgba(s.rgb, 0.8)}` : "none",
                      transform: on ? "scale(1.25)" : "scale(1)",
                    }}
                  />
                  <span
                    className={`text-center text-[9px] uppercase leading-tight tracking-[0.12em] transition-colors sm:text-[10px] ${
                      on
                        ? "text-foreground"
                        : "text-muted-foreground [@media(hover:hover)]:group-hover:text-foreground"
                    }`}
                    style={{ hyphens: "manual" }}
                  >
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p
          aria-live="polite"
          className="mt-5 min-h-[1.25rem] text-center text-xs text-muted-foreground"
        >
          {current
            ? `${current.label.replace("­", "")} — ${current.blurb}`
            : "Select a system to explore"}
        </p>
      </div>
    </div>
  );
}
