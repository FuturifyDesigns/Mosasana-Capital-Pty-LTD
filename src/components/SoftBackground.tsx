export function SoftBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* base wash: white with a soft blue tint */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-brand-50/50 to-white" />
      {/* soft colour pools for a blue/white mixture */}
      <div className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-brand-200/35 blur-[120px]" />
      <div className="absolute right-[-12rem] top-1/4 h-[38rem] w-[38rem] rounded-full bg-brand-100/45 blur-[130px]" />
      <div className="absolute bottom-[-10rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-sky-200/30 blur-[120px]" />
      <div className="absolute right-1/4 top-2/3 h-72 w-72 rounded-full bg-gold-400/10 blur-[110px]" />
    </div>
  )
}
