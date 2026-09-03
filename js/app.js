/**
 * To-Do List Life Dashboard
 * Main Application JavaScript (single-file build per Kiro Req 11.5)
 *
 * Structure:
 *   1. App IIFE - dashboard logic (Phases 4/7/8)
 *   2. Property-test suites - console-run tests (merged from js/tests.js, Phase 7)
 *
 * Requirements addressed: 3.5, 4.6, 9.1, 9.2
 */

(function () {
    'use strict';

    // ==========================================
    // Storage Keys
    // ==========================================
    const STORAGE_KEYS = {
        TASKS:           'tasks',
        LINKS:           'quickLinks',
        THEME:           'theme',
        SORT_PREFERENCE: 'sortPreference'
    };

    // ==========================================
    // Safe Storage Helpers  (design spec section: Error Handling)
    // ==========================================

    function safeStorageGet(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from storage:`, error);
            return defaultValue;
        }
    }

    function safeStorageSet(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error saving ${key} to storage:`, error);
            return false;
        }
    }

    // ==========================================
    // DOM Element References
    // ==========================================

    // Greeting (custom-name feature removed - Phase 8 product decision)
    const greetingText      = document.getElementById('greeting-text');
    const currentDateEl     = document.getElementById('current-date');
    const currentTimeEl     = document.getElementById('current-time');

    // Focus Timer
    const timerDisplayEl    = document.getElementById('timer-display');
    const timerStartBtn     = document.getElementById('timer-start');
    const timerStopBtn      = document.getElementById('timer-stop');
    const timerResetBtn     = document.getElementById('timer-reset');
    const timerMessageEl    = document.getElementById('timer-message');
    const durationHoursIn   = document.getElementById('duration-hours');
    const durationMinutesIn = document.getElementById('duration-minutes');
    const durationSecondsIn = document.getElementById('duration-seconds');
    const setDurationBtn    = document.getElementById('set-duration-btn');
    const timerErrorEl      = document.getElementById('timer-error');

    // To-Do List
    const taskForm          = document.getElementById('task-form');
    const taskTitleInput    = document.getElementById('task-title');
    const taskDescInput     = document.getElementById('task-description');
    const sortSelect        = document.getElementById('sort-select');
    const taskErrorEl       = document.getElementById('task-error');
    const taskListEl        = document.getElementById('task-list');
    const taskItemTemplate  = document.getElementById('task-item-template');

    // Quick Links
    const linkForm          = document.getElementById('link-form');
    const linkNameInput     = document.getElementById('link-name');
    const linkUrlInput      = document.getElementById('link-url');
    const linkListEl        = document.getElementById('link-list');
    const linkItemTemplate  = document.getElementById('link-item-template');
    const linkErrorEl       = document.getElementById('link-error');

    // Theme
    const themeToggleBtn    = document.getElementById('theme-toggle');
    const themeIconEl       = document.querySelector('.theme-icon');

    // ==========================================
    // Utility Functions
    // ==========================================

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showTaskError(msg) {
        taskErrorEl.textContent = msg;
        taskErrorEl.classList.remove('hidden');
    }

    function clearTaskError() {
        taskErrorEl.textContent = '';
        taskErrorEl.classList.add('hidden');
    }

    /**
     * Format seconds for the timer display: "MM:SS" below one hour,
     * "HH:MM:SS" whenever the CONFIGURED duration reached an hour (the
     * optional basis argument) so a 1h timer shows 00:59:58, not 59:58.
     * @param {number} totalSeconds
     * @param {number} [durationSeconds] - configured duration basis (optional)
     * @returns {string}
     */
    function formatTime(totalSeconds, durationSeconds) {
        const basis = (typeof durationSeconds === 'number') ? durationSeconds : totalSeconds;
        const hours   = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const useHours = basis >= 3600;
        const hh = hours.toString().padStart(2, '0');
        const mm = minutes.toString().padStart(2, '0');
        const ss = seconds.toString().padStart(2, '0');
        return useHours ? hh + ':' + mm + ':' + ss : mm + ':' + ss;
    }

    /**
     * Return a time-based greeting string for the given hour (0-23).
     * Hour ranges (Req 1.3):
     *   5-11  -> Good morning! Ready to tackle the day
     *  12-16  -> Good afternoon! Keep it up!
     *  17-20  -> Good evening! Time to wind down.
     *  21-4   -> Good night! Time to rest.
     * @param {number} hour
     * @returns {string}
     */
    function getTimeBasedGreeting(hour) {
        if (hour >= 5  && hour <= 11) return 'Good morning! Ready to tackle the day';
        if (hour >= 12 && hour <= 16) return 'Good afternoon! Keep it up!';
        if (hour >= 17 && hour <= 20) return 'Good evening! Time to wind down.';
        return 'Good night! Time to rest.';
    }

    // ==========================================
    // Greeting Component
    // ==========================================

    /** Set the greeting h1 to the time-based message. */
    function updateGreeting() {
        const hour = new Date().getHours();
        greetingText.textContent = getTimeBasedGreeting(hour);
    }

    /** Refresh date and time displays. */
    function updateDateTime() {
        const now = new Date();
        currentDateEl.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        currentTimeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    }

    // ==========================================
    // Focus Timer Component
    // ==========================================

    // Timer state
    const DEFAULT_DURATION_SECONDS = 25 * 60; // Req 2.1 & 2.5: default/reset target
    let timerStatus         = 'idle';   // 'idle' | 'running' | 'paused' | 'complete'
    let timerDurationSeconds = DEFAULT_DURATION_SECONDS; // currently configured duration
    let remainingTime        = DEFAULT_DURATION_SECONDS;  // seconds
    let timerInterval        = null;
    // Timestamp anchor for drift-free countdown (Req 2.8 - continues in
    // background even when the browser throttles setInterval).
    let timerAnchorMs = 0;

    /** Push current remainingTime into the timer display. */
    function updateTimerDisplay() {
        timerDisplayEl.textContent = formatTime(remainingTime, timerDurationSeconds);
    }

    /**
     * Show an inline error under the duration form (shared pattern with
     * the other validation messages - rules.md F5).
     * @param {string} msg - empty string clears the error
     */
    function setTimerError(msg) {
        timerErrorEl.textContent = msg;
        timerErrorEl.classList.toggle('hidden', msg === '');
    }

    /**
     * Read the three duration inputs and apply them as the timer duration.
     * Empty fields count as 0; negative values or an all-zero total are
     * rejected inline. Setting is blocked while the timer is not idle -
     * the user must Reset first.
     */
    function setTimerDuration() {
        const h = parseInt(durationHoursIn.value,   10);
        const m = parseInt(durationMinutesIn.value, 10);
        const s = parseInt(durationSecondsIn.value, 10);

        if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(s) ||
            h < 0 || m < 0 || s < 0) {
            setTimerError('Duration values must be 0 or positive numbers');
            return;
        }

        const total = h * 3600 + m * 60 + s;
        if (total <= 0) {
            setTimerError('Duration must be at least 1 second');
            return;
        }

        if (timerStatus !== 'idle') {
            setTimerError('Reset the timer before changing the duration');
            return;
        }

        setTimerError('');
        timerDurationSeconds = total;
        remainingTime = total;
        updateTimerDisplay();
    }

    /**
     * Recompute remaining time from the wall clock instead of trusting
     * interval fire counts, which browsers throttle in background tabs.
     */
    function tickTimer() {
        const elapsed = Math.floor((Date.now() - timerAnchorMs) / 1000);
        remainingTime = Math.max(0, timerDurationSeconds - elapsed);
        updateTimerDisplay();
        if (remainingTime <= 0) {
            completeTimer();
        }
    }

    /**
     * Start the countdown.
     * No-ops when already running or complete (user must reset to restart after complete).
     */
    function startTimer() {
        if (timerStatus === 'running' || timerStatus === 'complete') return;

        timerStatus   = 'running';
        timerStartBtn.disabled = true;
        // Anchor the countdown to the wall clock; also listen for visibility
        // so a resumed tab corrects the display immediately.
        timerAnchorMs = Date.now() - (timerDurationSeconds - remainingTime) * 1000;
        timerInterval = setInterval(tickTimer, 1000);
        document.addEventListener('visibilitychange', tickTimer);
    }

    /** Detach interval + visibility listener. Shared by stop/reset/complete. */
    function teardownTimerTicks() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        document.removeEventListener('visibilitychange', tickTimer);
    }

    /**
     * Pause the countdown.
     * Interval is cleared but remainingTime is preserved.
     */
    function stopTimer() {
        teardownTimerTicks();
        if (timerStatus === 'running') {
            timerStatus = 'paused';
        }
        timerStartBtn.disabled = false;
    }

    /**
     * Reset to 25 minutes and return to idle state.
     * Works from any state.
     */
    function resetTimer() {
        teardownTimerTicks();
        timerStatus   = 'idle';
        // Req 2.5 + product decision: Reset returns everything to the 25:00
        // default - including the configured duration, so the display shows
        // "25:00" (MM:SS), not a leftover custom basis.
        timerDurationSeconds = DEFAULT_DURATION_SECONDS;
        remainingTime = DEFAULT_DURATION_SECONDS;
        // Restore the duration inputs to match (25 minutes)
        durationHoursIn.value   = '0';
        durationMinutesIn.value = '25';
        durationSecondsIn.value = '0';
        setTimerError('');
        timerStartBtn.disabled = false;
        timerDisplayEl.classList.remove('timer-complete');
        timerMessageEl.textContent = '';
        timerMessageEl.classList.add('hidden');
        updateTimerDisplay();
    }

    /**
     * Called when the countdown reaches zero.
     * Sets status to 'complete' and fires a notification.
     */
    function completeTimer() {
        teardownTimerTicks();
        timerStatus = 'complete';
        timerStartBtn.disabled = false;
        timerDisplayEl.classList.add('timer-complete');
        timerMessageEl.textContent = '🎉 Focus session complete! Take a break.';
        timerMessageEl.classList.remove('hidden');
        notifyTimerComplete();
    }

    /** Human label for the configured duration, e.g. "25-minute" or "2-hour". */
    function durationLabel() {
        const minutes = Math.round(timerDurationSeconds / 60);
        if (timerDurationSeconds % 3600 === 0 && timerDurationSeconds >= 3600) {
            return (timerDurationSeconds / 3600) + '-hour';
        }
        return minutes + '-minute';
    }

    /** Show a browser notification (or in-app message fallback) when timer ends. */
    function notifyTimerComplete() {
        const title   = 'Focus Timer Complete';
        const body    = 'Your ' + durationLabel() + ' focus session has ended!';

        if (!('Notification' in window)) {
            // In-app message already shown by completeTimer(); nothing extra needed.
            return;
        }

        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
                // In-app message already visible regardless of permission outcome.
            });
        }
        // If denied, in-app message (timerMessageEl) is the fallback - already set.
    }

    // ==========================================
    // To-Do List - Storage & Data Layer
    // ==========================================

    function getTasks() {
        return safeStorageGet(STORAGE_KEYS.TASKS, []);
    }

    function saveTasks(tasks) {
        return safeStorageSet(STORAGE_KEYS.TASKS, tasks);
    }

    function taskTitleExists(title, excludeId = null) {
        const normalised = title.toLowerCase().trim();
        return getTasks().some(function (t) {
            return t.id !== excludeId && t.title.toLowerCase().trim() === normalised;
        });
    }

    function validateTaskTitle(title, excludeId = null) {
        if (!title || title.trim() === '') {
            return { valid: false, error: 'Title cannot be empty' };
        }
        if (taskTitleExists(title, excludeId)) {
            return { valid: false, error: 'A task with this title already exists' };
        }
        return { valid: true };
    }

    function addTask(title, description) {
        const validation = validateTaskTitle(title);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        const tasks   = getTasks();
        const newTask = {
            id:          generateId(),
            title:       title.trim(),
            description: description.trim(),
            createdAt:   Date.now(),
            completed:   false
        };

        tasks.push(newTask);
        saveTasks(tasks);
        return { success: true, task: newTask };
    }

    function updateTask(id, updates) {
        const tasks = getTasks();
        const index = tasks.findIndex(function (t) { return t.id === id; });
        if (index === -1) return { success: false, error: 'Task not found' };

        if (updates.title !== undefined) {
            const validation = validateTaskTitle(updates.title, id);
            if (!validation.valid) return { success: false, error: validation.error };
            updates.title = updates.title.trim();
        }
        if (updates.description !== undefined) {
            updates.description = updates.description.trim();
        }

        tasks[index] = Object.assign({}, tasks[index], updates);
        saveTasks(tasks);
        return { success: true, task: tasks[index] };
    }

    function deleteTask(id) {
        saveTasks(getTasks().filter(function (t) { return t.id !== id; }));
        return { success: true };
    }

    function toggleTaskCompletion(id) {
        const task = getTasks().find(function (t) { return t.id === id; });
        if (!task) return { success: false };
        return updateTask(id, { completed: !task.completed });
    }

    function sortTasks(tasks, sortBy) {
        const sorted = tasks.slice();
        switch (sortBy) {
            case 'newest':       return sorted.sort(function (a, b) { return b.createdAt - a.createdAt; });
            case 'oldest':       return sorted.sort(function (a, b) { return a.createdAt - b.createdAt; });
            case 'alphabetical': return sorted.sort(function (a, b) { return a.title.localeCompare(b.title); });
            case 'incomplete':   return sorted.sort(function (a, b) { return a.completed - b.completed; });
            default:             return sorted;
        }
    }

    // ==========================================
    // To-Do List - Rendering (template-based)
    // ==========================================

    function buildTaskElement(task) {
        const node    = taskItemTemplate.content.cloneNode(true);
        const item    = node.querySelector('.task-item');
        const checkbox    = node.querySelector('.task-complete');
        const titleSpan   = node.querySelector('.task-title');
        const expandBtn   = node.querySelector('.expand-btn');
        const editBtn     = node.querySelector('.edit-btn');
        const deleteBtn   = node.querySelector('.delete-btn');
        const descDiv     = node.querySelector('.task-description');
        const editForm    = node.querySelector('.task-edit-form');
        const editTitleIn = node.querySelector('.edit-title');
        const editDescIn  = node.querySelector('.edit-description');
        const editErrorIn = node.querySelector('.edit-error');
        const saveEditBtn = node.querySelector('.btn-save-edit');
        const cancelEditBtn = node.querySelector('.btn-cancel-edit');

        // Populate static data
        item.dataset.taskId      = task.id;
        checkbox.checked         = task.completed;
        titleSpan.textContent    = task.title;
        descDiv.textContent      = task.description;
        checkbox.setAttribute('aria-label', 'Mark "' + escapeHtml(task.title) + '" as ' + (task.completed ? 'incomplete' : 'complete'));

        // Hide description and expand button when no description
        if (!task.description) {
            expandBtn.style.display = 'none';
            descDiv.style.display   = 'none';
        }

        // Mark completed tasks visually
        if (task.completed) {
            item.classList.add('task-completed');
        }

        // Checkbox: toggle completion
        checkbox.addEventListener('change', function () {
            toggleTaskCompletion(task.id);
            renderTasks();
        });

        // Expand/collapse description
        expandBtn.addEventListener('click', function () {
            const isCollapsed = descDiv.classList.contains('collapsed');
            descDiv.classList.toggle('collapsed', !isCollapsed);
            descDiv.setAttribute('aria-hidden', String(!isCollapsed));
            expandBtn.setAttribute('aria-expanded', String(isCollapsed));
            expandBtn.textContent = isCollapsed ? '▼' : '▶';
        });

        // Edit: show inline form pre-filled with current values
        editBtn.addEventListener('click', function () {
            editTitleIn.value = task.title;
            editDescIn.value  = task.description;
            editErrorIn.textContent = '';
            editErrorIn.classList.add('hidden');
            editForm.classList.remove('hidden');
            editBtn.classList.add('hidden');
            editTitleIn.focus();
        });

        // Save edit - validation failures show inline (role="alert"), not alert()
        saveEditBtn.addEventListener('click', function () {
            const newTitle = editTitleIn.value;
            const newDesc  = editDescIn.value;
            const result   = updateTask(task.id, { title: newTitle, description: newDesc });
            if (!result.success) {
                editErrorIn.textContent = result.error;
                editErrorIn.classList.remove('hidden');
                editTitleIn.focus();
                return;
            }
            renderTasks();
        });

        // Cancel edit
        cancelEditBtn.addEventListener('click', function () {
            editErrorIn.textContent = '';
            editErrorIn.classList.add('hidden');
            editForm.classList.add('hidden');
            editBtn.classList.remove('hidden');
        });

        // Delete
        deleteBtn.addEventListener('click', function () {
            if (confirm('Delete task "' + task.title + '"?')) {
                deleteTask(task.id);
                renderTasks();
            }
        });

        return item;
    }

    /** Re-render the full task list into #task-list. */
    function renderTasks() {
        // Apply saved sort preference to the dropdown before reading its value
        const savedSort = safeStorageGet(STORAGE_KEYS.SORT_PREFERENCE, 'newest');
        if (sortSelect.value !== savedSort) {
            sortSelect.value = savedSort;
        }

        const tasks  = getTasks();
        const sorted = sortTasks(tasks, sortSelect.value);

        taskListEl.innerHTML = '';

        if (sorted.length === 0) {
            const empty = document.createElement('p');
            empty.className   = 'empty-state';
            empty.textContent = 'No tasks yet. Add one above!';
            taskListEl.appendChild(empty);
            return;
        }

        sorted.forEach(function (task) {
            taskListEl.appendChild(buildTaskElement(task));
        });
    }

    // ==========================================
    // Quick Links - Inline Error Helpers  (Req 7.2)
    // ==========================================

    function showLinkError(msg) {
        linkErrorEl.textContent = msg;
        linkErrorEl.classList.remove('hidden');
    }

    function clearLinkError() {
        linkErrorEl.textContent = '';
        linkErrorEl.classList.add('hidden');
    }

    // ==========================================
    // Quick Links - Storage & Data Layer
    // ==========================================

    function getLinks() {
        return safeStorageGet(STORAGE_KEYS.LINKS, []);
    }

    function saveLinks(links) {
        return safeStorageSet(STORAGE_KEYS.LINKS, links);
    }

    function validateLink(name, url) {
        if (!name || name.trim() === '') return { valid: false, error: 'Link name is required' };
        if (!url  || url.trim()  === '') return { valid: false, error: 'URL is required' };
        return { valid: true };
    }

    function addLink(name, url) {
        const validation = validateLink(name, url);
        if (!validation.valid) return { success: false, error: validation.error };

        // Auto-prepend https:// if no protocol is present (Req 7.3)
        let normalizedUrl = url.trim();
        if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        const links   = getLinks();
        const newLink = {
            id:   generateId(),
            name: name.trim(),
            url:  normalizedUrl
        };

        links.push(newLink);
        saveLinks(links);
        return { success: true, link: newLink };
    }

    function deleteLink(id) {
        saveLinks(getLinks().filter(function (l) { return l.id !== id; }));
    }

    // ==========================================
    // Quick Links - Rendering (template-based)
    // ==========================================

    function buildLinkElement(link) {
        const node      = linkItemTemplate.content.cloneNode(true);
        const item      = node.querySelector('.link-item');
        const anchor    = node.querySelector('.link-anchor');
        const deleteBtn = node.querySelector('.delete-link-btn');

        item.dataset.linkId  = link.id;
        anchor.href          = link.url;
        anchor.textContent   = link.name;
        anchor.setAttribute('aria-label', 'Open ' + escapeHtml(link.name));

        deleteBtn.addEventListener('click', function () {
            deleteLink(link.id);
            renderLinks();
        });

        return item;
    }

    /** Re-render the full links list into #link-list. */
    function renderLinks() {
        const links = getLinks();
        linkListEl.innerHTML = '';

        if (links.length === 0) {
            const empty = document.createElement('p');
            empty.className   = 'empty-state';
            empty.textContent = 'No links yet. Add one above!';
            linkListEl.appendChild(empty);
            return;
        }

        links.forEach(function (link) {
            linkListEl.appendChild(buildLinkElement(link));
        });
    }

    // ==========================================
    // Theme Manager
    // ==========================================

    function getCurrentTheme() {
        return safeStorageGet(STORAGE_KEYS.THEME, 'light');
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        safeStorageSet(STORAGE_KEYS.THEME, theme);
        themeIconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    /** Toggle between light and dark themes. */
    function toggleTheme() {
        setTheme(getCurrentTheme() === 'light' ? 'dark' : 'light');
    }

    // ==========================================
    // Event Listeners
    // ==========================================

    function initEventListeners() {
        // --- Timer ---
        timerStartBtn.addEventListener('click', startTimer);
        timerStopBtn.addEventListener('click', stopTimer);
        timerResetBtn.addEventListener('click', resetTimer);
        setDurationBtn.addEventListener('click', setTimerDuration);

        // --- To-Do Form ---
        taskForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const result = addTask(taskTitleInput.value, taskDescInput.value);
            if (result.success) {
                clearTaskError();
                taskForm.reset();
                renderTasks();
            } else {
                showTaskError(result.error);
            }
        });

        sortSelect.addEventListener('change', function () {
            safeStorageSet(STORAGE_KEYS.SORT_PREFERENCE, sortSelect.value);
            renderTasks();
        });

        // --- Quick Links Form ---
        linkForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const result = addLink(linkNameInput.value, linkUrlInput.value);
            if (result.success) {
                clearLinkError();
                linkForm.reset();
                renderLinks();
            } else {
                showLinkError(result.error);
            }
        });

        // --- Theme Toggle ---
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // ==========================================
    // Initialization
    // ==========================================

    function init() {
        // Apply persisted theme first (prevents flash)
        setTheme(getCurrentTheme());

        // Render the time-based greeting and the live clock
        updateGreeting();
        updateDateTime();
        updateTimerDisplay();
        renderTasks();
        renderLinks();

        // Live clock - update every second
        setInterval(function () {
            updateDateTime();
        }, 1000);

        // Greeting only needs minute-level updates (hour changes are rare)
        setInterval(function () {
            updateGreeting();
        }, 60000);

        initEventListeners();

        // Request notification permission proactively
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

}());

