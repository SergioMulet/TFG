export const SEED_SHIPS = [
  { id: 'cargo-001',  lat: 41.3851, lng:  2.1734, type: 'cargo'  },
  { id: 'tanker-001', lat: 39.4699, lng: -0.3763, type: 'tanker' },
  { id: 'yacht-001',  lat: 43.3183, lng: -1.9812, type: 'yacht'  },
];

export const SEED_DETAILS = {
  'cargo-001': {
    ship_id:   'cargo-001',
    type:      'cargo',
    lat:       41.3851,
    lng:       2.1734,
    image_url: null,
    route: [
      { lat: 41.30, lng: 2.10 },
      { lat: 41.35, lng: 2.15 },
      { lat: 41.3851, lng: 2.1734 },
    ],
  },
};
