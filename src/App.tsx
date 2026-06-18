import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Clipboard, Code2, ExternalLink, GitFork, Image, Moon, Search, Sun, X } from "lucide-react";
import type { Manifest, Theme } from "./types";
import popularity from "./data/popularity.json";

const assetBaseUrl = new URL(import.meta.env.BASE_URL, window.location.href);

function repositoryUrl() {
  if (import.meta.env.VITE_REPOSITORY_URL) return import.meta.env.VITE_REPOSITORY_URL.replace(/\/$/, "");
  if (location.hostname.endsWith(".github.io")) {
    const owner = location.hostname.slice(0, -10);
    const repo = location.pathname.split("/").filter(Boolean)[0] || `${owner}.github.io`;
    return `https://github.com/${owner}/${repo}`;
  }
  return "https://github.com/element-themes/element-themes.github.io";
}

const repoUrl = repositoryUrl();
const organizationUrl = "https://github.com/element-themes";
const themesRepoUrl = "https://github.com/element-themes/themes";

function publishedBaseUrl() {
  if (import.meta.env.VITE_SITE_URL) return new URL(import.meta.env.VITE_SITE_URL);
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return assetBaseUrl;
  const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return assetBaseUrl;
  return new URL(match[2] === `${match[1]}.github.io` ? `https://${match[1]}.github.io/` : `https://${match[1]}.github.io/${match[2]}/`);
}

const themeValue = (theme: Theme, key: string, fallback: string) => theme.colors[key] || fallback;

function GeneratedPreview({ theme }: { theme: Theme }) {
  const background = themeValue(theme, "timeline-background-color", theme.isDark ? "#15171c" : "#f5f6f7");
  const sidebar = themeValue(theme, "sidebar-color", theme.isDark ? "#24272d" : "#e7e9ed");
  const rooms = themeValue(theme, "roomlist-background-color", sidebar);
  const text = themeValue(theme, "timeline-text-color", theme.isDark ? "#f2f3f5" : "#24262b");
  const accent = themeValue(theme, "accent-color", themeValue(theme, "primary-color", "#0dbd8b"));
  return <div className="fallback-preview" style={{ background, color: text }}>
    <div style={{ background: sidebar }}><i style={{ background: accent }} /> <i /> <i /></div>
    <aside style={{ background: rooms }}><b>Rooms</b><span>General</span><span>Element</span><span>Design</span></aside>
    <section><b>General</b><p><i style={{ background: accent }} /><span><strong>Alex</strong><small>Theme preview unavailable</small></span></p><p><i /><span><strong>Riley</strong><small>Colors from the theme JSON</small></span></p></section>
  </div>;
}

function ThemeMedia({ theme }: { theme: Theme }) {
  const [failed, setFailed] = useState(false);
  if (!theme.preview || failed) return <GeneratedPreview theme={theme} />;
  return <div className="preview-image">
    <img src={new URL(`themes/${theme.preview}`, assetBaseUrl).href} alt={`${theme.name} preview in Element`} loading="lazy" onError={() => setFailed(true)} />
  </div>;
}

