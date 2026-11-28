
// file -> URL input , Run test button , loading , errors

import ResultCard from "./ResultCard.jsx";
function TestForm({
    url,
    setUrl,
    runTest,
    loading,
    error,
    result,
    showFullResult = false,
}) {
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

            <p className="hint">
                Tip: Run the same endpoint twice to compare MISS and HIT.
            </p>

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

            <ResultCard
                result={result}
                showFullResult={showFullResult}
            />
        </section>
    );
}

export default TestForm;
