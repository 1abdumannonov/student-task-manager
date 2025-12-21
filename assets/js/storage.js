/* Storage module for Student Task & Schedule Manager
   - Responsible for serializing/deserializing subjects, tasks, and selected language
   - Provides an init() that returns sanitized data for application startup
   - Handles corrupted or missing data gracefully
*/
(function () {
  'use strict';

  const KEYS = { SUBJECTS: 'stm_subjects', TASKS: 'stm_tasks', LANG: 'stm_language' };

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  // Basic validators to ensure persisted data matches expected shapes
  function validateSubjects(arr) {
    if (!Array.isArray(arr)) return false;
    return arr.every(s => s && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.color === 'string');
  }

  function validateTasks(arr) {
    if (!Array.isArray(arr)) return false;
    return arr.every(t => {
      if (!t || typeof t.id !== 'string' || typeof t.title !== 'string') return false;
      if (typeof t.subjectId !== 'string') return false; // subjectId must be a string (refs a subject)
      if (typeof t.deadline !== 'string' || Number.isNaN(Date.parse(t.deadline))) return false;
      if (typeof t.completed !== 'boolean') return false;
      return true;
    });
  }

  function loadSubjects() {
    const raw = localStorage.getItem(KEYS.SUBJECTS);
    const arr = raw ? safeParse(raw) : null;
    if (!validateSubjects(arr)) return [];
    return arr;
  }

  function saveSubjects(subjects) {
    try { localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects)); }
    catch (e) { console.error('saveSubjects failed', e); }
  }

  function loadTasks() {
    const raw = localStorage.getItem(KEYS.TASKS);
    const arr = raw ? safeParse(raw) : null;
    if (!validateTasks(arr)) return [];
    return arr;
  }

  function saveTasks(tasks) {
    try { localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks)); }
    catch (e) { console.error('saveTasks failed', e); }
  }

  function loadLanguage() {
    try {
      const v = localStorage.getItem(KEYS.LANG);
      return (typeof v === 'string' && v.length > 0) ? v : null;
    } catch (e) { console.error('loadLanguage failed', e); return null; }
  }

  function saveLanguage(lang) {
    try { localStorage.setItem(KEYS.LANG, String(lang)); }
    catch (e) { console.error('saveLanguage failed', e); }
  }

  /**
   * Initialize storage and return sanitized data.
   * Ensures referential integrity (tasks referencing existing subjects only).
   */
  function init() {
    const subjects = loadSubjects();
    let tasks = loadTasks();
    const language = loadLanguage() || 'en';

    // Remove tasks that reference missing subjects
    const subjectIds = new Set(subjects.map(s => s.id));
    tasks = tasks.filter(t => subjectIds.has(t.subjectId));

    return { subjects, tasks, language };
  }

  function clearAll() {
    try {
      localStorage.removeItem(KEYS.SUBJECTS);
      localStorage.removeItem(KEYS.TASKS);
      localStorage.removeItem(KEYS.LANG);
    } catch (e) { console.error('clearAll failed', e); }
  }

  window.AppStorage = Object.freeze({ init, loadSubjects, saveSubjects, loadTasks, saveTasks, loadLanguage, saveLanguage, clearAll });
})();