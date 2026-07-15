export function formatPageLabel(page: number, total: number): string {
  return `${page + 1}/${total}`;
}

export function formatSeconds(milliseconds: number): string {
  return (milliseconds / 1000).toFixed(1);
}

export function formatWaveLabel(activeWave: number | null, total: number): string {
  return `${activeWave ?? '-'}/${total}`;
}
