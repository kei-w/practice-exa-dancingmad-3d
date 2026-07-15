import { VOLLEY_COUNT } from '../config';
import type { TranslationKey, TranslationParams } from '../i18n/translations';
import { DEFAULT_TRAINER_SETTINGS, type MarkerPreset } from './settings';

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
  markerPreset: DEFAULT_TRAINER_SETTINGS.markerPreset,
  markerRadius: DEFAULT_TRAINER_SETTINGS.markerRadius,
  page: 0,
  slideTotal: VOLLEY_COUNT + 1,
  slideTitle: '',
  oneByOne: DEFAULT_TRAINER_SETTINGS.oneByOne,
  resolveMs: DEFAULT_TRAINER_SETTINGS.resolveMs,
  runActive: false,
  runPaused: false,
  runFinished: false,
  rtHits: 0,
  activeWave: null,
  countdown: null,
  hitFlash: false,
  logs: [],
};
