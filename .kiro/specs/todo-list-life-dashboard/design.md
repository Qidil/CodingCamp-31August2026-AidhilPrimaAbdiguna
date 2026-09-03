# Design Document

## Overview

The To-Do List Life Dashboard is a single-page browser application built with vanilla HTML, CSS, and JavaScript. It provides a personalized productivity interface with four main components: Greeting, Focus Timer, To-Do List, and Quick Links. All data persists via Local Storage, supporting offline functionality and user privacy.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Dashboard (index.html)                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   App Controller                         │ │
│  │              (js/app.js - Main Entry)                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐ │
│  │  Greeting  │ │   Focus    │ │  To-Do     │ │  Quick    │ │
│  │ Component  │ │   Timer    │ │   List     │ │  Links    │ │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Storage Service (localStorage)              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Theme Manager (Light/Dark)                  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
project-root/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Single stylesheet
└── js/
    └── app.js              # Single JavaScript file
```

## Component Design

### 1. Greeting Component

**Responsibility:** Display personalized time-based greeting, current date/time, and custom user name.

**Data Model:**
```javascript
// Stored in Local Storage
const greetingData = {
  customName: string  // Default: "User"
};
```

**Key Functions:**
```javascript
// Get time-based greeting based on current hour
function getTimeBasedGreeting(hour) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

// Format current date and time
function formatDateTime(date) {
  // Returns human-readable format: "Monday, January 15, 2024 at 2:30 PM"
}

// Update greeting display
function updateGreeting() {
  // Updates DOM with current time, greeting, and custom name
}

// Set custom name
function setCustomName(name) {
  // Validates, saves to storage, updates display
}
```

**DOM Structure:**
```html
<section id="greeting-component">
  <div id="datetime-display"></div>
  <h1 id="greeting-text"></h1>
  <div id="name-input-container">
    <input type="text" id="custom-name" placeholder="Enter your name" />
    <button id="save-name-btn">Save</button>
  </div>
</section>
```

### 2. Focus Timer Component

**Responsibility:** Provide a 25-minute countdown timer with start/stop/reset controls and browser notification on completion.

**State Machine:**
```
┌─────────┐  Start   ┌─────────┐  Stop    ┌─────────┐
│  IDLE   │ ───────> │ RUNNING │ ───────> │ PAUSED  │
│ (25:00) │ <─────── │         │ <─────── │         │
└─────────┘  Reset   └─────────┘  Start   └─────────┘
     ^          │          │                    │
     │          │          │ Complete           │ Reset
     │          │          v                    │
     │          │     ┌─────────┐               │
     └──────────┴──── │COMPLETE │───────────────┘
                        │ Notify│
                        └─────────┘
```

**Data Model:**
```javascript
const timerState = {
  status: 'idle' | 'running' | 'paused' | 'complete',
  timeRemaining: number,  // Seconds remaining
  intervalId: number | null
};
```

**Key Functions:**
```javascript
// Initialize timer to 25 minutes
function initTimer() {
  timerState.timeRemaining = 25 * 60; // 1500 seconds
  timerState.status = 'idle';
}

// Start countdown
function startTimer() {
  if (timerState.status === 'complete') return;
  timerState.status = 'running';
  timerState.intervalId = setInterval(tick, 1000);
}

// Timer tick - decrement by 1 second
function tick() {
  if (timerState.timeRemaining > 0) {
    timerState.timeRemaining--;
    updateTimerDisplay();
  } else {
    completeTimer();
  }
}

// Stop/pause timer
function stopTimer() {
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
  timerState.status = 'paused';
}

// Reset timer to 25 minutes
function resetTimer() {
  stopTimer();
  initTimer();
  updateTimerDisplay();
}

// Handle timer completion
function completeTimer() {
  stopTimer();
  timerState.status = 'complete';
  notifyCompletion();
}

// Display notification
function notifyCompletion() {
  if (Notification.permission === 'granted') {
    new Notification('Focus Timer Complete', {
      body: 'Great job! Your 25-minute focus session is done.'
    });
  } else {
    showInAppAlert('Focus timer complete!');
  }
}

// Format time for display (MM:SS)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

**DOM Structure:**
```html
<section id="focus-timer-component">
  <h2>Focus Timer</h2>
  <div id="timer-display">25:00</div>
  <div id="timer-controls">
    <button id="start-btn">Start</button>
    <button id="stop-btn">Stop</button>
    <button id="reset-btn">Reset</button>
  </div>
</section>
```

### 3. To-Do List Component

