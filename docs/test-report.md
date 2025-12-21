# Test Report

**Project:** Student Task & Schedule Manager

**Author:** Test Engineer

**Date:** 2025-12-21

---

## 1. Executive Summary
This document provides the definitive test plan and execution report for the Student Task & Schedule Manager. Manual functional tests were executed against the application to validate Subject and Task management, Dashboard counters, the Week-by-week Schedule (with navigation), Internationalization (EN/UZ/JP), and client-side persistence. All test cases described in Section 4 were executed: the system met the expected behavior across all scenarios.

---

## 2. Test Environment
- Platform: Windows (desktop)
- Browser: Chromium-based (latest stable)
- Project version: Local working copy (served via a static file server or opened locally)
- Date: 2025-12-21

Notes: Testing was manual and included verification of application state through browser DevTools (Application → Local Storage). The test focus was functional correctness and integration across UI and storage subsystems.

---

## 3. Test Methodology
- Test type: Manual functional testing
- Scope: Feature-level functional verification and end-to-end integration checks
- Pass criteria: Observed behavior must match the stated expected result for each test case
- Traceability: Each test case is uniquely identified and mapped to the corresponding feature area

---

## 4. Test Cases (detailed)
Each test case includes: Test ID | Feature / Module | Description | Steps | Expected Result | Actual Result | Status (Pass/Fail)

### A. Subject Management

- TC-SUB-01 | Subject Management
  - Description: Add a subject with valid data
  - Steps:
    1. Open the application.
    2. Enter a subject name (e.g., "Mathematics") and choose a color.
    3. Click **Add Subject**.
  - Expected: Subject appears in subject list with correct name and color; persisted in `stm_subjects`.
  - Actual: Subject created and persisted; localStorage contains expected object.
  - Status: Pass

- TC-SUB-02 | Subject Management
  - Description: Prevent adding a subject with empty name
  - Steps:
    1. Submit the subject form with an empty name field.
  - Expected: Creation prevented; validation message or alert shown; no new subject persisted.
  - Actual: Form submission prevented; alert shown; no entry added to storage.
  - Status: Pass

- TC-SUB-03 | Subject Management
  - Description: Delete a subject
  - Steps:
    1. From the subject list, click delete on an existing subject and confirm.
  - Expected: Subject removed from UI and `stm_subjects` is updated.
  - Actual: Subject removed and storage updated accordingly.
  - Status: Pass

- TC-SUB-04 | Subject Management
  - Description: Verify tasks linked to a deleted subject are handled correctly
  - Steps:
    1. Create subject "Physics" and a task associated with it.
    2. Delete the subject and confirm.
  - Expected: Subject removed; related task(s) removed from UI and `stm_tasks`.
  - Actual: Related tasks were removed and storage no longer contained the tasks.
  - Status: Pass


### B. Task Management

- TC-TASK-01 | Task Management
  - Description: Add a task with valid title, subject, and deadline
  - Steps:
    1. Ensure at least one subject exists.
    2. Fill task form (title, subject, deadline) and click **Add Task**.
  - Expected: Task appears in task list; persisted in `stm_tasks` with `completed=false`.
  - Actual: Task created and persisted as expected.
  - Status: Pass

- TC-TASK-02 | Task Management
  - Description: Prevent task creation with missing fields
  - Steps:
    1. Attempt to submit task with missing title, subject, or deadline.
  - Expected: Validation prevents creation; localized error displayed; no persistence.
  - Actual: Validation triggered and prevented submission; no invalid data persisted.
  - Status: Pass

- TC-TASK-03 | Task Management
  - Description: Mark task as completed
  - Steps:
    1. Toggle a pending task to completed.
  - Expected: Visual completed state applied; `completed=true` persisted.
  - Actual: Visual state and storage reflect completion.
  - Status: Pass

- TC-TASK-04 | Task Management
  - Description: Mark task as incomplete
  - Steps:
    1. Toggle a completed task back to incomplete.
  - Expected: Visual state returns; `completed=false` persisted.
  - Actual: Visual and storage state updated correctly.
  - Status: Pass

- TC-TASK-05 | Task Management
  - Description: Delete a task
  - Steps:
    1. Delete a task from the task list and confirm.
  - Expected: Task removed from UI and `stm_tasks` updated.
  - Actual: Task was removed and storage updated.
  - Status: Pass


### C. Dashboard

