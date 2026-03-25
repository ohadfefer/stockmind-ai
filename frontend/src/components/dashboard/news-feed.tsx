const news = [
  {
    sentiment: "BULLISH",
    sentimentColor: "bg-[#10B981]/15 text-[#10B981]",
    time: "12m ago",
    source: "Reuters",
    headline: "Fed Signals Potential Rate Cut in Upcoming Meeting",
    summary:
      "Chairman Jerome Powell's latest remarks have ignited a broad-based rally across tech and growth stocks...",
  },
  {
    sentiment: "BEARISH",
    sentimentColor: "bg-[#EF4444]/15 text-[#EF4444]",
    time: "45m ago",
    source: "Bloomberg",
    headline: "Oil Prices Spike as Middle East Tensions Escalate",
    summary:
      "Brent crude jumped over 3% this morning following reports of new supply chain disruptions in the region...",
  },
  {
    sentiment: "NEUTRAL",
    sentimentColor: "bg-primary/15 text-primary",
    time: "1h ago",
    source: "CNBC",
    headline: "Retail Sales Data Beats Expectations for Second Month",
    summary:
      "Consumer spending remains resilient despite inflationary pressures, surprising many economic analysts...",
  },
]

export function NewsFeed() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">Market News</h2>
      </div>
      <div className="flex flex-col gap-0">
        {news.map((item, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 border-t border-border px-5 py-4"
          >
            <div className="flex items-center gap-2">
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.sentimentColor}`}
              >
                {item.sentiment}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.time}
              </span>
              <span className="text-xs text-muted-foreground/50">
                {"*"}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.source}
              </span>
            </div>
            <h3 className="text-sm font-semibold leading-snug text-foreground text-pretty">
              {item.headline}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {item.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
