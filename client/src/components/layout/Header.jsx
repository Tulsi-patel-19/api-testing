
/*
health -> backend and mongodb health info
*/
function Header({ pageInfo, backendConnected, health }) {
  const systemLabel = !backendConnected
    ? "System Offline"
    : health.mongo
      ? "System Ready"
      : "MongoDB Offline";

/*
badgeclass -> dynamically apply css class 
badge -> base styling 

*/
  const badgeClass = `badge ${
    backendConnected && !health.mongo ? "warn" : ""
  } ${backendConnected ? "" : "offline"}`.trim();

  return (
    <header className="topbar">
      <div>
        <h1>{pageInfo.title}</h1>
        <p>{pageInfo.subtitle}</p>
      </div>

      <span className={badgeClass}>
        ● {systemLabel}
      </span>
    </header>
  );
}

export default Header;