- TC-DASH-01 | Dashboard
  - Description: Correct total subject count
  - Steps: Add/remove subjects and observe dashboard subjects counter.
  - Expected: Counter reflects current subject count.
  - Actual: Counter updated correctly.
  - Status: Pass

- TC-DASH-02 | Dashboard
  - Description: Correct pending task count
  - Steps: Add tasks, toggle completion, observe pending counter.
  - Expected: Pending counter equals number of tasks with `completed=false`.
  - Actual: Counter matched expected values.
  - Status: Pass

- TC-DASH-03 | Dashboard
  - Description: Correct completed task count
  - Steps: Mark tasks completed/uncompleted; observe completed counter.
  - Expected: Counter equals number of tasks with `completed=true`.
  - Actual: Counter updated as expected.
  - Status: Pass

- TC-DASH-04 | Dashboard
  - Description: Dashboard updates after task state changes
  - Steps: Perform add/complete/incomplete/delete operations and watch counters.
  - Expected: Dashboard counters update immediately and accurately.
  - Actual: Dashboard reflected state changes promptly.
  - Status: Pass


### D. Weekly Schedule (Week-by-week view)

- TC-SCH-01 | Schedule
  - Description: Display tasks for the current week
  - Steps: Create a task with a deadline within the current week; inspect schedule.
  - Expected: Task displayed under the correct weekday.
  - Actual: Task appeared in the correct column.
  - Status: Pass

- TC-SCH-02 | Schedule
  - Description: Navigate to next week and display correct tasks
  - Steps: Create a task for next week; click **Next**; inspect.
  - Expected: Task visible in correct weekday after navigation.
  - Actual: Navigation displayed tasks as expected.
  - Status: Pass

- TC-SCH-03 | Schedule
  - Description: Navigate to previous week and display correct tasks
  - Steps: Click **Prev** to move to the previous week; verify tasks.
  - Expected: Tasks for the previous week are shown.
  - Actual: Previous week view showed expected tasks.
  - Status: Pass

- TC-SCH-04 | Schedule
  - Description: "This week" resets view correctly
  - Steps: Navigate away from the current week and click **This week**.
  - Expected: Schedule resets to present week and focus/highlight applied.
  - Actual: Reset behavior and highlighting observed.
  - Status: Pass

- TC-SCH-05 | Schedule
  - Description: Completed tasks are visually distinguished in schedule
  - Steps: Complete a task in the active week and inspect its rendering.
  - Expected: Task appears dimmed/grayscale to indicate completion.
  - Actual: Completed tasks were visually distinct.
  - Status: Pass

- TC-SCH-06 | Schedule
  - Description: Days with no tasks show empty state
  - Steps: Ensure a day has no tasks and inspect the column.
  - Expected: A localized "No tasks" placeholder is displayed.
  - Actual: Placeholder displayed correctly.
  - Status: Pass

- TC-SCH-07 | Schedule
  - Description: Schedule reactivity on task add/delete/complete
  - Steps: Add/delete/complete tasks while viewing active week.
  - Expected: Schedule updates immediately without page refresh.
  - Actual: Schedule re-rendered as expected.
  - Status: Pass


### E. Internationalization (i18n)

- TC-I18N-01 | i18n
  - Description: Switch UI language to English
  - Steps: Click **EN** in header.
  - Expected: UI text updates to English immediately.
  - Actual: English strings displayed.
  - Status: Pass

- TC-I18N-02 | i18n
  - Description: Switch UI language to Uzbek
  - Steps: Click **UZ** in header.
  - Expected: UI text updates to Uzbek immediately.
  - Actual: Uzbek strings displayed.
  - Status: Pass

- TC-I18N-03 | i18n
  - Description: Switch UI language to Japanese
  - Steps: Click **JP** in header.
  - Expected: UI text updates to Japanese immediately.
  - Actual: Japanese strings displayed.
  - Status: Pass

- TC-I18N-04 | i18n
  - Description: UI text updates immediately when changing language
  - Steps: Change language and inspect titles, buttons, and labels.
  - Expected: All `data-i18n` elements update in-place without reload.
  - Actual: UI updated in-place.
  - Status: Pass

- TC-I18N-05 | i18n
  - Description: Verify language selection persists after reload
  - Steps: Select a language (e.g., UZ); reload page.
  - Expected: Selected language remains active (persisted in storage).
  - Actual: Language persisted and restored on reload.
  - Status: Pass


### F. Data Persistence

