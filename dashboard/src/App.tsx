import { useEffect, useState } from "react";
import { BRAND } from "./brand";
import type { Attribute, Page, Results, ScoreRow } from "./types";

const label = (s: string) =>
  s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()).replace(/\bcta\b/gi, "CTA").replace(/\bui\b/gi, "UI");
const pageName = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "") || url;
const liftText = (share: number | null) => (share == null ? "n/a" : `${share >= 0 ? "+" : ""}${Math.round(share * 100)}%`);
const corrText = (r: number | null) => (r == null ? "n/a" : r.toFixed(2));
const pText = (p: number | null) => (p == null ? "n/a" : p < 0.001 ? "<0.001" : p.toFixed(3));
const ORIGIN: Record<Attribute["computed_by"], string> = { jev: "tagged by Jev", vision: "from the screenshot", code: "counted", label: "counted" };
const titleOf = (res: Results, name: string) => res.attributes.find((a) => a.name === name)?.title ?? label(name);

/** Rates show as percentages. Any other metric shows as its own number. */
const metricFormat = (pages: Page[]) => {
  const asRate = pages.every((p) => p.conversion_rate <= 1);
  return (n: number) => (asRate ? `${(n * 100).toFixed(2)}%` : n.toLocaleString(undefined, { maximumFractionDigits: 2 }));
};
type Fmt = (n: number) => string;

type View = "attributes" | "pages" | "words" | "page";
const TABS: [View, string][] = [["attributes", "Attributes"], ["pages", "Pages"], ["words", "Words"]];

export default function App() {
  const params = new URLSearchParams(location.search);
  const [res, setRes] = useState<Results | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>((params.get("view") as View) || "attributes");
  const [pageId, setPageId] = useState(params.get("page") || "");

  useEffect(() => {
    const src = params.get("src") || "results.json";
    fetch(src)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Couldn't load ${src}.`))))
      .then(setRes)
      .catch((e) => setError(e.message));
  }, []);

  const open = (file: File) =>
    file.text().then((t) => {
      try {
        setRes(JSON.parse(t));
        setError("");
        setView("attributes");
      } catch {
        setError("That file isn't a Landing Page Analyzer results file.");
      }
    });

  const openPage = (id: string) => {
    setPageId(id);
    setView("page");
    window.scrollTo(0, 0);
  };

  const format = res ? metricFormat(res.pages) : (n: number) => String(n);
  return (
    <div className="page">
      <header>
        <div>
          <h1>{BRAND.logo && <img src={BRAND.logo} alt="" className="logo" />}{BRAND.name} <span className="muted">· Results</span></h1>
          {res && (
            <p className="muted">
              {res.pages.length} pages, measured on {label(res.metric).toLowerCase()}{res.as_of ? `. Run ${res.as_of}` : ""}.
            </p>
          )}
        </div>
        <label className="file">
          Open results file
          <input type="file" accept=".json" onChange={(e) => e.target.files?.[0] && open(e.target.files[0])} />
        </label>
      </header>
      {error && <p className="note">{error} Run `waf sample` or `waf example`, then open results.json here.</p>}
      {res && (
        <>
          {res.sample && <p className="banner">{res.banner || "Illustrative data."} Example Co is made up, with two effects planted on purpose.</p>}
          {res.skipped > 0 && <p className="warn">{res.skipped} {res.skipped === 1 ? "page" : "pages"} could not be opened.</p>}
          <Headline res={res} format={format} />
          <nav>
            {TABS.map(([v, text]) => (
              <button key={v} className={view === v || (v === "pages" && view === "page") ? "on" : ""} onClick={() => setView(v)}>
                {text}
              </button>
            ))}
          </nav>
          {view === "attributes" && <Attributes res={res} format={format} />}
          {view === "pages" && <Pages res={res} format={format} openPage={openPage} />}
          {view === "words" && <Words res={res} format={format} />}
          {view === "page" && <PageDetail res={res} format={format} id={pageId} back={() => setView("pages")} />}
        </>
      )}
    </div>
  );
}

