/* Application State & Data Model for Student Task & Schedule Manager
   - Focus: centralized state, data validation, persistence, and change notifications
   - No UI / DOM code in this module (kept separate)
*/
(function () {
  'use strict';

  // Storage adapter (optional external AppStorage)
  const storage = window.AppStorage || null;
  const LANG_KEY = 'stm_language';

  // ---------------- Utilities ----------------
  const Utils = {
    generateId() {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    },
    isValidDateString(d) {
      if (!d) return false;
      const dt = new Date(d);
      return !Number.isNaN(dt.getTime());
    },
    toISODate(input) {
      // Normalize input to a local YYYY-MM-DD string (no timezone offset)
      // Reason: toISOString() returns UTC and can shift the date across
      // timezone boundaries, causing tasks to appear on the wrong day.
      function pad(n) { return String(n).padStart(2, '0'); }
      let d;
      if (input instanceof Date) {
        d = new Date(input.getFullYear(), input.getMonth(), input.getDate());
      } else if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        const [y, m, day] = input.split('-').map(Number);
        d = new Date(y, m - 1, day);
      } else {
        d = new Date(input);
        if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // YYYY-MM-DD
    },
    deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
  };

  // ---------------- Application State ----------------
  // Initialize from storage.init() when available; otherwise fall back to direct reads
  const _state = { subjects: [], tasks: [], language: 'en' };

  // Initialize i18n first so we can use it as the source of truth for language
  if (window.AppI18n && typeof window.AppI18n.init === 'function') {
    try { window.AppI18n.init(); } catch (e) { console.error('AppI18n.init() failed', e); }
  }

  if (storage && typeof storage.init === 'function') {
    try {
      const loaded = storage.init();
      _state.subjects = Array.isArray(loaded.subjects) ? loaded.subjects : [];
      _state.tasks = Array.isArray(loaded.tasks) ? loaded.tasks : [];
      // prefer AppI18n language if available (keeps modules consistent)
      _state.language = (window.AppI18n && typeof window.AppI18n.getLanguage === 'function') ? window.AppI18n.getLanguage() : (typeof loaded.language === 'string' ? loaded.language : 'en');
    } catch (e) {
      console.error('AppStorage.init() failed', e);
    }
  } else {
    try {
      if (storage) {
        _state.subjects = storage.loadSubjects() || [];
        _state.tasks = storage.loadTasks() || [];
        _state.language = (window.AppI18n && typeof window.AppI18n.getLanguage === 'function') ? window.AppI18n.getLanguage() : ((typeof storage.loadLanguage === 'function' && storage.loadLanguage()) || localStorage.getItem(LANG_KEY) || 'en');
      } else {
        _state.subjects = JSON.parse(localStorage.getItem('stm_subjects') || '[]');
        _state.tasks = JSON.parse(localStorage.getItem('stm_tasks') || '[]');
        _state.language = (window.AppI18n && typeof window.AppI18n.getLanguage === 'function') ? window.AppI18n.getLanguage() : (localStorage.getItem(LANG_KEY) || 'en');
      }
    } catch (e) {
      console.error('Failed to initialize state from storage', e);
      _state.subjects = []; _state.tasks = []; _state.language = 'en';
    }
  }

  const THEME_KEY = 'stm_theme';
  // If AppI18n is present, subscribe to language changes so app state stays in sync
  if (window.AppI18n && typeof window.AppI18n.onLanguageChange === 'function') {
    window.AppI18n.onLanguageChange((newLang) => {
      if (_state.language === newLang) return; // no-op when unchanged
      _state.language = newLang;
      persist(); emit();
    });
  }

  // Simple observer for state changes
  const listeners = new Set();
  function emit() {
    const snapshot = Utils.deepClone(_state);
    for (const cb of listeners) {
      try { cb(snapshot); } catch (e) { console.error('Listener error', e); }
    }
  }

  // ---------------- Persistence ----------------
  function persist() {
    try {
      if (storage) {
        storage.saveSubjects(_state.subjects);
        storage.saveTasks(_state.tasks);
        if (typeof storage.saveLanguage === 'function') storage.saveLanguage(_state.language);
        else localStorage.setItem(LANG_KEY, _state.language);
      } else {
        localStorage.setItem('stm_subjects', JSON.stringify(_state.subjects));
        localStorage.setItem('stm_tasks', JSON.stringify(_state.tasks));
        localStorage.setItem(LANG_KEY, _state.language);
      }
    } catch (e) { console.error('Failed to persist state', e); }
  }

  // ---------------- State getters (safe/immutable) ----------------
  function getState() { return Utils.deepClone(_state); }
  function getSubjects() { return Utils.deepClone(_state.subjects); }
  function getTasks() { return Utils.deepClone(_state.tasks); }
  function getLanguage() { return _state.language; }

  // ---------------- Subject operations ----------------
  /**
   * Add a subject with name and optional color.
   * Returns the created subject object.
   */
  function addSubject({ name, color = '#3498db' } = {}) {
    const n = String(name || '').trim();
    if (!n) throw new Error('Subject name is required');
    const subject = { id: Utils.generateId(), name: n, color: String(color) };
    _state.subjects.push(subject);
    persist(); emit();
    return Utils.deepClone(subject);
  }

  /**
   * Remove subject by id. Also removes related tasks (cascade delete).
   * Returns true if a subject was removed, false otherwise.
   */
  function removeSubject(subjectId) {
    const initialLength = _state.subjects.length;
    _state.subjects = _state.subjects.filter(s => s.id !== subjectId);
    const removed = _state.tasks.filter(t => t.subjectId === subjectId).length;
    if (removed > 0) {
      _state.tasks = _state.tasks.filter(t => t.subjectId !== subjectId);
    }
    const changed = _state.subjects.length !== initialLength || removed > 0;
    if (changed) { persist(); emit(); }
    return _state.subjects.length !== initialLength;
  }

  // ---------------- Task operations ----------------
  /**
   * Add a task. Requires: title (non-empty), subjectId (existing), deadline (valid date string)
   * Returns the created task object.
   */
  function addTask({ title, subjectId, deadline } = {}) {
    const t = String(title || '').trim();
    if (!t) throw new Error('Task title cannot be empty');
    if (typeof subjectId !== 'string' || !_state.subjects.some(s => s.id === subjectId)) {
      throw new Error('Related subject does not exist');
    }
    if (!deadline || !Utils.isValidDateString(deadline)) throw new Error('Invalid or missing deadline');
    const task = {
      id: Utils.generateId(),
      title: t,
      subjectId: subjectId,
      deadline: Utils.toISODate(deadline),
      completed: false,
    };
    _state.tasks.push(task);
    persist(); emit();
    return Utils.deepClone(task);
  }

  function deleteTask(taskId) {
    const before = _state.tasks.length;
    _state.tasks = _state.tasks.filter(t => t.id !== taskId);
    const changed = _state.tasks.length !== before;
    if (changed) { persist(); emit(); }
    return changed;
  }

  function toggleTaskCompletion(taskId) {
    const task = _state.tasks.find(t => t.id === taskId);
    if (!task) return null;
    task.completed = !task.completed;
    persist(); emit();
    return Utils.deepClone(task);
  }

  // ---------------- Language ----------------
  function setLanguage(lang) {
    if (typeof lang !== 'string' || !lang) throw new Error('Invalid language');
    _state.language = lang;
    persist(); emit();
  }

  // ---------------- Subscriptions ----------------
  function onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); }

  // Expose public API in a single global object (minimize globals)
  const API = Object.freeze({
    // state access
    getState, getSubjects, getTasks, getLanguage,
    // mutations
    addSubject, removeSubject,
    addTask, deleteTask, toggleTaskCompletion,
    // language
    setLanguage,
    // subscriptions
    onChange,
  });

  // initialize (ensure data consistency: sanitize tasks with missing subjects)
  (function init() {
    // Ensure tasks reference valid subjects, otherwise remove them.
    // Also normalize all task.deadline values to local YYYY-MM-DD to avoid
    // timezone-related mismatches (previously some deadlines were stored
    // in UTC/ISO and shifted when compared using toISOString()).
    const subjectIds = new Set(_state.subjects.map(s => s.id));
    let changed = false;
    _state.tasks = _state.tasks.map(t => {
      if (!t || typeof t.id !== 'string') return null; // will filter out
      if (!subjectIds.has(t.subjectId)) { changed = true; return null; }
      // Normalize deadline to local ISO (YYYY-MM-DD)
      try {
        const normalized = Utils.toISODate(t.deadline);
        if (t.deadline !== normalized) { t.deadline = normalized; changed = true; }
      } catch (e) {
        // invalid deadline -> remove task
        changed = true; return null;
      }
      return t;
    }).filter(Boolean);
    if (changed) persist();
  })();

  Object.defineProperty(window, 'StudentTaskManager', { value: API, writable: false, configurable: false });

  /* ---------------- UI Integration (separate from domain logic) -----------------
     - Binds forms and buttons to StudentTaskManager operations
     - Renders subjects, tasks, summary, and weekly schedule
     - Integrates with AppI18n for translations
     - Subscribes to state and language changes
  */
  (function UI() {
    if (typeof document === 'undefined') return; // guard for non-browser environments

    const app = window.StudentTaskManager;
    const i18n = window.AppI18n;
    const dayMap = { 1: 'day-mon', 2: 'day-tue', 3: 'day-wed', 4: 'day-thu', 5: 'day-fri', 6: 'day-sat', 0: 'day-sun' };

    // Current visible week (ISO YYYY-MM-DD for the week's Monday)
    let currentWeekStart = (window.AppSchedule && typeof AppSchedule.startOfWeek === 'function') ? AppSchedule.startOfWeek(new Date()) : null;

    // Set the current week and trigger UI updates
    function setCurrentWeek(iso) { currentWeekStart = iso; renderSchedule(); updateWeekRangeUI(); }
    function prevWeek() { if (!currentWeekStart) return; setCurrentWeek(AppSchedule.addDays(currentWeekStart, -7)); }
    function nextWeek() { if (!currentWeekStart) return; setCurrentWeek(AppSchedule.addDays(currentWeekStart, 7)); }
    function goToThisWeek() { if (!window.AppSchedule) return; setCurrentWeek(AppSchedule.startOfWeek(new Date())); }

    function updateWeekRangeUI() {
      const rangeEl = document.getElementById('week-range'); if (!rangeEl || !currentWeekStart) return;
      const start = currentWeekStart; const end = AppSchedule.addDays(start, 6);
      rangeEl.textContent = `${formatDate(start)} — ${formatDate(end)}`;
      // visually mark the panel if this is the current week
      const scheduleSection = document.getElementById('schedule-section');
      if (scheduleSection) {
        const todayWeek = AppSchedule.startOfWeek(new Date());
        scheduleSection.classList.toggle('is-current-week', todayWeek === start);
      }
    }

    /* Utilities */
    function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }
    function formatDate(iso) {
      try {
        if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
          const [y, m, d] = iso.split('-').map(Number);
          return new Date(y, m - 1, d).toLocaleDateString();
        }
        return new Date(iso).toLocaleDateString();
      } catch (e) { return iso; }
    }

    /* Translation: replace text of elements with data-i18n attribute */
    function translateUI() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (!key) return;
        // For <title> element, set document.title
        if (el.tagName.toLowerCase() === 'title') { document.title = i18n.t(key); return; }
        el.textContent = i18n.t(key);
      });
      // Update select placeholder option if present
      const selPlaceholder = document.querySelector('#task-subject option[disabled][data-i18n]');
      if (selPlaceholder) selPlaceholder.textContent = i18n.t(selPlaceholder.getAttribute('data-i18n'));
      updateLangButtons();
      updateThemeUI();
    }

    function updateLangButtons() {
      document.querySelectorAll('.lang-btn').forEach(btn => {
        const l = btn.getAttribute('data-lang');
        btn.setAttribute('aria-pressed', i18n.getLanguage() === l ? 'true' : 'false');
        // ensure button label is translated if a key is present
        const key = btn.getAttribute('data-i18n');
        if (key) btn.textContent = i18n.t(key);
      });
    }

    function updateThemeUI(){
      const body = document.body;
      const current = body && body.classList.contains('dark-theme') ? 'dark' : (localStorage.getItem(THEME_KEY) || 'light');
      const themeCurrent = document.getElementById('theme-current'); if (themeCurrent) themeCurrent.textContent = i18n.t('theme.' + (current === 'dark' ? 'dark' : 'light'));
      const themeBtn = document.getElementById('theme-toggle-btn'); if (themeBtn) themeBtn.setAttribute('aria-pressed', current === 'dark' ? 'true' : 'false');
    }

    /* Rendering functions */
    function renderSubjects() {
      const list = document.getElementById('subject-list');
      const select = document.getElementById('task-subject');
      const subjects = app.getSubjects();
      if (list) {
        list.innerHTML = '';
        subjects.forEach(s => {
          const item = document.createElement('div'); item.className = 'item subject-item';
          item.innerHTML = `
            <span class="subject-chip" style="background:${esc(s.color)}" aria-hidden="true"></span>
            <div class="meta"><div class="subject-name">${esc(s.name)}</div></div>
            <div class="actions">
              <button type="button" class="btn secondary del-sub" data-id="${esc(s.id)}" aria-label="${i18n.t('subject.delete')}">${i18n.t('subject.delete')}</button>
            </div>
          `;
          list.appendChild(item);
        });
      }
      if (select) {
        // rebuild options, preserve placeholder first
        const placeholder = select.querySelector('option[disabled][data-i18n]');
        select.innerHTML = '';
        if (placeholder) select.appendChild(placeholder);
        subjects.forEach(s => {
          const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; select.appendChild(opt);
        });
      }
    }

    function renderTasks() {
      const list = document.getElementById('task-list');
      const tasks = app.getTasks();
      const subjects = app.getSubjects();
      const subjectMap = new Map(subjects.map(s => [s.id, s]));
      if (list) {
        list.innerHTML = '';
        tasks.forEach(t => {
          const item = document.createElement('div'); item.className = 'item task-item';
          const subject = subjectMap.get(t.subjectId);
          const subjectLabel = subject ? `<span class="subject-chip" style="background:${esc(subject.color)}"></span> <span class="small">${esc(subject.name)}</span>` : '';
          const completedClass = t.completed ? 'task-completed' : '';
          item.innerHTML = `
            <div class="meta ${completedClass}">
              <p class="task-title">${esc(t.title)}</p>
              <div class="task-sub">${subjectLabel}</div>
            </div>
            <div class="meta small task-deadline ${t.completed ? '' : ''}">${esc(formatDate(t.deadline))}</div>
            <div class="actions">
              <button type="button" class="btn secondary toggle-task" data-id="${esc(t.id)}">${t.completed ? i18n.t('task.mark_incomplete') : i18n.t('task.mark_complete')}</button>
              <button type="button" class="btn secondary del-task" data-id="${esc(t.id)}">${i18n.t('task.delete')}</button>
            </div>
          `;
          list.appendChild(item);
        });
      }
    }

    function renderSummary() {
      const subjectsCount = app.getSubjects().length;
      const tasks = app.getTasks();
      const pending = tasks.filter(t => !t.completed).length;
      const completed = tasks.filter(t => t.completed).length;
      const elS = document.getElementById('summary-subjects-count'); if (elS) elS.textContent = subjectsCount;
      const elP = document.getElementById('summary-pending-count'); if (elP) elP.textContent = pending;
      const elC = document.getElementById('summary-completed-count'); if (elC) elC.textContent = completed;
    }

    function renderSchedule() {
      // Use AppSchedule to group tasks for the current week (Mon..Sun)
      const tasks = app.getTasks();
      // Use the current visible week (currentWeekStart) when available; fall back to startOfWeek(now)
      const weekMap = (window.AppSchedule && typeof AppSchedule.groupTasksByWeek === 'function') ? AppSchedule.groupTasksByWeek(tasks, currentWeekStart || AppSchedule.startOfWeek(new Date())) : {};

      // Clear day containers and also set the date label under each weekday heading
      // We'll iterate Monday..Sunday using weekday order [1..6,0]
      const weekdayOrder = [1,2,3,4,5,6,0];
      const weekStart = currentWeekStart || ((window.AppSchedule && typeof AppSchedule.startOfWeek === 'function') ? AppSchedule.startOfWeek(new Date()) : null);

      weekdayOrder.forEach((wdIdx, offset) => {
        const colId = dayMap[wdIdx];
        const container = document.getElementById(colId + '-tasks');
        if (container) container.innerHTML = '';
        // update date label for the column (create or update a small date element)
        if (weekStart) {
          const iso = AppSchedule.addDays(weekStart, offset);
          const h3 = document.getElementById(colId + '-label');
          if (h3) {
            let dateEl = document.getElementById(colId + '-date');
            if (!dateEl) {
              dateEl = document.createElement('div');
              dateEl.id = colId + '-date';
              dateEl.className = 'small';
              dateEl.style.marginTop = '6px';
              dateEl.style.opacity = '0.85';
              h3.parentNode && h3.parentNode.insertBefore(dateEl, h3.nextSibling);
            }
            dateEl.textContent = formatDate(iso);
          }
        }
      });

      // For each day in the active week, append tasks that EXACTLY match that date
      // Note: we match by full date string (YYYY-MM-DD) — not by weekday only — to prevent
      // a single task appearing repeatedly across different weeks.
      weekdayOrder.forEach((wdIdx, offset) => {
        const colId = dayMap[wdIdx];
        const container = document.getElementById(colId + '-tasks');
        if (!container) return;
        // ensure container cleared (safety)
        container.innerHTML = '';

        // Compute ISO date for this column from the weekStart (YYYY-MM-DD local)
        const iso = (weekStart && window.AppSchedule && typeof AppSchedule.addDays === 'function') ? AppSchedule.addDays(weekStart, offset) : null;

        const dayTasks = (iso && weekMap[iso]) ? weekMap[iso] : [];

        if (!dayTasks || dayTasks.length === 0) {
          // show placeholder when no tasks for this exact date
          const emp = document.createElement('div'); emp.className = 'day-empty small'; emp.textContent = i18n.t('schedule.no_tasks', {}, 'No tasks'); container.appendChild(emp);
          return;
        }

        // Render each task as a small card/pill inside the day column
        const subjects = app.getSubjects();
        const subjectMap = new Map(subjects.map(s => [s.id, s]));

        dayTasks.forEach(t => {
          const subject = subjectMap.get(t.subjectId);
          const item = document.createElement('div'); item.className = 'day-task';
          if (t.completed) item.classList.add('completed');

          // left: subject pill, center: title + small date
          const subjectHtml = subject ? `<span class="subject-pill" style="background:${esc(subject.color)};">${esc(subject.name)}</span>` : '';
          const titleHtml = `<div class="task-info"><div class="task-title">${esc(t.title)}</div></div>`;
          const dateHtml = `<div class="task-meta small">${esc(formatDate(t.deadline))}</div>`;

          item.innerHTML = `<div class="day-task-left">${subjectHtml}</div><div class="day-task-body">${titleHtml}${dateHtml}</div>`;

          container.appendChild(item);
        });
      });
    }

    function updateAll() {
      renderSubjects(); renderTasks(); renderSummary(); renderSchedule(); translateUI();
    }

    /* Event bindings */
    function bindEvents() {
      // Subject form
      const subjForm = document.getElementById('subject-form');
      if (subjForm) subjForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameEl = document.getElementById('subject-name');
        const colorEl = document.getElementById('subject-color');
        const name = nameEl ? nameEl.value.trim() : '';
        const color = colorEl ? colorEl.value : '#3498db';
        if (!name) { alert(i18n.t('error.invalid_subject_name')); return; }
        try { app.addSubject({ name, color }); if (nameEl) nameEl.value = ''; } catch (err) { console.error(err); alert(err.message); }
      });

      // Subject delete (delegation)
      const subjectList = document.getElementById('subject-list');
      if (subjectList) subjectList.addEventListener('click', (e) => {
        const btn = e.target.closest('.del-sub'); if (!btn) return;
        const id = btn.getAttribute('data-id'); if (!id) return;
        const subject = app.getSubjects().find(s => s.id === id);
        const label = subject ? subject.name : i18n.t('section.subjects');
        if (!confirm(i18n.t('confirm.delete', { entity: label }))) return;
        app.removeSubject(id);
      });

      // Task form
      const taskForm = document.getElementById('task-form');
      if (taskForm) taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const titleEl = document.getElementById('task-title');
        const subjectEl = document.getElementById('task-subject');
        const deadlineEl = document.getElementById('task-deadline');
        const title = titleEl ? titleEl.value.trim() : '';
        const subjectId = subjectEl ? subjectEl.value : null;
        const deadline = deadlineEl ? deadlineEl.value : null;
        if (!title) { alert(i18n.t('error.invalid_title')); return; }
        if (!subjectId) { alert(i18n.t('error.subject_missing')); return; }
        if (!deadline || isNaN(Date.parse(deadline))) { alert(i18n.t('error.invalid_deadline')); return; }
        try { app.addTask({ title, subjectId, deadline }); if (titleEl) titleEl.value = ''; if (deadlineEl) deadlineEl.value = ''; } catch (err) { console.error(err); alert(err.message); }
      });

      // Task actions (delegation)
      const taskList = document.getElementById('task-list');
      if (taskList) taskList.addEventListener('click', (e) => {
        const del = e.target.closest('.del-task'); if (del) {
          const id = del.getAttribute('data-id');
          if (!id) return;
          const task = app.getTasks().find(t => t.id === id);
          const label = task ? task.title : i18n.t('section.tasks');
          if (id && confirm(i18n.t('confirm.delete', { entity: label }))) app.deleteTask(id);
          return;
        }
        const tog = e.target.closest('.toggle-task'); if (tog) { const id = tog.getAttribute('data-id'); if (id) app.toggleTaskCompletion(id); return; }
      });

      // Language switcher
      document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const lang = btn.getAttribute('data-lang'); if (!lang) return; i18n.setLanguage(lang); console.log('[i18n] language set to', lang);
        });
      });

      // Week navigation controls
      const weekPrev = document.getElementById('week-prev'); const weekNext = document.getElementById('week-next'); const weekToday = document.getElementById('week-today');
      if (weekPrev) weekPrev.addEventListener('click', () => { prevWeek(); });
      if (weekNext) weekNext.addEventListener('click', () => { nextWeek(); });
      if (weekToday) weekToday.addEventListener('click', () => { goToThisWeek(); });

      // Ensure week UI initialized
      if (!currentWeekStart && window.AppSchedule && typeof AppSchedule.startOfWeek === 'function') currentWeekStart = AppSchedule.startOfWeek(new Date());
      updateWeekRangeUI();

      // Theme toggle
      const themeBtn = document.getElementById('theme-toggle-btn');
      function getSavedTheme() { return localStorage.getItem(THEME_KEY) || 'light'; }
      function applyTheme(theme) {
        try {
          const body = document.body;
          if (!body) return;
          if (theme === 'dark') body.classList.add('dark-theme'); else body.classList.remove('dark-theme');
          localStorage.setItem(THEME_KEY, theme);
          // update theme label element if present
          const themeCurrent = document.getElementById('theme-current'); if (themeCurrent) themeCurrent.textContent = i18n.t('theme.' + (theme === 'dark' ? 'dark' : 'light'));
          if (themeBtn) themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
          console.log('[theme] applied', theme);
        } catch (e) { console.error('applyTheme failed', e); }
      }
      if (themeBtn) themeBtn.addEventListener('click', () => { const next = (getSavedTheme() === 'dark') ? 'light' : 'dark'; applyTheme(next); });
      // initialize theme after DOM ready
      document.addEventListener('DOMContentLoaded', () => applyTheme(getSavedTheme()));
    }

    // Subscribe to app state changes
    const unsub = app.onChange(() => { updateAll(); });
    // Subscribe to language changes
    if (i18n && typeof i18n.onLanguageChange === 'function') i18n.onLanguageChange(() => { translateUI(); updateAll(); });

    // Initial boot: bind events and render
    document.addEventListener('DOMContentLoaded', () => {
      bindEvents();
      // Ensure i18n initialized
      if (i18n && typeof i18n.init === 'function') try { i18n.init(); } catch (e) { console.error('i18n.init failed', e); }
      // Log initial language and theme for verification
      console.log('[app] initialized - language:', i18n.getLanguage(), ' theme:', (document.body.classList.contains('dark-theme') ? 'dark' : 'light'));
      updateAll();
    });

  })();

})();