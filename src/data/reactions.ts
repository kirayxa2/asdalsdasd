import type { JarState, Tag } from "../types";

export function jarHas(state: JarState, tag: Tag): boolean {
  return state.entries.some((e) => e.tags.includes(tag));
}

export function jarCount(state: JarState, tag: Tag): number {
  return state.entries.filter((e) => e.tags.includes(tag)).length;
}

/**
 * Pure function: recompute visual & chemistry state of the jar each tick.
 * Driven by the set of entries and whether the burner is on.
 */
export function recomputeJar(prev: JarState, burnerOn: boolean, dt: number): JarState {
  const next: JarState = { ...prev, entries: prev.entries.map((e) => ({ ...e })) };

  const hasOrganic = jarHas(next, "organic");
  const hasAcid = jarHas(next, "acid");
  const hasMetal = jarHas(next, "metal");
  const hasUranium = jarHas(next, "uranium");

  let targetBubbles = 0;
  let targetSmoke = 0;
  let targetSparks = 0;
  let targetGlow = 0;
  let dangerRate = -0.05;

  if (hasOrganic && hasAcid) targetBubbles = Math.max(targetBubbles, 0.9);
  if (hasOrganic && burnerOn) {
    targetSmoke = Math.max(targetSmoke, 0.85);
    dangerRate = Math.max(dangerRate, 0.05);
  }
  if (hasMetal && hasAcid) {
    targetSparks = Math.max(targetSparks, 0.7);
    targetSmoke = Math.max(targetSmoke, 0.5);
    dangerRate = Math.max(dangerRate, 0.04);
  }
  if (hasUranium) {
    targetGlow = 0.9;
    dangerRate = Math.max(dangerRate, hasAcid ? 0.18 : 0.07);
    if (burnerOn) dangerRate = Math.max(dangerRate, 0.35);
    if (hasOrganic) dangerRate = Math.max(dangerRate, 0.12);
  }

  if (burnerOn && next.entries.some((e) => e.kind === "liquid")) {
    targetBubbles = Math.max(targetBubbles, 0.35);
  }

  const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.min(1, k);
  const k = dt * 2.5;
  next.bubbles = lerp(next.bubbles, targetBubbles, k);
  next.smoke = lerp(next.smoke, targetSmoke, k);
  next.sparks = lerp(next.sparks, targetSparks, k);
  next.glow = lerp(next.glow, targetGlow, k);
  next.danger = Math.max(0, Math.min(1.2, next.danger + dangerRate * dt));

  // Liquid color: weighted by amount. Tinted by reactions.
  const liquids = next.entries.filter((e) => e.kind === "liquid" && e.amount > 0);
  let baseColor = liquids.length
    ? mixColorsWeighted(liquids.map((l) => [l.color, l.amount] as [string, number]))
    : "#1a1a1a";
  if (hasAcid && hasOrganic) baseColor = blendHex(baseColor, "#9aff5a", 0.35);
  if (hasOrganic && burnerOn) baseColor = blendHex(baseColor, "#1a0d05", 0.4);
  if (hasMetal && hasAcid) baseColor = blendHex(baseColor, "#8a3a1a", 0.3);
  if (hasUranium) baseColor = blendHex(baseColor, "#7aff4a", 0.45);
  next.liquidColor = baseColor;

  // Liquid level: sum of liquid amounts (each bottle = 0.20 of jar).
  const totalAmount = liquids.reduce((s, l) => s + l.amount, 0);
  const targetLevel = Math.min(0.95, 0.05 + totalAmount * 0.2);
  // Live pouring: snap to target very fast so player sees the pour visibly
  next.liquidLevel = lerp(next.liquidLevel, targetLevel, k * 2);

  // Decay solids in acid / fire
  for (const e of next.entries) {
    if (e.kind !== "solid") continue;
    let decay = 0;
    if (e.tags.includes("organic") && hasAcid) decay += 0.04;
    if (e.tags.includes("organic") && burnerOn) decay += 0.05;
    if (e.tags.includes("metal") && hasAcid) decay += 0.02;
    if (decay > 0) e.integrity = Math.max(0, e.integrity - decay * dt);
  }
  next.entries = next.entries.filter(
    (e) => (e.kind === "liquid" && e.amount > 0.01) || (e.kind === "solid" && e.integrity > 0.02),
  );

  next.shake = Math.max(0, next.shake - dt * 1.5);

  return next;
}

// ---- Color helpers ----
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
export function blendHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}
export function mixColorsWeighted(items: [string, number][]): string {
  if (!items.length) return "#000000";
  let r = 0, g = 0, b = 0, w = 0;
  for (const [c, weight] of items) {
    const [cr, cg, cb] = hexToRgb(c);
    r += cr * weight;
    g += cg * weight;
    b += cb * weight;
    w += weight;
  }
  if (w === 0) return "#000000";
  return rgbToHex(r / w, g / w, b / w);
}
