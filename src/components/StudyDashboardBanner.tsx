/** Place after the timer dashboard content, inside its main layout container. */
export default function StudyDashboardBanner() {
  return (
    <aside
      aria-label="Website services promotion"
      className="mt-8 w-full shrink-0 border-t border-white/10 px-4 py-4 text-center sm:px-6"
    >
      <p className="mx-auto max-w-2xl text-xs font-normal leading-relaxed text-slate-400 sm:text-sm">
        This is your sign to start the business you’ve been thinking about. Get a
        website from{' '}
        <a
          href="https://chadrosedigital.co.za"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm text-cyan-300/90 underline decoration-cyan-300/30 underline-offset-4 transition-colors hover:text-cyan-200 hover:decoration-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 motion-reduce:transition-none"
        >
          chadrosedigital.co.za
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </aside>
  );
}
