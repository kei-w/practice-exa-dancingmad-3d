import type { Vec2 } from './lanes';

export type PracticeVolleyPhase = 'idle' | 'warning' | 'firing' | 'ended';

export interface VolleyStatus {
  phase: PracticeVolleyPhase;
  progress: number;
}

export interface VolleyTiming {
  countdownMs: number;
  warnMs: number;
  waveGapMs: number;
  resolveMs: number;
}

export function getVolleyStatus(index: number, elapsed: number, timing: VolleyTiming): VolleyStatus {
  const warnAt = timing.countdownMs + index * timing.waveGapMs;
  const fireAt = warnAt + timing.warnMs;
  const endAt = fireAt + timing.resolveMs;
  if (elapsed < warnAt) return { phase: 'idle', progress: 0 };
  if (elapsed < fireAt) return { phase: 'warning', progress: (elapsed - warnAt) / timing.warnMs };
  if (elapsed < endAt) return { phase: 'firing', progress: (elapsed - fireAt) / timing.resolveMs };
  return { phase: 'ended', progress: 1 };
}

export function getPracticeEndAt(volleyCount: number, timing: VolleyTiming): number {
  return timing.countdownMs + (volleyCount - 1) * timing.waveGapMs + timing.warnMs + timing.resolveMs;
}

export class PracticeSession {
  active = false;
  paused = false;
  finished = false;
  hits = 0;
  readonly pos: Vec2 = { x: 0, z: 0 };
  facing = Math.PI;
  private startedAt = 0;
  private pausedAt = 0;
  private tagged: boolean[] = [];

  start(volleyCount: number, now: number): void {
    this.active = true;
    this.paused = false;
    this.finished = false;
    this.hits = 0;
    this.tagged = Array.from({ length: volleyCount }, () => false);
    this.pos.x = 0;
    this.pos.z = 0;
    this.startedAt = now;
  }

  stop(resetFinished = false): void {
    this.active = false;
    this.paused = false;
    if (resetFinished) this.finished = false;
  }

  togglePause(now: number): void {
    if (!this.active) return;
    if (!this.paused) {
      this.paused = true;
      this.pausedAt = now;
      return;
    }
    this.startedAt += now - this.pausedAt;
    this.paused = false;
  }

  elapsed(now: number): number {
    return now - this.startedAt;
  }

  isTagged(index: number): boolean {
    return this.tagged[index] ?? false;
  }

  markHit(index: number): boolean {
    if (this.isTagged(index)) return false;
    this.tagged[index] = true;
    this.hits++;
    return true;
  }

  finish(): void {
    this.active = false;
    this.paused = false;
    this.finished = true;
  }

  move(direction: Vec2, dt: number, speed: number, maxRadius: number): void {
    const magnitude = Math.hypot(direction.x, direction.z);
    if (magnitude > 0.001) {
      const step = (speed * dt * Math.min(1, magnitude)) / 1000;
      this.pos.x += (direction.x / magnitude) * step;
      this.pos.z += (direction.z / magnitude) * step;
      this.facing = Math.atan2(direction.x, direction.z);
    }
    const radius = Math.hypot(this.pos.x, this.pos.z);
    if (radius > maxRadius) {
      this.pos.x *= maxRadius / radius;
      this.pos.z *= maxRadius / radius;
    }
  }
}
