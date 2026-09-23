// Overrides the parent portfolio/loading.tsx for trade/ and its confirmation
// child, so neither flashes the holdings skeleton. Both pages share this
// shape — a header block over one centered max-w-lg card — but not their
// titles or back-link targets, so the header is a placeholder here.
export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div>
        <div className="mb-3 h-5 w-32 rounded bg-secondary" />
        <div className="h-8 w-40 rounded bg-secondary" />
        <div className="mt-2 h-4 w-64 rounded bg-secondary" />
      </div>

      <div className="mx-auto w-full max-w-lg rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-20 rounded bg-secondary" />
              <div className="h-9 w-full rounded-md bg-secondary" />
            </div>
          ))}
          <div className="mt-2 h-10 w-full rounded-lg bg-secondary" />
        </div>
      </div>
    </div>
  )
}
