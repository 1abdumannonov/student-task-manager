/* Storage wrapper for subjects, tasks, and language
   - Persists to localStorage
   - Provides simple validation
*/
(function () {
  'use strict';

  const KEYS = { SUBJECTS: 'stm_subjects', TASKS: 'stm_tasks' };

  function safeParse(raw) {
    try { return JSON.parse(raw); } catch(e) { return null; }
  }

  function loadSubjects() {
    const raw = localStorage.getItem(KEYS.SUBJECTS);
    const arr = raw ? safeParse(raw) : null;
    if (!Array.isArray(arr)) return [];
    // minimal validation
    return arr.filter(s => s && typeof s.id === 'string' && typeof s.name === 'string');
  }

  function saveSubjects(subjects) {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(subjects));
  }

  function loadTasks() {
    const raw = localStorage.getItem(KEYS.TASKS);
    const arr = raw ? safeParse(raw) : null;
    if (!Array.isArray(arr)) return [];
    return arr.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string');
  }

  function saveTasks(tasks) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  }

  window.AppStorage = { loadSubjects, saveSubjects, loadTasks, saveTasks };
})();