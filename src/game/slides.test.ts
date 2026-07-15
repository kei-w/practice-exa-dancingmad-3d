import { describe, expect, it } from 'vitest';
import type { Volley } from './lanes';
import { makeSlides } from './slides';

const volleys: Volley[] = [
  { source: 'NW', spread: 'left' },
  { source: 'NE', spread: 'right' },
];

describe('makeSlides', () => {
  it('creates one preview page plus one page per volley', () => {
    const slides = makeSlides(volleys);
    expect(slides).toHaveLength(3);
    expect(slides[0]).toMatchObject({ title: '1回目の予兆', dangerIndex: null, warnTelegraph: volleys[0] });
    expect(slides[1]).toMatchObject({ title: '1回目の直線と2回目の予兆', dangerIndex: 0 });
    expect(slides[2]).toMatchObject({ title: '2回目の直線', dangerIndex: 1, warnTelegraph: null });
  });

  it('creates English slide titles and captions', () => {
    const slides = makeSlides(volleys, 'en');
    expect(slides[0]).toMatchObject({
      title: 'Wave 1 telegraph',
      bands: [{ caption: 'Telegraph: Wave 1: northwest, left' }],
    });
    expect(slides[1].title).toBe('Wave 1 line and wave 2 telegraph');
    expect(slides[2].title).toBe('Wave 2 line');
  });
});
