/* i18n module (dictionary-based) - window.AppI18n
   - translations stored in this module
   - language persisted to localStorage
   - provides t(key) and onLanguageChange
*/
(function () {
  'use strict';

  const STORAGE_KEY = 'stm_language';
  const DEFAULT = 'en';

  const translations = {
    en: {
      'app.title': 'Student Task & Schedule Manager',
      'lang.label': 'Language',
      'subject.create': 'Create subject',
      'task.create': 'Create task',
    },
    uz: {
      'app.title': 'Talabalar Vazifalari va Jadvali',
      'lang.label': 'Til',
      'subject.create': 'Fan yaratish',
      'task.create': 'Vazifa yaratish',
    },
    ja: {
      'app.title': '学生タスク・スケジュール管理',
      'lang.label': '言語',
      'subject.create': '科目を作成',
      'task.create': 'タスクを作成',
    }
  };

  let lang = localStorage.getItem(STORAGE_KEY) || DEFAULT;

  const listeners = new Set();

  function setLanguage(newLang) {
    if (!translations[newLang]) newLang = DEFAULT;
    lang = newLang;
    localStorage.setItem(STORAGE_KEY, lang);
    listeners.forEach(cb => cb(lang));
  }

  function t(key, vars) {
    const dict = translations[lang] || translations[DEFAULT];
    let str = dict[key] || key;
    if (vars) {
      Object.keys(vars).forEach(k => {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return str;
  }

  function onLanguageChange(cb) { listeners.add(cb); return () => listeners.delete(cb); }

  window.AppI18n = { getLanguage: () => lang, setLanguage, t, onLanguageChange, available: () => Object.keys(translations) };
})();