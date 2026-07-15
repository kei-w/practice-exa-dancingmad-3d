import { describe, expect, it } from 'vitest';
import { getPracticeEndAt, getVolleyStatus, PracticeSession, type VolleyTiming } from './practiceSession';

const timing: VolleyTiming = { countdownMs: 3000, warnMs: 4000, waveGapMs: 2000, resolveMs: 5000 };

describe('practice timing', () => {
  it('calculates every volley phase from elapsed time', () => {
    expect(getVolleyStatus(1, 4999, timing)).toEqual({ phase: 'idle', progress: 0 });
    expect(getVolleyStatus(1, 7000, timing)).toEqual({ phase: 'warning', progress: 0.5 });
    expect(getVolleyStatus(1, 11000, timing)).toEqual({ phase: 'firing', progress: 0.4 });
    expect(getVolleyStatus(1, 14000, timing)).toEqual({ phase: 'ended', progress: 1 });
    expect(getPracticeEndAt(3, timing)).toBe(16000);
  });
});

describe('PracticeSession', () => {
  it('keeps elapsed time stable while paused', () => {
    const session = new PracticeSession();
    session.start(2, 1000);
    session.togglePause(3000);
    session.togglePause(8000);
    expect(session.elapsed(9000)).toBe(3000);
  });

  it('counts a hit only once per volley', () => {
    const session = new PracticeSession();
    session.start(2, 0);
    expect(session.markHit(0)).toBe(true);
    expect(session.markHit(0)).toBe(false);
    expect(session.hits).toBe(1);
  });

  it('moves within the arena boundary', () => {
    const session = new PracticeSession();
    session.start(1, 0);
    session.move({ x: 10, z: 0 }, 10000, 20, 46);
    expect(Math.hypot(session.pos.x, session.pos.z)).toBeCloseTo(46);
    expect(session.facing).toBeCloseTo(Math.PI / 2);
  });
});