// ============================================================================
// Shared Test Utilities
// To-Do List Life Dashboard
//
// Common assertion + storage-stub infrastructure for every property-test suite
// in this file. App-logic mirrors stay standalone per suite (rules.md
// Testing Conventions); only the test scaffolding is shared here.
//
// Internal API: window.__testUtils
// ============================================================================

(function () {
  'use strict';

  /**
   * Create a counter-backed assert function.
   * @param {{passed:number, failed:number}} counter - shared counters object
   * @returns {function(boolean, string): void}
   */
  function makeAssert(counter) {
    return function (condition, message) {
      if (condition) {
        console.log(
          '%c PASS %c ' + message,
          'background:#388e3c;color:#fff;padding:2px 4px;border-radius:3px;font-weight:bold',
          'color:inherit'
        );
        counter.passed++;
      } else {
        console.error(
          '%c FAIL %c ' + message,
          'background:#d32f2f;color:#fff;padding:2px 4px;border-radius:3px;font-weight:bold',
          'color:inherit'
        );
        counter.failed++;
      }
    };
  }

  /**
   * In-memory localStorage stub. Keeps real localStorage untouched.
   * @param {Object} [seed] - initial key/value map
   * @returns {Object} storage-like object
   */
  function createMemoryStore(seed) {
    var _data = {};
    if (seed) {
      Object.keys(seed).forEach(function (k) { _data[k] = seed[k]; });
    }
    return {
      getItem: function (key) {
        return Object.prototype.hasOwnProperty.call(_data, key) ? _data[key] : null;
      },
      setItem: function (key, value) {
        _data[key] = String(value);
      },
      removeItem: function (key) {
        delete _data[key];
      },
      clear: function () {
        _data = {};
      }
    };
  }

  /**
   * Print suite summary and return the counts.
   * @param {string} label
   * @param {{passed:number, failed:number}} counter
   * @returns {{passed:number, failed:number, total:number}}
   */
  function finishSuite(label, counter) {
    var total = counter.passed + counter.failed;
    var summary = label + ': ' + counter.passed + '/' + total + ' passed';
    if (counter.failed === 0) {
      console.log(
        '%c ALL PASS %c ' + summary,
        'background:#388e3c;color:#fff;padding:3px 6px;border-radius:3px;font-weight:bold',
        'color:inherit'
      );
    } else {
      console.error(
        '%c ' + counter.failed + ' FAILED %c ' + summary,
        'background:#d32f2f;color:#fff;padding:3px 6px;border-radius:3px;font-weight:bold',
        'color:inherit'
      );
    }
    return { passed: counter.passed, failed: counter.failed, total: total };
  }

  window.__testUtils = {
    makeAssert: makeAssert,
    createMemoryStore: createMemoryStore,
    finishSuite: finishSuite
  };

}());

