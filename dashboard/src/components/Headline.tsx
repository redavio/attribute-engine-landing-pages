import type { Results } from "../types";
import { card, label, pageName, ui, type Fmt } from "./ui";

/** Pages, average, best page and how many clear links. */
export default function Headline({ res, format }: { res: Results; format: Fmt }) {
  const rates = res.pages.map((p) => p.conversion_rate);
  const best = [...res.pages].sort((a, b) => b.conversion_rate - a.conversion_rate)[0];
  const rows = card(res);
  const cards: [string, string, string][] = [
    ["Pages", String(res.pages.length), res.skipped ? `${res.skipped} could not be opened` : "all opened"],
    [`Average ${label(res.metric).toLowerCase()}`, format(rates.reduce((a, b) => a + b, 0) / (rates.length || 1)),
      `${format(Math.min(...rates))} to ${format(Math.max(...rates))}`],
    ["Best page", best ? format(best.conversion_rate) : "–", best ? pageName(best.url) : ""],
    ["Clear links", String(rows.filter((r) => r.significant).length), `of ${rows.length} values tested`],
  ];
  return (
    <section className="my-5 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
      {cards.map(([name, value, sub]) => (
        <div key={name} className={ui.card}>
          <div className={`text-xs ${ui.muted}`}>{name}</div>
          <div className="my-1 text-2xl font-semibold">{value}</div>
          <div className={`break-words text-xs ${ui.muted}`}>{sub}</div>
        </div>
      ))}
    </section>
  );
}