**Responsibility:** Manage tasks with CRUD operations, prevent duplicate titles, support sorting, and toggle description visibility.

**Data Model:**
```javascript
// Individual Task
const task = {
  id: string,           // Unique identifier (UUID or timestamp)
  title: string,        // Task title (required, unique case-insensitive)
  description: string,  // Task description (optional)
  createdAt: number,    // Creation timestamp (epoch ms)
  completed: boolean    // Completion status
};

// Task list stored in Local Storage
const taskList = task[];  // Array of tasks
```

**Key Functions:**
```javascript
// Generate unique ID
function generateTaskId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate task title
function validateTaskTitle(title, existingTasks, excludeId = null) {
  if (!title || title.trim() === '') {
    return { valid: false, error: 'Title cannot be empty' };
  }
  
  const normalizedTitle = title.toLowerCase().trim();
  const isDuplicate = existingTasks.some(task => 
    task.id !== excludeId && task.title.toLowerCase().trim() === normalizedTitle
  );
  
  if (isDuplicate) {
    return { valid: false, error: 'A task with this title already exists' };
  }
  
  return { valid: true };
}

// Create task
function createTask(title, description) {
  const tasks = getTasks();
  const validation = validateTaskTitle(title, tasks);
  
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  const newTask = {
    id: generateTaskId(),
    title: title.trim(),
    description: description.trim(),
    createdAt: Date.now(),
    completed: false
  };
  
  tasks.push(newTask);
  saveTasks(tasks);
  return { success: true, task: newTask };
}

// Read/Get all tasks
function getTasks() {
  const stored = localStorage.getItem('tasks');
  return stored ? JSON.parse(stored) : [];
}

// Update task
function updateTask(taskId, updates) {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  
  if (index === -1) {
    return { success: false, error: 'Task not found' };
  }
  
  if (updates.title !== undefined) {
    const validation = validateTaskTitle(updates.title, tasks, taskId);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    updates.title = updates.title.trim();
  }
  
  tasks[index] = { ...tasks[index], ...updates };
  saveTasks(tasks);
  return { success: true, task: tasks[index] };
}

// Delete task
function deleteTask(taskId) {
  const tasks = getTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  saveTasks(filtered);
  return { success: true };
}

// Toggle task completion
function toggleTaskCompletion(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) return { success: false };
  
  return updateTask(taskId, { completed: !task.completed });
}

// Sort tasks
function sortTasks(tasks, sortBy) {
  const sorted = [...tasks];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'incomplete':
      return sorted.sort((a, b) => a.completed - b.completed);
    default:
      return sorted;
  }
}

// Save tasks to storage
function saveTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Toggle description visibility
function toggleDescription(taskElement) {
  const desc = taskElement.querySelector('.task-description');
  desc.classList.toggle('collapsed');
}
```

**DOM Structure:**
```html
<section id="todo-list-component">
  <h2>To-Do List</h2>
  
  <form id="task-form">
    <input type="text" id="task-title" placeholder="Task title" required />
    <textarea id="task-description" placeholder="Description (optional)"></textarea>
    <button type="submit">Add Task</button>
  </form>
  
  <div id="sorting-controls">
    <button data-sort="newest">Newest First</button>
    <button data-sort="oldest">Oldest First</button>
    <button data-sort="alphabetical">Alphabetical</button>
    <button data-sort="incomplete">Incomplete First</button>
  </div>
  
  <div id="task-list">
    <!-- Task items rendered here -->
  </div>
</section>

<!-- Task Item Template -->
<div class="task-item" data-task-id="">
  <div class="task-header">
    <input type="checkbox" class="task-complete" />
    <span class="task-title"></span>
    <button class="expand-btn">▼</button>
    <button class="edit-btn">Edit</button>
    <button class="delete-btn">Delete</button>
  </div>
  <div class="task-description collapsed"></div>
  <div class="task-edit-form hidden">
    <input type="text" class="edit-title" />
    <textarea class="edit-description"></textarea>
    <button class="save-edit-btn">Save</button>
    <button class="cancel-edit-btn">Cancel</button>
  </div>
</div>
```

### 4. Quick Links Component

**Responsibility:** Manage user-defined URL shortcuts with names.

**Data Model:**
```javascript
// Individual Link
const link = {
  id: string,     // Unique identifier
  name: string,   // Display name (required)
  url: string     // URL (required)
};

// Links stored in Local Storage
const linkList = link[];
```

