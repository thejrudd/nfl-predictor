const VIEWS = [
  { id: 'stats', label: 'Stats' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'standings', label: 'Standings' },
];

export default function StatisticsSubNav({ activeView = 'stats', onViewChange }) {
  return (
    <div className="season-tabs" role="tablist" aria-label="Statistics views">
      {VIEWS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeView === id}
          onClick={() => onViewChange?.(id)}
          className={`season-tab${activeView === id ? ' active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
