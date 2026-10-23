# Study dashboard banner

The supplied attachment is an app specification, not application source. This component is ready for integration; it has not been installed or tested in the actual dashboard.

1. Copy `StudyDashboardBanner.tsx` into your React app’s components directory.
2. Import it into your study dashboard:

   ```tsx
   import StudyDashboardBanner from './components/StudyDashboardBanner';
   ```

3. Render `<StudyDashboardBanner />` after the main timer/dashboard content, inside the dashboard layout container. Adjust the import path to match your project.

The banner stays in normal document flow to avoid covering timer controls. It inherits the app font and background, wraps on small screens, and uses a subtle border, muted slate text, and a cyan link consistent with the supplied design brief. The link opens in a new tab with `noopener noreferrer` and has a visible keyboard focus indicator.

Uses React, TypeScript, and standard Tailwind utilities, with no additional dependencies, environment variables, backend, or external assets. Commit alongside the existing app in GitHub and deploy using its existing Vercel build settings. A standalone component is not a complete deployable app; full deployment verification requires the app source and build configuration.
