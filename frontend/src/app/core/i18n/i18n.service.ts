import { Injectable } from '@angular/core';

import {
  DEFAULT_LANGUAGE,
  Language,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from './translations';

const LANGUAGE_STORAGE_KEY = 'app-language';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private language: Language = this.getInitialLanguage();

  get currentLanguage(): Language {
    return this.language;
  }

  setLanguage(language: Language): void {
    if (!SUPPORTED_LANGUAGES.includes(language)) return;

    this.language = language;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  translate(key: string): string {
    return TRANSLATIONS[this.language][key] ?? TRANSLATIONS[DEFAULT_LANGUAGE][key] ?? key;
  }

  private getInitialLanguage(): Language {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    return SUPPORTED_LANGUAGES.includes(storedLanguage as Language)
      ? (storedLanguage as Language)
      : DEFAULT_LANGUAGE;
  }
}
