export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162d54 50%, #0f2240 100%)' }}>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-full skeleton mx-auto mb-4" />
          <div className="h-8 w-64 skeleton rounded-lg mx-auto mb-2" />
          <div className="h-4 w-80 skeleton rounded-md mx-auto" />
        </div>

        {/* 4 tree card skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-6" style={{ background: '#0f2240', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg skeleton" />
                <div>
                  <div className="h-5 w-32 skeleton rounded-md mb-1" />
                  <div className="h-3 w-24 skeleton rounded-md" />
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex flex-col items-center gap-2">
                    <div className="w-4 h-3 skeleton rounded" />
                    <div className="w-3 h-32 skeleton rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
