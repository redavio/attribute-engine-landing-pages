import type { Results } from "../types";
import { corrText, liftText, pText, ui, type Fmt } from "./ui";

/** Real words and phrases on the pages, each compared with the pages without it. */
export default function Words({ res, format }: { res: Results; format: Fmt }) {
  const table = Object.values(res.words)[0];
  if (!table) return <p className={ui.help}>Words weren't tested in this run.</p>;
  return (
    <section className="overflow-x-auto">
      <p className={ui.help}>
        Real words and phrases on the pages, each compared with the pages without it. Filler and site-wide menu words are skipped.{" "}
        {table.significant} of {table.tested} cleared the significance bar.{res.sample ? " Nothing was planted on words, so this shows the format only." : ""}
      </p>
      <table className={ui.table}>
        <thead>
          <tr>
            {["Word or phrase", "Pages", "With it", "Without it", "Lift", "Correlation", "P-value"].map((h) => <th key={h} className={ui.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {table.terms.map((t) => {
            const td = `${ui.td} ${t.significant ? "bg-brand/10" : ""}`;
            return (
              <tr key={t.term}>
                <td className={td}><strong>{t.term}</strong></td>
                <td className={td}>{t.pages}</td>
                <td className={td}>{format(t.rate_with)}</td>
                <td className={td}>{format(t.rate_without)}</td>
                <td className={td}>{liftText(t.rate_without ? (t.rate_with - t.rate_without) / t.rate_without : null)}</td>
                <td className={td}>{corrText(t.correlation)}</td>
                <td className={td}>{pText(t.p_adjusted)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
