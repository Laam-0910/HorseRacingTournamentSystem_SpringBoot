import dictData from './dictionary.json';

interface Translations {
  en: string;
  vi?: string;
  zh?: string;
  ja?: string;
}

const dict: Record<string, Translations> = dictData;

export const $t = (key: string, lang: string): string => {
  const entry = dict[key];
  
  if (entry) {
    if (lang === 'vi' && entry.vi) return entry.vi;
    if (lang === 'en' && entry.en) return entry.en;
    if (lang === 'zh' && entry.zh) return entry.zh;
    if (lang === 'ja' && entry.ja) return entry.ja;
  }

  // Fallback to original behavior for keys not in dictionary (assuming key is Vietnamese)
  if (!lang || lang === 'vi') return key;
  
  if (entry) {
    if (lang === 'en') return entry.en || key;
    if (lang === 'zh') return entry.zh || entry.en || key;
    if (lang === 'ja') return entry.ja || entry.en || key;
  }
  
  return key;
};
