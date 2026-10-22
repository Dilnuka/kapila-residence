/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Exact Architectural Blueprint Data for:
 * "PROPOSED RESIDENCE FOR MR. KAPILA LIYANAGE AT YATIYANA"
 * Architect: Archt. Nelum Idamgedara AIA, SL (Studio Red)
 * Ground Floor (1157 sq.ft + 160 sq.ft Car Porch) & First Floor Option 03 (1105.45 sq.ft)
 * Total Floor Area: 2262.45 sq.ft (210.18 sq.m)
 */

export const FT_TO_M = 0.3048;

/** Convert feet and inches to meters */
export function ft(feet: number, inches: number = 0): number {
  return (feet + inches / 12) * FT_TO_M;
}

/** Convert meters back to architectural feet-inches string (e.g. "11'-0\"") */
export function formatFeetInches(meters: number): string {
  const totalInches = Math.round((meters / FT_TO_M) * 12);
  const sign = totalInches < 0 ? '-' : '';
  const absInches = Math.abs(totalInches);
  const f = Math.floor(absInches / 12);
  const i = absInches % 12;
  return `${sign}${f}'-${i}"`;
}

/**
 * Structural Grid Coordinates in Feet
 * Origin (gx=0, gz=0) is at the intersection of Grid 2 (West) and Grid A (South).
 * In 3D World Space:
 *   X = ft(gx)   (East is +X)
 *   Y = ft(gy)   (Up is +Y)
 *   Z = -ft(gz)  (North is -Z, South/Road is +Z)
 */
export const GRID_X_FT: Record<string, number> = {
  '2': 0,       // 0'-0"
  '3': 14,      // +14'-0"
  '4': 24,      // +10'-0"
  '5': 28,      // +4'-0"
  '6': 34,      // +6'-0"
  '7': 38,      // +4'-0"
  '8': 41,      // +3'-0"
};

export const GRID_Z_FT: Record<string, number> = {
  'A': 0,       // 0'-0"
  'B': 12,      // +12'-0"
  'C': 18.75,   // +6'-9"  (18'-9")
  'D': 30.75,   // +12'-0" (30'-9")
  'E': 42.75,   // +12'-0" (42'-9")
};

export const ELEVATIONS_FT = {
  SITE_GARDEN: 0,           // +0'-0" LEVEL
  GROUND_CORRIDOR: 0.5,     // +0'-6" LEVEL (Verandah, Car Porch, Corridors)
  GROUND_BATH: 0.75,        // +0'-9" / +0'-8" LEVEL
  GROUND_FLOOR: 1.0,        // +1'-0" LEVEL (Main Ground Floor Rooms)
  STAIR_LANDING: 6.0,       // +6'-0" LEVEL (Mid-landing between Ground & First)
  FIRST_CORRIDOR: 10.5,     // +10'-6" LEVEL (Terrace & Upper Corridors/Balconies)
  FIRST_BATH: 10.75,        // +10'-9" / +10'-8" LEVEL
  FIRST_FLOOR: 11.0,        // +11'-0" LEVEL (Main First Floor Rooms)
  BEDROOM_04_ROOF: 13.0,    // +13'-0" LEVEL note on plan
  ROOF_SLAB: 21.0,          // +21'-0" LEVEL
};

export type FloorLevelId = 'ground' | 'first' | 'outdoor';

export interface RoomSpec {
  id: string;
  name: string;
  code: string;
  floor: FloorLevelId;
  levelLabel: string;
  elevationFt: number;
  /** Bounds in plan feet: gxMin..gxMax (West->East), gzMin..gzMax (South->North) */
  gxMin: number;
  gxMax: number;
  gzMin: number;
  gzMax: number;
  dimensionsLabel: string;
  areaSqFt: number;
  description: string;
  floorMaterial: 'teak' | 'porcelain' | 'terracotta' | 'granite' | 'nonslip_tile' | 'grass' | 'paver';
  /** Spawn / teleport position in plan feet (gx, gz) and yaw in radians (0 = looking North/-Z) */
  spawnGx: number;
  spawnGz: number;
  spawnYaw: number;
  hasCeilingFan?: boolean;
  lightPosFt?: [number, number, number];
}

