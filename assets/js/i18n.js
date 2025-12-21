/* i18n module (dictionary-based) - window.AppI18n
   Responsibilities:
   - Manage active language (default: 'en')
   - Persist selected language to storage (localStorage or AppStorage)
   - Provide translation lookup with safe fallbacks and simple interpolation
   - Notify listeners on language change
*/
(function () {
  'use strict';

  const STORAGE_KEY = 'stm_language';
  const DEFAULT = 'en';

  // Central translations dictionary: language -> key -> string
  const translations = {
    en: {
      'app.title': 'Student Task & Schedule Manager',
      'lang.label': 'Language',
      'lang.en': 'EN',
      'lang.uz': 'UZ',
      'lang.ja': 'JP',
      'theme.toggle': 'Toggle theme',
      'theme.light': 'Light',
      'theme.dark': 'Dark',

      'section.subjects': 'Subjects',
      'section.tasks': 'Tasks',
      'section.schedule': 'Weekly Schedule',
      'dashboard.title': 'Dashboard',
      'summary.subjects': 'Total Subjects',
      'summary.pending': 'Pending Tasks',
      'summary.completed': 'Completed Tasks',
      'select.subject': 'Select subject',
      'day.mon': 'Mon', 'day.tue': 'Tue', 'day.wed': 'Wed', 'day.thu': 'Thu', 'day.fri': 'Fri', 'day.sat': 'Sat', 'day.sun': 'Sun',
      'schedule.no_tasks': 'No tasks',
      'schedule.prev': 'Prev',
      'schedule.next': 'Next',
      'schedule.this_week': 'This week',
      'footer.note': '— Academic project.',

      'subject.create': 'Add Subject',
      'subject.delete': 'Delete subject',
      'subject.name': 'Subject name',
      'subject.color': 'Color',

      'task.create': 'Add Task',
      'task.delete': 'Delete task',
      'task.title': 'Title',
      'task.subject': 'Subject',
      'task.deadline': 'Deadline',
      'task.completed': 'Completed',
      'task.mark_complete': 'Mark complete',
      'task.mark_incomplete': 'Mark incomplete',

      'error.invalid_title': 'Task title cannot be empty.',
      'error.invalid_subject_name': 'Subject name cannot be empty.',
      'error.invalid_deadline': 'Deadline is invalid.',
      'error.subject_missing': 'Related subject does not exist.',

      'confirm.delete': 'Delete {entity}?'
    },
    uz: {
      'app.title': 'Talabalar Vazifalari va Jadvali',
      'lang.label': 'Til',
      'lang.en': 'EN',
      'lang.uz': 'UZ',
      'lang.ja': 'JP',
      'theme.toggle': 'Mavzuni almashtirish',
      'theme.light': 'Yorugʻ',
      'theme.dark': 'Qorongʻi',

      'section.subjects': 'Fanlar',
      'section.tasks': 'Vazifalar',
      'section.schedule': 'Haftalik jadval',
      'dashboard.title': 'Boshqaruv paneli',
      'summary.subjects': 'Fanlar soni',
      'summary.pending': 'Kutayotgan vazifalar',
      'summary.completed': 'Bajarilgan vazifalar',
      'schedule.no_tasks': 'Vazifalar yoʻq',
      'schedule.prev': 'Orqaga',
      'schedule.next': 'Oldinga',
      'schedule.this_week': 'Joriy hafta',

      'subject.create': 'Fan qoʻshish',
      'subject.delete': 'Fanni oʻchirish',
      'subject.name': 'Fan nomi',
      'subject.color': 'Rang',

      'task.create': 'Vazifa yaratish',
      'task.delete': 'Vazifani oʻchirish',
      'task.title': 'Sarlavha',
      'task.subject': 'Fan',
      'task.deadline': 'Muddat',
      'task.completed': 'Bajarilgan',
      'task.mark_complete': 'Bajarilgan deb belgilang',
      'task.mark_incomplete': 'Bajarilmagan deb belgilang',

      'error.invalid_title': "Vazifa sarlavhasi bo'sh bo'lishi mumkin emas.",
      'error.invalid_subject_name': 'Fanning nomi boʻsh boʻlmasligi kerak.',
      'error.invalid_deadline': 'Muddat notoʻgʻri.',
      'error.subject_missing': 'Bogʻlangan fan topilmadi.',

      'confirm.delete': '{entity} oʻchirilsinmi?'
    },
    ja: {
      'app.title': '学生タスク・スケジュール管理',
      'lang.label': '言語',
      'lang.en': 'EN',
      'lang.uz': 'UZ',
      'lang.ja': 'JP',
      'theme.toggle': 'テーマ切替',
      'theme.light': 'ライト',
      'theme.dark': 'ダーク',

      'section.subjects': '科目',
      'section.tasks': 'タスク',
      'section.schedule': '週間スケジュール',
      'dashboard.title': 'ダッシュボード',
      'summary.subjects': '科目数',
      'summary.pending': '未完了タスク',
      'summary.completed': '完了タスク',
      'schedule.no_tasks': 'タスクなし',
      'schedule.prev': '前の週',
      'schedule.next': '次の週',
      'schedule.this_week': '今週',

      'subject.create': '科目を作成',
      'subject.delete': '科目を削除',
      'subject.name': '名前',
      'subject.color': '色',

      'task.create': 'タスクを作成',
      'task.delete': 'タスクを削除',
      'task.title': 'タイトル',
      'task.subject': '科目',
      'task.deadline': '期限',
      'task.completed': '完了',
      'task.mark_complete': '完了にする',
      'task.mark_incomplete': '未完了にする',

      'error.invalid_title': 'タスクのタイトルは空にできません。',
      'error.invalid_subject_name': '科目名は必須です。',
      'error.invalid_deadline': '期限が無効です。',
      'error.subject_missing': '関連する科目が見つかりません。',

      'confirm.delete': '{entity} を削除しますか？'
    }
  };

  // current active language; initialized lazily in init()
  let lang = DEFAULT;
  const listeners = new Set();

  // Helper to persist language using AppStorage if available, otherwise localStorage
  function persistLanguage(l) {
    try {
      if (window.AppStorage && typeof window.AppStorage.saveLanguage === 'function') {
        window.AppStorage.saveLanguage(l);
      } else {
        localStorage.setItem(STORAGE_KEY, l);
      }
    } catch (e) { console.error('Failed to persist language', e); }
  }

  /**
   * Initialize i18n module: restore saved language from storage and sanitize it.
   * Should be called once during application startup.
   */
  function init() {
    try {
      let stored = null;
      if (window.AppStorage && typeof window.AppStorage.loadLanguage === 'function') {
        stored = window.AppStorage.loadLanguage();
      } else {
        stored = localStorage.getItem(STORAGE_KEY);
      }
      if (typeof stored === 'string' && translations[stored]) lang = stored;
      else lang = DEFAULT;
      // ensure storage contains a valid language
      persistLanguage(lang);
      return lang;
    } catch (e) {
      console.error('i18n.init failed', e);
      lang = DEFAULT;
      return lang;
    }
  }

  function getLanguage() { return lang; }

  /**
   * Change active language. Notifies listeners and persists selection.
   */
  function setLanguage(newLang) {
    const normalized = (typeof newLang === 'string' && translations[newLang]) ? newLang : DEFAULT;
    lang = normalized;
    persistLanguage(lang);
    console.log('[i18n] setLanguage ->', lang);
    for (const cb of listeners) {
      try { cb(lang); } catch (e) { console.error('Language listener error', e); }
    }
  }

  /**
   * Translate a key for the active language.
   * - Falls back to default language when key missing
   * - If still missing, returns the key itself or an optional fallback value
   * - Supports simple interpolation using {name} syntax
   */
  function t(key, vars = {}, fallback = null) {
    const activeDict = translations[lang] || {};
    let str = activeDict[key];
    if (typeof str === 'undefined') {
      // try default language
      str = (translations[DEFAULT] && translations[DEFAULT][key]);
    }
    if (typeof str === 'undefined') {
      str = (typeof fallback === 'string') ? fallback : key;
    }
    // simple interpolation
    if (vars && typeof vars === 'object') {
      Object.keys(vars).forEach(k => {
        str = String(str).replace(new RegExp('\{' + k + '\}', 'g'), String(vars[k]));
      });
    }
    return str;
  }

  function onLanguageChange(cb) { listeners.add(cb); return () => listeners.delete(cb); }
  function availableLanguages() { return Object.keys(translations); }

  // Public API
  window.AppI18n = Object.freeze({ init, getLanguage, setLanguage, t, onLanguageChange, availableLanguages });
})();