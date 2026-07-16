export default function CategoryLoading() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #162d54 50%, #0f2240 100%)' }}>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-4 w-32 skeleton rounded mb-6" />
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg skeleton" />
          <div>
            <div className="h-7 w-48 skeleton rounded mb-1" />
            <div className="h-3 w-36 skeleton rounded" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: '#0f2240' }}>
              <div className="h-4 w-16 skeleton rounded mx-auto mb-2" />
              <div className="h-7 w-12 skeleton rounded mx-auto mb-2" />
              <div className="h-2 w-full skeleton rounded-full mb-2" />
              <div className="h-3 w-20 skeleton rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-6" style={{ background: '#0f2240' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 py-3 border-b border-slate-700/30">
              <div className="flex-1 h-4 skeleton rounded" />
              <div className="w-20 h-5 skeleton rounded-full" />
              <div className="w-20 h-5 skeleton rounded-full" />
              <div className="w-20 h-5 skeleton rounded-full" />
              <div className="w-20 h-5 skeleton rounded-full" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
