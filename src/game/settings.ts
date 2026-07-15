export const MARKER_PRESETS = ['1234', '2341'] as const;
export type MarkerPreset = (typeof MARKER_PRESETS)[number];

export const MARKER_RADIUS = {
  default: 35,
  min: 25,
  max: 50,
  step: 1,
} as const;

export const RESOLVE_SPEED = {
  defaultMs: 4400,
  minSeconds: 2.5,
  maxSeconds: 5,
  stepSeconds: 0.1,
} as const;

export interface TrainerSettings {
  markerPreset: MarkerPreset;
  markerRadius: number;
  oneByOne: boolean;
  resolveMs: number;
}

export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const TRAINER_SETTINGS_STORAGE_KEY = 'exa-trainer-settings';

const STORAGE_VERSION = 1;

export const DEFAULT_TRAINER_SETTINGS: Readonly<TrainerSettings> = {
  markerPreset: '2341',
  markerRadius: MARKER_RADIUS.default,
  oneByOne: false,
  resolveMs: RESOLVE_SPEED.defaultMs,
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function normalizeMarkerRadius(value: number): number {
  if (!isFiniteNumber(value)) return MARKER_RADIUS.default;
  return Math.min(MARKER_RADIUS.max, Math.max(MARKER_RADIUS.min, Math.round(value)));
}

export function normalizeResolveMs(value: number): number {
  if (!isFiniteNumber(value)) return RESOLVE_SPEED.defaultMs;
  const minMs = RESOLVE_SPEED.minSeconds * 1000;
  const maxMs = RESOLVE_SPEED.maxSeconds * 1000;
  const stepMs = RESOLVE_SPEED.stepSeconds * 1000;
  const clamped = Math.min(maxMs, Math.max(minMs, value));
  return Math.round(clamped / stepMs) * stepMs;
}

function defaultSettings(): TrainerSettings {
  return { ...DEFAULT_TRAINER_SETTINGS };
}

function normalizeSettings(value: Record<string, unknown>): TrainerSettings {
  return {
    markerPreset: MARKER_PRESETS.some((preset) => preset === value.markerPreset)
      ? (value.markerPreset as MarkerPreset)
      : DEFAULT_TRAINER_SETTINGS.markerPreset,
    markerRadius: isFiniteNumber(value.markerRadius)
      ? normalizeMarkerRadius(value.markerRadius)
      : DEFAULT_TRAINER_SETTINGS.markerRadius,
    oneByOne: typeof value.oneByOne === 'boolean' ? value.oneByOne : DEFAULT_TRAINER_SETTINGS.oneByOne,
    resolveMs: isFiniteNumber(value.resolveMs)
      ? normalizeResolveMs(value.resolveMs)
      : DEFAULT_TRAINER_SETTINGS.resolveMs,
  };
}

export function parseTrainerSettings(raw: string | null): TrainerSettings {
  if (raw === null) return defaultSettings();
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return defaultSettings();
    const stored = value as Record<string, unknown>;
    if (stored.version !== STORAGE_VERSION) return defaultSettings();
    return normalizeSettings(stored);
  } catch {
    return defaultSettings();
  }
}

function getBrowserStorage(): SettingsStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadTrainerSettings(storage: SettingsStorage | null = getBrowserStorage()): TrainerSettings {
  if (storage === null) return defaultSettings();
  try {
    return parseTrainerSettings(storage.getItem(TRAINER_SETTINGS_STORAGE_KEY));
  } catch {
    return defaultSettings();
  }
}

export function saveTrainerSettings(
  settings: TrainerSettings,
  storage: SettingsStorage | null = getBrowserStorage(),
): void {
  if (storage === null) return;
  try {
    const normalized = normalizeSettings({
      markerPreset: settings.markerPreset,
      markerRadius: settings.markerRadius,
      oneByOne: settings.oneByOne,
      resolveMs: settings.resolveMs,
    });
    storage.setItem(TRAINER_SETTINGS_STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...normalized }));
  } catch {
    // Storage may be unavailable in private browsing or restricted environments.
  }
}