**Key Functions:**
```javascript
// Validate link input
function validateLink(name, url) {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Link name is required' };
  }
  if (!url || url.trim() === '') {
    return { valid: false, error: 'URL is required' };
  }
  return { valid: true };
}

// Create link
function createLink(name, url) {
  const validation = validateLink(name, url);
  
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  const links = getLinks();
  const newLink = {
    id: generateLinkId(),
    name: name.trim(),
    url: url.trim()
  };
  
  links.push(newLink);
  saveLinks(links);
  return { success: true, link: newLink };
}

// Get all links
function getLinks() {
  const stored = localStorage.getItem('quickLinks');
  return stored ? JSON.parse(stored) : [];
}

// Delete link
function deleteLink(linkId) {
  const links = getLinks();
  const filtered = links.filter(l => l.id !== linkId);
  saveLinks(filtered);
  return { success: true };
}

// Open link in new tab
function openLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Save links to storage
function saveLinks(links) {
  localStorage.setItem('quickLinks', JSON.stringify(links));
}
```

**DOM Structure:**
```html
<section id="quick-links-component">
  <h2>Quick Links</h2>
  
  <form id="link-form">
    <input type="text" id="link-name" placeholder="Link name" required />
    <input type="url" id="link-url" placeholder="URL" required />
    <button type="submit">Add Link</button>
  </form>
  
  <div id="link-list">
    <!-- Link items rendered here -->
  </div>
</section>

<!-- Link Item Template -->
<div class="link-item" data-link-id="">
  <a href="" class="link-anchor" target="_blank" rel="noopener noreferrer"></a>
  <button class="delete-link-btn">Delete</button>
</div>
```

### 5. Theme Manager

**Responsibility:** Manage light/dark theme switching with persistence.

**Data Model:**
```javascript
const themeState = {
  theme: 'light' | 'dark'  // Default: 'light'
};
```

**Key Functions:**
```javascript
// Get current theme
function getTheme() {
  const stored = localStorage.getItem('theme');
  return stored || 'light';
}

// Set theme
function setTheme(theme) {
  localStorage.setItem('theme', theme);
  applyTheme(theme);
}

// Apply theme to DOM
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Toggle theme
function toggleTheme() {
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  setTheme(next);
}
```

**DOM Structure:**
```html
<button id="theme-toggle" class="fixed-button" aria-label="Toggle theme">
  <span class="theme-icon">🌓</span>
</button>
```

## Storage Schema

All data stored in Local Storage with the following keys:

| Key | Type | Description |
|-----|------|-------------|
| `customName` | string | User's custom display name |
| `tasks` | JSON string | Array of task objects |
| `quickLinks` | JSON string | Array of link objects |
| `theme` | string | Current theme ('light' or 'dark') |

## Error Handling

### Input Validation Errors

| Component | Error Condition | User Feedback |
|-----------|----------------|---------------|
| Greeting | Empty name | Inline error message |
| To-Do List | Empty title | Inline error: "Title cannot be empty" |
| To-Do List | Duplicate title | Inline error: "A task with this title already exists" |
| Quick Links | Empty name | Inline error: "Link name is required" |
| Quick Links | Empty URL | Inline error: "URL is required" |

### Notification Permission

```javascript
function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  return Notification.permission === 'granted';
}
```

### Storage Error Handling

```javascript
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
```

## Responsive Design

### Breakpoints

```css
/* Mobile: max-width 767px */
/* Tablet: 768px - 1023px */
/* Desktop: min-width 1024px */

:root {
  --breakpoint-mobile: 767px;
  --breakpoint-tablet: 1023px;
}
```

### Layout Adjustments

- **Desktop (≥1024px):** Four-column grid layout, components side-by-side
- **Tablet (768px-1023px):** Two-column layout, stacked components
- **Mobile (≤767px):** Single-column layout, full-width components

## CSS Architecture

### CSS Custom Properties

```css
:root {
  /* Light theme (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent-color: #4a90d9;
  --border-color: #e0e0e0;
  --error-color: #d32f2f;
  --success-color: #388e3c;
}

[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --text-primary: #eaeaea;
  --text-secondary: #b0b0b0;
  --accent-color: #64b5f6;
  --border-color: #2d3748;
}
```

### Component Styles

Each component follows the BEM naming convention:
- Block: `component-name`
- Element: `component-name__element`
- Modifier: `component-name--modifier`

## Initialization Flow

