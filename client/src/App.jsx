import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:3000";

const PAGES = {
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    title: "Dashboard",
    subtitle: "Monitor and analyze your API performance.",
  },
  testing: {
    id: "testing",
    label: "API Testing",
    title: "API Testing",
    subtitle: "Enter an endpoint to measure its performance.",
  },
  history: {
    id: "history",
    label: "Test History",
    title: "Test History",
    subtitle: "Review every API test stored in MongoDB.",
  },
  settings: {
    id: "settings",
    label: "Settings",
    title: "Settings",
    subtitle: "Manage cache and connection details.",
  },
};

const EMPTY_SUMMARY = {
  totalTests: 0,
  totalHits: 0,
  totalMisses: 0,
  averageResponseTime: 0,
};

const EMPTY_CACHE_STATS = {
  cacheHits: 0,
  cacheMisses: 0,
  totalRequests: 0,
  cacheSize: 0,
  ttlSeconds: 60,
};

function formatMs(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${Number(value).toFixed(2)} ms`;
}

function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString();
}

function App() {
  const [page, setPage] = useState("dashboard");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentHistory, setRecentHistory] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [cacheStats, setCacheStats] = useState(EMPTY_CACHE_STATS);
  const [cacheMessage, setCacheMessage] = useState("");
  const [clearingCache, setClearingCache] = useState(false);
  const [health, setHealth] = useState({
    connected: false,
    mongo: false,
  });

  const backendConnected = health.connected;
  const systemLabel = !backendConnected
    ? "System Offline"
    : health.mongo
      ? "System Ready"
      : "MongoDB Offline";

  const loadSummary = useCallback(async () => {
    setStatsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/history/summary`);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load summary");
      }

      setSummary(data.summary || EMPTY_SUMMARY);
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadRecentHistory = useCallback(async () => {
    setRecentLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/history?limit=8`);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load history");
      }

      setRecentHistory(data.data || []);
    } catch {
      setRecentHistory([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (filter = "ALL") => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const query = filter === "ALL" ? "" : `?cacheStatus=${filter}`;
      const response = await fetch(`${API_BASE}/api/history${query}`);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load history");
      }

      setHistory(data.data || []);
    } catch (err) {
      setHistory([]);
      setHistoryError(err.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadCacheStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/cache/stats`);
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to load cache stats");
      }

      setCacheStats(data.stats || EMPTY_CACHE_STATS);
    } catch {
      setCacheStats(EMPTY_CACHE_STATS);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      const data = await response.json();

      setHealth({
        connected: Boolean(data.success && data.server),
        mongo: Boolean(data.mongo),
      });
    } catch {
      setHealth({
        connected: false,
        mongo: false,
      });
    }
  }, []);

  const refreshDashboardData = useCallback(async () => {
    await Promise.all([
      loadSummary(),
      loadRecentHistory(),
      loadHistory(historyFilter),
      loadCacheStats(),
      checkHealth(),
    ]);
  }, [checkHealth, historyFilter, loadCacheStats, loadHistory, loadRecentHistory, loadSummary]);

  useEffect(() => {
    loadSummary();
    loadRecentHistory();
    loadHistory("ALL");
    loadCacheStats();
    checkHealth();
  }, [checkHealth, loadCacheStats, loadHistory, loadRecentHistory, loadSummary]);

  useEffect(() => {
    const healthTimer = setInterval(checkHealth, 8000);
    return () => clearInterval(healthTimer);
  }, [checkHealth]);

  async function runTest() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/external`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setError(data.message || "API test failed");
        await refreshDashboardData();
        return;
      }

      setResult(data);
      await refreshDashboardData();
    } catch (err) {
      setError(err.message || "Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  }

  async function handleClearCache() {
    setClearingCache(true);
    setCacheMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/cache`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to clear cache");
      }

      setCacheStats(data.stats || EMPTY_CACHE_STATS);
      setCacheMessage(data.message || "Cache cleared successfully");
      await loadCacheStats();
      await loadSummary();
    } catch (err) {
      setCacheMessage(err.message || "Failed to clear cache");
    } finally {
      setClearingCache(false);
    }
  }

  const pageInfo = PAGES[page];

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">⚡ API Lab</h2>

        {Object.values(PAGES).map((item) => (
          <button
            key={item.id}
            type="button"
            className={page === item.id ? "nav active" : "nav"}
            onClick={() => setPage(item.id)}
          >
            {item.label}
          </button>
        ))}

        <div className="sidebar-bottom">
          <span className={backendConnected ? "status-dot" : "status-dot offline"}></span>
          {backendConnected ? "Backend Connected" : "Backend Disconnected"}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{pageInfo.title}</h1>
            <p>{pageInfo.subtitle}</p>
          </div>
          <span className={`badge ${backendConnected ? "" : "offline"} ${backendConnected && !health.mongo ? "warn" : ""}`.trim()}>
            ● {systemLabel}
          </span>
        </header>

        {page === "dashboard" && (
          <>
            <section className="welcome">
              <div>
                <p className="eyebrow">API PERFORMANCE LAB</p>
                <h2>Test smarter. Build faster.</h2>
                <p>Measure response times and understand your cache performance.</p>
              </div>
              <div className="welcome-icon">⌁</div>
            </section>

            <StatsGrid summary={summary} loading={statsLoading} />

            <TestForm
              url={url}
              setUrl={setUrl}
              runTest={runTest}
              loading={loading}
              error={error}
              result={result}
            />

            <HistoryPanel
              title="Recent Test History"
              subtitle="Your latest API performance tests will appear here."
              items={recentHistory}
              loading={recentLoading}
              error=""
              onViewAll={() => setPage("history")}
            />
          </>
        )}

        {page === "testing" && (
          <>
            <StatsGrid summary={summary} loading={statsLoading} />
            <TestForm
              url={url}
              setUrl={setUrl}
              runTest={runTest}
              loading={loading}
              error={error}
              result={result}
              showFullResult
            />
          </>
        )}

        {page === "history" && (
          <section className="panel history-panel">
            <div className="panel-heading">
              <div>
                <h2>MongoDB Test History</h2>
                <p>Filter tests by cache HIT or MISS.</p>
              </div>
              <div className="filter-row">
                {["ALL", "HIT", "MISS"].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={historyFilter === filter ? "" : "secondary-button"}
                    onClick={() => {
                      setHistoryFilter(filter);
                      loadHistory(filter);
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <HistoryList
              items={history}
              loading={historyLoading}
              error={historyError}
            />
          </section>
        )}

        {page === "settings" && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Cache settings</h2>
                <p>In-memory cache used for repeated API tests.</p>
              </div>
            </div>

            <div className="settings-grid">
              <div className="setting-row">
                <div>
                  <h3>Cache lifetime</h3>
                  <p>Responses stay in memory for a fixed 60 seconds.</p>
                </div>
                <span className="method">{cacheStats.ttlSeconds || 60}s</span>
              </div>

              <div className="setting-row">
                <div>
                  <h3>Cached items</h3>
                  <p>Number of API responses currently stored.</p>
                </div>
                <strong>{cacheStats.cacheSize}</strong>
              </div>

              <div className="setting-row">
                <div>
                  <h3>Live cache hits / misses</h3>
                  <p>Counters for this server session. Clearing cache resets them.</p>
                </div>
                <strong>
                  {cacheStats.cacheHits} / {cacheStats.cacheMisses}
                </strong>
              </div>

              <div className="setting-row">
                <div>
                  <h3>MongoDB</h3>
                  <p>Test history is saved only while the database is connected.</p>
                </div>
                <span className={health.mongo ? "badge" : "badge warn"}>
                  {health.mongo ? "Connected" : "Offline"}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={handleClearCache}
              disabled={clearingCache || !backendConnected}
            >
              {clearingCache ? "Clearing..." : "Clear Cache"}
            </button>

            {cacheMessage && <p className="hint">{cacheMessage}</p>}
          </section>
        )}

        <footer>API Performance Lab · Built for API observability</footer>
      </main>
    </div>
  );
}

