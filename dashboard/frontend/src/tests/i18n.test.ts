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
    // Verify document type labels in Japanese
    expect(translations.ja.docTypes.knowledge).toBe('知見');
    expect(translations.ja.docTypes.proposal).toBe('提案');
    expect(translations.ja.docTypes.discussion).toBe('議論');
    expect(translations.ja.docTypes.undefined).toBe('未定義');
  });

  it('should correctly contain expected English terms', () => {
    expect(translations.en.header.title).toBe('agy-company');
    expect(translations.en.header.cockpitSubtitle).toBe('Obsidian Cockpit');
    expect(translations.en.todos.title).toBe('Daily Tasks');
    // Verify document type labels in English
    expect(translations.en.docTypes.knowledge).toBe('Knowledge');
    expect(translations.en.docTypes.proposal).toBe('Proposal');
    expect(translations.en.docTypes.discussion).toBe('Discussion');
    expect(translations.en.docTypes.undefined).toBe('Undefined');
  });
});
