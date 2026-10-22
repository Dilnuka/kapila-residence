/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCHITECTURAL_ROOMS,
  ELEVATIONS_FT,
  formatFeetInches,
  ft,
  GRID_X_FT,
  GRID_Z_FT,
  INITIAL_DOORS,
  INITIAL_PHYSICS_PROPS,
} from './blueprintData';
import {
  findNearestDoor,
  findRoomAt,
  getFloorElevationFt,
  isInsideFirstFloorVoid,
  planFtToWorldMeters,
  resolvePlayerMovement,
  stepPropsPhysics,
  worldMetersToPlanFt,
} from './spatialEngine';

test('architectural grid axes match Ground Floor and First Floor Option 03 specifications', () => {
  // Grid 2 to 8 total width = 14 + 10 + 4 + 6 + 4 + 3 = 41'-0"
  assert.equal(GRID_X_FT['2'], 0);
  assert.equal(GRID_X_FT['3'], 14);
  assert.equal(GRID_X_FT['4'], 24);
  assert.equal(GRID_X_FT['5'], 28);
  assert.equal(GRID_X_FT['6'], 34);
  assert.equal(GRID_X_FT['7'], 38);
  assert.equal(GRID_X_FT['8'], 41);

  // Grid A to E total depth = 12 + 6'-9" + 12 + 12 = 42'-9"
  assert.equal(GRID_Z_FT['A'], 0);
  assert.equal(GRID_Z_FT['B'], 12);
  assert.equal(GRID_Z_FT['C'], 18.75);
  assert.equal(GRID_Z_FT['D'], 30.75);
  assert.equal(GRID_Z_FT['E'], 42.75);

  assert.equal(formatFeetInches(ft(11, 0)), "11'-0\"");
  assert.equal(formatFeetInches(ft(10, 6)), "10'-6\"");
});

test('room detection maps Ground Floor and First Floor Option 03 coordinates accurately', () => {
  const tvLobbyGf = findRoomAt(19, 6, 1.0);
  assert.equal(tvLobbyGf.id, 'gf_tv_lobby');

  const tvLobbyFf = findRoomAt(19, 6, 11.0);
  assert.equal(tvLobbyFf.id, 'ff_tv_lobby');

  const masterSuite = findRoomAt(21, 36, 11.0);
  assert.equal(masterSuite.id, 'ff_master_bedroom');

  const kitchen = findRoomAt(20, 36, 1.0);
  assert.equal(kitchen.id, 'gf_kitchen');

  const carPorch = findRoomAt(29, 4, 0.5);
  assert.equal(carPorch.id, 'gf_car_porch');
});

test('staircase elevation solver smoothly interpolates lower flight, mid-landing, and upper flight', () => {
  // Start of lower flight at gx=17.5, gz=13.5 -> +1'-0"
  const yStart = getFloorElevationFt(17.5, 13.5, 1.0);
  assert.equal(yStart, ELEVATIONS_FT.GROUND_FLOOR);

  // Midpoint of lower flight at gx=21.0, gz=13.5 -> +3'-6" (3.5 ft)
  const yMidLower = getFloorElevationFt(21.0, 13.5, 3.0);
  assert.ok(Math.abs(yMidLower - 3.5) < 0.05);

  // Mid-landing at gx=26.0, gz=15.0 -> +6'-0" (6.0 ft)
  const yLanding = getFloorElevationFt(26.0, 15.0, 5.5);
  assert.equal(yLanding, ELEVATIONS_FT.STAIR_LANDING);

  // Top of upper flight at gx=17.5, gz=17.0 -> +11'-0" (11.0 ft)
  const yTop = getFloorElevationFt(17.5, 17.0, 10.5);
  assert.equal(yTop, ELEVATIONS_FT.FIRST_FLOOR);
});

test('wall and doorway collision allows passage when door is open and blocks when closed', () => {
  const radius = 0.85;
  // Main entrance door is at gz=0, gx=17.5..21.5 (initially open)
  const openPass = resolvePlayerMovement(
    19.5,
    -1.0,
    1.0,
    19.5,
    0.5,
    radius,
    INITIAL_DOORS,
    INITIAL_PHYSICS_PROPS
  );
  assert.equal(openPass.hitWall, false);
  assert.equal(openPass.gz, 0.5);

  // Close the main entrance door and verify collision blocks passage
  const closedDoors = INITIAL_DOORS.map((d) =>
    d.id === 'door_gf_main' ? { ...d, isOpen: false } : d
  );
  const blockedPass = resolvePlayerMovement(
    19.5,
    -1.2,
    1.0,
    19.5,
    0.2,
    radius,
    closedDoors,
    INITIAL_PHYSICS_PROPS
  );
  assert.equal(blockedPass.hitWall, true);
  assert.ok(blockedPass.gz < 0);
});

test('double-height void detection and prop gravity settling work accurately', () => {
  assert.equal(isInsideFirstFloorVoid(31.5, 24.5), true);
  assert.equal(isInsideFirstFloorVoid(21.0, 24.5), false);

  // Drop a prop from gy=4.0 in TV Lobby (floor at gy=1.0)
  const airborneProps = [
    {
      ...INITIAL_PHYSICS_PROPS[0],
      gy: 4.0,
      vy: 0,
    },
  ];
  let current = airborneProps;
  for (let i = 0; i < 60; i++) {
    current = stepPropsPhysics(current, 1 / 60);
  }
  assert.equal(current[0].gy, ELEVATIONS_FT.GROUND_FLOOR);
  assert.equal(current[0].vy, 0);

  // Coordinate round-trip
  const [mx, my, mz] = planFtToWorldMeters(14, 11, 30.75);
  const [gx, gy, gz] = worldMetersToPlanFt(mx, my, mz);
  assert.ok(Math.abs(gx - 14) < 1e-6);
  assert.ok(Math.abs(gy - 11) < 1e-6);
  assert.ok(Math.abs(gz - 30.75) < 1e-6);

  const nearMainDoor = findNearestDoor(19.5, -1.0, 1.0, INITIAL_DOORS);
  assert.equal(nearMainDoor?.id, 'door_gf_main');
});
