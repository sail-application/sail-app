export function BillingLoading() {
  return (
    <div className="grid gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-card p-6 rounded-xl animate-pulse">
          <div className="h-6 bg-gray-700/50 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
