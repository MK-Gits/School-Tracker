# School Tracker

## Run the application (frontend & backend concurrently):
```bash
npm run dev
```
## Dev Local:
URL : jdbc:postgresql://localhost:5432/postgres
host: localhost / 5432
 
## Features
- **Dashboard**: High-level overview of grade progress, daily tasks, and syllabus tracking.
- **Daily Tracker**: Simple schedule planning and checkboxes for daily habits.
- **Syllabus & Homework**: Reorderable syllabus curriculum tracker supporting custom grade templates and offline-first reordering.
- **Gradebook**: Grade average calculators and subject test scores.
- **Activities**: Track skill, coding, and sports progress.
- **Study Notes**: Rich text study note-taking by subject.
- **Clubs Tracker**: Comprehensive directory for tracking high school clubs, leadership roles, upcoming meetings, tasks, logged volunteer hours, and major milestone updates.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.