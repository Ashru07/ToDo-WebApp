# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Todo Dashboard** - a modern, responsive to-do list web application built with **React 18**, **Vite**, and **Tailwind CSS**. The app features a glassmorphism UI design with dark mode support, task filtering, search, progress tracking, and category/priority management.

## Tech Stack

- **React 18** - Component-based UI library with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Vitest** - Unit testing framework (React Testing Library)
- **ESLint** - Code quality

## Key Architecture

### State Management
- Uses local React state with `useState` hooks
- All task data is persisted to `localStorage`
- State structure:
  - `todos`: Array of task objects with `id`, `text`, `completed`, `priority`, `category`, `createdAt`, `dueDate`
  - `newTodo`: String for new task input
  - `filter`: 'all' | 'active' | 'completed'
  - `searchQuery`: String for search
  - `darkMode`: Boolean
  - `showStats`: Boolean for stats panel visibility

### Data Flow
1. User adds/edits/deletes tasks → state updates → automatically persisted to localStorage
2. Filtering and search operate on the todos array client-side
3. Dark mode preference also stored in localStorage

### Main Components (Single File Architecture)
The entire UI is in `src/App.jsx`:
- Header with title and dark mode toggle
- Stats dashboard (4 cards: total, active, completed, progress %)
- Progress bar showing completion percentage
- Left column: Add task form, Priority/Category stats
- Right column: Search, filter buttons, Todo list
- Each todo item shows: checkbox, text, priority badge, category badge, edit/delete buttons

### Styling Strategy
- Tailwind utility classes for most styling
- Custom `glass` class for glassmorphism effect (uses backdrop blur)
- Custom animations defined in `tailwind.config.js` (`fade-in`, `slide-up`)
- Dark mode using `class` strategy on `html` element
- Responsive breakpoints: `md:` and `lg:` variants

## Common Development Commands

### Install dependencies
```bash
npm install
```

### Start development server
```bash
npm run dev
```
Opens at `http://localhost:5173` with hot reload.

### Build for production
```bash
npm run build
```
Output goes to `dist/` folder.

### Preview production build
```bash
npm run preview
```

### Run tests
```bash
npm test
```
Vitest with React Testing Library, JSDOM environment.

### Run linter
```bash
npm run lint
```
ESLint with React-specific rules.

## Project Structure

```
.
├── src/
│   ├── App.jsx          - Main component with all UI and logic
│   ├── App.test.jsx     - Unit tests for app
│   ├── main.jsx         - React entry point
│   ├── index.css        - Tailwind imports + custom component styles
│   └── setupTests.js    - Test setup
├── public/
│   └── vite.svg         - Favicon
├── index.html           - HTML template
├── package.json         - Dependencies and scripts
├── vite.config.js       - Vite configuration
├── tailwind.config.js   - Tailwind + custom animations/theme
├── postcss.config.js    - PostCSS for Tailwind
├── vitest.config.js     - Test configuration
├── .eslintrc.js         - ESLint configuration
├── .gitignore
└── README.md            - User-facing documentation
```

## Testing Approach

- Tests are in `src/App.test.jsx`
- Uses `@testing-library/react` for component rendering and interaction
- Tests cover:
  - Rendering of key UI elements
  - Adding new tasks
  - Not adding empty tasks
  - Toggling task completion
  - Deleting tasks
  - Filtering tasks (all/active/completed)
- localStorage is mocked

## Development Best Practices

1. **Component Structure**: Keep it simple - all UI in `App.jsx`. If the app grows, split into components in `src/components/`.

2. **Styling**: Use Tailwind utilities primarily. Custom styles in `index.css` under `@layer components` for reusable patterns like `.glass`, `.btn-primary`, `.input-field`.

3. **Colors**: Use Tailwind's default palette. Dark mode variants: `dark:bg-slate-800`, `dark:text-slate-100`, etc.

4. **Accessibility**: Use semantic HTML where possible, proper ARIA labels for icon buttons (`aria-label`).

5. **Performance**: LocalStorage writes are batched in `useEffect`. No heavy computations - filtering/search is O(n) on small arrays.

6. **State Updates**: Use functional updates when necessary: `setTodos(prev => [...])` to avoid state race conditions.

7. **Animations**: Favor CSS animations over JS. Use `animate-fade-in`, `animate-slide-up` classes with style-based delays for staggered effects.

## Important Notes

- No backend - all data is client-side only in `localStorage`
- No authentication required
- No external API dependencies
- The app uses `lucide-react` icons - ensure they're imported from `'lucide-react'`
- For CI/CD: `npm ci` preferred for clean installs from package-lock.json
- The `.eslintrc.js` disables `react-hooks/exhaustive-deps` for this simple app

## Future Considerations

If expanding this app, consider:
- Splitting `App.jsx` into components: `Header`, `StatsPanel`, `TodoForm`, `TodoList`, `TodoItem`
- Adding due dates with calendar picker
- Drag-and-drop reordering
- Backend integration (REST or GraphQL)
- User accounts and syncing
- Advanced filtering (by priority, category, date range)
- Bulk operations (select multiple, delete all completed)

## Known Issues

None currently. The app is fully functional as is.
