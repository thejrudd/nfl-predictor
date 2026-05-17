import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { buildStatisticsStandings } from '../utils/statisticsStandings';
import { getTeamVisualTheme } from '../utils/teamVisualTheme';

const teamLogo = (teamId) => `https://a.espncdn.com/i/teamlogos/nfl/500/${String(teamId).toLowerCase()}.png`;

function getTeamName(team = {}) {
  return team.name || [team.city, team.nickname].filter(Boolean).join(' ') || team.id || 'TBD';
}

function formatRecord(wins = 0, losses = 0, ties = 0) {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

function formatPct(value = 0) {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toFixed(3).replace(/^0/, '');
}

function formatDiff(value = 0) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getStandingRowStyle(team, darkMode) {
  const theme = getTeamVisualTheme(team?.id, darkMode, { logoSide: 'start' });
  if (!theme?.gradient) return undefined;

  return {
    '--statistics-standings-row-bg': theme.gradient,
    '--statistics-standings-row-fg': theme.gradientFullForeground ?? theme.gradientForeground,
    '--statistics-standings-row-muted': theme.gradientFullMuted ?? theme.gradientMuted,
    '--statistics-standings-row-border': theme.borderColor,
  };
}

function TeamIdentity({ team }) {
  return (
    <div className="statistics-standings-team">
      {team?.id && (
        <img
          src={teamLogo(team.id)}
          alt=""
          className="statistics-standings-team-logo"
          loading="lazy"
          decoding="async"
          onError={(event) => { event.currentTarget.style.display = 'none'; }}
        />
      )}
      <div className="statistics-standings-team-copy">
        <span className="statistics-standings-team-code">{team?.id ?? 'TBD'}</span>
        <span className="statistics-standings-team-name">{getTeamName(team)}</span>
      </div>
    </div>
  );
}

function StandingRow({ row, darkMode }) {
  return (
    <tr className="statistics-standings-row" style={getStandingRowStyle(row.team, darkMode)}>
      <td>
        <span className="statistics-standings-rank">{row.rank}</span>
      </td>
      <td>
        <TeamIdentity team={row.team} />
      </td>
      <td className="statistics-standings-record">{formatRecord(row.wins, row.losses, row.ties)}</td>
      <td>{formatPct(row.winPct)}</td>
      <td>{formatRecord(row.divisionWins, row.divisionLosses, row.divisionTies)}</td>
      <td>{formatRecord(row.conferenceWins, row.conferenceLosses, row.conferenceTies)}</td>
      <td>{formatDiff(row.pointDifferential)}</td>
    </tr>
  );
}

function StandingsTableCard({ group, darkMode, scope }) {
  return (
    <section className="statistics-standings-table-card">
      <header className="statistics-standings-table-header">
        <span>{group.label}</span>
        <span>{pluralize(group.rows.length, 'team')}</span>
      </header>
      <div className="statistics-standings-table-scroll">
        <table className="statistics-standings-table" aria-label={`${group.label} ${scope} standings`}>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Record</th>
              <th>Pct</th>
              <th>Div</th>
              <th>Conf</th>
              <th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row) => (
              <StandingRow key={row.teamId} row={row} darkMode={darkMode} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StandingsPanel({ eyebrow, title, summary, groups, darkMode, scope }) {
  return (
    <section className="statistics-standings-panel">
      <header className="statistics-schedule-section-header">
        <p className="statistics-schedule-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <span>{summary}</span>
      </header>
      <div className="statistics-standings-grid">
        {groups.map((group) => (
          <StandingsTableCard
            key={group.id}
            group={group}
            darkMode={darkMode}
            scope={scope}
          />
        ))}
      </div>
    </section>
  );
}

export default function StatisticsStandings({ teams = [], scheduleData = {} }) {
  const { darkMode } = useTheme();
  const standings = useMemo(
    () => buildStatisticsStandings({ teams, scheduleData }),
    [teams, scheduleData],
  );
  const seasonLabel = standings.season ? `${standings.season}` : 'NFL';
  const finalLabel = `${pluralize(standings.completedGames, 'final game')} - ${pluralize(standings.scheduledGames, 'scheduled game')}`;

  return (
    <div className="statistics-standings">
      <header className="statistics-schedule-toolbar statistics-standings-toolbar">
        <div className="statistics-schedule-toolbar-copy">
          <p className="statistics-schedule-eyebrow">NFL standings</p>
          <h1>{seasonLabel} Standings</h1>
          <span>{finalLabel}</span>
        </div>
        <div className="statistics-standings-summary" aria-label="Standings summary">
          <span>
            <strong>{standings.divisionGroups.length}</strong>
            Divisions
          </span>
          <span>
            <strong>{standings.conferenceGroups.length}</strong>
            Conferences
          </span>
        </div>
      </header>

      <StandingsPanel
        eyebrow="Division table"
        title="Division Standings"
        summary={pluralize(standings.divisionGroups.length, 'division')}
        groups={standings.divisionGroups}
        darkMode={darkMode}
        scope="division"
      />

      <StandingsPanel
        eyebrow="Conference table"
        title="Conference Standings"
        summary={pluralize(standings.conferenceGroups.length, 'conference')}
        groups={standings.conferenceGroups}
        darkMode={darkMode}
        scope="conference"
      />
    </div>
  );
}
