import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shipService } from '../services/shipService.js';

// ── WebSocket mock ────────────────────────────────────────────────────────────
// Tracks every WebSocket instance created so tests can drive onmessage/onclose.

let mockInstances = [];

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    mockInstances.push(this);
  }

  close() {
    if (this.onclose) this.onclose();
  }
}

beforeEach(() => {
  mockInstances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ── Snapshot parsing ──────────────────────────────────────────────────────────

describe('shipService.connectShips — snapshot parsing', () => {
  it('calls onShips with the parsed ship array when a message arrives', () => {
    const onShips = vi.fn();
    shipService.connectShips(onShips);

    const ships = [
      { id: 'ship1', type: 'cargo',  lat: 41.38, lng: 2.17 },
      { id: 'ship2', type: 'tanker', lat: 40.00, lng: 1.00 },
    ];
    mockInstances[0].onmessage({ data: JSON.stringify(ships) });

    expect(onShips).toHaveBeenCalledTimes(1);
    expect(onShips).toHaveBeenCalledWith(ships);
  });

  it('does not call onShips when the message payload is malformed JSON', () => {
    const onShips = vi.fn();
    shipService.connectShips(onShips);

    mockInstances[0].onmessage({ data: '{not-valid-json' });

    expect(onShips).not.toHaveBeenCalled();
  });

  it('keeps calling onShips for each subsequent message', () => {
    const onShips = vi.fn();
    shipService.connectShips(onShips);

    const ws = mockInstances[0];
    ws.onmessage({ data: '[]' });
    ws.onmessage({ data: '[{"id":"s1","type":"yacht","lat":0,"lng":0}]' });

    expect(onShips).toHaveBeenCalledTimes(2);
  });
});

// ── Reconnection ──────────────────────────────────────────────────────────────

describe('shipService.connectShips — reconnection', () => {
  it('creates a new WebSocket after an unexpected close', () => {
    vi.useFakeTimers();
    shipService.connectShips(vi.fn());

    expect(mockInstances).toHaveLength(1);

    // Simulate a drop that was not initiated by the client.
    mockInstances[0].onclose();

    expect(mockInstances).toHaveLength(1); // not yet — delay pending

    vi.advanceTimersByTime(3000);

    expect(mockInstances).toHaveLength(2); // reconnected after RECONNECT_DELAY_MS
  });

  it('does not reconnect when close() was called by the client', () => {
    vi.useFakeTimers();
    const conn = shipService.connectShips(vi.fn());

    conn.close(); // sets closedByClient = true before firing onclose

    vi.advanceTimersByTime(5000);

    expect(mockInstances).toHaveLength(1); // no second connection created
  });
});