export const ARCHITECTURAL_ROOMS: RoomSpec[] = [
  // ==================== GROUND FLOOR INDOOR (+1'-0" & +0'-9") ====================
  {
    id: 'gf_verandah',
    name: 'Front Verandah & Main Entrance',
    code: 'GF-01',
    floor: 'ground',
    levelLabel: "+0'-6\" LEVEL",
    elevationFt: 0.5,
    gxMin: 14,
    gxMax: 24,
    gzMin: -4,
    gzMax: 0,
    dimensionsLabel: "10'-0\" × 4'-0\"",
    areaSqFt: 40,
    description: 'Stepped welcoming front verandah with terracotta finish leading to double timber-glass entrance door DW2.',
    floorMaterial: 'terracotta',
    spawnGx: 19,
    spawnGz: -2.2,
    spawnYaw: 0,
    lightPosFt: [19, 9.5, -2],
  },
  {
    id: 'gf_tv_lobby',
    name: 'TV Lobby Area',
    code: 'GF-02',
    floor: 'ground',
    levelLabel: "+1'-0\" LEVEL",
    elevationFt: 1.0,
    gxMin: 14,
    gxMax: 24,
    gzMin: 0,
    gzMax: 12,
    dimensionsLabel: "10'-0\" × 12'-0\"",
    areaSqFt: 120,
    description: 'Ground floor reception and TV lounge between Grid 3–4 and A–B with media wall, L-sofa, and direct view to staircase.',
    floorMaterial: 'porcelain',
    spawnGx: 18.5,
    spawnGz: 3.5,
    spawnYaw: 0.25,
    hasCeilingFan: true,
    lightPosFt: [19, 10.2, 6],
  },
  {
    id: 'gf_bedroom_01',
    name: 'Bed Room 01 (Front West)',
    code: 'GF-03',
    floor: 'ground',
    levelLabel: "+1'-0\" LEVEL",
    elevationFt: 1.0,
    gxMin: 0,
    gxMax: 14,
    gzMin: -2,
    gzMax: 12,
    dimensionsLabel: "14'-0\" × 14'-0\"",
    areaSqFt: 196,
    description: 'Spacious ground-floor guest/family bedroom with French doors DW2 opening to the South and West garden corridors.',
    floorMaterial: 'teak',
    spawnGx: 10.5,
    spawnGz: 5.5,
    spawnYaw: 1.85,
    hasCeilingFan: true,
    lightPosFt: [7, 10.2, 5],
  },
  {
    id: 'gf_stair_lobby',
    name: 'Staircase & Under-Stair Utility',
    code: 'GF-04',
    floor: 'ground',
    levelLabel: "+1'-0\" LEVEL",
    elevationFt: 1.0,
    gxMin: 14,
    gxMax: 28,
    gzMin: 12,
    gzMax: 18.75,
    dimensionsLabel: "14'-0\" × 6'-9\"",
    areaSqFt: 94.5,
    description: 'Central dog-leg timber & steel staircase rising from +1\'-0" to +11\'-0" with utility zone beneath.',
    floorMaterial: 'porcelain',
    spawnGx: 16.5,
    spawnGz: 15.2,
    spawnYaw: -1.57,
    lightPosFt: [21, 10.2, 15.3],
  },
  {
    id: 'gf_bathroom',
    name: 'Ground Common Bathroom',
    code: 'GF-05',
    floor: 'ground',
    levelLabel: "+0'-9\" / +0'-8\" LEVEL",
    elevationFt: 0.75,
    gxMin: 28,
    gxMax: 38,
    gzMin: 12,
    gzMax: 18.75,
    dimensionsLabel: "6'-0\" × 6'-9\"",
    areaSqFt: 40.5,
    description: 'Recessed wet/dry bathroom between Grid 5–7 and B–C with vanity, WC, shower glass screen, and F1 fanlight.',
    floorMaterial: 'nonslip_tile',
    spawnGx: 31.5,
    spawnGz: 15.3,
    spawnYaw: -1.57,
    lightPosFt: [33, 9.8, 15.3],
  },
  {
    id: 'gf_dining',
    name: 'Dining Area',
    code: 'GF-06',
    floor: 'ground',
    levelLabel: "+1'-0\" LEVEL",
    elevationFt: 1.0,
    gxMin: 14,
    gxMax: 28,
    gzMin: 18.75,
    gzMax: 30.75,
    dimensionsLabel: "13'-9\" × 12'-0\"",
    areaSqFt: 165,
    description: 'Central formal dining space opening West via wide folding glass doors DW1 onto a landscaped water/pebble deck.',
    floorMaterial: 'porcelain',
    spawnGx: 24.5,
    spawnGz: 27.5,
    spawnYaw: 2.4,
    hasCeilingFan: true,
    lightPosFt: [21, 10.2, 24.75],
  },
  {
    id: 'gf_living',
    name: 'Living Area (Double-Height Void)',
    code: 'GF-07',
    floor: 'ground',
    levelLabel: "+1'-0\" LEVEL",
    elevationFt: 1.0,
    gxMin: 28,
    gxMax: 38,
    gzMin: 18.75,
    gzMax: 30.75,
    dimensionsLabel: "10'-0\" × 12'-0\"",
    areaSqFt: 120,
    description: 'Soaring double-height living room beneath the First Floor VOID, featuring the signature 2\'-3" × 1\'-6" built-in window seat.',
    floorMaterial: 'porcelain',
    spawnGx: 33.5,
    spawnGz: 22.5,
    spawnYaw: 2.6,
    lightPosFt: [33, 19.5, 24.75],
  },
  {
    id: 'gf_kitchen',
    name: 'Kitchen & Pantry',
    code: 'GF-08',
    floor: 'ground',
    levelLabel: "+1'-0\" LEVEL",
    elevationFt: 1.0,
    gxMin: 14,
    gxMax: 25.5,
    gzMin: 30.75,
    gzMax: 42.75,
    dimensionsLabel: "11'-6\" × 12'-0\"",
    areaSqFt: 138,
    description: 'Ergonomic L-counter kitchen with granite worktops, range hood, sink at North window W3, and door D2 to service court.',
    floorMaterial: 'granite',
    spawnGx: 17.5,
    spawnGz: 33.5,
    spawnYaw: -0.2,
    lightPosFt: [20, 10.2, 36.75],
  },
  {
    id: 'gf_store',
    name: 'Rear Store & Service Alcove',
    code: 'GF-09',
    floor: 'ground',
    levelLabel: "+1'-0\" LEVEL",
    elevationFt: 1.0,
    gxMin: 6,
    gxMax: 14,
    gzMin: 30.75,
    gzMax: 39.5,
    dimensionsLabel: "8'-0\" × 8'-9\"",
    areaSqFt: 62,
    description: 'Dedicated storage room and external utility toilet tucked along the angled North-West boundary wall off the kitchen.',
    floorMaterial: 'granite',
    spawnGx: 10.5,
    spawnGz: 33.5,
    spawnYaw: 0,
    lightPosFt: [10.5, 9.8, 34],
  },
  {
    id: 'gf_bedroom_02',
    name: 'Bed Room 02 & Dressing Room',
    code: 'GF-10',
    floor: 'ground',
    levelLabel: "+1'-0\" LEVEL",
    elevationFt: 1.0,
    gxMin: 25.5,
    gxMax: 41,
    gzMin: 30.75,
    gzMax: 42.75,
    dimensionsLabel: "11'-9\" × 12'-0\" + 5'-0\" × 8'-0\" Dressing",
    areaSqFt: 181,
    description: 'Quiet North-East bedroom suite with walk-in Dressing Room and French doors DW2 to the rear and side garden corridors.',
    floorMaterial: 'teak',
    spawnGx: 31.5,
    spawnGz: 34.5,
    spawnYaw: -0.9,
    hasCeilingFan: true,
    lightPosFt: [34.5, 10.2, 36.75],
  },
  {
    id: 'gf_car_porch',
    name: 'Car Porch & Flower Trough',
    code: 'GF-11',
    floor: 'outdoor',
    levelLabel: "+0'-6\" LEVEL",
    elevationFt: 0.5,
    gxMin: 24,
    gxMax: 34,
    gzMin: -4,
    gzMax: 12,
    dimensionsLabel: "10'-0\" × 16'-0\" (160 SQ.FT.)",
    areaSqFt: 160,
    description: 'Covered 160 sq.ft architectural carport beneath Bed Room 04 with 2\'-0" East flower trough and direct doorway DW3 into lobby.',
    floorMaterial: 'paver',
    spawnGx: 29,
    spawnGz: -2,
    spawnYaw: 0,
    lightPosFt: [29, 9.5, 4],
  },

  // ==================== FIRST FLOOR OPTION 03 (+11'-0" & +10'-6") ====================
  {
    id: 'ff_tv_lobby',
    name: 'Upper TV Lobby Area',
    code: 'FF-01',
    floor: 'first',
    levelLabel: "+11'-0\" LEVEL",
    elevationFt: 11.0,
    gxMin: 14,
    gxMax: 24,
    gzMin: 0,
    gzMax: 12,
    dimensionsLabel: "10'-0\" × 12'-0\"",
    areaSqFt: 120,
    description: 'First floor family media lounge between Grid 3–4 and A–B opening directly onto the Southern First Floor Terrace.',
    floorMaterial: 'teak',
    spawnGx: 19,
    spawnGz: 4.5,
    spawnYaw: 0.15,
    hasCeilingFan: true,
    lightPosFt: [19, 20.2, 6],
  },
  {
    id: 'ff_terrace',
    name: 'First Floor Front Terrace',
    code: 'FF-02',
    floor: 'first',
    levelLabel: "+10'-6\" LEVEL",
    elevationFt: 10.5,
    gxMin: 14,
    gxMax: 24,
    gzMin: -4,
    gzMax: 0,
    dimensionsLabel: "10'-0\" × 4'-0\"",
    areaSqFt: 40,
    description: 'Elevated front viewing terrace at +10\'-6" level overlooking the Front Space Garden and 6.6m wide road.',
    floorMaterial: 'terracotta',
    spawnGx: 19,
    spawnGz: -2,
    spawnYaw: 3.14,
    lightPosFt: [19, 19.8, -2],
  },
  {
    id: 'ff_bedroom_03',
    name: 'Bed Room 03 (Upper Front West)',
    code: 'FF-03',
    floor: 'first',
    levelLabel: "+11'-0\" LEVEL",
    elevationFt: 11.0,
    gxMin: 0,
    gxMax: 14,
    gzMin: -2,
    gzMax: 12,
    dimensionsLabel: "14'-0\" × 14'-0\"",
    areaSqFt: 196,
    description: 'Large upper West bedroom surrounded by wrap-around +10\'-6" cantilevered balcony corridors on South and North-West.',
    floorMaterial: 'teak',
    spawnGx: 10.5,
    spawnGz: 5.5,
    spawnYaw: 1.85,
    hasCeilingFan: true,
    lightPosFt: [7, 20.2, 5],
  },
  {
    id: 'ff_bedroom_04',
    name: 'Bed Room 04 (Upper Front East)',
    code: 'FF-04',
    floor: 'first',
    levelLabel: "+11'-0\" LEVEL",
    elevationFt: 11.0,
    gxMin: 24,
    gxMax: 34,
    gzMin: -2,
    gzMax: 12,
    dimensionsLabel: "10'-0\" × 14'-0\"",
    areaSqFt: 140,
    description: 'Cantilevered upper bedroom over the Car Porch featuring a Southern flower trough (2\'-0") and East private balcony corridor.',
    floorMaterial: 'teak',
    spawnGx: 29,
    spawnGz: 8.5,
    spawnYaw: 3.0,
    hasCeilingFan: true,
    lightPosFt: [29, 20.2, 5],
  },
  {
    id: 'ff_bathroom_common',
    name: 'Upper Common Bathroom',
    code: 'FF-05',
    floor: 'first',
    levelLabel: "+10'-9\" / +10'-8\" LEVEL",
    elevationFt: 10.75,
    gxMin: 28,
    gxMax: 38,
    gzMin: 12,
    gzMax: 18.75,
    dimensionsLabel: "6'-0\" × 6'-9\"",
    areaSqFt: 40.5,
    description: 'First floor family bathroom aligned vertically with the Ground Floor plumbing stack between Grid 5–7 and B–C.',
    floorMaterial: 'nonslip_tile',
    spawnGx: 31.5,
    spawnGz: 15.3,
    spawnYaw: -1.57,
    lightPosFt: [33, 19.8, 15.3],
  },
  {
    id: 'ff_upper_living',
    name: 'Upper Living & Pantry Area',
    code: 'FF-06',
    floor: 'first',
    levelLabel: "+11'-0\" LEVEL",
    elevationFt: 11.0,
    gxMin: 14,
    gxMax: 28,
    gzMin: 18.75,
    gzMax: 30.75,
    dimensionsLabel: "13'-3\" × 12'-0\"",
    areaSqFt: 159,
    description: 'Airy upper living gallery overlooking the double-height VOID on the East, with a 2\'-0" upper Pantry counter on the North wall and West balcony.',
    floorMaterial: 'porcelain',
    spawnGx: 17.5,
    spawnGz: 26.0,
    spawnYaw: -0.55,
    hasCeilingFan: true,
    lightPosFt: [21, 20.2, 24.75],
  },
  {
    id: 'ff_master_bedroom',
    name: 'Master Bed Room Suite',
    code: 'FF-07',
    floor: 'first',
    levelLabel: "+11'-0\" LEVEL",
    elevationFt: 11.0,
    gxMin: 14,
    gxMax: 41,
    gzMin: 30.75,
    gzMax: 42.75,
    dimensionsLabel: "20'-3\" × 12'-0\" Suite (Bed + Dressing + Bath)",
    areaSqFt: 243,
    description: 'Flagship Option 03 Master Suite spanning the North wing with King bed, North & West wrap balconies, walk-in Dressing Room (6\'-6"×5\'-6"), and attached luxury Bathroom.',
    floorMaterial: 'teak',
    spawnGx: 19.5,
    spawnGz: 34.0,
    spawnYaw: -0.55,
    hasCeilingFan: true,
    lightPosFt: [21, 20.2, 36.75],
  },
  {
    id: 'outdoor_gardens',
    name: 'Front & Rear Space Gardens & 6.6m Road',
    code: 'SITE-01',
    floor: 'outdoor',
    levelLabel: "+0'-0\" LEVEL",
    elevationFt: 0,
    gxMin: -12,
    gxMax: 46,
    gzMin: -28,
    gzMax: 58,
    dimensionsLabel: "Full Site Lot (Yatiyana)",
    areaSqFt: 3850,
    description: 'Complete landscaped lot including 6.6m Wide Road, storm drain, 20ft building line, West garden court, Rear Space Garden, Septic Tank & Soakage Pit, and waste sorting station.',
    floorMaterial: 'grass',
    spawnGx: 22,
    spawnGz: -15,
    spawnYaw: 0,
  },
];

