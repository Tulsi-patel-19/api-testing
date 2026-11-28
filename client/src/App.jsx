import { useCallback, useEffect, useState } from "react";
import "./App.css";

import { PAGES } from "./constants/pages";
import { formatMs } from "./utils/formatters";

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import WelcomeBanner from "./components/dashboard/WelcomeBanner";
import StatsGrid from "./components/dashboard/StatsGrid";
import TestForm from "./components/dashboard/TestForm";

import HistoryPanel from "./components/history/HistoryPanel";
import HistoryList from "./components/history/HistoryList";

import CacheSettings from "./components/settings/CacheSettings";

const API_BASE = "http://localhost:3000";

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
  const pageInfo = PAGES[page];

  // Fetch dashboard summary
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

  // Fetch recent history
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

  // Fetch full history
  const loadHistory = useCallback(async (filter = "ALL") => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const query =
        filter === "ALL" ? "" : `?cacheStatus=${filter}`;

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

  // Fetch cache statistics
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

  // Check backend and MongoDB health
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

  // Refresh all dashboard data
  const refreshDashboardData = useCallback(async () => {
    await Promise.all([
      loadSummary(),
      loadRecentHistory(),
      loadHistory(historyFilter),
      loadCacheStats(),
      checkHealth(),
    ]);
  }, [
    checkHealth,
    historyFilter,
    loadCacheStats,
    loadHistory,
    loadRecentHistory,
    loadSummary,
  ]);

  // Initial data loading
  useEffect(() => {
    loadSummary();
    loadRecentHistory();
    loadHistory("ALL");
    loadCacheStats();
    checkHealth();
  }, [
    checkHealth,
    loadCacheStats,
    loadHistory,
    loadRecentHistory,
    loadSummary,
  ]);

  // Periodic health check every 8 seconds
  useEffect(() => {
    const healthTimer = setInterval(checkHealth, 8000);

    return () => clearInterval(healthTimer);
  }, [checkHealth]);

  // Run an API test
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

  // Clear cache
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

  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
        backendConnected={backendConnected}
        pages={PAGES}
      />

      <main className="main">
        <Header
          pageInfo={pageInfo}
          backendConnected={backendConnected}
          health={health}
        />

        {/* Dashboard page */}
        {page === "dashboard" && (
          <>
            <WelcomeBanner />

            <StatsGrid
              summary={summary}
              loading={statsLoading}
            />

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

        {/* API Testing page */}
        {page === "testing" && (
          <>
            <StatsGrid
              summary={summary}
              loading={statsLoading}
            />

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

        {/* History page */}
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
                    className={
                      historyFilter === filter ? "" : "secondary-button"
                    }
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

        {/* Settings page */}
        {page === "settings" && (
          <CacheSettings
            cacheStats={cacheStats}
            statsLoading={statsLoading}
            clearingCache={clearingCache}
            cacheMessage={cacheMessage}
            onClearCache={handleClearCache}
          />
        )}

        <footer>API Performance Lab · Built for API observability</footer>
      </main>
    </div>
  );
}

export default App;