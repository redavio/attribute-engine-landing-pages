import { useState } from "react";
import type { Results } from "../types";
import { label, pageName, ui, valueOf, type Fmt } from "./ui";

/** One page: its screenshot, tags and result. */
export default function PageDetail({ res, format, id, back }: { res: Results; format: Fmt; id: string; back: () => void }) {
  const [full, setFull] = useState(false);
  const page = res.pages.find((p) => p.id === id) ?? res.pages[0];
  if (!page) return <p className={ui.help}>Page not found.</p>;
  const shot = full && page.full_shot ? page.full_shot : page.fold_shot;
  const row = "flex justify-between gap-4 border-t border-zinc-200 py-[7px] dark:border-zinc-700";
  return (
    <section className="overflow-x-auto @container" data-shot="3">
      <div className="my-3 flex flex-wrap items-center gap-2 text-sm">
        <button type="button" className={ui.pill(false)} onClick={back}>← All pages</button>
        {page.full_shot && (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={ui.pill(!full)} onClick={() => setFull(false)}>Top of page</button>
            <button type="button" className={ui.pill(full)} onClick={() => setFull(true)}>Full page</button>
          </div>
        )}
      </div>
      <h2 className="mb-2 text-lg font-semibold">
        <a href={page.url} target="_blank" rel="noreferrer" className="underline underline-offset-[3px]">{pageName(page.url)}</a>
      </h2>
      <div className="grid items-start gap-6 @3xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {shot ? (
            <img src={shot} alt={`Screenshot of ${page.url}`} className="block h-auto w-full rounded-xl border border-zinc-200 dark:border-zinc-700" />
          ) : (
            <p className={ui.help}>No screenshot.</p>
          )}
        </div>
        <aside>
          <div className={`text-xs ${ui.muted}`}>{label(res.metric)}</div>
          <div className="my-1 text-2xl font-semibold">{format(page.conversion_rate)}</div>
          <dl className="mt-4 text-sm">
            <div className={row}><dt className={ui.muted}>Opening line</dt><dd className="text-right font-medium">{page.opening}</dd></div>
            <div className={row}><dt className={ui.muted}>Calls to action</dt><dd className="text-right font-medium">{page.ctas.join(", ") || "none"}</dd></div>
            {res.attributes.map((a) => (
              <div key={a.name} className={row}>
                <dt className={ui.muted} title={a.question}>{a.title ?? label(a.name)}</dt>
                <dd className="text-right font-medium">{valueOf(page, a)}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}
