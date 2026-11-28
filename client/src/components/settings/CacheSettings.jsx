// handle the UI of setting 
// display cache statistic and clear cache button 

import { formatMs } from "../../utils/formatters";

function CacheSettings({ cacheStats, statsLoading, clearingCache, cacheMessage, onClearCache })  {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Cache Configuration</h2>
          <p>Monitor and manage your in-memory cache.</p>
        </div>
        <button
          className="danger-btn"
          onClick={onClearCache}
          disabled={clearingCache}
        >
          {clearingCache ? "Clearing..." : "Clear Cache"}
        </button>
      </div>

      {cacheMessage && <div className="success-banner">{cacheMessage}</div>}

      {statsLoading ? (
        <div className="empty-state compact">
          <h3>Loading cache stats...</h3>
        </div>
      ) : (
        <div className="cache-grid">
          <div className="cache-stat">
            <p>Cache Hits</p>
            <h2>{cacheStats.cacheHits}</h2>
          </div>

          <div className="cache-stat">
            <p>Cache Misses</p>
            <h2>{cacheStats.cacheMisses}</h2>
          </div>

          <div className="cache-stat">
            <p>Total Requests</p>
            <h2>{cacheStats.totalRequests}</h2>
          </div>

          <div className="cache-stat">
            <p>Cache Size</p>
            <h2>{cacheStats.cacheSize}</h2>
          </div>

          <div className="cache-stat">
            <p>Cache TTL</p>
            <h2>{cacheStats.ttlSeconds}s</h2>
          </div>
        </div>
      )}
    </section>
  );
}

export default CacheSettings;