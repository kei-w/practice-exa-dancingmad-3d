import { describe, expect, it } from 'vitest';
import { HIT_TIMING_LEAD } from '../config';
import { hitByVolley, hitStepFromProgress, shotCenter, SPREAD_OFFSETS, timingFromProgress, type Volley } from './lanes';

const volley: Volley = { source: 'NW', spread: 'center' };

describe('exa hit timing', () => {
  it('preserves the configured two-timing lead', () => {
    for (const progress of [0, 0.15, 0.35, 0.7, 0.99]) {
      expect(hitStepFromProgress(progress)).toBe(timingFromProgress(progress) + HIT_TIMING_LEAD - 1);
    }
  });

  it('judges the advanced center instead of the displayed first center', () => {
    const offset = SPREAD_OFFSETS.center[0];
    const displayed = shotCenter(volley, offset, 0);
    const judged = shotCenter(volley, offset, hitStepFromProgress(0));
    expect(hitByVolley(judged, volley, 0)).toBe(true);
    expect(hitByVolley(displayed, volley, 0)).toBe(false);
  });

  it('keeps travel exactly diagonal', () => {
    const offset = SPREAD_OFFSETS.center[0];
    const from = shotCenter(volley, offset, 0);
    const to = shotCenter(volley, offset, 1);
    expect(Math.abs(to.x - from.x)).toBeCloseTo(Math.abs(to.z - from.z), 10);
  });
});
