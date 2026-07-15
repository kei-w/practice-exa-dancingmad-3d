import { ARENA_R, HIT_TIMING_LEAD, LANE_W, SHOT_PATH_END, SHOT_PATH_START, SHOT_R, SHOT_STEPS } from '../config';

// エクサフレアの発生源（北西または北東の場外）
export type Source = 'NW' | 'NE';
// 2レーン同時攻撃のパターン（発生源に向かって左寄り/中央/右寄り）
export type Spread = 'left' | 'center' | 'right';

// 1ウェーブ = 発生源 × パターン
export interface Volley {
  source: Source;
  spread: Spread;
}

// world座標: x=東, z=南（原点=フィールド中心）
export interface Vec2 {
  x: number;
  z: number;
}

const D = Math.SQRT1_2;

// 弾の進行方向（NW発 → 南東へ、NE発 → 南西へ）
export const TRAVEL: Record<Source, Vec2> = {
  NW: { x: D, z: D },
  NE: { x: -D, z: D },
};

// レーンを横断する軸（進行方向と直交）。この軸上の座標でレーンを区別する
export const ACROSS: Record<Source, Vec2> = {
  NW: { x: D, z: -D },
  NE: { x: D, z: D },
};

// 参照動画の全6波をフィールド半径Rで正規化して追跡した、横断軸上の2円の中心位置。
// 中点は左=-0.34R、中央=0、右=+0.34Rとなり、全パターンで中央ターゲットサークルに重なる。
export const SPREAD_OFFSETS: Record<Spread, readonly [number, number]> = {
  left: [-ARENA_R * 0.85, ARENA_R * 0.17],
  center: [-ARENA_R * 0.55, ARENA_R * 0.55],
  right: [-ARENA_R * 0.17, ARENA_R * 0.85],
};

export function dot(p: Vec2, axis: Vec2): number {
  return p.x * axis.x + p.z * axis.z;
}

// 点がこのウェーブの攻撃レーン帯（直線の通り道）に入っているか
export function inVolleyLanes(p: Vec2, v: Volley): boolean {
  const off = dot(p, ACROSS[v.source]);
  return SPREAD_OFFSETS[v.spread].some((centerOffset) => Math.abs(off - centerOffset) <= LANE_W / 2);
}

// step番目の発動位置（進行軸上のスカラー。0=入口、最後=反対側の場外）
export function stepDistance(step: number): number {
  return SHOT_PATH_START + ((SHOT_PATH_END - SHOT_PATH_START) * step) / (SHOT_STEPS - 1);
}

// ウェーブvの横断軸位置・stepにおける着弾円の中心（world座標）
export function shotCenter(v: Volley, centerOffset: number, step: number): Vec2 {
  const a = ACROSS[v.source];
  const t = TRAVEL[v.source];
  const u = centerOffset;
  const s = stepDistance(step);
  return { x: a.x * u + t.x * s, z: a.z * u + t.z * s };
}

export function timingFromProgress(progress: number): number {
  return Math.floor(Math.min(Math.max(progress, 0), 0.999) * SHOT_STEPS);
}

export function hitStepFromProgress(progress: number): number {
  // 発動開始時点で判定は1回目の移動を終えているため、最初の判定ステップは1になる。
  return timingFromProgress(progress) + HIT_TIMING_LEAD - 1;
}

// 実際の着弾判定は表示位置の単純な先読みではなく、先行したタイミング列で1つずつ移動する
export function hitByVolley(p: Vec2, v: Volley, progress: number): boolean {
  const hitStep = hitStepFromProgress(progress);
  return SPREAD_OFFSETS[v.spread].some((centerOffset) => {
    const c = shotCenter(v, centerOffset, hitStep);
    return Math.hypot(p.x - c.x, p.z - c.z) <= SHOT_R;
  });
}
