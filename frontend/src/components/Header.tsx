export default function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="header-title">RACKET MATCHMAKER</h1>
        <p className="header-subtitle">Smart court & matchup planner for racket sports</p>
      </div>
      {/* 抽象的な装飾シェイプ */}
      <div className="header-shape header-shape-1"></div>
      <div className="header-shape header-shape-2"></div>
      <div className="header-shape header-shape-3"></div>
    </header>
  );
}
