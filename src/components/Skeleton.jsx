export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-surface-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-3 w-1/4" />
          </div>
          <div className="skeleton w-[100px] h-[100px] rounded-full" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-10 w-28 rounded-xl" />
          <div className="skeleton h-10 w-28 rounded-xl" />
          <div className="skeleton h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-surface-border rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-4 w-12" />
            </div>
            <div className="skeleton h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonCategory() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-5 w-1/3" />
          <div className="skeleton h-3 w-1/4" />
        </div>
      </div>
      <div className="skeleton h-3 w-full rounded-full" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-surface-border rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-4 w-8" />
            </div>
            <div className="skeleton h-2 w-full rounded-full" />
            <div className="skeleton h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
