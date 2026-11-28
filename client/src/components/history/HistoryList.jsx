
// it retrives data from its parents component insted of fetching it itself
// conditional rendering
import { formatMs, formatDate } from "../../utils/formatters";

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
                <span
                  className={
                    item.cacheStatus === "HIT"
                      ? "status-pill hit"
                      : "status-pill miss"
                  }
                >
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

export default HistoryList;
