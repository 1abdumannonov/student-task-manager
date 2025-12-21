/* Scheduling utilities
   - date helpers and grouping tasks by week (Monday start)
*/
(function () {
  'use strict';

  // Convert input to a local YYYY-MM-DD string (no timezone offset)
  // Rationale: using toISOString() may shift the date due to UTC conversion and the
  // user's timezone, causing tasks to appear on the wrong day. We use local date
  // components to produce stable local ISO strings.
  function toISODate(input) {
    // Helper to build YYYY-MM-DD with zero padding
    function pad(n) { return String(n).padStart(2, '0'); }

    let d;
    if (input instanceof Date) {
      // construct a date using local year/month/day to avoid UTC shifts
      d = new Date(input.getFullYear(), input.getMonth(), input.getDate());
    } else if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      // already an ISO-like string: parse components and build local date
      const [y, m, day] = input.split('-').map(Number);
      d = new Date(y, m - 1, day);
    } else {
      // fallback: let Date parse other formats and then normalize to local date
      d = new Date(input);
      if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function startOfWeek(input) {
    // Produce the Monday date (YYYY-MM-DD) for the week of `input`
    const iso = toISODate(input);
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const day = dt.getDay() || 7; // Sunday=0 -> 7
    dt.setDate(dt.getDate() - (day - 1));
    return toISODate(dt);
  }

  function addDays(isoDate, offset) {
    // isoDate is expected in YYYY-MM-DD local format
    const [y, m, d] = (typeof isoDate === 'string' ? isoDate : toISODate(isoDate)).split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + offset);
    return toISODate(dt);
  }

  function groupTasksByWeek(tasks, dateInWeek) {
    const weekStart = startOfWeek(dateInWeek);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const map = {};
    days.forEach(d => (map[d] = []));
    tasks.forEach(t => {
      if (!t.deadline) return;
      let dd;
      try { dd = toISODate(t.deadline); }
      catch (e) { return; }
      if (dd in map) map[dd].push(t);
    });
    return map;
  }

  window.AppSchedule = { toISODate, startOfWeek, addDays, groupTasksByWeek };
})();