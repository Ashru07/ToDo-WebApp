# Todo Dashboard

A modern, responsive to-do dashboard built with React, Vite, and Tailwind CSS.

## Features

- **Task Management**: Create, read, update, and delete tasks with ease
- **Smart Filtering**: Filter tasks by status (All, Active, Completed)
- **Search**: Search tasks in real-time
- **Priority Levels**: Low, Medium, High priority badges
- **Categories**: Organize tasks by categories (Personal, Work, Shopping, etc.)
- **Dark Mode**: Toggle between light and dark themes
- **Progress Tracking**: Visual progress bar and statistics dashboard
- **Local Storage**: Tasks persist automatically in browser storage
- **Modern UI**: Glassmorphism design with smooth animations
- **Responsive**: Works seamlessly on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to the URL shown (typically `http://localhost:5173`)

### Build

```bash
npm run build
```

Build output will be in the `dist/` directory.

### Lint

```bash
npm run lint
```

### Run Tests

```bash
npm test
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Vitest** - Fast unit testing framework

## Project Structure

```
src/
├── App.jsx          # Main application component
├── main.jsx         # Entry point
└── index.css        # Global styles and Tailwind imports

public/
└── vite.svg         # Favicon

package.json
vite.config.js
tailwind.config.js
postcss.config.js
```

## Development Notes

- All task data is stored in browser `localStorage`
- Dark mode preference is also persisted
- The app uses React hooks for state management
- Custom animations are defined in `tailwind.config.js`
- Glassmorphism effects use backdrop blur and transparency

## Browser Support

Modern browsers with support for:
- CSS backdrop-filter
- CSS Grid
- ES6+

Chrome, Firefox, Safari, Edge (latest versions)
