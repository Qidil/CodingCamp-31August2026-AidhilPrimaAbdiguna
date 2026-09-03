# Requirements Document

## Introduction

The To-Do List Life Dashboard is a browser-based personal productivity application that provides users with an interactive dashboard interface. The dashboard combines essential productivity tools including personalized greetings, a focus timer, task management, and quick access links. All data is persisted locally in the browser, ensuring user privacy and offline functionality.

## Glossary

- **Dashboard**: The main application interface displaying all components
- **Greeting Component**: The section displaying personalized time-based messages and information
- **Focus Timer**: A 25-minute countdown timer for productivity sessions
- **To-Do List**: A task management system supporting CRUD operations
- **Quick Links**: A collection of user-defined URL shortcuts
- **Local Storage**: Browser-based persistent data storage mechanism
- **Light Mode**: A visual theme with light background colors
- **Dark Mode**: A visual theme with dark background colors
- **Browser Notification**: System-level alerts displayed outside the browser window

## Requirements

### Requirement 1: Greeting Component

**User Story:** As a user, I want to see a personalized greeting when I open the dashboard, so that I feel welcomed and informed about the current time and date.

#### Acceptance Criteria

1. THE Dashboard SHALL display the current date and time in a human-readable format.
2. THE Dashboard SHALL display a custom name that the user can set and modify.
3. WHEN the time of day changes, THE Dashboard SHALL display a time-based message according to the following schedule: "Good morning" (5:00 AM - 11:59 AM), "Good afternoon" (12:00 PM - 4:59 PM), "Good evening" (5:00 PM - 8:59 PM), or "Good night" (9:00 PM - 4:59 AM).
4. THE Dashboard SHALL persist the custom name in Local Storage.
5. WHEN the Dashboard loads, THE Dashboard SHALL retrieve and display the stored custom name from Local Storage.

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute focus timer with controls, so that I can manage my productivity sessions effectively.

#### Acceptance Criteria

1. THE Focus Timer SHALL display a countdown starting at 25 minutes.
2. THE Focus Timer SHALL provide Start, Stop, and Reset control buttons.
3. WHEN the Start button is clicked, THE Focus Timer SHALL begin counting down from the current displayed time.
4. WHEN the Stop button is clicked, THE Focus Timer SHALL pause the countdown and maintain the current displayed time.
5. WHEN the Reset button is clicked, THE Focus Timer SHALL reset the countdown to 25 minutes.
6. WHEN the countdown reaches zero, THE Focus Timer SHALL trigger a browser notification.
7. IF browser notifications are not permitted, THE Focus Timer SHALL display an in-app alert.
8. WHILE the timer is running, THE Focus Timer SHALL continue counting down in the background.

### Requirement 3: To-Do List - Create Operation

**User Story:** As a user, I want to add new tasks with titles and descriptions, so that I can track my activities.

#### Acceptance Criteria

1. THE To-Do List SHALL provide an input form for task title and description.
2. WHEN a user submits a new task, THE To-Do List SHALL validate that the title is not empty.
3. THE To-Do List SHALL prevent creation of tasks with duplicate titles on a case-insensitive basis.
4. WHEN a duplicate title is detected, THE To-Do List SHALL display an error message to the user.
5. WHEN a valid task is submitted, THE To-Do List SHALL save the task to Local Storage with a unique identifier, title, description, creation timestamp, and completion status.
6. THE To-Do List SHALL display newly created tasks with the description collapsed by default.

### Requirement 4: To-Do List - Read Operation

**User Story:** As a user, I want to view my tasks with various sorting options, so that I can organize and prioritize my work.

#### Acceptance Criteria

1. THE To-Do List SHALL display all saved tasks with their titles visible.
2. THE To-Do List SHALL provide sorting options: newest first, oldest first, alphabetical, and incomplete first.
3. WHEN a sorting option is selected, THE To-Do List SHALL reorder and display tasks accordingly.
4. THE To-Do List SHALL display task descriptions in a collapsed state by default.
5. WHEN a task's expand/collapse control is clicked, THE To-Do List SHALL toggle the visibility of the description.
6. WHEN the Dashboard loads, THE To-Do List SHALL retrieve and display all tasks from Local Storage.

