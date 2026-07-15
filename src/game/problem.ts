import { VOLLEY_COUNT } from '../config';
import type { Spread, Volley } from './lanes';

// 山札から1枚ずつランダムに引いて左/中/右の順番を決める
function drawOrder(random: () => number): Spread[] {
  const pool: Spread[] = ['left', 'center', 'right'];
  const order: Spread[] = [];
  while (pool.length > 0) {
    order.push(...pool.splice(Math.floor(random() * pool.length), 1));
  }
  return order;
}

// 北西・北東が交互に、それぞれ左/中/右を1回ずつ撃つ6ウェーブの問題を作る
export function rollVolleys(random: () => number = Math.random): Volley[] {
  const nw = drawOrder(random);
  const ne = drawOrder(random);
  return Array.from({ length: VOLLEY_COUNT }, (_, i) =>
    i % 2 === 0 ? { source: 'NW' as const, spread: nw[i / 2] } : { source: 'NE' as const, spread: ne[(i - 1) / 2] },
  );
}

// 出題履歴。カーソルを戻すと過去の問題をやり直せる
export class ProblemHistory {
  private entries: Volley[][] = [];
  private cursor = -1;

  get current(): Volley[] {
    return this.entries[this.cursor] ?? [];
  }

  get number(): number {
    return this.cursor + 1;
  }

  get canGoBack(): boolean {
    return this.cursor > 0;
  }

  // 新しい問題を積む（過去に戻った状態で積むと、それ以降の履歴は捨てる）
  push(volleys: Volley[] = rollVolleys()): Volley[] {
    this.entries = this.entries.slice(0, this.cursor + 1);
    this.entries.push(volleys.map((v) => ({ ...v })));
    this.cursor = this.entries.length - 1;
    return this.current;
  }

  back(): boolean {
    if (!this.canGoBack) return false;
    this.cursor--;
    return true;
  }
}