export interface DoorSpec {
  id: string;
  code: 'D1' | 'D2' | 'D3' | 'DW1' | 'DW2' | 'DW3';
  label: string;
  floor: 'ground' | 'first';
  /** Hinge position in plan feet (gx, gz) */
  gx: number;
  gz: number;
  /** Base elevation in feet */
  elevationFt: number;
  widthFt: number;
  heightFt: number;
  /** Closed orientation angle in radians: 0 = along +X (East-West wall), Math.PI/2 = along +Z (North-South wall) */
  axis: 'x' | 'z';
  swingDir: 1 | -1;
  isOpen: boolean;
  isGlassDoor?: boolean;
}

export const INITIAL_DOORS: DoorSpec[] = [
  // Ground Floor Doors
  {
    id: 'door_gf_main',
    code: 'DW2',
    label: 'Main Entrance Door (Verandah -> TV Lobby)',
    floor: 'ground',
    gx: 17.5,
    gz: 0,
    elevationFt: 1.0,
    widthFt: 4.0,
    heightFt: 7.5,
    axis: 'x',
    swingDir: 1,
    isOpen: true,
    isGlassDoor: true,
  },
  {
    id: 'door_gf_porch_lobby',
    code: 'DW3',
    label: 'Car Porch Side Entrance (Car Porch -> TV Lobby)',
    floor: 'ground',
    gx: 24,
    gz: 8.5,
    elevationFt: 1.0,
    widthFt: 3.0,
    heightFt: 7.0,
    axis: 'z',
    swingDir: -1,
    isOpen: false,
    isGlassDoor: true,
  },
  {
    id: 'door_gf_bed1_entry',
    code: 'D1',
    label: 'Bed Room 01 Entry Door',
    floor: 'ground',
    gx: 14,
    gz: 9.0,
    elevationFt: 1.0,
    widthFt: 3.2,
    heightFt: 7.0,
    axis: 'z',
    swingDir: -1,
    isOpen: true,
  },
  {
    id: 'door_gf_bed1_south',
    code: 'DW2',
    label: 'Bed Room 01 South Corridor French Door',
    floor: 'ground',
    gx: 8.5,
    gz: -2,
    elevationFt: 1.0,
    widthFt: 3.5,
    heightFt: 7.0,
    axis: 'x',
    swingDir: 1,
    isOpen: false,
    isGlassDoor: true,
  },
  {
    id: 'door_gf_bath',
    code: 'D3',
    label: 'Ground Floor Common Bathroom Door',
    floor: 'ground',
    gx: 28,
    gz: 14.2,
    elevationFt: 1.0,
    widthFt: 2.6,
    heightFt: 7.0,
    axis: 'z',
    swingDir: 1,
    isOpen: false,
  },
  {
    id: 'door_gf_dining_west',
    code: 'DW1',
    label: 'Dining West Folding Patio Door',
    floor: 'ground',
    gx: 14,
    gz: 22.0,
    elevationFt: 1.0,
    widthFt: 5.0,
    heightFt: 7.5,
    axis: 'z',
    swingDir: 1,
    isOpen: true,
    isGlassDoor: true,
  },
  {
    id: 'door_gf_kitchen_entry',
    code: 'D1',
    label: 'Dining to Kitchen Doorway',
    floor: 'ground',
    gx: 20.5,
    gz: 30.75,
    elevationFt: 1.0,
    widthFt: 3.4,
    heightFt: 7.0,
    axis: 'x',
    swingDir: 1,
    isOpen: true,
  },
  {
    id: 'door_gf_kitchen_rear',
    code: 'D2',
    label: 'Kitchen Rear Service Door',
    floor: 'ground',
    gx: 14,
    gz: 39.0,
    elevationFt: 1.0,
    widthFt: 3.0,
    heightFt: 7.0,
    axis: 'z',
    swingDir: -1,
    isOpen: false,
  },
  {
    id: 'door_gf_bed2_entry',
    code: 'D1',
    label: 'Bed Room 02 Entry Door',
    floor: 'ground',
    gx: 27.5,
    gz: 30.75,
    elevationFt: 1.0,
    widthFt: 3.2,
    heightFt: 7.0,
    axis: 'x',
    swingDir: 1,
    isOpen: true,
  },
  {
    id: 'door_gf_bed2_north',
    code: 'DW2',
    label: 'Bed Room 02 Rear Garden French Door',
    floor: 'ground',
    gx: 33.5,
    gz: 42.75,
    elevationFt: 1.0,
    widthFt: 3.5,
    heightFt: 7.0,
    axis: 'x',
    swingDir: -1,
    isOpen: false,
    isGlassDoor: true,
  },

  // First Floor Option 03 Doors
  {
    id: 'door_ff_terrace',
    code: 'DW2',
    label: 'Upper TV Lobby to Front Terrace Door',
    floor: 'first',
    gx: 17.5,
    gz: 0,
    elevationFt: 11.0,
    widthFt: 4.0,
    heightFt: 7.5,
    axis: 'x',
    swingDir: 1,
    isOpen: true,
    isGlassDoor: true,
  },
  {
    id: 'door_ff_bed3_entry',
    code: 'D1',
    label: 'Bed Room 03 Entry Door',
    floor: 'first',
    gx: 14,
    gz: 9.0,
    elevationFt: 11.0,
    widthFt: 3.2,
    heightFt: 7.0,
    axis: 'z',
    swingDir: -1,
    isOpen: true,
  },
  {
    id: 'door_ff_bed4_entry',
    code: 'D1',
    label: 'Bed Room 04 Entry Door',
    floor: 'first',
    gx: 24,
    gz: 9.0,
    elevationFt: 11.0,
    widthFt: 3.2,
    heightFt: 7.0,
    axis: 'z',
    swingDir: 1,
    isOpen: true,
  },
  {
    id: 'door_ff_bath_common',
    code: 'D3',
    label: 'Upper Common Bathroom Door',
    floor: 'first',
    gx: 28,
    gz: 14.2,
    elevationFt: 11.0,
    widthFt: 2.6,
    heightFt: 7.0,
    axis: 'z',
    swingDir: 1,
    isOpen: false,
  },
  {
    id: 'door_ff_upper_living_west',
    code: 'DW2',
    label: 'Upper Living West Balcony Door',
    floor: 'first',
    gx: 14,
    gz: 23.0,
    elevationFt: 11.0,
    widthFt: 3.5,
    heightFt: 7.0,
    axis: 'z',
    swingDir: 1,
    isOpen: true,
    isGlassDoor: true,
  },
  {
    id: 'door_ff_master_entry',
    code: 'D1',
    label: 'Master Bed Room Suite Entry Door',
    floor: 'first',
    gx: 15.5,
    gz: 30.75,
    elevationFt: 11.0,
    widthFt: 3.4,
    heightFt: 7.0,
    axis: 'x',
    swingDir: 1,
    isOpen: true,
  },
  {
    id: 'door_ff_master_bath',
    code: 'D3',
    label: 'Master Attached Bathroom Door',
    floor: 'first',
    gx: 34,
    gz: 33.0,
    elevationFt: 11.0,
    widthFt: 2.6,
    heightFt: 7.0,
    axis: 'z',
    swingDir: 1,
    isOpen: false,
  },
  {
    id: 'door_ff_master_north',
    code: 'DW2',
    label: 'Master Bed Room North Balcony French Door',
    floor: 'first',
    gx: 21.0,
    gz: 42.75,
    elevationFt: 11.0,
    widthFt: 4.0,
    heightFt: 7.0,
    axis: 'x',
    swingDir: -1,
    isOpen: true,
    isGlassDoor: true,
  },
];