function StatsGrid({ summary, loading }) {
  return (
    <section className="stats-grid">
      <div className="stat-card">
        <p>Total Requests</p>
        <h2>{loading ? "..." : summary.totalTests}</h2>
        <span>All API tests</span>
      </div>
      <div className="stat-card">
        <p>Cache Hits</p>
        <h2>{loading ? "..." : summary.totalHits}</h2>
        <span>Served from cache</span>
      </div>
      <div className="stat-card">
        <p>Cache Misses</p>
        <h2>{loading ? "..." : summary.totalMisses}</h2>
        <span>Fetched from API</span>
      </div>
      <div className="stat-card">
        <p>Avg. Response Time</p>
        <h2>{loading ? "..." : formatMs(summary.averageResponseTime)}</h2>
        <span>Across all tests</span>
      </div>
    </section>
  );
}

function TestForm({ url, setUrl, runTest, loading, error, result, showFullResult = false }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Test an API</h2>
          <p>Enter an endpoint to measure its performance.</p>
        </div>
        <span className="method">GET</span>
      </div>

      <label htmlFor="api-url">API Endpoint URL</label>

      <div className="input-row">
        <input
          id="api-url"
          type="url"
          placeholder="https://jsonplaceholder.typicode.com/posts"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          onClick={runTest}
          disabled={!url.trim() || loading}
        >
          {loading ? "Running..." : "▶ Run Test"}
        </button>
      </div>

      <p className="hint">Tip: Run the same endpoint twice to compare MISS and HIT.</p>

      {error && (
        <div className="error-banner">
          <strong>Test failed</strong>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="empty-state compact">
          <h3>Running test...</h3>
          <p>Measuring response time and cache status.</p>
        </div>
      )}

      {result && (
        <div className="result-box">
          <div className="result-grid">
            <div>
              <p>Cache status</p>
              <span className={result.cacheStatus === "HIT" ? "status-pill hit" : "status-pill miss"}>
                {result.cacheStatus}
              </span>
            </div>
            <div>
              <p>Response time</p>
              <strong>{formatMs(result.responseTime)}</strong>
            </div>
            <div>
              <p>API called</p>
              <strong>{result.apicalled ? "Yes" : "No"}</strong>
            </div>
          </div>

          {(showFullResult || result.data) && (
            <>
              <label>Response JSON</label>
              <pre className="result-json">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function HistoryPanel({ title, subtitle, items, loading, error, onViewAll }) {
  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {onViewAll && (
          <button type="button" className="secondary-button" onClick={onViewAll}>
            View All
          </button>
        )}
      </div>

      <HistoryList items={items} loading={loading} error={error} />
    </section>
  );
}

function HistoryList({ items, loading, error }) {
  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◷</div>
        <h3>Loading tests...</h3>
        <p>Fetching saved results from MongoDB.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">!</div>
        <h3>Could not load history</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◷</div>
        <h3>No tests displayed yet</h3>
        <p>Your test history will be shown here.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th>URL</th>
            <th>Cache</th>
            <th>Time</th>
            <th>API called</th>
            <th>Result</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td className="url-cell">{item.apiurl}</td>
              <td>
                <span className={item.cacheStatus === "HIT" ? "status-pill hit" : "status-pill miss"}>
                  {item.cacheStatus}
                </span>
              </td>
              <td>{formatMs(item.responseTime)}</td>
              <td>{item.apiCalled ? "Yes" : "No"}</td>
              <td>{item.success === false ? "Failed" : "OK"}</td>
              <td>{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
