"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-bg-primary">
      <div className="max-w-md w-full text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Error</p>
        <h1 className="mt-3 text-3xl font-bold text-text-primary">Something went wrong</h1>
        <p className="mt-3 text-text-secondary">
          We hit an unexpected issue. Try again, or refresh the page.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors duration-200 hover:bg-accent-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
