
// file -> HIT/MISS ,response time , api called , json output
import { formatMs } from "../../utils/formatters";

function ResultCard({ result, showFullResult }) {
  if (!result) return null;

  return (
    <div className="result-box">
      <div className="result-grid">
        <div>
          <p>Cache status</p>
          <span
            className={
              result.cacheStatus === "HIT"
                ? "status-pill hit"
                : "status-pill miss"
            }
          >
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
  );
}

export default ResultCard;