export type CatalogItemType =
  | 'teak_armchair'
  | 'tropical_planter'
  | 'floor_lamp'
  | 'coffee_table'
  | 'study_desk'
  | 'bookshelf_unit'
  | 'ceramic_vase'
  | 'lounge_ottoman';

export interface CatalogItemSpec {
  type: CatalogItemType;
  name: string;
  category: 'Furniture' | 'Lighting' | 'Decor' | 'Botanical';
  dimensionsLabel: string;
  radiusFt: number;
  heightFt: number;
  massKg: number;
  grabbable: boolean;
  accentColor: string;
}

export const PLACEABLE_CATALOG: CatalogItemSpec[] = [
  {
    type: 'teak_armchair',
    name: 'Ceylon Teak Lounge Chair',
    category: 'Furniture',
    dimensionsLabel: "2'-8\" × 2'-8\" × 2'-10\"",
    radiusFt: 1.35,
    heightFt: 2.8,
    massKg: 14,
    grabbable: true,
    accentColor: '#b87333',
  },
  {
    type: 'tropical_planter',
    name: 'Monstera & Brass Planter',
    category: 'Botanical',
    dimensionsLabel: "2'-0\" × 2'-0\" × 3'-6\"",
    radiusFt: 1.0,
    heightFt: 3.5,
    massKg: 9,
    grabbable: true,
    accentColor: '#3b7a57',
  },
  {
    type: 'floor_lamp',
    name: 'Studio Warm Arc Floor Lamp',
    category: 'Lighting',
    dimensionsLabel: "1'-8\" × 1'-8\" × 5'-6\"",
    radiusFt: 0.9,
    heightFt: 5.5,
    massKg: 6,
    grabbable: true,
    accentColor: '#e6a15c',
  },
  {
    type: 'coffee_table',
    name: 'Low Travertine & Timber Table',
    category: 'Furniture',
    dimensionsLabel: "3'-6\" × 2'-2\" × 1'-5\"",
    radiusFt: 1.6,
    heightFt: 1.4,
    massKg: 18,
    grabbable: true,
    accentColor: '#d2c4b0',
  },
  {
    type: 'study_desk',
    name: 'Architect Drafting & Study Desk',
    category: 'Furniture',
    dimensionsLabel: "4'-0\" × 2'-2\" × 2'-6\"",
    radiusFt: 1.8,
    heightFt: 2.5,
    massKg: 24,
    grabbable: false,
    accentColor: '#8c583a',
  },
  {
    type: 'bookshelf_unit',
    name: 'Open Timber Display Shelf',
    category: 'Furniture',
    dimensionsLabel: "3'-4\" × 1'-4\" × 5'-8\"",
    radiusFt: 1.5,
    heightFt: 5.6,
    massKg: 28,
    grabbable: false,
    accentColor: '#73482d',
  },
  {
    type: 'ceramic_vase',
    name: 'Handcrafted Terracotta Vessel',
    category: 'Decor',
    dimensionsLabel: "1'-2\" × 1'-2\" × 2'-0\"",
    radiusFt: 0.65,
    heightFt: 2.0,
    massKg: 4,
    grabbable: true,
    accentColor: '#c86446',
  },
  {
    type: 'lounge_ottoman',
    name: 'Woven Linen Pouf Ottoman',
    category: 'Furniture',
    dimensionsLabel: "2'-0\" × 2'-0\" × 1'-6\"",
    radiusFt: 1.0,
    heightFt: 1.5,
    massKg: 5,
    grabbable: true,
    accentColor: '#c9b89c',
  },
];

