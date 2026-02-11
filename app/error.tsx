'use client';

// Root error boundary for the entire app

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-dark-surface rounded-lg shadow-lg p-8 text-center border border-dark-border">
        <div className="text-red-400 text-5xl mb-4">!</div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Something went wrong</h2>
        <p className="text-gray-400 mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-accent text-dark-bg font-medium rounded-lg hover:bg-accent-light transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
