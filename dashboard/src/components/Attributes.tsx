import type { Attribute, Results, ScoreRow } from "../types";
import { card, corrText, label, liftText, ORIGIN, pText, titleOf, ui, type Fmt } from "./ui";

/** Which page attributes go with a higher result: the summary, then one card per attribute. */
export default function Attributes({ res, format }: { res: Results; format: Fmt }) {
  const rows = card(res);
  const wins = rows.filter((r) => r.significant && r.kind === "group" && (r.correlation ?? 0) > 0);
  const losses = rows.filter((r) => r.significant && (r.kind === "number" || (r.correlation ?? 0) < 0));
  const quiet = res.attributes.filter((a) => !rows.some((r) => r.attribute === a.name && r.significant));
  const metric = label(res.metric).toLowerCase();
  return (
    <section className="overflow-x-auto" data-shot="1">
      <div className="my-2 rounded-xl bg-brand/10 px-4 py-3.5">
        <h2 className="mb-2 text-lg font-semibold">{wins.length ? `What goes with a higher ${metric}` : "Nothing stood out clearly"}</h2>
        <ul className="mb-1.5 list-disc pl-[18px] text-sm leading-relaxed">
          {[...wins, ...losses].map((r) => (
            <li key={`${r.attribute}|${r.value}`}>
              <strong>{titleOf(res, r.attribute)}{r.value ? `: ${label(r.value)}` : ""}</strong>
              {r.kind === "group" && r.mean_with != null && r.mean_rest != null
                ? ` ${format(r.mean_with)} vs ${format(r.mean_rest)} for the rest (${r.n_with} vs ${r.n_rest} pages).`
                : ` More goes with ${(r.correlation ?? 0) > 0 ? "higher" : "lower"} ${metric}.`}
            </li>
          ))}
        </ul>
        {quiet.length > 0 && <p className={`text-xs ${ui.muted}`}>No clear difference: {quiet.map((a) => a.title ?? label(a.name)).join(", ")}.</p>}
      </div>
      <p className={ui.help}>
        Each value is compared with every other page. Lift is the difference in {metric}. Correlation runs from -1 to 1. P-values are adjusted for
        testing many values at once; below 0.05 is significant, shown in green. These are correlations, not causes: test before you rewrite.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
        {res.attributes.map((a) => (
          <AttributeCard key={a.name} attr={a} rows={rows.filter((r) => r.attribute === a.name)} format={format} />
        ))}
      </div>
    </section>
  );
}

function AttributeCard({ attr, rows, format }: { attr: Attribute; rows: ScoreRow[]; format: Fmt }) {
  const shown = rows.filter((r) => r.value !== "unknown" && r.mean_with != null).sort((a, b) => b.mean_with! - a.mean_with!);
  const top = Math.max(...shown.map((r) => r.mean_with!), 0);
  const note = rows.find((r) => r.note)?.note;
  return (
    <div className={ui.card}>
      <h3 className="mb-1 font-semibold" title={attr.question}>
        {attr.title ?? label(attr.name)} <span className={ui.tag}>{ORIGIN[attr.computed_by]}</span>
      </h3>
      <p className={`text-xs ${ui.muted}`}>{attr.question}</p>
      {attr.type === "number" ? (
        rows[0] ? (
          <p className="mt-2 text-xs">
            {rows[0].significant ? `More goes with ${(rows[0].correlation ?? 0) > 0 ? "higher" : "lower"} performance` : "No clear link"}
            <span className={ui.muted}> · Correlation {corrText(rows[0].correlation)} · P-value {pText(rows[0].p_adjusted)}</span>
          </p>
        ) : (
          <p className={`mt-2 text-xs ${ui.muted}`}>Same on every page.</p>
        )
      ) : (
        <ul className="mt-2.5 text-sm">
          {shown.map((r) => {
            const win = r.significant && (r.correlation ?? 0) > 0;
            const pct = top > 0 ? (r.mean_with! / top) * 100 : 0;
            return (
              <li key={r.value} className="mb-3">
                <div className="flex justify-between gap-3">
                  <span className={win ? "font-semibold text-brand" : ""}>{label(r.value!)}</span>
                  <span className={ui.muted}>
                    <strong className="text-zinc-900 dark:text-zinc-100">{format(r.mean_with!)}</strong> · {r.n_with} {r.n_with === 1 ? "page" : "pages"}
                  </span>
                </div>
                <svg className="my-1 block h-1.5 w-full" aria-hidden="true">
                  <rect width="100%" height="100%" rx="3" className="fill-zinc-100 dark:fill-zinc-800" />
                  <rect width={`${pct}%`} height="100%" rx="3" className={win ? "fill-brand" : "fill-zinc-400 dark:fill-zinc-500"} />
                </svg>
                <div className={`text-xs ${ui.muted}`}>Lift {liftText(r.lift_pct)} · Correlation {corrText(r.correlation)} · P-value {pText(r.p_adjusted)}</div>
              </li>
            );
          })}
        </ul>
      )}
      {note && <p className={`text-xs ${ui.muted}`}>{note}</p>}
    </div>
  );
}
