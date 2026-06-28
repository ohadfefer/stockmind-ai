import { TrendingUp } from "lucide-react"

// Single source of truth for the chart curve — shared by the area fill, the
// drawn line, and the leading dot's motion path so they can never desync.
const HERO_CURVE =
  "M0,150 C60,120 90,160 150,130 C210,100 240,140 300,95 C360,60 390,110 450,70 C510,40 540,75 600,45"

const TICKERS = [
  { label: "AAPL", value: "+3.1%" },
  { label: "NVDA", value: "+5.7%" },
  { label: "MSFT", value: "+1.9%" },
]

export function LandingHero() {
  return (
    <section className="relative hidden overflow-hidden bg-primary/5 lg:block">
      {/* Aurora background */}
      <div className="aurora absolute inset-0" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Hero content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-12">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="hero-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live markets
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-foreground text-balance">
            Research smarter with an AI co-pilot for the markets.
          </h2>
        </div>

        {/* Animated chart */}
        <div className="relative rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                SMND · NASDAQ
              </span>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                $248.32
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-primary tabular-nums">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              +12.4%
            </span>
          </div>

          <svg
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
            className="mt-5 h-40 w-full"
            role="img"
            aria-label="Animated stock price chart trending upward"
          >
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-primary)"
                  stopOpacity="0.35"
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-primary)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Area */}
            <path
              className="hero-area"
              fill="url(#areaFill)"
              d={`${HERO_CURVE} L600,200 L0,200 Z`}
            />
            {/* Line */}
            <path
              className="hero-line"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d={HERO_CURVE}
            />
            {/* Leading dot */}
            <circle className="hero-dot" r="5" fill="var(--color-primary)">
              <animateMotion
                dur="6s"
                repeatCount="indefinite"
                keyPoints="0;1"
                keyTimes="0;1"
                calcMode="linear"
                path={HERO_CURVE}
              />
            </circle>
          </svg>

          {/* Floating sparkline accents */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {TICKERS.map((t, i) => (
              <div
                key={t.label}
                className="float-card rounded-lg border border-border bg-background/60 px-3 py-2"
                style={{ animationDelay: `${i * 0.6}s` }}
              >
                <span className="block text-[10px] font-medium text-muted-foreground">
                  {t.label}
                </span>
                <span className="block text-sm font-semibold tabular-nums text-primary">
                  {t.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero-scoped animations. Class/keyframe names are namespaced (hero-*)
          so they can't collide with Tailwind utilities (e.g. animate-ping). */}
      <style>{`
        @keyframes aurora-shift {
          0%, 100% { transform: translate3d(-5%, -5%, 0) scale(1.1); }
          50% { transform: translate3d(5%, 5%, 0) scale(1.25); }
        }
        .aurora {
          background:
            radial-gradient(40% 50% at 20% 20%, var(--color-primary) 0%, transparent 60%),
            radial-gradient(45% 55% at 80% 30%, var(--color-accent) 0%, transparent 60%),
            radial-gradient(50% 50% at 60% 90%, var(--color-primary) 0%, transparent 55%);
          opacity: 0.18;
          filter: blur(40px);
          animation: aurora-shift 16s ease-in-out infinite;
        }
        @keyframes dash-draw {
          from { stroke-dashoffset: 1400; }
          to { stroke-dashoffset: 0; }
        }
        .hero-line {
          stroke-dasharray: 1400;
          animation: dash-draw 6s ease-in-out infinite alternate;
        }
        @keyframes area-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .hero-area { animation: area-pulse 6s ease-in-out infinite; }
        @keyframes float-y {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .float-card { animation: float-y 5s ease-in-out infinite; }
        @keyframes hero-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .hero-ping { animation: hero-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite; }

        @media (prefers-reduced-motion: reduce) {
          .aurora, .hero-line, .hero-area, .float-card, .hero-ping, .hero-dot {
            animation: none !important;
          }
          .hero-line { stroke-dasharray: none; }
        }
      `}</style>
    </section>
  )
}
