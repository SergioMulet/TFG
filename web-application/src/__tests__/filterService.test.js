import { describe, it, expect } from 'vitest';
import { filterService } from '../services/filterService.js';

const SHIPS = [
  { id: 'Alpha-01', type: 'cargo' },
  { id: 'Alpha-02', type: 'cargo' },
  { id: 'Beta-01',  type: 'tanker' },
  { id: 'Gamma-01', type: 'yacht' },
  { id: 'Gamma-02', type: 'yacht' },
  { id: 'Gamma-03', type: 'yacht' },
  { id: 'Delta-01', type: 'patrol' },
];

// ── findShips (partial-id search) ─────────────────────────────────────────────

describe('filterService.findShips', () => {
  it('returns [] for a blank query', () => {
    expect(filterService.findShips(SHIPS, '')).toEqual([]);
  });

  it('returns [] for a whitespace-only query', () => {
    expect(filterService.findShips(SHIPS, '   ')).toEqual([]);
  });

  it('matches partial id case-insensitively', () => {
    const result = filterService.findShips(SHIPS, 'alpha');
    expect(result.map((s) => s.id)).toEqual(['Alpha-01', 'Alpha-02']);
  });

  it('caps results at the default limit of 6', () => {
    // All 7 ships contain '-0', but only 6 should be returned.
    const result = filterService.findShips(SHIPS, '-0');
    expect(result).toHaveLength(6);
  });

  it('respects a custom maxResults limit', () => {
    const result = filterService.findShips(SHIPS, 'gamma', 2);
    expect(result).toHaveLength(2);
  });

  it('handles a null ships list without throwing', () => {
    expect(filterService.findShips(null, 'alpha')).toEqual([]);
  });
});

// ── filterByType ──────────────────────────────────────────────────────────────

describe('filterService.filterByType', () => {
  it('returns all ships when selectedTypes is null', () => {
    expect(filterService.filterByType(SHIPS, null)).toHaveLength(SHIPS.length);
  });

  it('returns all ships when selectedTypes is undefined', () => {
    expect(filterService.filterByType(SHIPS, undefined)).toHaveLength(SHIPS.length);
  });

  it('excludes ships whose type is explicitly false', () => {
    const result = filterService.filterByType(SHIPS, { cargo: false });
    expect(result.every((s) => s.type !== 'cargo')).toBe(true);
  });

  it('keeps ships whose type is explicitly true', () => {
    const result = filterService.filterByType(SHIPS, { cargo: true });
    expect(result.some((s) => s.type === 'cargo')).toBe(true);
  });

  it('keeps ships whose type is not present in selectedTypes (undefined passes)', () => {
    // Only cargo is set to false; tanker, yacht, patrol are absent → kept.
    const result = filterService.filterByType(SHIPS, { cargo: false });
    const types = new Set(result.map((s) => s.type));
    expect(types.has('tanker')).toBe(true);
    expect(types.has('yacht')).toBe(true);
    expect(types.has('cargo')).toBe(false);
  });
});

// ── Selected ship overrides the type filter ───────────────────────────────────
// When a ship is explicitly selected by id, it must remain visible even if its
// type has been filtered out.  The application achieves this by using filterById
// to retrieve the selected ship regardless of the active type filter.

describe('filterService — selected ship overrides type filter', () => {
  it('filterByType excludes a ship, but filterById retrieves it anyway', () => {
    const cargoShip = { id: 'cargo1', type: 'cargo' };
    const ships = [cargoShip, { id: 'yacht1', type: 'yacht' }];
    const selectedTypes = { cargo: false, yacht: true };

    // Type filter hides the cargo ship.
    const byType = filterService.filterByType(ships, selectedTypes);
    expect(byType.find((s) => s.id === 'cargo1')).toBeUndefined();

    // Selecting the cargo ship by id retrieves it regardless of the type filter.
    const byId = filterService.filterById(ships, 'cargo1');
    expect(byId).toHaveLength(1);
    expect(byId[0].id).toBe('cargo1');
  });
});