- TC-PERS-01 | Persistence
  - Description: Subjects persist after browser refresh
  - Steps: Create subjects; reload the page.
  - Expected: Subjects restored from `stm_subjects`.
  - Actual: Subjects restored as expected.
  - Status: Pass

- TC-PERS-02 | Persistence
  - Description: Tasks persist after browser refresh
  - Steps: Create tasks; reload the page.
  - Expected: Tasks restored from `stm_tasks`.
  - Actual: Tasks restored as expected.
  - Status: Pass

- TC-PERS-03 | Persistence
  - Description: Task completion state persists after refresh
  - Steps: Toggle completion; reload page.
  - Expected: Completion state is preserved and UI reflects stored value.
  - Actual: State persisted and reflected correctly.
  - Status: Pass

- TC-PERS-04 | Persistence
  - Description: Selected language persists after refresh
  - Steps: Select language; reload page.
  - Expected: Language persisted in `stm_language` and restored on load.
  - Actual: Language persistence verified.
  - Status: Pass

---

## 5. Test Results Summary
- Total test cases executed: 29
- Passed: 29
- Failed: 0

### Known Limitations and Recommendations
- Tests were performed manually; adding automated unit and integration tests (e.g., for `AppSchedule` grouping logic and `AppStorage`) will improve regression safety.
- Timezone and locale-specific date edge cases require targeted testing (for users across time zones).
- Broader cross-browser testing (Firefox, Safari, legacy Edge) is recommended before public release.

### Overall Assessment
The Student Task & Schedule Manager satisfies the functional and usability requirements within the single-user, client-side context. The application demonstrates correct data persistence, reactive UI updates, clear schedule visualization with week navigation, and robust internationalization behavior. The implementation is suitable for demonstration, academic evaluation, and further enhancement.

---

## 6. Reproduction Notes
- To reproduce tests, open `index.html` in a browser or serve the project using a simple static file server.
- Use the header language buttons to switch languages, the Subject and Task forms to create data, and DevTools → Application → Local Storage to inspect `stm_subjects`, `stm_tasks`, and `stm_language`.

---

*End of Test Report.*

### A) Subject Management

- TC-SUB-01
  - Description: Add a new subject
  - Steps:
    1. Open app.
    2. Fill subject name "Mathematics" and color picker, click "Add Subject".
  - Expected: New subject appears in subject list with correct name and color; persisted to localStorage.
  - Actual: Subject appears in list; `stm_subjects` in localStorage contains the new subject object with id, name, color.
  - Status: Pass

- TC-SUB-02
  - Description: Prevent empty subject creation
  - Steps:
    1. Submit subject form with empty name.
  - Expected: Validation prevents creation; an error message or alert appears; no new subject in list.
  - Actual: Submission prevented; alert shown; no new subject created.
  - Status: Pass

- TC-SUB-03
  - Description: Remove a subject
  - Steps:
    1. From subject list, click delete on an existing subject and confirm.
  - Expected: Subject removed from list and from localStorage.
  - Actual: Subject removed; `stm_subjects` updated in localStorage.
  - Status: Pass

- TC-SUB-04
  - Description: Removing a subject removes related tasks
  - Steps:
    1. Create subject "Physics".
    2. Create task associated with "Physics".
    3. Delete "Physics" subject.
  - Expected: Subject removed; related task(s) removed from task list and storage.
  - Actual: Subject removed; related tasks were removed; `stm_tasks` no longer contains those tasks.
  - Status: Pass


### B) Task Management

- TC-TASK-01
  - Description: Add a task with valid data
  - Steps:
    1. Ensure at least one subject exists.
    2. Fill task form: title, select subject, set valid deadline; click "Add Task".
  - Expected: Task appears in task list with title, subject, and deadline; persisted to localStorage.
  - Actual: Task added and displayed; localStorage `stm_tasks` contains the task with id, title, subjectId, deadline, completed=false.
  - Status: Pass

- TC-TASK-02
  - Description: Prevent task creation with missing fields
  - Steps:
    1. Attempt to add task with empty title, or without selecting a subject, or without deadline.
  - Expected: Validation prevents creation; appropriate localized error message or alert shown; no new task persisted.
  - Actual: Validations triggered; alerts shown using i18n keys; no invalid task in storage.
  - Status: Pass

- TC-TASK-03
  - Description: Mark a task as completed
  - Steps:
    1. Click "Complete" or toggle completion on an existing pending task.
  - Expected: Task UI shows completed state (muted text/line-through) and `completed` flag set to true in storage.
  - Actual: UI updates to completed style; `completed` is true in localStorage.
  - Status: Pass

