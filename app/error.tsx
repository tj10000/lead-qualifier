"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6 text-center py-16">
      <p className="text-warm-900 font-semibold text-lg">Something went wrong</p>
      <p className="text-warm-500 text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-xl bg-coral-500 hover:bg-coral-600 text-white
                   font-medium py-2.5 px-6 transition-colors duration-150"
      >
        Try again
      </button>
    </div>
  );
}
