export default function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-800">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cream/40 text-sm font-display uppercase tracking-widest">Loading</p>
      </div>
    </div>
  )
}
