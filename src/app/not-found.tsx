import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6 opacity-20 select-none">♟</div>
        <h1 className="text-6xl font-black text-amber-400 mb-2">404</h1>
        <p className="text-xl font-semibold mb-2">Page not found</p>
        <p className="text-gray-500 text-sm mb-8">This page doesn't exist or was moved.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/" className="btn-primary px-6">Go Home</Link>
          <Link href="/play" className="btn-secondary px-6">Play Chess</Link>
        </div>
      </div>
    </div>
  );
}
