import { useEffect, useState, useRef } from 'react';
import { loadScheduleData } from './utils/scheduleParser';
import { usePredictions } from './context/PredictionContext';
import { useTheme } from './context/ThemeContext';
import { validateTotalWinsLosses } from './utils/validation';
import { exportAsJSON, importFromJSON } from './utils/exportImport';
import TeamList from './components/TeamList';
import TeamDetail from './components/TeamDetail';
import StandingsTable from './components/StandingsTable';
import PlayoffSeeding from './components/PlayoffSeeding';
import Guide from './components/Guide';
import ExportPreview from './components/ExportPreview';
import PlayerBrowser from './components/PlayerBrowser';
import { usePWAInstall } from './hooks/usePWAInstall';
import NavBar from './components/NavBar';
import BottomTabBar from './components/BottomTabBar';
import SeasonSubNav from './components/SeasonSubNav';
import ActionSheet from './components/ActionSheet';
import Sidebar from './components/Sidebar';
import FavoriteTeamPicker from './components/FavoriteTeamPicker';

function App() {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Two-level navigation
  const [activeTab, setActiveTab] = useState('predictions');
  const [seasonView, setSeasonView] = useState('predictions');

  const { getPredictionCount, resetAllPredictions, predictions, importPredictions, generateRandomPredictions } = usePredictions();
  const { darkMode, toggleDarkMode, favoriteTeam, setFavoriteTeam } = useTheme();
  const fileInputRef = useRef(null);

  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);

  const [teamSearch, setTeamSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');

  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  useEffect(() => {
    if (seasonView !== 'predictions') {
      setTeamSearch('');
      setDivisionFilter('');
    }
  }, [seasonView]);

  useEffect(() => {
    setTeamSearch('');
    setDivisionFilter('');
  }, [activeTab]);

  useEffect(() => {
    loadScheduleData()
      .then(data => { setScheduleData(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const handleExportJSON = () => { exportAsJSON(predictions); setActionSheetOpen(false); };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importFromJSON(file);
      importPredictions(data);
      alert(`Imported predictions for ${Object.keys(data).length} teams.`);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
    e.target.value = '';
  };

  const handleExportImage = () => { setExportPreviewOpen(true); setActionSheetOpen(false); };
  const handleRandom = () => {
    setActionSheetOpen(false);
    if (!window.confirm('This will replace all current predictions with random ones. Continue?')) return;
    if (scheduleData) generateRandomPredictions(scheduleData.teams);
  };
  const handleReset = () => {
    setActionSheetOpen(false);
    if (!window.confirm('Are you sure you want to reset all predictions? This cannot be undone.')) return;
    resetAllPredictions();
  };
  const handleInstall = () => { triggerInstall(); setActionSheetOpen(false); };
  const handleImportClick = () => { fileInputRef.current?.click(); setActionSheetOpen(false); };
  const handleMyTeam = () => { setTeamPickerOpen(true); setActionSheetOpen(false); };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <span className="text-sm" style={{ color: 'var(--color-label-secondary)' }}>Loading…</span>
      </div>
    );
  }

  if (error || !scheduleData) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <span className="text-sm" style={{ color: 'var(--color-accent-red)' }}>{error || 'No data available'}</span>
      </div>
    );
  }

  const predictionCount = getPredictionCount();
  const totalTeams = scheduleData.teams.length;
  const validation = validateTotalWinsLosses(predictions);
  const isSeasonComplete = predictionCount === totalTeams && validation.isValid;

  return (
    <div className="app-shell">

      {/* ── Desktop Sidebar (lg+) ─────────────────────────────── */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        predictionCount={predictionCount}
        totalTeams={totalTeams}
        isSeasonComplete={isSeasonComplete}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onGuide={() => setGuideOpen(true)}
        onExportImage={handleExportImage}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportClick}
        onRandom={handleRandom}
        onReset={handleReset}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstall={handleInstall}
        favoriteTeam={favoriteTeam}
        onMyTeam={handleMyTeam}
      />

      {/* ── Main panel ───────────────────────────────────────── */}
      <div className="app-main">

        {/* Top nav bar — mobile/tablet only, hidden lg+ via CSS */}
        <NavBar
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
          onMenuOpen={() => setActionSheetOpen(true)}
        />

        {/* Season sub-navigation */}
        {activeTab === 'predictions' && (
          <div className="season-subnav">
            {/* Title + progress — shown on mobile (lg+ has this in sidebar) */}
            <div className="season-subnav-header lg:hidden">
              <h1
                className="font-display font-bold"
                style={{ fontSize: '20px', color: 'var(--color-label)', letterSpacing: '0.08em' }}
              >
                2026 SEASON
              </h1>
              <span
                className="text-xs font-bold tabular-nums px-2 py-0.5 rounded"
                style={{
                  background: isSeasonComplete ? 'rgba(46,213,120,0.12)' : 'var(--color-fill)',
                  color: isSeasonComplete ? 'var(--color-accent-green)' : 'var(--color-label-secondary)',
                }}
              >
                {predictionCount}/{totalTeams}{isSeasonComplete && ' ✓'}
              </span>
            </div>
            <SeasonSubNav activeView={seasonView} onViewChange={setSeasonView} />
          </div>
        )}

        {/* ── Content area ─────────────────────────────────── */}
        <div className="content-area px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6">

          {activeTab === 'predictions' && (
            <>
              {seasonView === 'predictions' && (
                <>
                  {/* Search + filter */}
                  <div className="flex gap-2 mb-4 lg:mb-5">
                    <div className="flex-1 relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: 'var(--color-label-tertiary)' }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={teamSearch}
                        onChange={e => setTeamSearch(e.target.value)}
                        placeholder="Search teams…"
                        aria-label="Search teams"
                        className="w-full pl-9 pr-3 py-2 rounded-xl font-medium focus:outline-none"
                        style={{
                          fontSize: '16px',
                          background: 'var(--color-fill-secondary)',
                          color: 'var(--color-label)',
                        }}
                      />
                    </div>
                    <div className="flex gap-1.5 items-center shrink-0">
                      {[['', 'All'], ['AFC', 'AFC'], ['NFC', 'NFC']].map(([val, label]) => (
                        <button
                          key={val}
                          onClick={() => setDivisionFilter(val)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                          style={{
                            background: divisionFilter === val ? 'var(--color-signature)' : 'var(--color-fill-secondary)',
                            color: divisionFilter === val ? 'var(--color-signature-fg)' : 'var(--color-label-secondary)',
                          }}
                          aria-pressed={divisionFilter === val}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <TeamList
                    teams={scheduleData.teams}
                    onTeamClick={setSelectedTeam}
                    teamSearch={teamSearch}
                    divisionFilter={divisionFilter}
                  />
                </>
              )}

              {seasonView === 'standings' && <StandingsTable teams={scheduleData.teams} />}
              {seasonView === 'playoffs' && <PlayoffSeeding teams={scheduleData.teams} />}
            </>
          )}

          {activeTab === 'statistics' && <PlayerBrowser teams={scheduleData.teams} />}

          {activeTab === 'companion' && (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'var(--color-fill)' }}
              >
                <svg width="32" height="32" viewBox="0 0 26 26" fill="none" style={{ color: 'var(--color-signature)' }}>
                  <path d="M13 3l2.5 5 5.5.8-4 3.9.95 5.5L13 15.7l-4.95 2.5.95-5.5-4-3.9 5.5-.8z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" />
                </svg>
              </div>
              <h2
                className="font-display font-bold mb-2"
                style={{ fontSize: '22px', letterSpacing: '0.06em', color: 'var(--color-label)' }}
              >
                COMPANION
              </h2>
              <p
                className="text-sm max-w-xs leading-relaxed mb-1"
                style={{ color: 'var(--color-label-secondary)' }}
              >
                Fantasy league integration, Sleeper sync, and advanced analytics — coming in v4.0.
              </p>
              <span
                className="inline-block mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(245,183,0,0.12)',
                  color: 'var(--color-signature)',
                  letterSpacing: '0.10em',
                }}
              >
                Coming Soon
              </span>
            </div>
          )}
        </div>

        {/* Bottom tab bar — mobile/tablet only, hidden lg+ via CSS */}
        <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* ── Action Sheet (mobile menu) ───────────────────────── */}
      {actionSheetOpen && (
        <ActionSheet
          onClose={() => setActionSheetOpen(false)}
          predictionCount={predictionCount}
          activeTab={activeTab}
          onGuide={() => { setGuideOpen(true); setActionSheetOpen(false); }}
          onExportImage={handleExportImage}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportClick}
          onRandom={handleRandom}
          onReset={handleReset}
          onInstall={isInstallable && !isInstalled ? handleInstall : null}
          onMyTeam={handleMyTeam}
          favoriteTeam={favoriteTeam}
        />
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      {guideOpen && <Guide onClose={() => setGuideOpen(false)} activeTab={activeTab} />}
      {teamPickerOpen && <FavoriteTeamPicker onClose={() => setTeamPickerOpen(false)} />}

      {exportPreviewOpen && (
        <ExportPreview teams={scheduleData.teams} onClose={() => setExportPreviewOpen(false)} />
      )}

      {selectedTeam && (
        <TeamDetail
          team={selectedTeam}
          allTeams={scheduleData.teams}
          onClose={() => setSelectedTeam(null)}
        />
      )}

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </div>
  );
}

export default App;
