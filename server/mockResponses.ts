/**
 * Canned OpenUI-Lang responses for the offline "mock" provider.
 *
 * Each response is valid OpenUI-Lang built ONLY from documented component
 * signatures + the sanctuary tools. Because Query() statements execute on load,
 * these fully exercise the real pipeline: streaming parse -> render ->
 * toolProvider -> /api/tools -> data. They double as the smoke-test oracle.
 */

const cards = `dragons = Query("list_dragons", {element: "Fire"}, {rows: []})
header = CardHeader("Fire Dragons 🔥", "Toasty residents currently at Ember & Scale")
grid = Stack(@Each(dragons.rows, "d", Card([TextContent("" + d.emoji + "  " + d.name, "large-heavy"), TextContent(d.funFact), TagBlock([Tag(d.temperament, null, "sm", "neutral"), Tag("🔥 " + d.firePower, null, "sm", "warning"), Tag(d.status, null, "sm", "success")]), TextContent("Hoard: " + d.hoardValue + " gold · Wingspan: " + d.wingspanM + "m")])), "row", "m")
root = Stack([header, grid])`;

const elementPie = `breakdown = Query("element_breakdown", {}, {rows: []})
header = CardHeader("Treasure Hoards by Element 💰", "Total gold guarded, grouped by dragon type")
pie = PieChart(breakdown.rows.element, breakdown.rows.totalHoard, "donut")
tbl = Table([Col("Element", breakdown.rows.element), Col("Dragons", breakdown.rows.count, "number"), Col("Hoard (gold)", breakdown.rows.totalHoard, "number"), Col("Avg 🔥", breakdown.rows.avgFirePower, "number")])
root = Stack([header, pie, tbl])`;

const dashboard = `stats = Query("sanctuary_stats", {}, {totalDragons: 0, available: 0, sponsored: 0, avgFirePower: 0, totalHoard: 0})
breakdown = Query("element_breakdown", {}, {rows: []})
seasons = Query("rescues_by_season", {}, {rows: []})
header = CardHeader("🐉 Ember & Scale — Sanctuary Dashboard", "Live view of our scaly residents")
kpiTotal = Card([TextContent("Total Dragons", "small"), TextContent("" + stats.totalDragons, "large-heavy")])
kpiAvail = Card([TextContent("Available", "small"), TextContent("" + stats.available, "large-heavy")])
kpiHoard = Card([TextContent("Total Hoard (gold)", "small"), TextContent("" + stats.totalHoard, "large-heavy")])
kpiFire = Card([TextContent("Avg Fire Power", "small"), TextContent("" + stats.avgFirePower, "large-heavy")])
kpis = Stack([kpiTotal, kpiAvail, kpiHoard, kpiFire], "row", "m")
pie = Card([CardHeader("Dragons by Element"), PieChart(breakdown.rows.element, breakdown.rows.count, "donut")])
line = Card([CardHeader("Rescues by Season"), LineChart(seasons.rows.season, [Series("Rescued", seasons.rows.rescued), Series("Sponsored", seasons.rows.sponsored)])])
charts = Stack([pie, line], "row", "m")
root = Stack([header, kpis, charts])`;

const seasons = `seasons = Query("rescues_by_season", {}, {rows: []})
header = CardHeader("Rescues Across the Seasons 🗓️", "How many dragons we took in — and how many found sponsors")
area = AreaChart(seasons.rows.season, [Series("Rescued", seasons.rows.rescued), Series("Sponsored", seasons.rows.sponsored)])
tbl = Table([Col("Season", seasons.rows.season), Col("Rescued", seasons.rows.rescued, "number"), Col("Sponsored", seasons.rows.sponsored, "number")])
note = Callout("info", "Did you know?", "Winter is our busiest rescue season — cold snaps send dragons hunting for a warm hoard.")
root = Stack([header, area, tbl, note])`;

const topDragons = `$sponsorId = ""
top = Query("top_dragons", {metric: "firePower", limit: 6}, {rows: []})
sponsor = Mutation("sponsor_dragon", {id: $sponsorId})
header = CardHeader("Most Powerful Dragons 🔥", "Ranked by fire power — sponsor your favourite")
bar = BarChart(top.rows.name, [Series("Fire Power", top.rows.firePower)], "grouped")
tbl = Table([Col("Dragon", top.rows.name), Col("Element", top.rows.element), Col("🔥 Power", top.rows.firePower, "number"), Col("Adopt", @Each(top.rows, "d", Button("Sponsor " + d.name, Action([@Set($sponsorId, d.id), @Run(sponsor), @Run(top)]))))])
root = Stack([header, bar, tbl])`;

interface Route {
  keywords: string[];
  code: string;
}

// Most specific first.
const routes: Route[] = [
  { keywords: ['fire', 'card', 'profile', 'available'], code: cards },
  { keywords: ['hoard', 'treasure', 'element', 'gold', 'pie'], code: elementPie },
  { keywords: ['dashboard', 'overview', 'kpi', 'summary', 'everything'], code: dashboard },
  { keywords: ['season', 'rescue', 'over time', 'timeline', 'report', 'trend'], code: seasons },
  { keywords: ['top', 'power', 'strong', 'rank', 'best', 'sponsor'], code: topDragons },
];

export function pickMockResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  for (const r of routes) {
    if (r.keywords.some((k) => p.includes(k))) return r.code;
  }
  return dashboard;
}
