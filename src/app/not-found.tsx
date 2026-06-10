import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-brand/3 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md text-center">
        {/* Logo lockup */}
        <div className="mx-auto mb-8 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white">
            C
          </div>
          <span className="font-display text-lg font-semibold text-ink">
            Clinic<span className="text-brand">OS</span>
          </span>
        </div>

        {/* 404 treatment */}
        <h1 className="text-brand-gradient font-display text-8xl font-bold tracking-tight sm:text-9xl">
          404
        </h1>

        <h2 className="mt-4 font-display text-xl font-semibold text-ink sm:text-2xl">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-brand-gradient px-5 text-sm font-medium text-white transition-all hover:brightness-105"
          >
            Back to home
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-input px-5 text-sm font-medium text-ink-soft transition-colors hover:bg-muted hover:text-ink"
          >
            Go to login
          </Link>
        </div>

        {/* Subtle decorative line */}
        <div className="mx-auto mt-12 flex items-center gap-3">
          <div className="h-px flex-1 bg-line-soft" />
          <span className="text-[10px] uppercase tracking-widest text-ink-faint">ClinicOS</span>
          <div className="h-px flex-1 bg-line-soft" />
        </div>
      </div>
    </div>
  )
}
