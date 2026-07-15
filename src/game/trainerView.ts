import { VOLLEY_COUNT } from '../config';
import type { TranslationKey, TranslationParams } from '../i18n/translations';
import { MARKER_RADIUS, type MarkerPreset, RESOLVE_SPEED } from './settings';

export type Mode = 'quiz' | 'rt';
export type LogClass = 'e' | 'ok' | 'ng' | 'sys';

export interface LogEntry {
  id: number;
  key: TranslationKey;
  params?: TranslationParams;
  className: LogClass;
}

export interface TrainerViewState {
  mode: Mode;
  markerPreset: MarkerPreset;
  markerRadius: number;
  page: number;
  slideTotal: number;
  slideTitle: string;
  oneByOne: boolean;
  resolveMs: number;
  runActive: boolean;
  runPaused: boolean;
  runFinished: boolean;
  rtHits: number;
  activeWave: number | null;
  countdown: number | null;
  hitFlash: boolean;
  logs: LogEntry[];
}

export const INITIAL_TRAINER_VIEW: TrainerViewState = {
  mode: 'rt',
  markerPreset: '2341',
  markerRadius: MARKER_RADIUS.default,
  page: 0,
  slideTotal: VOLLEY_COUNT + 1,
  slideTitle: '',
  oneByOne: false,
  resolveMs: RESOLVE_SPEED.defaultMs,
  runActive: false,
  runPaused: false,
  runFinished: false,
  rtHits: 0,
  activeWave: null,
  countdown: null,
  hitFlash: false,
  logs: [],
};