const card = (res: Results) => Object.values(res.scorecards)[0]?.card ?? [];

function Headline({ res, format }: { res: Results; format: Fmt }) {
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
    <section className="cards">
      {cards.map(([name, value, sub]) => (
        <div key={name} className="card">
          <div className="muted small">{name}</div>
          <div className="big">{value}</div>
          <div className="muted small">{sub}</div>
        </div>
      ))}
    </section>
  );
}

function Attributes({ res, format }: { res: Results; format: Fmt }) {
  const rows = card(res);
  const wins = rows.filter((r) => r.significant && r.kind === "group" && (r.correlation ?? 0) > 0);
  const losses = rows.filter((r) => r.significant && (r.kind === "number" || (r.correlation ?? 0) < 0));
  const quiet = res.attributes.filter((a) => !rows.some((r) => r.attribute === a.name && r.significant));
  const metric = label(res.metric).toLowerCase();
  return (
    <section data-shot="1">
      <div className="summary">
        <h2>{wins.length ? `What goes with a higher ${metric}` : "Nothing stood out clearly"}</h2>
        <ul>
          {[...wins, ...losses].map((r) => (
            <li key={`${r.attribute}|${r.value}`}>
              <strong>{titleOf(res, r.attribute)}{r.value ? `: ${label(r.value)}` : ""}</strong>
              {r.kind === "group" && r.mean_with != null && r.mean_rest != null
                ? ` ${format(r.mean_with)} vs ${format(r.mean_rest)} for the rest (${r.n_with} vs ${r.n_rest} pages).`
                : ` More goes with ${(r.correlation ?? 0) > 0 ? "higher" : "lower"} ${metric}.`}
            </li>
          ))}
        </ul>
        {quiet.length > 0 && <p className="muted small">No clear difference: {quiet.map((a) => a.title ?? label(a.name)).join(", ")}.</p>}
      </div>
      <p className="help">
        Each value is compared with every other page. Lift is the difference in {metric}. Correlation runs from -1 to 1. P-values are adjusted for
        testing many values at once; below 0.05 is significant, shown in green. These are correlations, not causes: test before you rewrite.
      </p>
      <div className="attrs">
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
    <div className="card">
      <h3 title={attr.question}>{attr.title ?? label(attr.name)} <span className="tag">{ORIGIN[attr.computed_by]}</span></h3>
      <p className="muted small">{attr.question}</p>
      {attr.type === "number" ? (
        rows[0] ? (
          <p className="small">
            {rows[0].significant ? `More goes with ${(rows[0].correlation ?? 0) > 0 ? "higher" : "lower"} performance` : "No clear link"}
            <span className="muted"> · Correlation {corrText(rows[0].correlation)} · P-value {pText(rows[0].p_adjusted)}</span>
          </p>
        ) : (
          <p className="muted small">Same on every page.</p>
        )
      ) : (
        <ul className="values">
          {shown.map((r) => {
            const win = r.significant && (r.correlation ?? 0) > 0;
            return (
              <li key={r.value}>
                <div className="row">
                  <span className={win ? "win-text" : ""}>{label(r.value!)}</span>
                  <span className="muted"><strong className="ink">{format(r.mean_with!)}</strong> · {r.n_with} {r.n_with === 1 ? "page" : "pages"}</span>
                </div>
                <div className="bar"><div className={win ? "win" : ""} style={{ width: `${top > 0 ? (r.mean_with! / top) * 100 : 0}%` }} /></div>
                <div className="muted small">Lift {liftText(r.lift_pct)} · Correlation {corrText(r.correlation)} · P-value {pText(r.p_adjusted)}</div>
              </li>
            );
          })}
        </ul>
      )}
      {note && <p className="muted small">{note}</p>}
    </div>
  );
}

const valueOf = (page: Page, a: Attribute) =>
  a.type === "number" ? String(page[a.name] ?? "n/a") : label(String(page[`jev_${a.name}`] ?? "unknown"));

