"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6 opacity-20 select-none">♚</div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-gray-500 text-sm mb-8">An unexpected error occurred. Try refreshing the page.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={reset} className="btn-primary px-6">Try Again</button>
          <Link href="/" className="btn-secondary px-6">Go Home</Link>
        </div>
      </div>
    </div>
  );
}
