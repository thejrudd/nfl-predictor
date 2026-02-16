// Load the schedule data from the JSON file
export const loadScheduleData = async () => {
  const response = await fetch('/nfl-data-2026.json');
  const data = await response.json();
  return data;
};

// Get a team by ID
export const getTeamById = (teams, teamId) => {
  return teams.find(team => team.id === teamId);
};

// Get teams by division
export const getTeamsByDivision = (teams, division) => {
  return teams.filter(team => team.division === division);
};

// Get all division names
export const getAllDivisions = () => {
  return [
    'AFC East',
    'AFC North',
    'AFC South',
    'AFC West',
    'NFC East',
    'NFC North',
    'NFC South',
    'NFC West'
  ];
};

// Get opponent details for a team (returns full team objects instead of just IDs)
export const getOpponentDetails = (teams, team) => {
  return team.opponents.map(oppId => getTeamById(teams, oppId));
};

// Get teams by conference
export const getTeamsByConference = (teams, conference) => {
  return teams.filter(team => team.conference === conference);
};

// Sort teams by wins (for standings), with division record as tiebreaker
export const sortTeamsByRecord = (teams, predictions) => {
  return [...teams].sort((a, b) => {
    const aWins = predictions[a.id]?.wins || 0;
    const bWins = predictions[b.id]?.wins || 0;

    // Sort by overall wins descending
    if (bWins !== aWins) {
      return bWins - aWins;
    }

    // If overall wins are tied, sort by division wins descending
    const aDivisionWins = predictions[a.id]?.divisionWins || 0;
    const bDivisionWins = predictions[b.id]?.divisionWins || 0;

    if (bDivisionWins !== aDivisionWins) {
      return bDivisionWins - aDivisionWins;
    }

    // If still tied, sort alphabetically
    return a.name.localeCompare(b.name);
  });
};