```javascript
// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize theme
  initTheme();
  
  // 2. Initialize greeting
  initGreeting();
  
  // 3. Initialize timer
  initTimer();
  
  // 4. Load and render tasks
  renderTasks();
  
  // 5. Load and render quick links
  renderLinks();
  
  // 6. Request notification permission
  requestNotificationPermission();
  
  // 7. Start greeting time update interval
  setInterval(updateGreeting, 60000);
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Name Round Trip

*For any* valid name string, setting the custom name and then retrieving it from storage SHALL return the exact same name.

**Validates: Requirements 1.2, 1.4, 1.5**

### Property 2: Time-Based Greeting Correctness

*For any* valid hour (0-23), the greeting function SHALL return the correct time-based message: "Good morning" for hours 5-11, "Good afternoon" for hours 12-16, "Good evening" for hours 17-20, and "Good night" for hours 21-4.

**Validates: Requirements 1.3**

### Property 3: Timer Reset Idempotence

*For any* timer state (idle, running, paused, or complete), calling the reset function SHALL always set the timer back to exactly 25 minutes (1500 seconds).

**Validates: Requirements 2.5**

### Property 4: Empty Title Rejection

*For any* string that is empty or contains only whitespace characters, the task validation function SHALL reject the title as invalid.

**Validates: Requirements 3.2**

### Property 5: Case-Insensitive Duplicate Title Prevention

*For any* two task titles that match when compared case-insensitively (after trimming whitespace), the second task creation SHALL be rejected with a duplicate error.

**Validates: Requirements 3.3**

### Property 6: Task Creation Field Integrity

*For any* valid task submission with title and description, the created task SHALL contain a unique identifier, the trimmed title, the trimmed description, a valid creation timestamp, and a completion status of false.

**Validates: Requirements 3.5**

### Property 7: Task List Rendering Completeness

*For any* array of tasks in storage, the render function SHALL display all tasks with their titles visible in the DOM.

**Validates: Requirements 4.1**

### Property 8: Sorting Correctness

*For any* array of tasks and any sorting option (newest, oldest, alphabetical, incomplete), the sort function SHALL return tasks ordered according to the specified criteria.

**Validates: Requirements 4.3**

### Property 9: Description Toggle Round Trip

*For any* task item in any expanded/collapsed state, clicking the expand/collapse control twice SHALL return the description to its original visibility state.

**Validates: Requirements 4.5**

### Property 10: Task Storage Round Trip

*For any* array of valid tasks, saving to Local Storage and then retrieving SHALL return an equivalent array of tasks.

**Validates: Requirements 4.6, 9.1, 9.2**

### Property 11: Edit Duplicate Prevention

*For any* task being edited, if the new title matches another existing task's title on a case-insensitive basis, the update SHALL be prevented.

**Validates: Requirements 5.3**

### Property 12: Completion Toggle Round Trip

*For any* task, toggling the completion status twice SHALL return the task to its original completion state.

**Validates: Requirements 5.5**

### Property 13: Task Deletion Completeness

*For any* task in the list, after deletion that task SHALL no longer exist in Local Storage.

**Validates: Requirements 6.2**

### Property 14: Link Validation

*For any* link submission with an empty name or empty URL, validation SHALL fail with an appropriate error message.

**Validates: Requirements 7.2**

### Property 15: Link Storage Round Trip

*For any* valid link with name and URL, saving to Local Storage and then retrieving SHALL return a link with the same name and URL.

**Validates: Requirements 7.3, 7.7**

### Property 16: Theme Toggle Round Trip

*For any* theme state (light or dark), clicking the theme toggle button twice SHALL return to the original theme.

**Validates: Requirements 8.2**

### Property 17: Theme Persistence Round Trip

*For any* theme (light or dark), saving the theme preference and then retrieving from Local Storage SHALL return the same theme.

**Validates: Requirements 8.4, 8.5**

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:
- Specific date/time formatting examples
- Empty/whitespace input validation
- Boundary conditions for time-based greeting (4:59 AM, 5:00 AM, 11:59 AM, 12:00 PM, etc.)
- Task creation with specific examples
- Link creation with specific examples

### Property-Based Tests

Property-based tests verify universal properties across all inputs:
- All 17 properties defined above
- Use property testing library (e.g., fast-check or jsverify)
- Minimum 100 iterations per property
- Generate random inputs: strings, task lists, link lists, time values

### Integration Tests

Integration tests verify component interactions:
- Timer state machine transitions
- Storage operations with actual localStorage mock
- Notification permission handling
- Full data persistence cycle (save, reload, verify)

### Smoke Tests

Smoke tests verify basic functionality:
- All UI elements present on page load
- Theme toggle button functionality
- Timer controls visible and interactive
- Form inputs present and accessible
