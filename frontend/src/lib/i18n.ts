import dictData from './dictionary.json';

interface Translations {
  en: string;
}

const dict: Record<string, Translations> = dictData;

/**
 * Single-Language Helper ($t): Always returns English translations.
 */
export const $t = (key: string, _lang?: string): string => {
  const entry = dict[key];
  if (entry && entry.en) {
    return entry.en;
  }
  return key;
};