// ============================================================================
// Property-Based Tests: Theme Persistence
// Tests Properties 16 & 17 (Requirements 8.2, 8.4, 8.5)
// Usage: runThemeTests()
// ============================================================================

(function () {
  'use strict';

  var THEME_KEY = 'theme';

  var createMemoryStore = window.__testUtils.createMemoryStore;

  // --- Minimal theme logic (standalone, no app dependency) ---

  function getTheme(store) {
    try {
      var raw = store.getItem(THEME_KEY);
      if (!raw) return 'light';
      // setTheme persists JSON.stringify(theme); parse before comparing,
      // matching app.js safeStorageGet semantics.
      var parsed = JSON.parse(raw);
      return (parsed === 'light' || parsed === 'dark') ? parsed : 'light';
    } catch (_) {
      return 'light';
    }
  }

  function setTheme(store, theme) {
    store.setItem(THEME_KEY, JSON.stringify(theme));
  }

  function toggleTheme(store) {
    var current = getTheme(store);
    setTheme(store, current === 'light' ? 'dark' : 'light');
  }

  // --- Assertion helper (shared counters + shared assert) ---

  var counter = { passed: 0, failed: 0 };
  var assert = window.__testUtils.makeAssert(counter);

  // --- Property 16: Theme Toggle Round Trip ---

  function testThemeToggleRoundTrip() {
    console.groupCollapsed('Property 16 - Theme Toggle Round Trip');

    // Case A: start with 'light'
    (function () {
      var store = createMemoryStore();
      setTheme(store, 'light');

      var initial = getTheme(store);
      toggleTheme(store);
      var afterFirst = getTheme(store);
      toggleTheme(store);
      var afterSecond = getTheme(store);

      assert(initial === 'light',   'P16-A: initial theme is "light"');
      assert(afterFirst === 'dark', 'P16-A: after 1st toggle theme is "dark"');
      assert(afterSecond === 'light', 'P16-A: after 2nd toggle theme returns to "light"');
    }());

    // Case B: start with 'dark'
    (function () {
      var store = createMemoryStore();
      setTheme(store, 'dark');

      var initial = getTheme(store);
      toggleTheme(store);
      var afterFirst = getTheme(store);
      toggleTheme(store);
      var afterSecond = getTheme(store);

      assert(initial === 'dark',    'P16-B: initial theme is "dark"');
      assert(afterFirst === 'light','P16-B: after 1st toggle theme is "light"');
      assert(afterSecond === 'dark','P16-B: after 2nd toggle theme returns to "dark"');
    }());

    // Exhaustive: iterate all valid themes and double-toggle; each must be idempotent
    var themes = ['light', 'dark'];
    themes.forEach(function (startTheme) {
      var store = createMemoryStore();
      setTheme(store, startTheme);
      toggleTheme(store);
      toggleTheme(store);
      var result = getTheme(store);
      assert(
        result === startTheme,
        'P16 round-trip: starting "' + startTheme + '", two toggles -> "' + result + '" (expected "' + startTheme + '")'
      );
    });

    console.groupEnd();
  }

  // --- Property 17: Theme Persistence Round Trip ---

  function testThemePersistenceRoundTrip() {
    console.groupCollapsed('Property 17 - Theme Persistence Round Trip');

    var themes = ['light', 'dark'];

    themes.forEach(function (theme) {
      // Write then read back
      var store = createMemoryStore();
      setTheme(store, theme);
      var retrieved = getTheme(store);

      assert(
        retrieved === theme,
        'P17: save "' + theme + '" -> retrieve -> got "' + retrieved + '" (expected "' + theme + '")'
      );
    });

    // Saving one theme then overwriting with the other must also round-trip
    (function () {
      var store = createMemoryStore();
      setTheme(store, 'light');
      setTheme(store, 'dark');
      var retrieved = getTheme(store);
      assert(retrieved === 'dark', 'P17: overwrite "light" with "dark" -> retrieve -> "dark"');
    }());

    (function () {
      var store = createMemoryStore();
      setTheme(store, 'dark');
      setTheme(store, 'light');
      var retrieved = getTheme(store);
      assert(retrieved === 'light', 'P17: overwrite "dark" with "light" -> retrieve -> "light"');
    }());

    // Default when key is absent must be 'light'
    (function () {
      var store = createMemoryStore();
      var retrieved = getTheme(store);
      assert(retrieved === 'light', 'P17: absent key -> default theme is "light"');
    }());

    console.groupEnd();
  }

  // --- Test runner ---

  function runThemeTests() {
    counter.passed = 0;
    counter.failed = 0;

    console.group('Theme Property Tests (Properties 16 & 17)');
    testThemeToggleRoundTrip();
    testThemePersistenceRoundTrip();
    var result = window.__testUtils.finishSuite('Results', counter);
    console.groupEnd();

    return result;
  }

  window.runThemeTests = runThemeTests;

}());

