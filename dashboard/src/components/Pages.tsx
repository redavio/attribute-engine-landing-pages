import type { Results } from "../types";
import { label, pageName, ui, valueOf, type Fmt } from "./ui";

/** Every page with its tags and result. */
export default function Pages({ res, format, openPage }: { res: Results; format: Fmt; openPage: (id: string) => void }) {
  const pages = [...res.pages].sort((a, b) => b.conversion_rate - a.conversion_rate);
  return (
    <section className="overflow-x-auto" data-shot="2">
      <p className={ui.help}>Sorted by {label(res.metric).toLowerCase()}. Click a page to see its screenshot and every tag.</p>
      <table className={ui.table}>
        <thead>
          <tr>
            <th className={ui.th}>Page</th>
            <th className={ui.th}>Opening line</th>
            {res.attributes.map((a) => <th key={a.name} className={ui.th} title={a.question}>{a.title ?? label(a.name)}</th>)}
            <th className={ui.th}>{label(res.metric)}</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id}>
              <td className={ui.td}>
                <button type="button" className="flex items-center gap-2.5 text-left" onClick={() => openPage(p.id)} title={p.url}>
                  {p.fold_shot && (
                    <img src={p.fold_shot} alt="" className="h-[45px] w-[72px] max-w-none shrink-0 rounded border border-zinc-200 object-cover object-top dark:border-zinc-700" />
                  )}
                  <span className={ui.link}>{pageName(p.url)}</span>
                </button>
              </td>
              <td className={`${ui.cell} min-w-[220px]`}>{p.opening}</td>
              {res.attributes.map((a) => <td key={a.name} className={ui.td}>{valueOf(p, a)}</td>)}
              <td className={ui.td}><strong>{format(p.conversion_rate)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
