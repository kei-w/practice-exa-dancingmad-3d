import { describe, expect, it } from 'vitest';
import { resolveLocale, translate } from './translations';

describe('translate', () => {
  it('interpolates values in both languages', () => {
    expect(translate('ja', 'problemLabel', { number: 3 })).toBe('3問目');
    expect(translate('en', 'problemLabel', { number: 3 })).toBe('Problem 3');
  });

  it('uses Japanese only for Japanese browser locales', () => {
    expect(resolveLocale('ja-JP')).toBe('ja');
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('fr-FR')).toBe('en');
  });
});
