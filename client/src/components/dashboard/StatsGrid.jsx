
import StatCard from "./StatCard";
import { formatMs } from "../../utils/formatters";

function StatsGrid({ summary, loading }) {
  return (
    <section className="stats-grid">
      <StatCard
        title="Total Requests"
        value={loading ? "..." : summary.totalTests}
        description="All API tests"
      />

      <StatCard
        title="Cache Hits"
        value={loading ? "..." : summary.totalHits}
        description="Served from cache"
      />

      <StatCard
        title="Cache Misses"
        value={loading ? "..." : summary.totalMisses}
        description="Fetched from API"
      />

      <StatCard
        title="Avg. Response Time"
        value={loading ? "..." : formatMs(summary.averageResponseTime)}
        description="Across all tests"
      />
    </section>
  );
}

export default StatsGrid;