// ============================================================================
// Property-Based Tests: Task Storage Round Trip
// Tests Property 10 (Requirements 4.6, 9.1, 9.2)
// Usage: runTaskStorageTests()
// ============================================================================

(function () {
  'use strict';

  var TASKS_KEY = 'tasks';

  function saveTasks(store, tasks) {
    store.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function getTasks(store) {
    try {
      var raw = store.getItem(TASKS_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  var createMemoryStore = window.__testUtils.createMemoryStore;

  var counter = { passed: 0, failed: 0 };
  var assert = window.__testUtils.makeAssert(counter);

  // --- Task fixture factory ---

  function makeTask(overrides) {
    var base = {
      id:          'task-' + Math.random().toString(36).substring(2, 8),
      title:       'Sample Task',
      description: 'A test description',
      createdAt:   Date.now(),
      completed:   false
    };
    if (overrides) {
      Object.keys(overrides).forEach(function (k) { base[k] = overrides[k]; });
    }
    return base;
  }

  // --- Property 10: Task Storage Round Trip ---

  function testTaskStorageRoundTrip() {
    console.groupCollapsed('Property 10 - Task Storage Round Trip');

    // Case A: Empty array round-trip
    (function () {
      var store = createMemoryStore();
      saveTasks(store, []);
      var result = getTasks(store);
      assert(Array.isArray(result),    'P10-A: empty array -> result is an array');
      assert(result.length === 0,      'P10-A: empty array -> length is 0');
    }());

    // Case B: Single task round-trip - all fields preserved
    (function () {
      var store = createMemoryStore();
      var task  = makeTask({ id: 'abc123', title: 'Buy groceries', description: 'Milk and eggs', createdAt: 1700000000000, completed: false });
      saveTasks(store, [task]);
      var result = getTasks(store);
      assert(result.length === 1,                      'P10-B: single task -> length is 1');
      assert(result[0].id          === task.id,        'P10-B: id preserved');
      assert(result[0].title       === task.title,     'P10-B: title preserved');
      assert(result[0].description === task.description, 'P10-B: description preserved');
      assert(result[0].createdAt   === task.createdAt, 'P10-B: createdAt preserved');
      assert(result[0].completed   === task.completed, 'P10-B: completed preserved');
    }());

    // Case C: Multiple tasks round-trip - length and each field matches
    (function () {
      var store = createMemoryStore();
      var tasks = [
        makeTask({ id: 'id-1', title: 'Task One',   description: 'First',  createdAt: 1700000001000, completed: false }),
        makeTask({ id: 'id-2', title: 'Task Two',   description: 'Second', createdAt: 1700000002000, completed: true  }),
        makeTask({ id: 'id-3', title: 'Task Three', description: 'Third',  createdAt: 1700000003000, completed: false })
      ];
      saveTasks(store, tasks);
      var result = getTasks(store);
      assert(result.length === 3, 'P10-C: three tasks -> length is 3');
      tasks.forEach(function (task, i) {
        assert(result[i].id          === task.id,          'P10-C[' + i + ']: id preserved');
        assert(result[i].title       === task.title,       'P10-C[' + i + ']: title preserved');
        assert(result[i].description === task.description, 'P10-C[' + i + ']: description preserved');
        assert(result[i].createdAt   === task.createdAt,   'P10-C[' + i + ']: createdAt preserved');
        assert(result[i].completed   === task.completed,   'P10-C[' + i + ']: completed preserved');
      });
    }());

    // Case D: Task with empty description
    (function () {
      var store = createMemoryStore();
      var task  = makeTask({ description: '' });
      saveTasks(store, [task]);
      var result = getTasks(store);
      assert(result.length === 1,         'P10-D: empty description -> length is 1');
      assert(result[0].description === '', 'P10-D: empty description is preserved as ""');
    }());

    // Case E: Task with completed=true
    (function () {
      var store = createMemoryStore();
      var task  = makeTask({ completed: true });
      saveTasks(store, [task]);
      var result = getTasks(store);
      assert(result.length === 1,           'P10-E: completed task -> length is 1');
      assert(result[0].completed === true,  'P10-E: completed=true is preserved');
    }());

    // Case F: Order preservation
    (function () {
      var store = createMemoryStore();
      var tasks = [
        makeTask({ id: 'first',  title: 'Alpha',   createdAt: 3000 }),
        makeTask({ id: 'second', title: 'Beta',    createdAt: 1000 }),
        makeTask({ id: 'third',  title: 'Gamma', createdAt: 2000 })
      ];
      saveTasks(store, tasks);
      var result = getTasks(store);
      assert(result.length === tasks.length,  'P10-F: order check -> same length');
      assert(result[0].id === 'first',        'P10-F: index 0 is "first"');
      assert(result[1].id === 'second',       'P10-F: index 1 is "second"');
      assert(result[2].id === 'third',        'P10-F: index 2 is "third"');
    }());

    // Case G: Absent key defaults to empty array
    (function () {
      var store  = createMemoryStore();
      var result = getTasks(store);
      assert(Array.isArray(result),  'P10-G: absent key -> result is an array');
      assert(result.length === 0,    'P10-G: absent key -> default is []');
    }());

    // Case H: Overwrite
    (function () {
      var store   = createMemoryStore();
      var tasks1  = [makeTask({ id: 'old', title: 'Old Task' })];
      var tasks2  = [makeTask({ id: 'new', title: 'New Task' })];
      saveTasks(store, tasks1);
      saveTasks(store, tasks2);
      var result  = getTasks(store);
      assert(result.length === 1,         'P10-H: overwrite -> only 1 task remains');
      assert(result[0].id === 'new',      'P10-H: overwrite -> latest task is "new"');
    }());

    console.groupEnd();
  }

  function runTaskStorageTests() {
    counter.passed = 0;
    counter.failed = 0;

    console.group('Task Storage Property Tests (Property 10)');
    testTaskStorageRoundTrip();
    var result = window.__testUtils.finishSuite('Results', counter);
    console.groupEnd();

    return result;
  }

  window.runTaskStorageTests = runTaskStorageTests;

}());

// ============================================================================
// Property-Based Tests: Greeting Component
// Tests Property 2 (Requirement 1.3) - Property 1 (Name Round Trip) removed with
// the custom-name feature in Phase 8.
// Usage: runGreetingTests()
// ============================================================================

(function () {
  'use strict';

  var createMemoryStore = window.__testUtils.createMemoryStore;

  /**
   * Time-based greeting for a given hour, mirroring app.js ranges:
   *   5-11 morning | 12-16 afternoon | 17-20 evening | 21-4 night.
   * @param {number} hour 0-23
   * @returns {string}
   */
  function getTimeBasedGreeting(hour) {
    if (hour >= 5  && hour <= 11) return 'morning';
    if (hour >= 12 && hour <= 16) return 'afternoon';
    if (hour >= 17 && hour <= 20) return 'evening';
    return 'night';
  }

  var counter = { passed: 0, failed: 0 };
  var assert = window.__testUtils.makeAssert(counter);

  // --- Property 2: Time-Based Greeting Correctness ---

  function testTimeBasedGreeting() {
    console.groupCollapsed('Property 2 - Time-Based Greeting Correctness');

    // Exhaustive: all 24 hours map to the right bucket
    for (var h = 0; h <= 23; h++) {
      var expected = 'night';
      if (h >= 5  && h <= 11) expected = 'morning';
      if (h >= 12 && h <= 16) expected = 'afternoon';
      if (h >= 17 && h <= 20) expected = 'evening';
      assert(
        getTimeBasedGreeting(h) === expected,
        'P2: hour ' + h + ' -> "' + expected + '"'
      );
    }

    // Boundary hours asserted explicitly
    assert(getTimeBasedGreeting(4)  === 'night',     'P2 boundary: 4 (4:59 AM)  -> night');
    assert(getTimeBasedGreeting(5)  === 'morning',  'P2 boundary: 5 (5:00 AM)  -> morning');
    assert(getTimeBasedGreeting(11) === 'morning',  'P2 boundary: 11 (11:59 AM) -> morning');
    assert(getTimeBasedGreeting(12) === 'afternoon', 'P2 boundary: 12 (12:00 PM) -> afternoon');
    assert(getTimeBasedGreeting(16) === 'afternoon', 'P2 boundary: 16 (4:59 PM) -> afternoon');
    assert(getTimeBasedGreeting(17) === 'evening',  'P2 boundary: 17 (5:00 PM) -> evening');
    assert(getTimeBasedGreeting(20) === 'evening',  'P2 boundary: 20 (8:59 PM) -> evening');
    assert(getTimeBasedGreeting(21) === 'night',     'P2 boundary: 21 (9:00 PM) -> night');
    assert(getTimeBasedGreeting(0)  === 'night',     'P2 boundary: 0 (midnight) -> night');

    console.groupEnd();
  }

  function runGreetingTests() {
    counter.passed = 0;
    counter.failed = 0;

    console.group('Greeting Property Tests (Property 2)');
    testTimeBasedGreeting();
    var result = window.__testUtils.finishSuite('Results', counter);
    console.groupEnd();

    return result;
  }

  window.runGreetingTests = runGreetingTests;

}());

// ============================================================================
// Property-Based Tests: Focus Timer
// Tests Properties 3 & 18 (Requirement 2.5; Phase 7 configurable duration)
// Usage: runTimerTests()
// ============================================================================

(function () {
  'use strict';

  var DURATION_SECONDS = 25 * 60; // 1500 - default & reset target (Req 2.1, 2.5)

  /**
   * Reset semantics from app.js resetTimer(): remaining -> 1500s, status -> idle,
   * from ANY state - regardless of the configured duration (Req 2.5).
   */
  function resetTimerState(timerState) {
    timerState.status = 'idle';
    timerState.timeRemaining = DURATION_SECONDS;
  }

  /**
   * formatTime from app.js (Phase 7): "MM:SS" below one hour, "HH:MM:SS"
   * whenever the CONFIGURED duration reached an hour (optional basis arg).
   */
  function formatTime(totalSeconds, durationSeconds) {
    var basis = (typeof durationSeconds === 'number') ? durationSeconds : totalSeconds;
    var hours   = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    function pad2(n) { return (n < 10 ? '0' : '') + n; }
    return basis >= 3600 ? pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds)
                        : pad2(minutes) + ':' + pad2(seconds);
  }

  /**
   * Duration-input parsing mirroring app.js setTimerDuration validation.
   * @param {string} hRaw - raw Hours input
   * @param {string} mRaw - raw Minutes input
   * @param {string} sRaw - raw Seconds input
   * @returns {{ok:boolean, total?:number, error?:string}}
   */
  function parseDurationInputs(hRaw, mRaw, sRaw) {
    var h = parseInt(hRaw, 10), m = parseInt(mRaw, 10), s = parseInt(sRaw, 10);
    if (isNaN(h) || isNaN(m) || isNaN(s) || h < 0 || m < 0 || s < 0) {
      return { ok: false, error: 'Duration values must be 0 or positive numbers' };
    }
    var total = h * 3600 + m * 60 + s;
    if (total <= 0) return { ok: false, error: 'Duration must be at least 1 second' };
    return { ok: true, total: total };
  }

  var counter = { passed: 0, failed: 0 };
  var assert = window.__testUtils.makeAssert(counter);

  // --- Property 3: Timer Reset Idempotence ---

  function testTimerResetIdempotence() {
    console.groupCollapsed('Property 3 - Timer Reset Idempotence');

    var states = [
      { label: 'idle (full 1500s)',      status: 'idle',     timeRemaining: 1500 },
      { label: 'running (partial 750s)',  status: 'running',  timeRemaining: 750  },
      { label: 'paused (partial 333s)',  status: 'paused',   timeRemaining: 333  },
      { label: 'complete (0s)',          status: 'complete', timeRemaining: 0    }
    ];

    states.forEach(function (s) {
      var timerState = { status: s.status, timeRemaining: s.timeRemaining };
      resetTimerState(timerState);
      assert(
        timerState.timeRemaining === 1500,
        'P3: from ' + s.label + ' -> reset -> ' + timerState.timeRemaining + 's (expected 1500)'
      );
      assert(
        timerState.status === 'idle',
        'P3: from ' + s.label + ' -> reset -> status "' + timerState.status + '" (expected "idle")'
      );
      assert(
        formatTime(timerState.timeRemaining) === '25:00',
        'P3: from ' + s.label + ' -> display "' + formatTime(timerState.timeRemaining) + '" (expected "25:00")'
      );
    });

    // Idempotence: consecutive resets keep 1500s
    (function () {
      var timerState = { status: 'complete', timeRemaining: 0 };
      resetTimerState(timerState);
      resetTimerState(timerState);
      resetTimerState(timerState);
      assert(
        timerState.timeRemaining === 1500 && timerState.status === 'idle',
        'P3: triple reset stays pinned at 1500s / idle'
      );
    }());

    console.groupEnd();
  }

  // --- Property 18 (Phase 7): Configurable Duration & HH:MM:SS Display ---

  function testConfigurableDuration() {
    console.groupCollapsed('Property 18 - Configurable Duration & HH:MM:SS Display');

    var displayCases = [
      { secs: 0,     expected: '00:00' },
      { secs: 59,    expected: '00:59' },
      { secs: 60,    expected: '01:00' },
      { secs: 1500,  expected: '25:00' },
      { secs: 3599,  expected: '59:59' },      // no hour basis -> MM:SS
      { secs: 3600,  expected: '01:00:00' },
      { secs: 7200,  expected: '02:00:00' },
      { secs: 90000, expected: '25:00:00' }   // 25 hours - no upper limit
    ];
    displayCases.forEach(function (c) {
      assert(formatTime(c.secs) === c.expected, 'P18 display: ' + c.secs + 's -> "' + formatTime(c.secs) + '" (expected "' + c.expected + '")');
    });

    // Duration-basis cases: a 1h-configured timer keeps HH:MM:SS under the hour mark
    assert(formatTime(3598, 3600) === '00:59:58', 'P18 basis: 3598s of 3600s timer -> "00:59:58" (HH kept)');
    assert(formatTime(60, 3600) === '00:01:00', 'P18 basis: 60s of 3600s timer -> "00:01:00"');
    assert(formatTime(3598, 1500) === '59:58', 'P18 basis: 3598s of 1500s basis -> "59:58" (sub-hour basis)');

    // Valid duration inputs accepted and totalled
    var validCases = [
      { h: '0', m: '25', s: '0',  total: 1500 },
      { h: '1', m: '0',  s: '0',  total: 3600 },
      { h: '0', m: '0',  s: '90', total: 90 },
      { h: '2', m: '30', s: '30', total: 9030 }
    ];
    validCases.forEach(function (c) {
      var r = parseDurationInputs(c.h, c.m, c.s);
      assert(r.ok === true && r.total === c.total, 'P18 valid: ' + c.h + 'h ' + c.m + 'm ' + c.s + 's -> ' + (r.ok ? r.total : r.error) + 's (expected ' + c.total + ')');
    });

    // Invalid inputs rejected: all-zero, negative, empty
    var invalidCases = [
      { h: '0', m: '0',  s: '0',  err: 'Duration must be at least 1 second' },
      { h: '-1', m: '0', s: '0',  err: 'Duration values must be 0 or positive numbers' },
      { h: '0', m: '-5', s: '0',  err: 'Duration values must be 0 or positive numbers' },
      { h: '0', m: '0',  s: '-1', err: 'Duration values must be 0 or positive numbers' },
      { h: '',  m: '',   s: '',   err: 'Duration values must be 0 or positive numbers' }
    ];
    invalidCases.forEach(function (c) {
      var r = parseDurationInputs(c.h, c.m, c.s);
      assert(r.ok === false && r.error === c.err, 'P18 invalid: "' + c.h + '","' + c.m + '","' + c.s + '" -> rejected "' + (r.error) + '"');
    });

    // Reset after custom duration returns to 25:00, not the custom value
    (function () {
      var timerState = { status: 'idle', timeRemaining: 9030 }; // 2h 30m 30s set earlier
      resetTimerState(timerState);
      assert(
        formatTime(timerState.timeRemaining) === '25:00',
        'P18: reset after custom 2h30m30s -> "' + formatTime(timerState.timeRemaining) + '" (expected "25:00", Req 2.5)'
      );
    }());

    console.groupEnd();
  }

  function runTimerTests() {
    counter.passed = 0;
    counter.failed = 0;

    console.group('Focus Timer Property Tests (Properties 3 & 18)');
    testTimerResetIdempotence();
    testConfigurableDuration();
    var result = window.__testUtils.finishSuite('Results', counter);
    console.groupEnd();

    return result;
  }

  window.runTimerTests = runTimerTests;

}());

// ============================================================================
// Property-Based Tests: Task CRUD Operations
// Tests Properties 4-9 and 11-13 (Requirements 3, 4, 5, 6)
// Usage: runTaskCreationTests() / runTaskDisplayTests() / runTaskUpdateDeleteTests()
// ============================================================================

(function () {
  'use strict';

  var TASKS_KEY = 'tasks';

  var createMemoryStore = window.__testUtils.createMemoryStore;

  var counter = { passed: 0, failed: 0 };
  var assert = window.__testUtils.makeAssert(counter);

  // --- Standalone task data layer (mirrors app.js CRUD behavior) ---

  function getTasks(store) {
    try {
      var raw = store.getItem(TASKS_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveTasks(store, tasks) {
    store.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  function validateTaskTitle(title, tasks, excludeId) {
    if (!title || title.trim() === '') {
      return { valid: false, error: 'Title cannot be empty' };
    }
    var normalized = title.toLowerCase().trim();
    var isDuplicate = tasks.some(function (task) {
      return task.id !== excludeId && task.title.toLowerCase().trim() === normalized;
    });
    if (isDuplicate) {
      return { valid: false, error: 'A task with this title already exists' };
    }
    return { valid: true };
  }

  function addTask(store, title, description) {
    var tasks = getTasks(store);
    var validation = validateTaskTitle(title, tasks);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    var newTask = {
      id:          generateId(),
      title:       title.trim(),
      description: (description || '').trim(),
      createdAt:   Date.now(),
      completed:   false
    };
    tasks.push(newTask);
    saveTasks(store, tasks);
    return { success: true, task: newTask };
  }

  function updateTask(store, id, updates) {
    var tasks = getTasks(store);
    var index = tasks.findIndex(function (t) { return t.id === id; });
    if (index === -1) {
      return { success: false, error: 'Task not found' };
    }
    if (updates.title !== undefined) {
      var validation = validateTaskTitle(updates.title, tasks, id);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
      updates.title = updates.title.trim();
    }
    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }
    tasks[index] = Object.assign({}, tasks[index], updates);
    saveTasks(store, tasks);
    return { success: true, task: tasks[index] };
  }

  function deleteTask(store, id) {
    var tasks = getTasks(store);
    var filtered = tasks.filter(function (t) { return t.id !== id; });
    saveTasks(store, filtered);
    return { success: true };
  }

  function toggleTaskCompletion(store, id) {
    var tasks = getTasks(store);
    var task = tasks.find(function (t) { return t.id === id; });
    if (!task) return { success: false };
    return updateTask(store, id, { completed: !task.completed });
  }

  function sortTasks(tasks, sortBy) {
    var sorted = tasks.slice();
    switch (sortBy) {
      case 'newest':       return sorted.sort(function (a, b) { return b.createdAt - a.createdAt; });
      case 'oldest':       return sorted.sort(function (a, b) { return a.createdAt - b.createdAt; });
      case 'alphabetical': return sorted.sort(function (a, b) { return a.title.localeCompare(b.title); });
      case 'incomplete':   return sorted.sort(function (a, b) { return a.completed - b.completed; });
      default:             return sorted;
    }
  }

  // --- Task fixture factory ---

  function makeTask(overrides) {
    var base = {
      id:          'task-' + Math.random().toString(36).substring(2, 8),
      title:       'Sample Task',
      description: 'A test description',
      createdAt:   Date.now(),
      completed:   false
    };
    if (overrides) {
      Object.keys(overrides).forEach(function (k) { base[k] = overrides[k]; });
    }
    return base;
  }

  // --- Property 4: Empty Title Rejection ---

  function testEmptyTitleRejection() {
    console.groupCollapsed('Property 4 - Empty Title Rejection');

    ['', '   ', '\t', '\n', ' \t \n '].forEach(function (bad) {
      var store = createMemoryStore();
      var result = addTask(store, bad, 'desc');
      assert(
        result.success === false && result.error === 'Title cannot be empty',
        'P4: title ' + JSON.stringify(bad) + ' -> rejected with "Title cannot be empty"'
      );
      assert(
        getTasks(store).length === 0,
        'P4: title ' + JSON.stringify(bad) + ' -> nothing saved'
      );
    });

    console.groupEnd();
  }

  // --- Property 5: Case-Insensitive Duplicate Title Prevention ---

  function testDuplicateTitlePrevention() {
    console.groupCollapsed('Property 5 - Case-Insensitive Duplicate Title Prevention');

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Task A', '');
      var result = addTask(store, 'Task A', 'other');
      assert(result.success === false, 'P5: exact repeat "Task A" -> rejected');
    }());

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Task A', '');
      var result = addTask(store, 'TASK A', '');
      assert(result.success === false, 'P5: "TASK A" vs "Task A" -> rejected');
    }());

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Task A', '');
      var result = addTask(store, '  task a ', '');
      assert(result.success === false, 'P5: "  task a " vs "Task A" -> rejected');
    }());

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Buy milk', '');
      var result = addTask(store, 'buy milk', '');
      assert(
        result.error === 'A task with this title already exists',
        'P5: duplicate error message is "A task with this title already exists"'
      );
    }());

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Alpha', '');
      var result = addTask(store, 'Alphabet', '');
      assert(result.success === true, 'P5: distinct titles ("Alpha" vs "Alphabet") both accepted');
      assert(getTasks(store).length === 2, 'P5: two distinct tasks saved');
    }());

    console.groupEnd();
  }

  // --- Property 6: Task Creation Field Integrity ---

  function testTaskCreationFieldIntegrity() {
    console.groupCollapsed('Property 6 - Task Creation Field Integrity');

    (function () {
      var store = createMemoryStore();
      var result = addTask(store, '  Padded Title  ', '  Padded description  ');
      var task = result.task;

      assert(result.success === true,      'P6: valid submission succeeds');
      assert(typeof task.id === 'string' && task.id.length > 0, 'P6: id present and non-empty');
      assert(task.title === 'Padded Title', 'P6: title trimmed to "Padded Title"');
      assert(task.description === 'Padded description', 'P6: description trimmed');
      assert(typeof task.createdAt === 'number' && task.createdAt > 0, 'P6: createdAt is a valid epoch');
      assert(task.completed === false,    'P6: completed defaults to false');
    }());

    (function () {
      var store = createMemoryStore();
      var ids = [];
      for (var i = 0; i < 5; i++) {
        var r = addTask(store, 'Task ' + i, '');
        ids.push(r.task.id);
      }
      var unique = ids.filter(function (v, idx, arr) { return arr.indexOf(v) === idx; });
      assert(unique.length === 5, 'P6: five creations produce 5 distinct ids');
    }());

    (function () {
      var store = createMemoryStore();
      var r = addTask(store, 'No Description', undefined);
      assert(r.task.description === '', 'P6: missing description saved as ""');
    }());

    console.groupEnd();
  }

  // --- Property 7: Task List Rendering Completeness ---

  function testTaskListRenderingCompleteness() {
    console.groupCollapsed('Property 7 - Task List Rendering Completeness');

    function renderTitles(store) {
      return getTasks(store).map(function (t) { return { id: t.id, title: t.title }; });
    }

    (function () {
      var store = createMemoryStore();
      var tasks = [
        makeTask({ id: 't1', title: 'First',  createdAt: 1000, completed: false }),
        makeTask({ id: 't2', title: 'Second', createdAt: 2000, completed: true  }),
        makeTask({ id: 't3', title: 'Third',  createdAt: 3000, completed: false })
      ];
      saveTasks(store, tasks);

      var rendered = renderTitles(store);
      assert(rendered.length === 3, 'P7: 3 stored tasks -> 3 rendered entries');
      tasks.forEach(function (t) {
        var found = rendered.some(function (r) { return r.id === t.id && r.title === t.title; });
        assert(found, 'P7: task "' + t.title + '" rendered with visible title');
      });
    }());

    (function () {
      var store = createMemoryStore();
      var rendered = renderTitles(store);
      assert(rendered.length === 0, 'P7: empty storage -> empty render');
    }());

    console.groupEnd();
  }

  // --- Property 8: Sorting Correctness ---

  function testSortingCorrectness() {
    console.groupCollapsed('Property 8 - Sorting Correctness');

    var fixture = [
      makeTask({ id: 's1', title: 'Banana', createdAt: 3000, completed: true  }),
      makeTask({ id: 's2', title: 'apple',  createdAt: 1000, completed: false }),
      makeTask({ id: 's3', title: 'Cherry',  createdAt: 2000, completed: false }),
      makeTask({ id: 's4', title: 'Date',   createdAt: 4000, completed: true  })
    ];

    assert(
      sortTasks(fixture, 'newest').map(function (t) { return t.id; }).join(',') === 's4,s1,s3,s2',
      'P8: newest -> s4 (4000), s1 (3000), s3 (2000), s2 (1000)'
    );

    assert(
      sortTasks(fixture, 'oldest').map(function (t) { return t.id; }).join(',') === 's2,s3,s1,s4',
      'P8: oldest -> s2 (1000), s3 (2000), s1 (3000), s4 (4000)'
    );

    assert(
      sortTasks(fixture, 'alphabetical').map(function (t) { return t.id; }).join(',') === 's2,s1,s3,s4',
      'P8: alphabetical -> apple, Banana, Cherry, Date'
    );

    var incompleteFirst = sortTasks(fixture, 'incomplete').map(function (t) { return t.completed; });
    assert(
      incompleteFirst.join(',') === 'false,false,true,true',
      'P8: incomplete -> all incomplete before complete'
    );

    (function () {
      var input = fixture.slice();
      sortTasks(input, 'newest');
      assert(
        input.map(function (t) { return t.id; }).join(',') === 's1,s2,s3,s4',
        'P8: sorting does not mutate the input array'
      );
    }());

    console.groupEnd();
  }

  // --- Property 9: Description Toggle Round Trip ---

  function testDescriptionToggleRoundTrip() {
    console.groupCollapsed('Property 9 - Description Toggle Round Trip');

    function makeToggleState() {
      return { collapsed: true, ariaExpanded: 'false', glyph: '▶' };
    }
    function toggle(state) {
      state.collapsed = !state.collapsed;
      state.ariaExpanded = state.collapsed ? 'false' : 'true';
      state.glyph = state.collapsed ? '▶' : '▼';
    }

    (function () {
      var s = makeToggleState();
      assert(s.collapsed === true, 'P9: description starts collapsed by default');
    }());

    (function () {
      var s = makeToggleState();
      toggle(s);
      var afterFirst = { collapsed: s.collapsed, ariaExpanded: s.ariaExpanded, glyph: s.glyph };
      toggle(s);
      assert(
        afterFirst.collapsed === false && afterFirst.ariaExpanded === 'true' && afterFirst.glyph === '▼',
        'P9: first toggle -> expanded, aria-expanded="true", glyph "▼"'
      );
      assert(
        s.collapsed === true && s.ariaExpanded === 'false' && s.glyph === '▶',
        'P9: second toggle -> back to collapsed / "false" / "▶" (round trip)'
      );
    }());

    (function () {
      var s = makeToggleState();
      toggle(s); toggle(s); toggle(s); toggle(s);
      assert(s.collapsed === true, 'P9: four toggles -> original collapsed state');
    }());

    console.groupEnd();
  }

  // --- Property 11: Edit Duplicate Prevention ---

  function testEditDuplicatePrevention() {
    console.groupCollapsed('Property 11 - Edit Duplicate Prevention');

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Alpha', '');
      addTask(store, 'Beta', '');
      var alphaId = getTasks(store)[0].id;
      var result = updateTask(store, alphaId, { title: 'beta' });
      assert(result.success === false, 'P11: rename "Alpha" -> "beta" blocked (duplicate of "Beta")');
      assert(getTasks(store)[0].title === 'Alpha', 'P11: original title unchanged after blocked rename');
    }());

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Alpha', '');
      addTask(store, 'Beta', '');
      var alphaId = getTasks(store)[0].id;
      var result = updateTask(store, alphaId, { title: 'alpha' });
      assert(result.success === true, 'P11: self-rename "Alpha" -> "alpha" allowed (excludes itself)');
      assert(getTasks(store)[0].title === 'alpha', 'P11: self-rename persisted as trimmed "alpha"');
    }());

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Alpha', '');
      var alphaId = getTasks(store)[0].id;
      var result = updateTask(store, alphaId, { title: '   ' });
      assert(result.success === false && result.error === 'Title cannot be empty', 'P11: rename to whitespace-only blocked');
    }());

    console.groupEnd();
  }

  // --- Property 12: Completion Toggle Round Trip ---

  function testCompletionToggleRoundTrip() {
    console.groupCollapsed('Property 12 - Completion Toggle Round Trip');

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Toggle Me', '');
      var id = getTasks(store)[0].id;

      var before = getTasks(store)[0].completed;
      toggleTaskCompletion(store, id);
      var afterFirst = getTasks(store)[0].completed;
      toggleTaskCompletion(store, id);
      var afterSecond = getTasks(store)[0].completed;

      assert(before === false,   'P12: task starts incomplete');
      assert(afterFirst === true,  'P12: first toggle -> completed');
      assert(afterSecond === false, 'P12: second toggle -> back to incomplete (round trip)');
    }());

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Only One', '');
      var before = getTasks(store);
      var result = toggleTaskCompletion(store, 'missing-id');
      assert(result.success === false, 'P12: toggling nonexistent id -> failure result');
      assert(getTasks(store).length === before.length, 'P12: list unchanged after failed toggle');
    }());

    console.groupEnd();
  }

  // --- Property 13: Task Deletion Completeness ---

  function testTaskDeletionCompleteness() {
    console.groupCollapsed('Property 13 - Task Deletion Completeness');

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Keep Me', '');
      addTask(store, 'Delete Me', '');
      var deleteId = getTasks(store).find(function (t) { return t.title === 'Delete Me'; }).id;

      var result = deleteTask(store, deleteId);
      var remaining = getTasks(store);

      assert(result.success === true, 'P13: delete reports success');
      assert(remaining.length === 1, 'P13: exactly one task remains');
      assert(
        !remaining.some(function (t) { return t.id === deleteId; }),
        'P13: deleted id absent from storage'
      );
      assert(remaining[0].title === 'Keep Me', 'P13: other tasks untouched');
    }());

    (function () {
      var store = createMemoryStore();
      addTask(store, 'Survivor', '');
      deleteTask(store, 'missing-id');
      var after = getTasks(store);
      assert(after.length === 1 && after[0].title === 'Survivor', 'P13: deleting absent id leaves list unchanged');
    }());

    console.groupEnd();
  }

  // --- Test runners ---

  function runTaskCreationTests() {
    counter.passed = 0;
    counter.failed = 0;

    console.group('Task Creation Property Tests (Properties 4-6)');
    testEmptyTitleRejection();
    testDuplicateTitlePrevention();
    testTaskCreationFieldIntegrity();
    var result = window.__testUtils.finishSuite('Results', counter);
    console.groupEnd();

    return result;
  }

  function runTaskDisplayTests() {
    counter.passed = 0;
    counter.failed = 0;

    console.group('Task Display & Sorting Property Tests (Properties 7-9)');
    testTaskListRenderingCompleteness();
    testSortingCorrectness();
    testDescriptionToggleRoundTrip();
    var result = window.__testUtils.finishSuite('Results', counter);
    console.groupEnd();

    return result;
  }

  function runTaskUpdateDeleteTests() {
    counter.passed = 0;
    counter.failed = 0;

    console.group('Task Update & Delete Property Tests (Properties 11-13)');
    testEditDuplicatePrevention();
    testCompletionToggleRoundTrip();
    testTaskDeletionCompleteness();
    var result = window.__testUtils.finishSuite('Results', counter);
    console.groupEnd();

    return result;
  }

  window.runTaskCreationTests = runTaskCreationTests;
  window.runTaskDisplayTests = runTaskDisplayTests;
  window.runTaskUpdateDeleteTests = runTaskUpdateDeleteTests;

}());