function Pages({ res, format, openPage }: { res: Results; format: Fmt; openPage: (id: string) => void }) {
  const pages = [...res.pages].sort((a, b) => b.conversion_rate - a.conversion_rate);
  return (
    <section data-shot="2">
      <p className="help">Sorted by {label(res.metric).toLowerCase()}. Click a page to see its screenshot and every tag.</p>
      <table>
        <thead>
          <tr>
            <th>Page</th><th>Opening line</th>
            {res.attributes.map((a) => <th key={a.name} title={a.question}>{a.title ?? label(a.name)}</th>)}
            <th>{label(res.metric)}</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.id}>
              <td>
                <button className="pagelink" onClick={() => openPage(p.id)} title={p.url}>
                  {p.fold_shot && <img src={p.fold_shot} alt="" className="thumb" />}
                  <span className="num">{pageName(p.url)}</span>
                </button>
              </td>
              <td className="wrap">{p.opening}</td>
              {res.attributes.map((a) => <td key={a.name}>{valueOf(p, a)}</td>)}
              <td><strong>{format(p.conversion_rate)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PageDetail({ res, format, id, back }: { res: Results; format: Fmt; id: string; back: () => void }) {
  const [full, setFull] = useState(false);
  const page = res.pages.find((p) => p.id === id) ?? res.pages[0];
  if (!page) return <p className="help">Page not found.</p>;
  const shot = full && page.full_shot ? page.full_shot : page.fold_shot;
  return (
    <section data-shot="3">
      <div className="controls">
        <button onClick={back}>← All pages</button>
        {page.full_shot && (
          <div className="toggle">
            <button className={!full ? "on" : ""} onClick={() => setFull(false)}>Top of page</button>
            <button className={full ? "on" : ""} onClick={() => setFull(true)}>Full page</button>
          </div>
        )}
      </div>
      <h2><a href={page.url} target="_blank" rel="noreferrer">{pageName(page.url)}</a></h2>
      <div className="detail">
        <div className="shot">{shot ? <img src={shot} alt={`Screenshot of ${page.url}`} /> : <p className="help">No screenshot.</p>}</div>
        <aside>
          <div className="muted small">{label(res.metric)}</div>
          <div className="big">{format(page.conversion_rate)}</div>
          <dl>
            <div><dt>Opening line</dt><dd>{page.opening}</dd></div>
            <div><dt>Calls to action</dt><dd>{page.ctas.join(", ") || "none"}</dd></div>
            {res.attributes.map((a) => (
              <div key={a.name}><dt title={a.question}>{a.title ?? label(a.name)}</dt><dd>{valueOf(page, a)}</dd></div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}

function Words({ res, format }: { res: Results; format: Fmt }) {
  const table = Object.values(res.words)[0];
  if (!table) return <p className="help">Words weren't tested in this run.</p>;
  return (
    <section>
      <p className="help">
        Real words and phrases on the pages, each compared with the pages without it. Filler and site-wide menu words are skipped.{" "}
        {table.significant} of {table.tested} cleared the significance bar.{res.sample ? " Nothing was planted on words, so this shows the format only." : ""}
      </p>
      <table>
        <thead>
          <tr><th>Word or phrase</th><th>Pages</th><th>With it</th><th>Without it</th><th>Lift</th><th>Correlation</th><th>P-value</th></tr>
        </thead>
        <tbody>
          {table.terms.map((t) => (
            <tr key={t.term} className={t.significant ? "win" : ""}>
              <td><strong>{t.term}</strong></td>
              <td>{t.pages}</td>
              <td>{format(t.rate_with)}</td>
              <td>{format(t.rate_without)}</td>
              <td>{liftText(t.rate_without ? (t.rate_with - t.rate_without) / t.rate_without : null)}</td>
              <td>{corrText(t.correlation)}</td>
              <td>{pText(t.p_adjusted)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
