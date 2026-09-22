import React, { useState, useEffect } from "react";
import { newsAPI } from "../services/api";
import { Newspaper } from "lucide-react";
import { useSettings } from "../services/useSettings";
import "./NewsSection.css";

const SCOPE_FILTERS = ["ALL", "LOCAL", "GLOBAL"];

const kampalaDate = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kampala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

const isPublishedToday = (article) => {
  if (!article.published_at) return false;
  return kampalaDate(article.published_at) === kampalaDate(new Date());
};

const timeAgo = (dt) => {
  if (!dt) return "";
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dt).toLocaleDateString("en-UG", { dateStyle: "medium" });
};

const formatLongDate = (dt) => {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("en-UG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/* ─── Navigate to article page ─────────────────────────── */
const goToArticle = (id) => {
  window.location.hash = `news-${id}`;
};

/* ─── Trending numbered card (Left column) ──────────────── */
const TrendingCard = ({ article, rank }) => (
  <div
    className="np-trending-card"
    onClick={() => goToArticle(article.id)}
    tabIndex={0}
    role="button"
    onKeyDown={(e) => e.key === "Enter" && goToArticle(article.id)}
  >
    <div className="np-trending-rank">{String(rank).padStart(2, "0")}</div>
    <div className="np-trending-body">
      {article.thumbnail && (
        <div className="np-trending-thumb">
          <img src={article.thumbnail} alt={article.title} loading="lazy" />
        </div>
      )}
      <div className="np-trending-text">
        {article.category && (
          <span className="np-cat-badge">{article.category}</span>
        )}
        <h4>{article.title}</h4>
        <span className="np-meta-line">
          {article.author && <span className="np-author">{article.author}</span>}
          <span className="np-dot">·</span>
          <span className="np-time">{timeAgo(article.published_at)}</span>
        </span>
      </div>
    </div>
  </div>
);

/* ─── Hero center card ──────────────────────────────────── */
const HeroCard = ({ article }) => {
  if (!article) return null;
  return (
    <div
      className="np-hero-card"
      onClick={() => goToArticle(article.id)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => e.key === "Enter" && goToArticle(article.id)}
    >
      <div className="np-hero-image-wrap">
        {article.thumbnail ? (
          <img src={article.thumbnail} alt={article.title} />
        ) : (
          <div className="np-hero-placeholder" />
        )}
        <div className="np-hero-gradient" />
        <span className="np-hero-news-badge">NEWS</span>
      </div>
      <div className="np-hero-content">
        {article.category && (
          <span className="np-cat-badge np-cat-badge--white">{article.category}</span>
        )}
        <h2 className="np-hero-title">{article.title}</h2>
        {article.excerpt && <p className="np-hero-excerpt">{article.excerpt}</p>}
        <span className="np-meta-line np-meta-line--light">
          {article.author && <span className="np-author">{article.author}</span>}
          {article.author && <span className="np-dot">·</span>}
          <span className="np-time">{timeAgo(article.published_at)}</span>
        </span>
      </div>
    </div>
  );
};

/* ─── Latest feed card (Right column) ──────────────────── */
const LatestFeedCard = ({ article }) => (
  <div
    className="np-latest-card"
    onClick={() => goToArticle(article.id)}
    tabIndex={0}
    role="button"
    onKeyDown={(e) => e.key === "Enter" && goToArticle(article.id)}
  >
    {article.thumbnail && (
      <div className="np-latest-thumb">
        <img src={article.thumbnail} alt={article.title} loading="lazy" />
      </div>
    )}
    <div className="np-latest-text">
      {article.category && (
        <span className="np-cat-label">{article.category}</span>
      )}
      <h4 className="np-latest-title">{article.title}</h4>
      <span className="np-time">{timeAgo(article.published_at)}</span>
    </div>
  </div>
);

/* ─── Full page article row card ────────────────────────── */
const FeedCard = ({ article }) => (
  <article
    className="np-feed-card"
    onClick={() => goToArticle(article.id)}
    tabIndex={0}
    role="button"
    onKeyDown={(e) => e.key === "Enter" && goToArticle(article.id)}
  >
    <div className="np-feed-image">
      {article.thumbnail ? (
        <img src={article.thumbnail} alt={article.title} loading="lazy" />
      ) : (
        <div className="np-feed-placeholder" />
      )}
    </div>
    <div className="np-feed-text">
      <div className="np-feed-meta">
        {article.category && <span className="np-cat-badge">{article.category}</span>}
        <span className="np-scope-badge np-scope-badge--{(article.scope||'local').toLowerCase()}">
          {article.scope || "LOCAL"}
        </span>
      </div>
      <h3 className="np-feed-title">{article.title}</h3>
      {article.excerpt && <p className="np-feed-excerpt">{article.excerpt}</p>}
      <span className="np-meta-line">
        {article.author && <span className="np-author">{article.author}</span>}
        {article.author && <span className="np-dot">·</span>}
        <span className="np-time">{timeAgo(article.published_at)}</span>
      </span>
    </div>
  </article>
);

/* ─── Hot Topics Bar ────────────────────────────────────── */
const HotTopicsBar = ({ sectors, activeSector, onSelect }) => (
  <div className="np-hot-topics-bar">
    <span className="np-hot-badge">
      <span className="np-hot-icon">🔥</span> HOT TOPICS
    </span>
    <div className="np-topics-scroll">
      {sectors.map((s) => (
        <button
          key={s}
          className={`np-topic-pill ${activeSector === s ? "active" : ""}`}
          onClick={() => onSelect(s)}
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const NewsSection = ({ fullPage = false }) => {
  const s = useSettings();
  const [articles, setArticles] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [activeSector, setActiveSector] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    newsAPI
      .getAll(50, 0)
      .then((d) => setArticles(d.articles || []))
      .catch(() => setError("Could not load articles."))
      .finally(() => setLoading(false));
  }, []);

  const sectors = ["ALL", ...new Set(articles.map((a) => a.category).filter(Boolean))];

  const filtered = (activeFilter === "ALL"
    ? articles
    : articles.filter((a) => (a.scope || "LOCAL") === activeFilter)
  )
    .filter((a) => activeSector === "ALL" || a.category === activeSector)
    .slice()
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

  const todayArticles = filtered.filter(isPublishedToday);
  const displayArticles = todayArticles.length > 0 ? todayArticles : filtered;

  /* ── Homepage 3-column Nilepost layout ── */
  const renderHomepage = () => {
    const hero = displayArticles[0];
    const trending = displayArticles.slice(1, 6);
    const latest = displayArticles.slice(6, 12);

    return (
      <>
        <HotTopicsBar sectors={sectors} activeSector={activeSector} onSelect={setActiveSector} />
        <div className="np-three-col">
          {/* Left: Trending numbered list */}
          <div className="np-col-trending">
            <div className="np-col-header">
              <span className="np-col-title">TRENDING</span>
              <span className="np-col-line" />
            </div>
            {trending.length === 0 ? (
              <p className="np-empty-col">No stories yet.</p>
            ) : (
              trending.map((a, i) => (
                <TrendingCard key={a.id} article={a} rank={i + 1} />
              ))
            )}
          </div>

          {/* Center: Hero */}
          <div className="np-col-hero">
            <div className="np-col-header">
              <span className="np-col-title">TOP STORY</span>
              <span className="np-col-line" />
            </div>
            {hero ? (
              <HeroCard article={hero} />
            ) : (
              <div className="np-empty-col">No stories yet.</div>
            )}
          </div>

          {/* Right: Latest feed */}
          <div className="np-col-latest">
            <div className="np-col-header">
              <span className="np-col-title">LATEST NEWS</span>
              <span className="np-col-line" />
            </div>
            {latest.length === 0 ? (
              <p className="np-empty-col">No stories yet.</p>
            ) : (
              latest.map((a) => <LatestFeedCard key={a.id} article={a} />)
            )}
          </div>
        </div>

        {!loading && !error && displayArticles.length > 0 && (
          <div className="np-view-all-wrap">
            <button
              className="np-view-all-btn"
              onClick={() => { window.location.hash = "latest-stories"; }}
            >
              View All Stories →
            </button>
          </div>
        )}
      </>
    );
  };

  /* ── Full page 2-column Nilepost layout ── */
  const renderFullPage = () => {
    const sidebar = filtered.slice(0, 6);
    const feed = filtered;

    return (
      <div className="np-fullpage-layout">
        {/* Main feed */}
        <div className="np-fullpage-main">
          <div className="np-filters-row">
            <div className="np-scope-filters">
              {SCOPE_FILTERS.map((f) => (
                <button
                  key={f}
                  className={`np-scope-btn ${activeFilter === f ? "active" : ""}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="np-cat-filters">
              {sectors.map((sec) => (
                <button
                  key={sec}
                  className={`np-cat-btn ${activeSector === sec ? "active" : ""}`}
                  onClick={() => setActiveSector(sec)}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          {feed.length === 0 ? (
            <div className="np-section-empty">
              <Newspaper size={40} opacity={0.3} />
              <p>No stories published yet.</p>
            </div>
          ) : (
            <div className="np-feed-list">
              {feed.map((a) => (
                <FeedCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="np-fullpage-sidebar">
          <div className="np-sidebar-block">
            <div className="np-sidebar-header">
              <span className="np-sidebar-title">HOT RIGHT NOW</span>
              <span className="np-col-line" />
            </div>
            {sidebar.map((a, i) => (
              <div
                key={a.id}
                className="np-sidebar-card"
                onClick={() => goToArticle(a.id)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => e.key === "Enter" && goToArticle(a.id)}
              >
                <span className="np-sidebar-rank">{i + 1}</span>
                <div className="np-sidebar-info">
                  {a.thumbnail && (
                    <div className="np-sidebar-thumb">
                      <img src={a.thumbnail} alt={a.title} loading="lazy" />
                    </div>
                  )}
                  <div>
                    <p className="np-sidebar-title-text">{a.title}</p>
                    <span className="np-time">{timeAgo(a.published_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    );
  };

  return (
    <section
      className={`np-news-section ${fullPage ? "np-fullpage" : "np-homepage"}`}
      id="news"
    >
      {/* Section header */}
      <div className="np-section-header">
        <div className="np-section-title-wrap">
          <span className="np-section-badge">
            {fullPage ? "LATEST STORIES" : s("news_title", "LATEST STORIES")}
          </span>
          <span className="np-section-tagline">
            {fullPage
              ? "All published stories from Base2 TV"
              : s("news_subtitle", "Local first · Global when it matters")}
          </span>
        </div>
        {fullPage && (
          <button
            className="np-back-btn"
            onClick={() => { window.location.hash = ""; }}
          >
            ← Back to Home
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="np-section-empty">
          <div className="np-spinner" />
          <p>Loading stories…</p>
        </div>
      ) : error ? (
        <div className="np-section-empty">
          <Newspaper size={40} opacity={0.3} />
          <p>{error}</p>
        </div>
      ) : fullPage ? (
        renderFullPage()
      ) : (
        renderHomepage()
      )}
    </section>
  );
};

export default NewsSection;
