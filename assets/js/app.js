/* Main application composition - connects i18n, storage, schedule and exposes StudentTaskManager
   - This file wires modules and provides a small UI integration example (language switcher)
*/
(function () {
  'use strict';

  const i18n = window.AppI18n;
  const storage = window.AppStorage;
  const schedule = window.AppSchedule;

  // Simple in-memory state (backed by storage)
  let subjects = storage.loadSubjects();
  let tasks = storage.loadTasks();

  function saveAll() {
    storage.saveSubjects(subjects);
    storage.saveTasks(tasks);
  }

  function generateId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Subject API
  function getSubjects() { return subjects.slice(); }
  function createSubject(name, color = '#3498db') {
    const s = { id: generateId(), name: String(name).trim(), color };
    subjects.push(s); saveAll(); return s;
  }
  function deleteSubject(id) {
    subjects = subjects.filter(s => s.id !== id);
    tasks = tasks.filter(t => t.subjectId !== id);
    saveAll();
  }

  // Task API
  function getTasks() { return tasks.slice(); }
  function createTask({ title, subjectId = null, deadline = null }) {
    if (!title || !String(title).trim()) throw new Error('Invalid title');
    const t = { id: generateId(), title: String(title).trim(), subjectId, deadline: deadline ? schedule.toISODate(deadline) : schedule.toISODate(new Date()), completed: false };
    tasks.push(t); saveAll(); return t;
  }
  function toggleTaskCompletion(id) {
    const t = tasks.find(x => x.id === id); if (!t) return null; t.completed = !t.completed; saveAll(); return t;
  }

  function groupTasksByWeek(dateInWeek) { return schedule.groupTasksByWeek(tasks, dateInWeek); }

  // Expose public API on window
  const StudentTaskManager = {
    // subjects
    getSubjects, createSubject, deleteSubject,
    // tasks
    getTasks, createTask, toggleTaskCompletion,
    // schedule
    groupTasksByWeek,
    // i18n
    t: (k) => i18n.t(k), setLanguage: (l) => i18n.setLanguage(l), getLanguage: () => i18n.getLanguage(),
  };

  Object.defineProperty(window, 'StudentTaskManager', { value: StudentTaskManager, writable: false });

  // --- Minimal UI glue: language switcher and title translation ---
  function renderLangSwitcher() {
    const container = document.getElementById('lang-switcher');
    if (!container) return;
    container.innerHTML = '';
    const label = document.createElement('label'); label.className = 'small'; label.textContent = i18n.t('lang.label') + ':';
    const select = document.createElement('select');
    i18n.available().forEach(l => {
      const opt = document.createElement('option'); opt.value = l; opt.textContent = l; if (l === i18n.getLanguage()) opt.selected = true; select.appendChild(opt);
    });
    select.addEventListener('change', (e) => i18n.setLanguage(e.target.value));
    container.appendChild(label); container.appendChild(select);
  }

  function translateUI() {
    const title = document.getElementById('app-title'); if (title) title.textContent = i18n.t('app.title');
  }

  i18n.onLanguageChange(() => { renderLangSwitcher(); translateUI(); });
  // initial render
  document.addEventListener('DOMContentLoaded', () => { renderLangSwitcher(); translateUI(); });
})();