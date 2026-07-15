import { describe, expect, it } from 'vitest';
import { ProblemHistory, rollVolleys } from './problem';

describe('rollVolleys', () => {
  it('alternates sources and uses each spread once per source', () => {
    const volleys = rollVolleys(() => 0);
    expect(volleys.map((volley) => volley.source)).toEqual(['NW', 'NE', 'NW', 'NE', 'NW', 'NE']);
    expect(
      volleys
        .filter((volley) => volley.source === 'NW')
        .map((volley) => volley.spread)
        .sort(),
    ).toEqual(['center', 'left', 'right']);
    expect(
      volleys
        .filter((volley) => volley.source === 'NE')
        .map((volley) => volley.spread)
        .sort(),
    ).toEqual(['center', 'left', 'right']);
  });
});

describe('ProblemHistory', () => {
  it('drops forward history when a new problem is added after going back', () => {
    const history = new ProblemHistory();
    history.push([{ source: 'NW', spread: 'left' }]);
    history.push([{ source: 'NE', spread: 'center' }]);
    expect(history.back()).toBe(true);
    history.push([{ source: 'NW', spread: 'right' }]);
    expect(history.number).toBe(2);
    expect(history.current).toEqual([{ source: 'NW', spread: 'right' }]);
  });
});
