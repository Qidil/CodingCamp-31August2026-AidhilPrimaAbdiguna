# Implementation Plan: To-Do List Life Dashboard

## Overview

Build a single-page browser application with vanilla HTML, CSS, and JavaScript featuring four main components: Greeting, Focus Timer, To-Do List, and Quick Links. All data persists via Local Storage with light/dark theme support.

## Tasks

- [x] 1. Set up project structure and base HTML
  - [x] 1.1 Create project directory structure (css/, js/)
    - Create `css/` directory
    - Create `js/` directory
    - Create `index.html` with semantic HTML structure
    - _Requirements: 11.1, 11.4, 11.5_

- [x] 2. Implement CSS foundation and theme system
  - [x] 2.1 Create base styles with CSS custom properties
    - Define CSS variables for colors, spacing, typography
    - Create light theme as default
    - Create dark theme under `[data-theme="dark"]`
    - Implement responsive breakpoints (mobile, tablet, desktop)
    - _Requirements: 8.3, 10.1, 10.2, 10.3, 10.4_

  - [x] 2.2 Write property tests for theme persistence
    - **Property 16: Theme Toggle Round Trip** - clicking toggle twice returns to original theme
    - **Property 17: Theme Persistence Round Trip** - saving and retrieving theme from storage returns same value
    - **Validates: Requirements 8.2, 8.4, 8.5**

- [x] 3. Implement Greeting component
  - [x] 3.1 Create Greeting HTML structure and styles
    - Add datetime display, greeting text, and name input elements
    - Style greeting section with responsive layout
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Implement Greeting JavaScript logic
    - Implement `getTimeBasedGreeting(hour)` function
    - Implement `formatDateTime(date)` function
    - Implement `updateGreeting()` function
    - Implement `setCustomName(name)` function
    - Initialize greeting on page load with stored name
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 3.3 Write property tests for Greeting component
    - **Property 1: Name Round Trip** - setting and retrieving name returns exact same value
    - **Property 2: Time-Based Greeting Correctness** - correct greeting for each hour range
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

- [x] 4. Implement Focus Timer component
  - [x] 4.1 Create Focus Timer HTML structure and styles
    - Add timer display and control buttons (Start, Stop, Reset)
    - Style timer section with clear visual hierarchy
    - _Requirements: 2.1, 2.2_

  - [x] 4.2 Implement Focus Timer JavaScript logic
    - Implement timer state machine (idle, running, paused, complete)
    - Implement `initTimer()`, `startTimer()`, `stopTimer()`, `resetTimer()` functions
    - Implement `tick()` function for countdown
    - Implement `formatTime(seconds)` for MM:SS display
    - Implement `completeTimer()` with notification support
    - Implement `notifyCompletion()` with fallback to in-app alert
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 4.3 Write property tests for Focus Timer
    - **Property 3: Timer Reset Idempotence** - reset always sets timer to exactly 25 minutes
    - **Validates: Requirements 2.5**

- [x] 5. Implement To-Do List component - Data layer
  - [x] 5.1 Create task data model and storage functions
    - Define task object structure (id, title, description, createdAt, completed)
    - Implement `generateTaskId()` function
    - Implement `getTasks()` and `saveTasks()` functions
    - Implement `safeStorageGet()` and `safeStorageSet()` helpers
    - _Requirements: 3.5, 4.6, 9.1, 9.2_

  - [x] 5.2 Write property tests for task storage
    - **Property 10: Task Storage Round Trip** - saving and retrieving tasks returns equivalent array
    - **Validates: Requirements 4.6, 9.1, 9.2**

- [x] 6. Implement To-Do List component - Create operation
  - [x] 6.1 Create To-Do List HTML structure and styles
    - Add task form with title input, description textarea, and submit button
    - Add sorting controls section
    - Add task list container
    - Style task items with expand/collapse support
    - _Requirements: 3.1, 3.6, 4.1, 4.4_

  - [x] 6.2 Implement task creation logic
    - Implement `validateTaskTitle()` with empty check and duplicate detection
    - Implement `createTask()` function
    - Render new task with collapsed description
    - Display inline error messages for validation failures
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 6.3 Write property tests for task creation
    - **Property 4: Empty Title Rejection** - empty/whitespace titles are rejected
    - **Property 5: Case-Insensitive Duplicate Title Prevention** - duplicate titles (case-insensitive) are rejected
    - **Property 6: Task Creation Field Integrity** - created tasks have all required fields
    - **Validates: Requirements 3.2, 3.3, 3.5**