### Requirement 5: To-Do List - Update Operation

**User Story:** As a user, I want to edit my existing tasks, so that I can correct or update information as needed.

#### Acceptance Criteria

1. THE To-Do List SHALL provide an edit function for each task.
2. WHEN the edit function is activated, THE To-Do List SHALL display editable fields for title and description.
3. WHEN an edited title matches an existing task title on a case-insensitive basis, THE To-Do List SHALL prevent the update and display an error message.
4. WHEN a valid update is submitted, THE To-Do List SHALL update the task in Local Storage and refresh the display.
5. WHEN the completion status of a task is toggled, THE To-Do List SHALL update the completion status in Local Storage.

### Requirement 6: To-Do List - Delete Operation

**User Story:** As a user, I want to remove tasks I no longer need, so that my list remains relevant and organized.

#### Acceptance Criteria

1. THE To-Do List SHALL provide a delete function for each task.
2. WHEN the delete function is activated, THE To-Do List SHALL remove the task from Local Storage.
3. WHEN a task is deleted, THE To-Do List SHALL refresh the display to reflect the removal.

### Requirement 7: Quick Links

**User Story:** As a user, I want to save custom links with names, so that I can quickly access frequently used websites.

#### Acceptance Criteria

1. THE Quick Links component SHALL provide input fields for link name and URL.
2. WHEN a user submits a new link, THE Quick Links component SHALL validate that both name and URL are provided.
3. WHEN a valid link is submitted, THE Quick Links component SHALL save the link to Local Storage.
4. THE Quick Links component SHALL display saved links as clickable elements.
5. WHEN a saved link is clicked, THE Quick Links component SHALL open the URL in a new browser tab.
6. THE Quick Links component SHALL provide a delete function for each saved link.
7. WHEN the Dashboard loads, THE Quick Links component SHALL retrieve and display all saved links from Local Storage.

### Requirement 8: Theme Toggle

**User Story:** As a user, I want to switch between light and dark themes, so that I can customize the dashboard appearance to my preference and environment.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a theme toggle button fixed in the bottom-right corner.
2. WHEN the theme toggle button is clicked, THE Dashboard SHALL switch between Light Mode and Dark Mode.
3. THE Dashboard SHALL apply the selected theme to all components and elements.
4. THE Dashboard SHALL persist the theme preference in Local Storage.
5. WHEN the Dashboard loads, THE Dashboard SHALL retrieve and apply the stored theme preference from Local Storage.

### Requirement 9: Data Persistence

**User Story:** As a user, I want my data to persist between sessions, so that I do not lose my tasks, links, and settings when I close the browser.

#### Acceptance Criteria

1. THE Dashboard SHALL store all user data in the browser's Local Storage.
2. WHEN the Dashboard is closed and reopened, THE Dashboard SHALL restore all tasks, quick links, custom name, and theme preference.
3. THE Dashboard SHALL maintain data integrity across browser sessions.

### Requirement 10: Responsive Design

**User Story:** As a user, I want the dashboard to work on different screen sizes, so that I can use it on desktop, tablet, and mobile devices.

#### Acceptance Criteria

1. THE Dashboard SHALL display correctly on desktop screens (minimum width 1024px).
2. THE Dashboard SHALL display correctly on tablet screens (width 768px to 1023px).
3. THE Dashboard SHALL display correctly on mobile screens (maximum width 767px).
4. WHEN the viewport size changes, THE Dashboard SHALL adjust the layout responsively.
5. THE Dashboard SHALL ensure all interactive elements remain accessible at all screen sizes.

### Requirement 11: Technology Stack

**User Story:** As a developer, I want the application built with vanilla technologies, so that it remains lightweight and maintainable.

#### Acceptance Criteria

1. THE Dashboard SHALL be built using vanilla HTML without frameworks.
2. THE Dashboard SHALL use vanilla CSS without preprocessors or frameworks.
3. THE Dashboard SHALL use vanilla JavaScript without libraries or frameworks.
4. THE Dashboard SHALL use a single CSS file located in a css/ directory.
5. THE Dashboard SHALL use a single JavaScript file located in a js/ directory.