// ============================================================================
// Property-Based Tests: Quick Links
// Tests Properties 14 & 15 (Requirements 7.2, 7.3, 7.7)
// Usage: runLinkTests()
// ============================================================================

(function () {
  'use strict';

  var LINKS_KEY = 'quickLinks';

  var createMemoryStore = window.__testUtils.createMemoryStore;

  var counter = { passed: 0, failed: 0 };
  var assert = window.__testUtils.makeAssert(counter);

  // --- Standalone link data layer (mirrors app.js behavior) ---

  function getLinks(store) {
    try {
      var raw = store.getItem(LINKS_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveLinks(store, links) {
    store.setItem(LINKS_KEY, JSON.stringify(links));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  function validateLink(name, url) {
    if (!name || name.trim() === '') return { valid: false, error: 'Link name is required' };
    if (!url  || url.trim()  === '') return { valid: false, error: 'URL is required' };
    return { valid: true };
  }

  function addLink(store, name, url) {
    var validation = validateLink(name, url);
    if (!validation.valid) return { success: false, error: validation.error };

    var normalizedUrl = url.trim();
    if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    var links = getLinks(store);
    var newLink = {
      id:   generateId(),
      name: name.trim(),
      url:  normalizedUrl
    };
    links.push(newLink);
    saveLinks(store, links);
    return { success: true, link: newLink };
  }

  function deleteLink(store, id) {
    var links = getLinks(store);
    var filtered = links.filter(function (l) { return l.id !== id; });
    saveLinks(store, filtered);
    return { success: true };
  }

  // --- Property 14: Link Validation ---

  function testLinkValidation() {
    console.groupCollapsed('Property 14 - Link Validation');

    ['', '   '].forEach(function (badName) {
      var result = validateLink(badName, 'https://example.com');
      assert(
        result.valid === false && result.error === 'Link name is required',
        'P14: name ' + JSON.stringify(badName) + ' -> "Link name is required"'
      );
    });

    ['', '   '].forEach(function (badUrl) {
      var result = validateLink('My Link', badUrl);
      assert(
        result.valid === false && result.error === 'URL is required',
        'P14: url ' + JSON.stringify(badUrl) + ' -> "URL is required"'
      );
    });

    (function () {
      var result = validateLink('', '');
      assert(
        result.valid === false && result.error === 'Link name is required',
        'P14: both empty -> name error reported first'
      );
    }());

    (function () {
      var store = createMemoryStore();
      var result = addLink(store, ' \t ', 'https://example.com');
      assert(result.success === false, 'P14: whitespace-only name -> rejected via addLink');
      assert(getLinks(store).length === 0, 'P14: nothing saved on rejected link');
    }());

    (function () {
      var store = createMemoryStore();
      var result = addLink(store, 'My Link', '   ');
      assert(result.success === false && result.error === 'URL is required', 'P14: whitespace-only URL -> rejected');
    }());

    (function () {
      var result = validateLink('Docs', 'https://docs.example.com');
      assert(result.valid === true, 'P14: valid name+URL -> passes');
    }());

    console.groupEnd();
  }

  // --- Property 15: Link Storage Round Trip ---

  function testLinkStorageRoundTrip() {
    console.groupCollapsed('Property 15 - Link Storage Round Trip');

    var cases = [
      { name: 'GitHub',        url: 'https://github.com',        expect: 'https://github.com' },
      { name: 'Localhost',     url: 'http://localhost:3000',     expect: 'http://localhost:3000' },
      { name: 'No Protocol',   url: 'example.com',               expect: 'https://example.com' },
      { name: 'No Protocol 2', url: '  www.wikipedia.org  ',     expect: 'https://www.wikipedia.org' }
    ];

    cases.forEach(function (c) {
      var store = createMemoryStore();
      var added = addLink(store, c.name, c.url);
      assert(added.success === true, 'P15: link "' + c.name + '" added');

      var back = getLinks(store);
      assert(back.length === 1, 'P15: link "' + c.name + '" -> exactly one stored');
      assert(back[0].name === c.name, 'P15: "' + c.name + '" name preserved');
      assert(back[0].url === c.expect, 'P15: "' + c.name + '" url "' + c.url + '" -> stored as "' + back[0].url + '" (expected "' + c.expect + '")');
    });

    (function () {
      var store = createMemoryStore();
      addLink(store, 'Search', 'google.com');
      var firstId = getLinks(store)[0].id;
      deleteLink(store, firstId);
      var second = addLink(store, 'Search', 'duckduckgo.com');
      assert(second.success === true, 'P15: re-adding same name after delete succeeds (no link uniqueness)');
      assert(getLinks(store).length === 1, 'P15: exactly one link remains after delete + re-add');
    }());

    (function () {
      var store = createMemoryStore();
      assert(getLinks(store).length === 0, 'P15: absent key -> default is []');
    }());

    console.groupEnd();
  }

  function runLinkTests() {
    counter.passed = 0;
    counter.failed = 0;

    console.group('Quick Links Property Tests (Properties 14 & 15)');
    testLinkValidation();
    testLinkStorageRoundTrip();
    var result = window.__testUtils.finishSuite('Results', counter);
    console.groupEnd();

    return result;
  }

  window.runLinkTests = runLinkTests;

}());

// ============================================================================
// Combined test runner
// ============================================================================

(function () {
  'use strict';

  function runAllTests() {
    console.group('Full Test Suite');

    var theme         = window.runThemeTests();
    var storage       = window.runTaskStorageTests();
    var greeting      = window.runGreetingTests();
    var timer         = window.runTimerTests();
    var taskCreation  = window.runTaskCreationTests();
    var taskDisplay   = window.runTaskDisplayTests();
    var taskUpdateDel = window.runTaskUpdateDeleteTests();
    var links         = window.runLinkTests();

    var suites = [theme, storage, greeting, timer, taskCreation, taskDisplay, taskUpdateDel, links];
    var totalPassed = 0, totalFailed = 0, total = 0;
    suites.forEach(function (s) {
      totalPassed += s.passed;
      totalFailed += s.failed;
      total += s.total;
    });
    var summary = 'Grand total: ' + totalPassed + '/' + total + ' passed';

    if (totalFailed === 0) {
      console.log(
        '%c ALL PASS %c ' + summary,
        'background:#388e3c;color:#fff;padding:3px 6px;border-radius:3px;font-weight:bold',
        'color:inherit'
      );
    } else {
      console.error(
        '%c ' + totalFailed + ' FAILED %c ' + summary,
        'background:#d32f2f;color:#fff;padding:3px 6px;border-radius:3px;font-weight:bold',
        'color:inherit'
      );
    }

    console.groupEnd();

    return {
      theme: theme,
      storage: storage,
      greeting: greeting,
      timer: timer,
      taskCreation: taskCreation,
      taskDisplay: taskDisplay,
      taskUpdateDelete: taskUpdateDel,
      links: links,
      passed: totalPassed,
      failed: totalFailed,
      total: total
    };
  }

  window.runAllTests = runAllTests;

}());
