import { useEffect, useRef, useState } from "react";
import {
  buildFigure,
  pointAt,
  rng,
  systemGeometry,
  type Figure,
  type Keypoints,
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

type Geo = ReturnType<typeof systemGeometry> & { lungDots: Pt[][] };

function buildScene() {
  const figs = [buildFigure("male"), buildFigure("female")];
  const geos: Geo[] = figs.map((f, i) => {
    const r = rng(101 + i);
    const g = systemGeometry(f);
    const lungDots = g.lungs.map(() => {
      const out: Pt[] = [];
      while (out.length < 22) {
        const p = { x: r() * 2 - 1, y: r() * 2 - 1 };
        if (p.x * p.x + p.y * p.y < 0.85) out.push(p);
      }
      return out;
    });
    return { ...g, lungDots };
  });
  return { figs, geos };
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

        // Baseline constellation.
        ctx.strokeStyle = rgba(WHITE, 0.13 * base);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (const [a, b] of fig.edges) {
          ctx.moveTo(pts[a].x, pts[a].y);
          ctx.lineTo(pts[b].x, pts[b].y);
        }
        ctx.stroke();
        fig.nodes.forEach((n, i) => {
          const tw = reduce ? 0.7 : 0.5 + 0.5 * Math.sin(t * n.speed + n.phase);
          const r = n.size * (0.85 + 0.45 * tw) * px * 1.6;
          dot(ctx, WHITE, pts[i].x, pts[i].y, r, (0.3 + 0.7 * tw) * base);
          if (n.star) drawGlow(ctx, WHITE, pts[i].x, pts[i].y, r * 9, 0.35 * tw * base);
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
          const s = P.h * 0.0019 * (1 + 0.18 * beat);
          drawGlow(ctx, c, hp.x, hp.y, P.h * (0.12 + 0.07 * beat), (0.5 + 0.45 * beat) * ac);
          ctx.save();
          ctx.translate(hp.x, hp.y);
          ctx.scale(s, s);
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const a = (i / 60) * Math.PI * 2;
            const x = 16 * Math.sin(a) ** 3;
            const y = -(
              13 * Math.cos(a) -
              5 * Math.cos(2 * a) -
              2 * Math.cos(3 * a) -
              Math.cos(4 * a)
            );
            if (i) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
          }
          ctx.closePath();
          const g = ctx.createRadialGradient(-4, -4, 1, 0, 0, 18);
          g.addColorStop(0, rgba([255, 190, 195], 0.85 * ac));
          g.addColorStop(1, rgba(c, 0.45 * ac));
          ctx.fillStyle = g;
          ctx.fill();
          ctx.lineWidth = 1 / s;
          ctx.strokeStyle = rgba(WHITE, 0.6 * ac);
          ctx.stroke();
          ctx.restore();
        }

        // ------------------------------------------------ Respiratory
        const ar = amp.resp;
        if (ar > 0.01) {
          const c = SYSTEMS[2].rgb;
          const inflate = 1 + 0.09 * pose.breath;
          const inhaling = Math.cos((2 * Math.PI * t) / BREATH_SECONDS) > 0;
          ctx.strokeStyle = rgba(c, 0.5 * ar);
          ctx.lineWidth = 1;
          for (const p of [geo.airway, ...geo.bronchi]) strokePath(ctx, p.pts.map(at));
          geo.lungs.forEach((L, li) => {
            const centre = at({ x: L.cx, y: L.cy });
            const rx = L.rx * P.h * inflate;
            const ry = L.ry * P.h * inflate;
            ctx.beginPath();
            ctx.ellipse(centre.x, centre.y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = rgba(c, 0.1 * ar);
            ctx.fill();
            ctx.strokeStyle = rgba(c, 0.55 * ar);
            ctx.stroke();
            geo.lungDots[li].forEach((d, di) => {
              const tw = 0.5 + 0.5 * Math.sin(t * 2 + di);
              dot(
                ctx,
                c,
                centre.x + d.x * rx,
                centre.y + d.y * ry,
                (0.9 + tw * 0.8) * px,
                (0.4 + 0.5 * tw) * ar,
              );
            });
            drawGlow(ctx, c, centre.x, centre.y, rx * 3, 0.25 * ar * (0.8 + 0.2 * pose.breath));
          });
          for (const [pi, p] of [geo.airway, ...geo.bronchi].entries()) {
            for (let k = 0; k < 4; k++) {
              let f = (t * 0.45 + k / 4 + pi * 0.2) % 1;
              if (!inhaling) f = 1 - f;
              const q = at(pointAt(p, f));
              drawGlow(ctx, c, q.x, q.y, 8 * px, 0.8 * ar);
            }
          }
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