function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<"name" | "popular">("name");
  const [toast, setToast] = useState("");
  const [contribute, setContribute] = useState(location.hash === "#contribute");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetch(new URL("themes/index.json", assetBaseUrl)).then((response) => {
      if (!response.ok) throw new Error("Could not load the theme manifest");
      return response.json();
    }).then(setManifest).catch((error) => setToast(error.message));
  }, []);
  useEffect(() => {
    if (!selectedTheme) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => modalRef.current?.querySelector<HTMLElement>("button, a")?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedTheme(null);
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [selectedTheme]);
  useEffect(() => {
    const onHash = () => setContribute(location.hash === "#contribute");
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const tags = useMemo(() => ["All", ...Array.from(new Set(manifest?.themes.flatMap((theme) => theme.tags) || []))], [manifest]);
  const popularityCounts = popularity.counts as Record<string, number>;
  const themes = useMemo(() => {
    const filtered = manifest?.themes.filter((theme) => {
      const matchesQuery = `${theme.name} ${theme.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      return matchesQuery && (filter === "All" || theme.tags.includes(filter));
    }) || [];
    return [...filtered].sort((a, b) => sort === "popular"
      ? (popularityCounts[b.id] || 0) - (popularityCounts[a.id] || 0) || a.name.localeCompare(b.name)
      : a.name.localeCompare(b.name));
  }, [manifest, query, filter, sort]);

  const copy = async (text: string, message: string) => {
    await navigator.clipboard.writeText(text);
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const localThemeUrl = (theme: Theme) => new URL(`themes/${theme.file}`, assetBaseUrl).href;
  const publishedThemeUrl = (theme: Theme) => new URL(`themes/${theme.file}`, publishedBaseUrl()).href;
  const copyThemeUrl = async (theme: Theme) => {
    window.umami?.track("copy-theme-url", { theme: theme.id });
    await copy(publishedThemeUrl(theme), `${theme.name} URL copied`);
  };
  const previewUrl = (theme: Theme) => theme.preview ? new URL(`themes/${theme.preview}`, assetBaseUrl).href : null;
  const openTheme = (theme: Theme) => {
    previousFocus.current = document.activeElement as HTMLElement;
    setSelectedTheme(theme);
  };

  if (contribute) return <ContributionPage onBack={() => { location.hash = ""; }} />;

  return <>
    <header className="nav shell">
      <a className="brand" href={import.meta.env.BASE_URL}><span className="brand-mark">E</span><span>Element Themes</span></a>
      <nav><a href="#gallery">Themes</a><a href="#about">About</a><a className="nav-github" href={organizationUrl} target="_blank" rel="noreferrer"><GitFork size={16} /> GitHub</a></nav>
    </header>

    <main>
      <section className="hero shell">
        <div><h1>Element Theme Gallery</h1><p>Browse community themes for Element Web and Desktop. Copy a theme URL to add it to Element.</p></div>
        <a className="button secondary" href="#contribute">Add a theme <ArrowUpRight size={16} /></a>
      </section>

      <section className="gallery shell" id="gallery">
        <div className="section-heading"><div><h2>Themes</h2><p>Community themes collected and contributed to this gallery.</p></div><span>{themes.length} of {manifest?.themes.length ?? 0}</span></div>
        <div className="controls">
          <label className="search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search themes" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}</label>
          <div className="filters">{tags.map((tag) => <button className={tag === filter ? "active" : ""} onClick={() => setFilter(tag)} key={tag}>{tag}</button>)}</div>
          <label className="sort-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as "name" | "popular")}><option value="name">Name</option><option value="popular">Popular</option></select></label>
        </div>
        <div className="grid">
          {themes.map((theme) => <article className="card" key={theme.id}>
            <button className="card-open" onClick={() => openTheme(theme)} aria-label={`Open details for ${theme.name}`} />
            <ThemeMedia theme={theme} />
            <div className="card-body">
              <div className="card-title">
                <div><h3>{theme.name}</h3><span className="mode">{theme.isDark ? <Moon size={13} /> : <Sun size={13} />}{theme.isDark ? "Dark" : "Light"}{popularityCounts[theme.id] > 0 && <> · {popularityCounts[theme.id]} copies</>}</span></div>
                <div className="swatches" aria-label="Theme colors">{["accent-color", "primary-color", "sidebar-color", "timeline-background-color"].map((key) => theme.colors[key] && <i key={key} style={{ background: theme.colors[key] }} />)}</div>
              </div>
              <div className="tags">{theme.tags.slice(1).map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="card-actions" onClick={(event) => event.stopPropagation()}>
                <button className="copy" onClick={() => copyThemeUrl(theme)}><Clipboard size={15} /> Copy theme URL</button>
                <a href={localThemeUrl(theme)} target="_blank" rel="noreferrer"><Code2 size={15} /> View JSON</a>
                <button onClick={() => openTheme(theme)}><Image size={15} /> Preview</button>
              </div>
              <button className="raw-link" onClick={async (event) => { event.stopPropagation(); await copy(await fetch(localThemeUrl(theme)).then((response) => response.text()), `${theme.name} JSON copied`); }}>Copy raw JSON</button>
            </div>
          </article>)}
        </div>
        {manifest && !themes.length && <div className="empty"><Search /><h3>No themes found</h3><p>Try another search or filter.</p><button onClick={() => { setQuery(""); setFilter("All"); }}>Clear filters</button></div>}
      </section>

      <section className="about shell" id="about">
        <div><h2>About this gallery</h2><p>The collection is maintained in <a href={themesRepoUrl} target="_blank" rel="noreferrer">element-themes/themes</a>. Some themes and screenshots were imported from <a href={manifest?.source} target="_blank" rel="noreferrer">aaronraimist/element-themes</a>. Other themes are contributed directly to the collection.</p></div>
        <a className="button secondary" href={manifest?.source} target="_blank" rel="noreferrer">View upstream <ExternalLink size={16} /></a>
        <a className="button secondary" href="#contribute">Contribute <ArrowUpRight size={16} /></a>
      </section>
    </main>

    <footer className="shell"><span>Element Themes</span><p>Community project. Not affiliated with Element or The Matrix.org Foundation.</p><a href={themesRepoUrl} target="_blank" rel="noreferrer"><GitFork size={16} /> Themes</a></footer>
    {selectedTheme && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTheme(null); }}>
      <div className="theme-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="theme-modal-title">
        <button className="modal-close" onClick={() => setSelectedTheme(null)} aria-label="Close theme details"><X size={19} /></button>
        <div className="modal-preview">
          {selectedTheme.preview ? <img src={previewUrl(selectedTheme)!} alt={`${selectedTheme.name} preview in Element`} /> : <GeneratedPreview theme={selectedTheme} />}
        </div>
        <div className="modal-content">
          <div className="modal-heading">
            <div><h2 id="theme-modal-title">{selectedTheme.name}</h2><span className="mode">{selectedTheme.isDark ? <Moon size={14} /> : <Sun size={14} />}{selectedTheme.isDark ? "Dark" : "Light"}{popularityCounts[selectedTheme.id] > 0 && <> · {popularityCounts[selectedTheme.id]} copies</>}</span></div>
            <div className="modal-swatches" aria-label="Theme colors">{Object.entries(selectedTheme.colors).filter(([key]) => ["accent-color", "primary-color", "sidebar-color", "roomlist-background-color", "timeline-background-color"].includes(key)).map(([key, color]) => <span key={key}><i style={{ background: color }} /><small>{key.replace(/-color$/, "")}</small></span>)}</div>
          </div>
          <div className="modal-tags">{selectedTheme.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <label className="json-url"><span>JSON URL</span><div><code>{publishedThemeUrl(selectedTheme)}</code><button onClick={() => copyThemeUrl(selectedTheme)} aria-label="Copy JSON URL"><Clipboard size={15} /></button></div></label>
          <div className="modal-actions">
            <button className="button primary" onClick={() => copyThemeUrl(selectedTheme)}><Clipboard size={16} /> Copy theme URL</button>
            <button className="button secondary" onClick={async () => copy(await fetch(localThemeUrl(selectedTheme)).then((response) => response.text()), `${selectedTheme.name} JSON copied`)}><Code2 size={16} /> Copy raw JSON</button>
            <a className="button secondary" href={localThemeUrl(selectedTheme)} target="_blank" rel="noreferrer">View JSON <ExternalLink size={15} /></a>
            {previewUrl(selectedTheme) && <a className="button text-button" href={previewUrl(selectedTheme)!} target="_blank" rel="noreferrer">Open preview image <ExternalLink size={15} /></a>}
          </div>
        </div>
      </div>
    </div>}
    {toast && <div className="toast"><Check size={16} />{toast}</div>}
  </>;
}

function ContributionPage({ onBack }: { onBack: () => void }) {
  const steps = [
    ["Fork the themes repository", "Create a copy of element-themes/themes under your GitHub account."],
    ["Add the files", "Add a valid theme JSON file to themes/ and at least one PNG, JPG, or WebP screenshot for the gallery preview."],
    ["Check the build", "Run pnpm install and pnpm build. Do not run the upstream import command for a single contribution."],
    ["Open a pull request", "Submit the theme for review."],
  ];
  return <div className="contribute-page">
    <header className="nav shell"><button className="back" onClick={onBack}><ArrowLeft size={17} /> Gallery</button><a className="brand" href={import.meta.env.BASE_URL}><span className="brand-mark">E</span><span>Element Themes</span></a><a className="nav-github" href={organizationUrl} target="_blank" rel="noreferrer"><GitFork size={16} /> GitHub</a></header>
    <main className="contribute shell">
      <h1>Add a theme</h1><p className="lead">Add the theme JSON, include at least one screenshot, and open a pull request.</p>
      <div className="steps">{steps.map(([title, body], index) => <article key={title}><span>{index + 1}</span><div><h2>{title}</h2><p>{body}</p>{index === 1 && <code>themes/my-theme.json</code>}</div></article>)}</div>
      <div className="contribute-cta"><a className="button primary" href={`${themesRepoUrl}/fork`} target="_blank" rel="noreferrer"><GitFork size={17} /> Fork on GitHub</a><a className="button secondary" href={`${themesRepoUrl}/compare`} target="_blank" rel="noreferrer">Open pull request <ArrowUpRight size={16} /></a></div>
      <aside><b>Theme format</b><p>Each JSON file needs a <code>name</code>, an <code>is_dark</code> boolean, and a <code>colors</code> object with Element custom theme color keys. Each theme also needs at least one screenshot for its gallery preview.</p><p><code>pnpm import-themes</code> is only for maintainers syncing the full upstream collection. It replaces the local theme snapshot, so it is not needed when adding one theme.</p></aside>
    </main>
  </div>;
}

export default App;
