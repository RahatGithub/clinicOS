const swatches = [
  { name: 'brand', color: 'bg-brand' },
  { name: 'brand-deep', color: 'bg-brand-deep' },
  { name: 'brand-tint', color: 'bg-brand-tint' },
  { name: 'ink', color: 'bg-ink' },
  { name: 'ink-soft', color: 'bg-ink-soft' },
  { name: 'line', color: 'bg-line' },
  { name: 'ok', color: 'bg-ok' },
  { name: 'warn', color: 'bg-warn' },
  { name: 'danger', color: 'bg-danger' },
]

export default function Home() {
  return (
    <div className="p-10 max-w-3xl mx-auto space-y-8">
      <h1 className="text-5xl font-bold">ClinicOS</h1>

      <p className="text-2xl font-semibold">
        <span className="text-brand-gradient">Design System</span>
      </p>

      {/* Color swatches */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Color Tokens</h2>
        <div className="flex flex-wrap gap-4">
          {swatches.map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-1">
              <div
                className={`w-14 h-14 rounded-lg border border-line ${s.color}`}
              />
              <span className="text-xs text-ink-soft">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Buttons</h2>
        <div className="flex gap-4">
          <button className="bg-brand-gradient bg-brand-gradient-hover px-6 py-2.5 rounded-lg text-white font-medium">
            Primary Action
          </button>
          <button className="border border-line px-6 py-2.5 rounded-lg text-ink font-medium hover:bg-line-soft">
            Outline
          </button>
        </div>
      </div>

      {/* Typography pairing */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Typography</h2>
        <h3 className="text-2xl font-semibold mb-2">
          Sora — The Display Font for Headings
        </h3>
        <p className="text-ink-soft">
          Inter is the body font. It provides excellent readability at small
          sizes and pairs well with Sora&apos;s geometric personality. This
          paragraph demonstrates the default body style with a comfortable
          line-height for long-form content.
        </p>
      </div>

      <p className="text-sm text-ink-faint">
        Temporary style guide — will be replaced by the landing page.
      </p>
    </div>
  )
}
