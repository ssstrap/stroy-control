export function SkeletonCard() {
  return (
    <div className="bg-card border border-surface-border rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-3 w-1/3" />
        </div>
        <div className="skeleton w-[72px] h-[72px] rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      </div>
      <div className="flex justify-center">
        <div className="skeleton w-[120px] h-[120px] rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card border border-surface-border rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-4 w-10" />
            </div>
            <div className="skeleton h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
