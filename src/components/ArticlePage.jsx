import React, { useState, useEffect } from "react";
import { newsAPI } from "../services/api";
import "./ArticlePage.css";

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

const formatDate = (dt) => {
  if (!dt) return "";
  return new Date(dt).toLocaleDateString("en-UG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const goToArticle = (id) => { window.location.hash = `news-${id}`; };

const RelatedCard = ({ article }) => (
  <div
    className="ap-related-card"
    onClick={() => goToArticle(article.id)}
    tabIndex={0}
    role="button"
    onKeyDown={(e) => e.key === "Enter" && goToArticle(article.id)}
  >
    <div className="ap-related-image">
      {article.thumbnail ? (
        <img src={article.thumbnail} alt={article.title} loading="lazy" />
      ) : (
        <div className="ap-related-placeholder" />
      )}
    </div>
    <div className="ap-related-text">
      {article.category && (
        <span className="ap-cat-badge">{article.category}</span>
      )}
      <h4 className="ap-related-title">{article.title}</h4>
      <span className="ap-meta-time">{timeAgo(article.published_at)}</span>
    </div>
  </div>
);

const ArticlePage = ({ id }) => {
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    setArticle(null);

    newsAPI
      .getById(id)
      .then((data) => {
        const art = data.article || data;
        setArticle(art);
        // Load related: same category or just latest
        return newsAPI.getAll(20, 0, art.category || "");
      })
      .then((d) => {
        const all = d.articles || [];
        setRelated(all.filter((a) => String(a.id) !== String(id)).slice(0, 6));
      })
      .catch(() => setError("Could not load this article."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} | Base2 TV Uganda`;
    }
    return () => {
      document.title = "Base2 TV Uganda | Telefwunkeni — Watch Live, News & Youth TV 24/7";
    };
  }, [article]);

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = article?.title || "Check this out on Base2 TV";

    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    } else if (platform === "x") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (loading) {
    return (
      <div className="ap-loading">
        <div className="ap-spinner" />
        <p>Loading article…</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="ap-error">
        <p>{error || "Article not found."}</p>
        <button className="ap-back-btn" onClick={() => { window.location.hash = "latest-stories"; }}>
          ← Back to News
        </button>
      </div>
    );
  }

  return (
    <div className="ap-root">
      {/* Breadcrumb */}
      <nav className="ap-breadcrumb" aria-label="Breadcrumb">
        <button className="ap-crumb-link" onClick={() => { window.location.hash = ""; }}>Home</button>
        <span className="ap-crumb-sep">/</span>
        <button className="ap-crumb-link" onClick={() => { window.location.hash = "latest-stories"; }}>News</button>
        {article.category && (
          <>
            <span className="ap-crumb-sep">/</span>
            <span className="ap-crumb-current">{article.category}</span>
          </>
        )}
      </nav>

      <div className="ap-layout">
        {/* ── Main article content ── */}
        <main className="ap-main">

          {/* Category + Title */}
          <div className="ap-article-header">
            {article.category && (
              <span className="ap-cat-badge">{article.category}</span>
            )}
            <h1 className="ap-title">{article.title}</h1>
            {article.excerpt && (
              <p className="ap-deck">{article.excerpt}</p>
            )}

            {/* Byline */}
            <div className="ap-byline">
              <div className="ap-byline-avatar">
                {article.author
                  ? article.author.charAt(0).toUpperCase()
                  : "B"}
              </div>
              <div className="ap-byline-info">
                <span className="ap-author-name">
                  {article.author || "Base2 TV Newsroom"}
                </span>
                <span className="ap-pub-date">
                  {formatDate(article.published_at)}
                  {article.published_at && (
                    <span className="ap-time-ago"> · {timeAgo(article.published_at)}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Share bar */}
          <div className="ap-share-bar">
            <span className="ap-share-label">SHARE</span>
            <button
              className="ap-share-btn ap-share-btn--wa"
              onClick={() => handleShare("whatsapp")}
              aria-label="Share on WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.528 5.853L.057 23.25c-.073.293.205.553.498.466l5.494-1.483A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.962-1.357l-.356-.211-3.684.994 1.003-3.577-.232-.37A9.718 9.718 0 012.25 12C2.25 6.617 6.617 2.25 12 2.25S21.75 6.617 21.75 12 17.383 21.75 12 21.75z"/>
              </svg>
              WhatsApp
            </button>
            <button
              className="ap-share-btn ap-share-btn--fb"
              onClick={() => handleShare("facebook")}
              aria-label="Share on Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
            <button
              className="ap-share-btn ap-share-btn--x"
              onClick={() => handleShare("x")}
              aria-label="Share on X"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.735-8.845L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X
            </button>
            <button
              className="ap-share-btn ap-share-btn--copy"
              onClick={() => handleShare("copy")}
              aria-label="Copy link"
            >
              {copied ? "✓ Copied!" : "🔗 Copy Link"}
            </button>
          </div>

          {/* Featured image */}
          {article.thumbnail && (
            <figure className="ap-featured-image">
              <img src={article.thumbnail} alt={article.title} />
              {article.image_caption && (
                <figcaption>{article.image_caption}</figcaption>
              )}
            </figure>
          )}

          {/* Body */}
          <div className="ap-body">
            {article.body ? (
              <div
                className="ap-body-content"
                dangerouslySetInnerHTML={{ __html: article.body.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>").replace(/^/, "<p>").replace(/$/, "</p>") }}
              />
            ) : article.excerpt ? (
              <div className="ap-body-content">
                <p>{article.excerpt}</p>
              </div>
            ) : (
              <p className="ap-no-body">Full article content coming soon.</p>
            )}
          </div>

          {/* Tags */}
          {article.category && (
            <div className="ap-tags">
              <span className="ap-tags-label">TAGS:</span>
              <span className="ap-tag">{article.category}</span>
              {article.scope && <span className="ap-tag">{article.scope}</span>}
            </div>
          )}

          {/* Bottom share */}
          <div className="ap-bottom-share">
            <span className="ap-share-label">SHARE THIS STORY</span>
            <div className="ap-share-row">
              <button className="ap-share-btn ap-share-btn--wa" onClick={() => handleShare("whatsapp")}>WhatsApp</button>
              <button className="ap-share-btn ap-share-btn--fb" onClick={() => handleShare("facebook")}>Facebook</button>
              <button className="ap-share-btn ap-share-btn--x" onClick={() => handleShare("x")}>X</button>
              <button className="ap-share-btn ap-share-btn--copy" onClick={() => handleShare("copy")}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </main>

        {/* ── Sidebar ── */}
        <aside className="ap-sidebar">
          <div className="ap-sidebar-block">
            <div className="ap-sidebar-header">
              <span>MORE STORIES</span>
            </div>
            {related.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="ap-sidebar-card"
                onClick={() => goToArticle(a.id)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => e.key === "Enter" && goToArticle(a.id)}
              >
                {a.thumbnail && (
                  <div className="ap-sidebar-thumb">
                    <img src={a.thumbnail} alt={a.title} loading="lazy" />
                  </div>
                )}
                <div className="ap-sidebar-text">
                  {a.category && <span className="ap-sidebar-cat">{a.category}</span>}
                  <p className="ap-sidebar-title">{a.title}</p>
                  <span className="ap-sidebar-time">{timeAgo(a.published_at)}</span>
                </div>
              </div>
            ))}

            <button
              className="ap-more-news-btn"
              onClick={() => { window.location.hash = "latest-stories"; }}
            >
              View All News →
            </button>
          </div>
        </aside>
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <section className="ap-related-section">
          <div className="ap-related-header">
            <span className="ap-related-title">RELATED STORIES</span>
            <span className="ap-related-line" />
          </div>
          <div className="ap-related-grid">
            {related.slice(0, 3).map((a) => (
              <RelatedCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ArticlePage;
