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
