import { describe, expect, it } from 'vitest';
import { activeGroundFade, firingStep, residualFade, warningArrowFrame } from './exaAnimation';

describe('warningArrowFrame', () => {
  it('starts each volley with only the leading V available', () => {
    expect(warningArrowFrame(0, 0)).toMatchObject({ visible: true, opacity: 0 });
    expect(warningArrowFrame(0, 1)).toMatchObject({ visible: false, opacity: 0 });
    expect(warningArrowFrame(0, 2)).toMatchObject({ visible: false, opacity: 0 });
  });

  it('repeats the same V sweep three times', () => {
    const first = warningArrowFrame(0.12, 0);
    const second = warningArrowFrame(0.12 + 1 / 3, 0);
    const third = warningArrowFrame(0.12 + 2 / 3, 0);
    expect(second.zOffset).toBeCloseTo(first.zOffset, 10);
    expect(third.zOffset).toBeCloseTo(first.zOffset, 10);
    expect(second.opacity).toBeCloseTo(first.opacity, 10);
    expect(third.opacity).toBeCloseTo(first.opacity, 10);
  });

  it('keeps delayed trails behind the leading V during travel', () => {
    const head = warningArrowFrame(0.1, 0);
    const trail1 = warningArrowFrame(0.1, 1);
    const trail2 = warningArrowFrame(0.1, 2);
    expect(head.zOffset).toBeGreaterThan(trail1.zOffset);
    expect(trail1.zOffset).toBeGreaterThan(trail2.zOffset);
  });
});

describe('firing animation', () => {
  it('maps normalized progress onto seven firing steps', () => {
    expect(firingStep(0)).toEqual({ index: 0, progress: 0 });
    expect(firingStep(0.15).index).toBe(1);
    expect(firingStep(1).index).toBe(6);
  });

  it('fades the full ground surface instead of leaving only the rim', () => {
    expect(activeGroundFade(0)).toEqual({ fill: 1, rim: 1, surface: 1 });
    expect(activeGroundFade(1)).toEqual({ fill: 0.08, rim: 0.04, surface: 0.1 });
    expect(residualFade(0)).toBe(1);
    expect(residualFade(0.45)).toBe(0);
  });
});
