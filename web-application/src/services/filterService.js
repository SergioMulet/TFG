const MAX_SUGGESTIONS = 6;

export const filterService = {
  findShips(ships, query, maxResults = MAX_SUGGESTIONS) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return (ships || [])
      .filter((ship) => ship.id.toLowerCase().includes(trimmed))
      .slice(0, maxResults);
  },

  filterById(ships, shipId) {
    return (ships || []).filter((ship) => ship.id === shipId);
  },

  filterByType(ships, selectedTypes) {
    if (!selectedTypes) return ships || [];
    return (ships || []).filter((ship) => selectedTypes[ship.type] !== false);
  },
};