export interface PlacedPropInstance {
  id: string;
  type: CatalogItemType;
  name: string;
  gx: number;
  gz: number;
  gy: number; // current bottom elevation in feet
  vy: number; // vertical velocity (ft/s) for gravity physics
  vx: number;
  vz: number;
  rotationY: number;
  roomId: string;
  isGrabbed?: boolean;
}

export const INITIAL_PHYSICS_PROPS: PlacedPropInstance[] = [
  {
    id: 'prop_lobby_vase',
    type: 'ceramic_vase',
    name: 'Lobby Welcome Terracotta Vessel',
    gx: 15.8,
    gz: 2.2,
    gy: 1.0,
    vy: 0,
    vx: 0,
    vz: 0,
    rotationY: 0.3,
    roomId: 'gf_tv_lobby',
  },
  {
    id: 'prop_living_planter',
    type: 'tropical_planter',
    name: 'Double-Height Void Planter',
    gx: 35.5,
    gz: 20.5,
    gy: 1.0,
    vy: 0,
    vx: 0,
    vz: 0,
    rotationY: 0,
    roomId: 'gf_living',
  },
  {
    id: 'prop_dining_lamp',
    type: 'floor_lamp',
    name: 'Dining Court Reading Lamp',
    gx: 26.2,
    gz: 29.0,
    gy: 1.0,
    vy: 0,
    vx: 0,
    vz: 0,
    rotationY: -0.8,
    roomId: 'gf_dining',
  },
  {
    id: 'prop_upper_ottoman',
    type: 'lounge_ottoman',
    name: 'Upper Gallery Linen Ottoman',
    gx: 24.5,
    gz: 23.0,
    gy: 11.0,
    vy: 0,
    vx: 0,
    vz: 0,
    rotationY: 0.5,
    roomId: 'ff_upper_living',
  },
  {
    id: 'prop_master_chair',
    type: 'teak_armchair',
    name: 'Master Suite Reading Chair',
    gx: 16.5,
    gz: 40.0,
    gy: 11.0,
    vy: 0,
    vx: 0,
    vz: 0,
    rotationY: 0.75,
    roomId: 'ff_master_bedroom',
  },
  {
    id: 'prop_terrace_planter',
    type: 'tropical_planter',
    name: 'First Floor Terrace Planter',
    gx: 22.2,
    gz: -2.2,
    gy: 10.5,
    vy: 0,
    vx: 0,
    vz: 0,
    rotationY: 1.2,
    roomId: 'ff_terrace',
  },
];
