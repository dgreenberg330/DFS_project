// Root loading state for the app

export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent border-r-transparent"></div>
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
