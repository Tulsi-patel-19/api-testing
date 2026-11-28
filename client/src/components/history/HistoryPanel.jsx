import HistoryList from "./HistoryList";

function HistoryPanel({ title, subtitle, items, loading, error, onViewAll }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {onViewAll && (
          <button className="secondary-btn" onClick={onViewAll}>
            View All →
          </button>
        )}
      </div>

      <HistoryList
        items={items}
        loading={loading}
        error={error}
      />
    </section>
  );
}

export default HistoryPanel;