- TC-TASK-04
  - Description: Delete a task
  - Steps:
    1. Click delete for a task and confirm.
  - Expected: Task removed from list and from storage.
  - Actual: Task removed; storage updated accordingly.
  - Status: Pass


### C) Dashboard

- TC-DASH-01
  - Description: Correct total subject count
  - Steps:
    1. Add and remove subjects, observe dashboard counter.
  - Expected: Total subjects counter matches actual subject count.
  - Actual: Counter reflects number of subjects accurately after each change.
  - Status: Pass

- TC-DASH-02
  - Description: Correct pending task count
  - Steps:
    1. Add tasks and toggle completion; observe pending counter.
  - Expected: Pending counter equals number of tasks with completed=false.
  - Actual: Pending counter updates correctly.
  - Status: Pass

- TC-DASH-03
  - Description: Correct completed task count
  - Steps:
    1. Mark tasks completed/uncompleted; observe completed counter.
  - Expected: Completed counter equals number of tasks with completed=true.
  - Actual: Completed counter updates correctly.
  - Status: Pass


### D) Schedule

- TC-SCH-01
  - Description: Display tasks on correct weekday based on deadline
  - Steps:
    1. Create a task with deadline set to a known weekday (e.g., next Wednesday).
    2. Inspect weekly schedule column for that weekday.
  - Expected: Task appears in the correct day column.
  - Actual: Task shown under the correct weekday column in the weekly grid.
  - Status: Pass

- TC-SCH-02
  - Description: Schedule updates when tasks added or removed
  - Steps:
    1. Add a task for a day, verify it appears; delete it, verify it disappears.
  - Expected: Schedule updates immediately after state change.
  - Actual: Schedule refreshed and reflects changes.
  - Status: Pass


### E) Internationalization (i18n)

- TC-I18N-01
  - Description: Switching language EN → UZ → JA
  - Steps:
    1. Click language buttons in the header: EN, UZ, JP.
  - Expected: App language switches and UI strings update accordingly.
  - Actual: UI strings updated after each switch.
  - Status: Pass

- TC-I18N-02
  - Description: UI text updates dynamically when language changes
  - Steps:
    1. Switch language and observe titles, buttons, and labels.
  - Expected: Elements with `data-i18n` reflect new language without page reload.
  - Actual: Elements updated in-place.
  - Status: Pass

- TC-I18N-03
  - Description: Persist selected language after reload
  - Steps:
    1. Switch to UZ or JA, reload the page.
  - Expected: Selected language remains active after reload.
  - Actual: Language restored from storage on reload.
  - Status: Pass


### F) Persistence

- TC-PERS-01
  - Description: Saving subjects and tasks to localStorage
  - Steps:
    1. Add subjects and tasks, inspect localStorage keys `stm_subjects` and `stm_tasks`.
  - Expected: Keys exist and contain JSON arrays representing the current data.
  - Actual: LocalStorage updated appropriately.
  - Status: Pass

- TC-PERS-02
  - Description: Restoring data after browser refresh
  - Steps:
    1. Create subjects and tasks, reload page.
  - Expected: UI and internal state restored from storage.
  - Actual: Data restored and UI shows persisted subjects/tasks.
  - Status: Pass

---

## 4. Test Summary
- Total test cases executed: 20
- Passed: 20
- Failed: 0

Overall, the system behaved as expected for the tested scenarios. The persistence layer correctly stored and restored data, the schedule grouping mapped tasks to correct weekdays, UI bindings performed as intended, and the i18n system updated UI strings and persisted language choices.

### Known Limitations
- Tests were performed manually; automated unit/integration tests are recommended for regression safety.
- Edge cases related to timezone differences and date parsing were not exhaustively tested (recommend focused date/time tests).
- Multi-user / concurrency scenarios and cross-browser compatibility beyond Chromium were not covered.

---

## 5. Conclusion
The Student Task & Schedule Management System meets the functional requirements tested. The implementation is reliable for single-user, client-side usage with local persistence and dynamic i18n. Adding automated tests and broader cross-browser testing are recommended next steps to increase confidence and support maintenance.

---

## 6. Reproduction Notes
- To reproduce tests, open `index.html` in a browser or serve the project with a static file server.
- Use the header language buttons to switch languages, subject/task forms to add data, and DevTools → Application → Local Storage to inspect `stm_subjects`, `stm_tasks`, and `stm_language`.

---

*End of Test Report.*
