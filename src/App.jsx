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

function App() {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [currentView, setCurrentView] = useState('predictions'); // 'predictions', 'standings', or 'playoffs'

  const { getPredictionCount, resetAllPredictions, predictions, importPredictions, generateRandomPredictions } = usePredictions();
  const { darkMode, toggleDarkMode } = useTheme();
  const fileInputRef = useRef(null);
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const { isInstallable, isInstalled, triggerInstall } = usePWAInstall();

  // Collapsing header — position-based, collapse zone = exact measured collapsible height
  // so content stays locked to the header bottom throughout the transition.
  const [headerCollapsed, setHeaderCollapsed] = useState(false); // drives hamburger nav only
  const titleRef = useRef(null);
  const tabsRef = useRef(null);
  const controlsRowRef = useRef(null);
  const prevCollapsedRef = useRef(false);
  const spacerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const isMobile = () => window.innerWidth < 640;
    const CONTROLS_MARGIN = 16; // mt-4 = 1rem = 16px, collapses to 0

    // Mutable measurements — updated by measure() whenever layout may have changed.
    let titleNaturalH = 0;
    let tabsNaturalH  = 0;
    let COLLAPSE_ZONE = 0;

    // Read the live scrollHeight of each collapsible section.
    // Must be called (a) at mount and (b) after fonts load, because
    // "NFL SEASON PREDICTOR" at text-4xl may wrap differently with the
    // fallback sans-serif vs. Barlow Condensed, changing titleNaturalH by
    // ~40px and making COLLAPSE_ZONE wrong until the font is ready.
    const measure = () => {
      titleNaturalH = titleRef.current?.scrollHeight ?? 90;
      tabsNaturalH  = tabsRef.current?.scrollHeight  ?? 160;
      COLLAPSE_ZONE = titleNaturalH + CONTROLS_MARGIN + tabsNaturalH;
    };

    const applyProgress = (p) => {
      if (titleRef.current) {
        const h = (1 - p) * titleNaturalH;
        // Snap sub-pixel values to 0 to prevent a 1-pixel sliver of text
        // flickering when inertial scroll oscillates near the COLLAPSE_ZONE boundary.
        titleRef.current.style.maxHeight = h < 1 ? '0px' : `${h}px`;
        titleRef.current.style.opacity = `${1 - p}`;
      }
      if (tabsRef.current) {
        const h = (1 - p) * tabsNaturalH;
        tabsRef.current.style.maxHeight = h < 1 ? '0px' : `${h}px`;
        tabsRef.current.style.opacity = `${1 - p}`;
      }
      if (controlsRowRef.current) {
        controlsRowRef.current.style.marginTop = `${(1 - p) * CONTROLS_MARGIN}px`;
      }
      if (spacerRef.current) {
        spacerRef.current.style.height = `${p * COLLAPSE_ZONE}px`;
      }
    };

    const clearStyles = () => {
      if (titleRef.current) { titleRef.current.style.maxHeight = ''; titleRef.current.style.opacity = ''; }
      if (tabsRef.current) { tabsRef.current.style.maxHeight = ''; tabsRef.current.style.opacity = ''; }
      if (controlsRowRef.current) { controlsRowRef.current.style.marginTop = ''; }
      if (spacerRef.current) { spacerRef.current.style.height = ''; }
    };

    const applyCurrentScroll = () => {
      if (!isMobile()) return;
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
      const y = Math.max(0, Math.min(window.scrollY, maxScrollY));
      const p = Math.max(0, Math.min(1, y / COLLAPSE_ZONE));
      applyProgress(p);
      const collapsed = p > 0.5;
      if (collapsed !== prevCollapsedRef.current) {
        prevCollapsedRef.current = collapsed;
        setHeaderCollapsed(collapsed);
      }
    };

    // Initial measurement (may use fallback font metrics).
    measure();

    // Re-measure once the web font is ready and immediately re-apply so the
    // spacer and header heights are corrected before the user scrolls.
    document.fonts.ready.then(() => {
      measure();
      applyCurrentScroll();
    });

    // Both scroll and touchmove call the same handler.
    // touchmove fires during iOS gesture-detection before the first scroll event,
    // and window.scrollY is already updated by then — so the animation starts
    // on the first pixel of finger movement rather than after the ~50-100ms
    // gesture-detection delay that caused the boundary to bounce before moving.
    const onScroll = () => applyCurrentScroll();
    const onTouchMove = () => applyCurrentScroll();

    const onResize = () => {
      if (!isMobile()) {
        clearStyles();
        setHeaderCollapsed(false);
        prevCollapsedRef.current = false;
      } else {
        // Re-measure on orientation change — font-size / layout may differ.
        measure();
        applyCurrentScroll();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setTeamSearch('');
    setDivisionFilter('');
  }, [currentView]);

  useEffect(() => {
    loadScheduleData()
      .then(data => {
        setScheduleData(data);
        setLoading(false);
        console.log('Loaded data:', data);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        console.error('Error loading data:', err);
      });
  }, []);

  const handleExportJSON = () => {
    exportAsJSON(predictions);
  };

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
    // Reset file input so re-importing the same file works
    e.target.value = '';
  };

  const handleExportImage = () => {
    setExportPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">No data available</div>
      </div>
    );
  }

  const predictionCount = getPredictionCount();
  const totalTeams = scheduleData.teams.length;
  const validation = validateTotalWinsLosses(predictions);
  const hasPredictions = predictionCount > 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div ref={titleRef} className="overflow-hidden">
              <div>
                <h1 className="text-4xl font-display tracking-wide text-gray-900 dark:text-white">
                  NFL SEASON PREDICTOR
                </h1>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">2026 SEASON</p>
              </div>
            </div>

            <div ref={controlsRowRef} className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-start space-x-4 w-full sm:w-auto">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <div className="text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{predictionCount}</span>
                <span className="text-gray-500 dark:text-gray-400"> / {totalTeams} teams predicted</span>
              </div>

              {/* Validation Status Badge */}
              {hasPredictions && validation.isValid && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700">
                  ✓ Valid
                </span>
              )}

              {/* Desktop controls */}
              <div className="hidden sm:flex items-stretch space-x-1.5">
                <button
                  onClick={() => setGuideOpen(true)}
                  className="px-2 text-xs text-center whitespace-nowrap h-7 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                >
                  Guide
                </button>
                <button
                  onClick={handleExportImage}
                  disabled={predictionCount === 0}
                  className="px-2 text-xs text-center whitespace-nowrap h-7 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create Image
                </button>
                <button
                  onClick={handleExportJSON}
                  disabled={predictionCount === 0}
                  className="px-2 text-xs text-center whitespace-nowrap h-7 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 text-xs text-center whitespace-nowrap h-7 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 rounded-md hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  Import JSON
                </button>
                <button
                  onClick={() => generateRandomPredictions(scheduleData.teams)}
                  className="px-2 text-xs text-center whitespace-nowrap h-7 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                >
                  Random
                </button>
                <button
                  onClick={resetAllPredictions}
                  disabled={predictionCount === 0}
                  className="px-2 text-xs text-center whitespace-nowrap h-7 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reset All
                </button>
                {isInstallable && !isInstalled && (
                  <button
                    onClick={triggerInstall}
                    className="px-2 text-xs text-center whitespace-nowrap h-7 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    Install App
                  </button>
                )}
                <a
                  href="https://github.com/thejrudd/nfl-predictor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 text-xs text-center whitespace-nowrap h-7 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                >
                  About
                </a>
              </div>

              {/* Search button — mobile only, predictions view only */}
              {currentView === 'predictions' && (
                <button
                  onClick={() => setSearchOpen(s => !s)}
                  className={`sm:hidden p-2 rounded-lg transition-colors ${searchOpen ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  aria-label="Search and filter teams"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}

              {/* Mobile menu button */}
              <div className="relative sm:hidden ml-auto">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Open menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl py-1">
                      {headerCollapsed && (
                        <>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Navigate
                          </div>
                          {[
                            { view: 'predictions', label: 'Make Predictions' },
                            { view: 'standings',   label: 'View Standings' },
                            { view: 'playoffs',    label: 'Playoff Seeding' },
                            { view: 'players',     label: 'Player Stats' },
                          ].map(({ view, label }) => (
                            <button
                              key={view}
                              onClick={() => { setCurrentView(view); setMenuOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                currentView === view
                                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                          <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                        </>
                      )}
                      <button
                        onClick={() => { handleExportImage(); setMenuOpen(false); }}
                        disabled={predictionCount === 0}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Create Image
                      </button>
                      <button
                        onClick={() => { handleExportJSON(); setMenuOpen(false); }}
                        disabled={predictionCount === 0}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Export JSON
                      </button>
                      <button
                        onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Import JSON
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                      <button
                        onClick={() => { setGuideOpen(true); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Guide
                      </button>
                      <button
                        onClick={() => { generateRandomPredictions(scheduleData.teams); setMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Random
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                      <button
                        onClick={() => { resetAllPredictions(); setMenuOpen(false); }}
                        disabled={predictionCount === 0}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Reset All
                      </button>
                      {isInstallable && !isInstalled && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                          <button
                            onClick={() => { triggerInstall(); setMenuOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Install App
                          </button>
                        </>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                      <a
                        href="https://github.com/thejrudd/nfl-predictor"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setMenuOpen(false)}
                      >
                        About
                      </a>
                    </div>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>

          {/* Progress bar + view tabs — collapse together, tracked by tabsRef */}
          <div ref={tabsRef} className="overflow-hidden">
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(predictionCount / totalTeams) * 100}%` }}
                />
              </div>
            </div>

            {/* View Toggle */}
            <div className="mt-4 grid grid-cols-2 sm:flex gap-2">
              <button
                onClick={() => setCurrentView('predictions')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'predictions'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                MAKE PREDICTIONS
              </button>
              <button
                onClick={() => setCurrentView('standings')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'standings'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                VIEW STANDINGS
              </button>
              <button
                onClick={() => setCurrentView('playoffs')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'playoffs'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                PLAYOFF SEEDING
              </button>
              <button
                onClick={() => setCurrentView('players')}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  currentView === 'players'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                PLAYER STATS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer — grows 1:1 with header collapse on mobile so content stays locked to header bottom */}
      <div ref={spacerRef} />

      {/* Search / Filter bar — slides in below header on predictions view */}
      <div
        style={{
          maxHeight: (searchOpen && currentView === 'predictions') ? '56px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 200ms ease-in-out',
        }}
      >
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <div className="flex-1 relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={teamSearch}
                onChange={e => setTeamSearch(e.target.value)}
                placeholder="Search teams..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-1.5 shrink-0">
              {[['', 'All'], ['AFC', 'AFC'], ['NFC', 'NFC']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setDivisionFilter(val)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                    divisionFilter === val
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setSearchOpen(false); setTeamSearch(''); setDivisionFilter(''); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
              aria-label="Close search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        {currentView === 'predictions' && (
          <TeamList
            teams={scheduleData.teams}
            onTeamClick={setSelectedTeam}
            teamSearch={teamSearch}
            divisionFilter={divisionFilter}
          />
        )}
        {currentView === 'standings' && (
          <StandingsTable teams={scheduleData.teams} />
        )}
        {currentView === 'playoffs' && (
          <PlayoffSeeding teams={scheduleData.teams} />
        )}
        {currentView === 'players' && (
          <PlayerBrowser teams={scheduleData.teams} />
        )}
      </div>

      {/* Guide Modal */}
      {guideOpen && <Guide onClose={() => setGuideOpen(false)} />}

      {/* Export Preview Modal */}
      {exportPreviewOpen && (
        <ExportPreview
          teams={scheduleData.teams}
          onClose={() => setExportPreviewOpen(false)}
        />
      )}

      {/* Team Detail Modal */}
      {selectedTeam && (
        <TeamDetail
          team={selectedTeam}
          allTeams={scheduleData.teams}
          onClose={() => setSelectedTeam(null)}
        />
      )}

      {/* Version Footer */}
      <footer className="mt-auto max-w-6xl mx-auto px-4 pb-6 sm:px-6 lg:px-8 text-center w-full">
        <p className="text-xs text-gray-400 dark:text-gray-600">V2.3</p>
      </footer>

    </div>
  );
}

export default App;
