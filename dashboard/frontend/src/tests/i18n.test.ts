import { describe, it, expect } from 'vitest';
import { translations } from '../i18n/translations';

describe('i18n translation dictionaries', () => {
  it('should have matching keys in both ja and en', () => {
    const jaKeys = Object.keys(translations.ja) as (keyof typeof translations.ja)[];
    const enKeys = Object.keys(translations.en) as (keyof typeof translations.en)[];

    expect(jaKeys).toEqual(enKeys);

    for (const key of jaKeys) {
      const jaSubKeys = Object.keys(translations.ja[key]);
      const enSubKeys = Object.keys(translations.en[key]);
      expect(jaSubKeys).toEqual(enSubKeys);
    }
  });

  it('should correctly contain expected Japanese terms', () => {
    expect(translations.ja.header.title).toBe('agy-company');
    expect(translations.ja.header.cockpitSubtitle).toBe('Obsidian コックピット');
    expect(translations.ja.todos.title).toBe('デイリータスク');
  });

  it('should correctly contain expected English terms', () => {
    expect(translations.en.header.title).toBe('agy-company');
    expect(translations.en.header.cockpitSubtitle).toBe('Obsidian Cockpit');
    expect(translations.en.todos.title).toBe('Daily Tasks');
  });
});
