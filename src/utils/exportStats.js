import { getAllDivisions, getTeamsByDivision, sortTeamsByRecord, getTeamsByConference } from './scheduleParser';

// Returns the team(s) with most wins and most losses
export const getBestAndWorstTeams = (predictions, teams) => {
  const predicted = teams.filter(t => predictions[t.id]);
  if (predicted.length === 0) return { best: null, worst: null };

  const sorted = sortTeamsByRecord(predicted, predictions, teams);
  return {
    best: sorted[0],
    worst: sorted[sorted.length - 1],
  };
};

// Returns the division with the highest combined wins
export const getToughestDivision = (predictions, teams) => {
  const divisions = getAllDivisions();
  let best = null;
  let bestWins = -1;

  for (const division of divisions) {
    const divTeams = getTeamsByDivision(teams, division);
    const allPredicted = divTeams.every(t => predictions[t.id]);
    if (!allPredicted) continue;

    const totalWins = divTeams.reduce((sum, t) => sum + (predictions[t.id]?.wins || 0), 0);
    if (totalWins > bestWins) {
      bestWins = totalWins;
      best = { division, totalWins, teams: divTeams };
    }
  }

  return best;
};

// Returns teams with notably high or low win totals
export const getBoldPredictions = (predictions, teams) => {
  const highFlyers = []; // 12+ wins
  const cellarDwellers = []; // 4 or fewer wins

  for (const team of teams) {
    const record = predictions[team.id];
    if (!record) continue;
    if (record.wins >= 12) highFlyers.push(team);
    if (record.wins <= 4) cellarDwellers.push(team);
  }

  // Sort high flyers by wins descending, cellar dwellers by wins ascending
  highFlyers.sort((a, b) => (predictions[b.id]?.wins || 0) - (predictions[a.id]?.wins || 0));
  cellarDwellers.sort((a, b) => (predictions[a.id]?.wins || 0) - (predictions[b.id]?.wins || 0));

  return { highFlyers, cellarDwellers };
};

// Returns the best team from each conference
export const getConferenceChampions = (predictions, teams) => {
  const result = {};

  for (const conference of ['AFC', 'NFC']) {
    const confTeams = getTeamsByConference(teams, conference).filter(t => predictions[t.id]);
    if (confTeams.length === 0) continue;
    const sorted = sortTeamsByRecord(confTeams, predictions, teams);
    result[conference] = sorted[0];
  }

  return result;
};

// Returns division winners for a conference (replicates PlayoffSeeding logic)
export const getDivisionWinners = (predictions, teams, conference) => {
  const divisions = getAllDivisions().filter(d => d.startsWith(conference));
  const winners = [];

  for (const division of divisions) {
    const divTeams = getTeamsByDivision(teams, division);
    const allPredicted = divTeams.every(t => predictions[t.id]);
    if (!allPredicted) continue;

    const sorted = sortTeamsByRecord(divTeams, predictions, teams);
    winners.push({ ...sorted[0], division });
  }

  return sortTeamsByRecord(winners, predictions, teams);
};
