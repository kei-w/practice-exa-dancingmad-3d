import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRAINER_SETTINGS,
  loadTrainerSettings,
  parseTrainerSettings,
  saveTrainerSettings,
  type SettingsStorage,
} from './settings';

function createMemoryStorage() {
  let stored: string | null = null;
  const storage: SettingsStorage = {
    getItem: () => stored,
    setItem: (_key, value) => {
      stored = value;
    },
  };
  return { storage, read: () => stored };
}

describe('trainer settings persistence', () => {
  it('round-trips saved settings', () => {
    const memory = createMemoryStorage();
    const settings = { markerPreset: '1234', markerRadius: 41, oneByOne: true, resolveMs: 3600 } as const;

    saveTrainerSettings(settings, memory.storage);

    expect(loadTrainerSettings(memory.storage)).toEqual(settings);
    expect(memory.read()).toContain('"version":1');
  });

  it('normalizes invalid or out-of-range fields independently', () => {
    const parsed = parseTrainerSettings(
      JSON.stringify({
        version: 1,
        markerPreset: 'invalid',
        markerRadius: 100,
        oneByOne: 'yes',
        resolveMs: 4372,
      }),
    );

    expect(parsed).toEqual({
      markerPreset: DEFAULT_TRAINER_SETTINGS.markerPreset,
      markerRadius: 50,
      oneByOne: DEFAULT_TRAINER_SETTINGS.oneByOne,
      resolveMs: 4400,
    });
  });

  it('falls back to defaults for malformed or unsupported data', () => {
    expect(parseTrainerSettings('{')).toEqual(DEFAULT_TRAINER_SETTINGS);
    expect(parseTrainerSettings(JSON.stringify({ version: 2, markerRadius: 40 }))).toEqual(DEFAULT_TRAINER_SETTINGS);
  });

  it('continues when browser storage is unavailable', () => {
    const storage: SettingsStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };

    expect(loadTrainerSettings(storage)).toEqual(DEFAULT_TRAINER_SETTINGS);
    expect(() => saveTrainerSettings({ ...DEFAULT_TRAINER_SETTINGS }, storage)).not.toThrow();
  });
});
