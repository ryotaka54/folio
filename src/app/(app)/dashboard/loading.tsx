export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border-gray bg-background h-14 sm:h-16 flex items-center px-4 md:px-6 max-w-[1200px] mx-auto gap-3">
        <div className="w-6 h-6 rounded bg-surface-gray animate-pulse" />
        <div className="w-16 h-4 rounded bg-surface-gray animate-pulse" />
        <div className="ml-auto flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-gray animate-pulse" />
          <div className="w-14 h-4 rounded bg-surface-gray animate-pulse self-center" />
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6">
        <div className="mb-6 w-48 h-6 rounded bg-surface-gray animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl p-4 bg-card-bg border border-border-gray">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded bg-surface-gray animate-pulse" />
                <div className="w-20 h-3 rounded bg-surface-gray animate-pulse" />
              </div>
              <div className="w-10 h-7 rounded bg-surface-gray animate-pulse" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[180px] w-[180px] flex-shrink-0">
              <div className="w-full h-3 rounded bg-surface-gray animate-pulse mb-3" />
              <div className="space-y-2">
                {[...Array(i % 2 === 0 ? 3 : 2)].map((_, j) => (
                  <div key={j} className="h-16 rounded-xl bg-surface-gray animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
