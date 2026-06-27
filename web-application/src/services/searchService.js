const MAX_SUGGESTIONS = 6;

export const searchService = {
  findShips(ships, query, maxResults = MAX_SUGGESTIONS) {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return (ships || [])
      .filter((ship) => ship.id.toLowerCase().includes(trimmed))
      .slice(0, maxResults);
  },
};
