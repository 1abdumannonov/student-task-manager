/* Scheduling utilities
   - date helpers and grouping tasks by week (Monday start)
*/
(function () {
  'use strict';

  function toISODate(input) {
    const d = (input instanceof Date) ? input : new Date(input);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
    return d.toISOString().slice(0, 10);
  }

  function startOfWeek(input) {
    const d = new Date(toISODate(input));
    const day = d.getDay() || 7; // Sunday=0 -> 7
    d.setDate(d.getDate() - (day - 1));
    return toISODate(d);
  }

  function addDays(isoDate, offset) {
    const d = new Date(isoDate);
    d.setDate(d.getDate() + offset);
    return toISODate(d);
  }

  function groupTasksByWeek(tasks, dateInWeek) {
    const weekStart = startOfWeek(dateInWeek);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const map = {};
    days.forEach(d => (map[d] = []));
    tasks.forEach(t => {
      if (!t.deadline) return;
      const dd = toISODate(t.deadline);
      if (dd in map) map[dd].push(t);
    });
    return map;
  }

  window.AppSchedule = { toISODate, startOfWeek, addDays, groupTasksByWeek };
})();