- [x] 7. Implement To-Do List component - Read operation
  - [x] 7.1 Implement task display and sorting
    - Implement `renderTasks()` function
    - Implement `sortTasks()` with all sorting options (newest, oldest, alphabetical, incomplete)
    - Load and display tasks on page load
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [x] 7.2 Implement description toggle
    - Implement `toggleDescription()` function
    - Add expand/collapse button click handlers
    - _Requirements: 4.4, 4.5_

  - [x] 7.3 Write property tests for task display
    - **Property 7: Task List Rendering Completeness** - all tasks displayed with visible titles
    - **Property 8: Sorting Correctness** - sorted tasks follow specified criteria
    - **Property 9: Description Toggle Round Trip** - double toggle returns to original state
    - **Validates: Requirements 4.1, 4.3, 4.5_

- [x] 8. Implement To-Do List component - Update and Delete operations
  - [x] 8.1 Implement task update logic
    - Add edit form to task item template
    - Implement `updateTask()` function with duplicate validation
    - Implement `toggleTaskCompletion()` function
    - Handle edit form submission and cancellation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 8.2 Implement task delete logic
    - Implement `deleteTask()` function
    - Add delete button click handler
    - Refresh display after deletion
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.3 Write property tests for update/delete
    - **Property 11: Edit Duplicate Prevention** - updating to duplicate title is prevented
    - **Property 12: Completion Toggle Round Trip** - double toggle returns to original state
    - **Property 13: Task Deletion Completeness** - deleted task no longer exists in storage
    - **Validates: Requirements 5.3, 5.5, 6.2_

- [x] 9. Implement Quick Links component
  - [x] 9.1 Create Quick Links HTML structure and styles
    - Add link form with name and URL inputs
    - Add link list container
    - Style link items as clickable elements
    - _Requirements: 7.1, 7.4_

  - [x] 9.2 Implement Quick Links JavaScript logic
    - Implement `validateLink()` function
    - Implement `createLink()`, `getLinks()`, `deleteLink()` functions
    - Implement `openLink()` to open in new tab
    - Load and display links on page load
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 9.3 Write property tests for Quick Links
    - **Property 14: Link Validation** - empty name or URL fails validation
    - **Property 15: Link Storage Round Trip** - saving and retrieving link returns same data
    - **Validates: Requirements 7.2, 7.3, 7.7_

- [x] 10. Implement Theme Manager
  - [x] 10.1 Create theme toggle button
    - Add fixed theme toggle button in bottom-right corner
    - Add theme icon (🌓)
    - _Requirements: 8.1_

  - [x] 10.2 Implement theme JavaScript logic
    - Implement `getTheme()`, `setTheme()`, `applyTheme()`, `toggleTheme()` functions
    - Initialize theme on page load from storage
    - Apply theme to all components
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [x] 11. Wire everything together in app.js
  - [x] 11.1 Create main initialization flow
    - Initialize all components on DOMContentLoaded
    - Set up event listeners for all interactions
    - Request notification permission
    - Start greeting time update interval
    - _Requirements: 1.5, 2.6, 4.6, 7.7, 8.5, 9.2_

- [x] 12. Checkpoint - Verify all components work together
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement responsive design refinements
  - [x] 13.1 Add responsive layout styles
    - Implement desktop 4-column grid layout (≥1024px)
    - Implement tablet 2-column layout (768px-1023px)
    - Implement mobile single-column layout (≤767px)
    - Ensure all interactive elements accessible at all sizes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 14. Final checkpoint - Complete integration testing
  - Ensure all tests pass, verify responsive design works correctly.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All code uses vanilla HTML, CSS, and JavaScript per Requirements 11

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "6.1", "9.1", "10.1"] },
    { "id": 2, "tasks": ["2.2", "5.1"] },
    { "id": 3, "tasks": ["3.2", "4.2", "5.2", "6.2", "7.1", "8.1", "9.2", "10.2"] },
    { "id": 4, "tasks": ["3.3", "4.3", "6.3", "7.2", "7.3", "8.2", "8.3", "9.3"] },
    { "id": 5, "tasks": ["11.1"] },
    { "id": 6, "tasks": ["13.1"] }
  ]
}
```
