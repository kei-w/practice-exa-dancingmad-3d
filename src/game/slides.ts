import { type Locale, translate } from '../i18n/translations';
import type { Source, Spread, Volley } from './lanes';

// スライド上の帯の強調: line=直線攻撃（濃）、warn=予兆（薄）
export type BandEmphasis = 'line' | 'warn';

export interface SlideBand {
  volley: Volley;
  emphasis: BandEmphasis;
  caption: string;
}

export interface Slide {
  title: string;
  // このページで「直線」として踏んだら誤答になるウェーブ番号（予兆のみのページは null）
  dangerIndex: number | null;
  bands: SlideBand[];
  // 予兆円を描くウェーブ（最終ページは null）
  warnTelegraph: Volley | null;
}

const sourceKeys: Record<Source, 'sourceNW' | 'sourceNE'> = { NW: 'sourceNW', NE: 'sourceNE' };
const spreadKeys: Record<Spread, 'spreadLeft' | 'spreadCenter' | 'spreadRight'> = {
  left: 'spreadLeft',
  center: 'spreadCenter',
  right: 'spreadRight',
};

function describe(volleys: Volley[], i: number, locale: Locale): string {
  const v = volleys[i];
  return translate(locale, 'volleyDescription', {
    wave: i + 1,
    source: translate(locale, sourceKeys[v.source]),
    spread: translate(locale, spreadKeys[v.spread]),
  });
}

// 位置確認モードのスライド一覧（ウェーブ数+1枚）。
// 各ページ = 「直前ウェーブの直線」と「次ウェーブの予兆」の重ね合わせ
export function makeSlides(volleys: Volley[], locale: Locale = 'ja'): Slide[] {
  const slides: Slide[] = [];
  for (let page = 0; page <= volleys.length; page++) {
    const line = page - 1; // このページで直線になっているウェーブ
    const warn = page < volleys.length ? page : null; // 予兆中のウェーブ
    const bands: SlideBand[] = [];
    if (line >= 0) {
      bands.push({
        volley: volleys[line],
        emphasis: 'line',
        caption: translate(locale, 'lineCaption', { description: describe(volleys, line, locale) }),
      });
    }
    if (warn !== null) {
      bands.push({
        volley: volleys[warn],
        emphasis: 'warn',
        caption: translate(locale, 'telegraphCaption', { description: describe(volleys, warn, locale) }),
      });
    }
    const title =
      line < 0
        ? translate(locale, 'telegraphSlideTitle', { wave: 1 })
        : warn === null
          ? translate(locale, 'lineSlideTitle', { wave: line + 1 })
          : translate(locale, 'lineAndTelegraphSlideTitle', { lineWave: line + 1, telegraphWave: warn + 1 });
    slides.push({
      title,
      dangerIndex: line >= 0 ? line : null,
      bands,
      warnTelegraph: warn !== null ? volleys[warn] : null,
    });
  }
  return slides;
}
