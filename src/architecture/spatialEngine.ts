/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure Spatial Mapping, Staircase Kinematics, Room Detection & Collision Engine
 * for the Kapila Residence 3D Architectural Environment.
 */

import {
  ARCHITECTURAL_ROOMS,
  DoorSpec,
  ELEVATIONS_FT,
  FT_TO_M,
  PLACEABLE_CATALOG,
  PlacedPropInstance,
  RoomSpec,
} from './blueprintData';

export interface WallSegment {
  id: string;
  floor: 'ground' | 'first' | 'site';
  gx1: number;
  gz1: number;
  gx2: number;
  gz2: number;
  baseFt: number;
  heightFt: number;
  thicknessFt: number;
  isGlass?: boolean;
  isRailing?: boolean;
  /** Optional doorway openings along this wall segment (in plan feet along the wall's primary axis) */
  openings?: Array<{
    minFt: number;
    maxFt: number;
    sillFt?: number;
    headFt: number;
    doorId?: string;
    windowCode?: string;
  }>;
}

/**
 * Complete Architectural Wall & Balustrade Segments derived from
 * Ground Floor and First Floor Option 03 drawings.
 */
export const ARCHITECTURAL_WALLS: WallSegment[] = [
  // ==================== GROUND FLOOR WALLS (Base +1'-0", Height 9'-6") ====================
  // South Front Wall of Bed Room 01 (along gz = -2, gx = 0..14)
  {
    id: 'gf_w_bed1_south',
    floor: 'ground',
    gx1: 0,
    gz1: -2,
    gx2: 14,
    gz2: -2,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 3.0, maxFt: 6.5, sillFt: 2.5, headFt: 7.0, windowCode: 'W2' },
      { minFt: 8.5, maxFt: 12.0, sillFt: 0, headFt: 7.0, doorId: 'door_gf_bed1_south' },
    ],
  },
  // South Front Wall of TV Lobby (Grid A: gz = 0, gx = 14..24)
  {
    id: 'gf_w_lobby_south',
    floor: 'ground',
    gx1: 14,
    gz1: 0,
    gx2: 24,
    gz2: 0,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 17.5, maxFt: 21.5, sillFt: 0, headFt: 7.5, doorId: 'door_gf_main' },
    ],
  },
  // West Wall of Bed Room 01 (Grid 2: gx = 0, gz = -2..12)
  {
    id: 'gf_w_bed1_west',
    floor: 'ground',
    gx1: 0,
    gz1: -2,
    gx2: 0,
    gz2: 12,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 2.5, maxFt: 7.5, sillFt: 2.5, headFt: 7.0, windowCode: 'W2' },
    ],
  },
  // North Wall of Bed Room 01 (Grid B: gz = 12, gx = 0..14)
  {
    id: 'gf_w_bed1_north',
    floor: 'ground',
    gx1: 0,
    gz1: 12,
    gx2: 14,
    gz2: 12,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 4.5, maxFt: 9.5, sillFt: 2.5, headFt: 7.0, windowCode: 'W4' },
    ],
  },
  // Partition Wall between Bed Room 01 and TV Lobby (Grid 3: gx = 14, gz = -2..12)
  {
    id: 'gf_w_bed1_east',
    floor: 'ground',
    gx1: 14,
    gz1: -2,
    gx2: 14,
    gz2: 12,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 9.0, maxFt: 12.2, sillFt: 0, headFt: 7.0, doorId: 'door_gf_bed1_entry' },
    ],
  },
  // East Wall of TV Lobby bordering Car Porch (Grid 4: gx = 24, gz = 0..12)
  {
    id: 'gf_w_lobby_east',
    floor: 'ground',
    gx1: 24,
    gz1: 0,
    gx2: 24,
    gz2: 12,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 2.5, maxFt: 6.5, sillFt: 2.0, headFt: 7.0, windowCode: 'W13' },
      { minFt: 8.5, maxFt: 11.5, sillFt: 0, headFt: 7.0, doorId: 'door_gf_porch_lobby' },
    ],
  },
  // West Wall of Staircase & Dining Area (Grid 3: gx = 14, gz = 12..30.75)
  {
    id: 'gf_w_stair_dining_west',
    floor: 'ground',
    gx1: 14,
    gz1: 12,
    gx2: 14,
    gz2: 30.75,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 13.5, maxFt: 17.2, sillFt: 2.0, headFt: 7.5, windowCode: 'W5' },
      { minFt: 22.0, maxFt: 27.0, sillFt: 0, headFt: 7.5, doorId: 'door_gf_dining_west' },
    ],
  },
  // South Wall of Common Bathroom (Grid B: gz = 12, gx = 24..38)
  {
    id: 'gf_w_bath_south',
    floor: 'ground',
    gx1: 24,
    gz1: 12,
    gx2: 38,
    gz2: 12,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
  },
  // West Wall of Common Bathroom (Grid 5: gx = 28, gz = 12..18.75)
  {
    id: 'gf_w_bath_west',
    floor: 'ground',
    gx1: 28,
    gz1: 12,
    gx2: 28,
    gz2: 18.75,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.6,
    openings: [
      { minFt: 14.2, maxFt: 16.8, sillFt: 0, headFt: 7.0, doorId: 'door_gf_bath' },
    ],
  },
  // North Wall of Common Bathroom (Grid C: gz = 18.75, gx = 28..38)
  {
    id: 'gf_w_bath_north',
    floor: 'ground',
    gx1: 28,
    gz1: 18.75,
    gx2: 38,
    gz2: 18.75,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
  },
  // East Exterior Wall of Bathroom & Living Area (Grid 7: gx = 38, gz = 12..30.75)
  {
    id: 'gf_w_living_east',
    floor: 'ground',
    gx1: 38,
    gz1: 12,
    gx2: 38,
    gz2: 30.75,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 14.0, maxFt: 16.5, sillFt: 5.0, headFt: 7.5, windowCode: 'F1' },
      { minFt: 20.5, maxFt: 28.5, sillFt: 1.5, headFt: 7.5, windowCode: 'W5' },
    ],
  },
  // Wall between Dining/Living and Kitchen/BedRoom 02 (Grid D: gz = 30.75, gx = 14..41)
  {
    id: 'gf_w_grid_d',
    floor: 'ground',
    gx1: 14,
    gz1: 30.75,
    gx2: 41,
    gz2: 30.75,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 20.5, maxFt: 23.9, sillFt: 0, headFt: 7.0, doorId: 'door_gf_kitchen_entry' },
      { minFt: 27.5, maxFt: 30.7, sillFt: 0, headFt: 7.0, doorId: 'door_gf_bed2_entry' },
    ],
  },
  // West Wall of Kitchen (Grid 3: gx = 14, gz = 30.75..42.75)
  {
    id: 'gf_w_kitchen_west',
    floor: 'ground',
    gx1: 14,
    gz1: 30.75,
    gx2: 14,
    gz2: 42.75,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 39.0, maxFt: 42.0, sillFt: 0, headFt: 7.0, doorId: 'door_gf_kitchen_rear' },
    ],
  },
  // Partition between Kitchen and Bed Room 02 Dressing Room (gx = 25.5, gz = 30.75..42.75)
  {
    id: 'gf_w_kitchen_bed2_div',
    floor: 'ground',
    gx1: 25.5,
    gz1: 30.75,
    gx2: 25.5,
    gz2: 42.75,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.6,
  },
  // North Rear Wall of Kitchen & Bed Room 02 (Grid E: gz = 42.75, gx = 14..41)
  {
    id: 'gf_w_north_rear',
    floor: 'ground',
    gx1: 14,
    gz1: 42.75,
    gx2: 41,
    gz2: 42.75,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 17.5, maxFt: 22.5, sillFt: 3.0, headFt: 7.0, windowCode: 'W3' },
      { minFt: 27.0, maxFt: 29.0, sillFt: 5.0, headFt: 7.5, windowCode: 'F1' },
      { minFt: 33.5, maxFt: 37.0, sillFt: 0, headFt: 7.0, doorId: 'door_gf_bed2_north' },
    ],
  },
  // East Wall of Bed Room 02 (Grid 8: gx = 41, gz = 30.75..42.75)
  {
    id: 'gf_w_bed2_east',
    floor: 'ground',
    gx1: 41,
    gz1: 30.75,
    gx2: 41,
    gz2: 42.75,
    baseFt: 1.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 34.0, maxFt: 39.0, sillFt: 2.5, headFt: 7.0, windowCode: 'W2' },
    ],
  },

  // ==================== FIRST FLOOR WALLS (Base +11'-0", Height 9'-6") ====================
  // South Wall of Bed Room 03 (gz = -2, gx = 0..14)
  {
    id: 'ff_w_bed3_south',
    floor: 'first',
    gx1: 0,
    gz1: -2,
    gx2: 14,
    gz2: -2,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 4.5, maxFt: 9.5, sillFt: 2.5, headFt: 7.0, windowCode: 'W2' },
    ],
  },
  // West Wall of Bed Room 03 (gx = 0, gz = -2..12)
  {
    id: 'ff_w_bed3_west',
    floor: 'first',
    gx1: 0,
    gz1: -2,
    gx2: 0,
    gz2: 12,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 3.0, maxFt: 8.0, sillFt: 2.5, headFt: 7.0, windowCode: 'W2' },
    ],
  },
  // North Wall of Bed Room 03 (gz = 12, gx = 0..14)
  {
    id: 'ff_w_bed3_north',
    floor: 'first',
    gx1: 0,
    gz1: 12,
    gx2: 14,
    gz2: 12,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 5.0, maxFt: 9.0, sillFt: 0, headFt: 7.0, windowCode: 'DW2' },
    ],
  },
  // Partition between Bed Room 03 and Upper TV Lobby (gx = 14, gz = -2..12)
  {
    id: 'ff_w_bed3_east',
    floor: 'first',
    gx1: 14,
    gz1: -2,
    gx2: 14,
    gz2: 12,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 9.0, maxFt: 12.2, sillFt: 0, headFt: 7.0, doorId: 'door_ff_bed3_entry' },
    ],
  },
  // South Wall of Upper TV Lobby to Terrace (gz = 0, gx = 14..24)
  {
    id: 'ff_w_tv_lobby_south',
    floor: 'first',
    gx1: 14,
    gz1: 0,
    gx2: 24,
    gz2: 0,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 17.5, maxFt: 21.5, sillFt: 0, headFt: 7.5, doorId: 'door_ff_terrace' },
    ],
  },
  // Partition between Upper TV Lobby and Bed Room 04 (gx = 24, gz = -2..12)
  {
    id: 'ff_w_bed4_west',
    floor: 'first',
    gx1: 24,
    gz1: -2,
    gx2: 24,
    gz2: 12,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 9.0, maxFt: 12.2, sillFt: 0, headFt: 7.0, doorId: 'door_ff_bed4_entry' },
    ],
  },
  // South Wall of Bed Room 04 with Flower Trough (gz = -2, gx = 24..34)
  {
    id: 'ff_w_bed4_south',
    floor: 'first',
    gx1: 24,
    gz1: -2,
    gx2: 34,
    gz2: -2,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 26.5, maxFt: 31.5, sillFt: 2.0, headFt: 7.0, windowCode: 'W10' },
    ],
  },
  // East Wall of Bed Room 04 (gx = 34, gz = -2..12)
  {
    id: 'ff_w_bed4_east',
    floor: 'first',
    gx1: 34,
    gz1: -2,
    gx2: 34,
    gz2: 12,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 3.0, maxFt: 7.0, sillFt: 0, headFt: 7.0, windowCode: 'DW3' },
    ],
  },
  // North Wall of Bed Room 04 / South Wall of Upper Common Bathroom (gz = 12, gx = 24..38)
  {
    id: 'ff_w_bath_south',
    floor: 'first',
    gx1: 24,
    gz1: 12,
    gx2: 38,
    gz2: 12,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
  },
  // West Wall of Upper Common Bathroom (gx = 28, gz = 12..18.75)
  {
    id: 'ff_w_bath_west',
    floor: 'first',
    gx1: 28,
    gz1: 12,
    gx2: 28,
    gz2: 18.75,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.6,
    openings: [
      { minFt: 14.2, maxFt: 16.8, sillFt: 0, headFt: 7.0, doorId: 'door_ff_bath_common' },
    ],
  },
  // North Wall of Upper Common Bathroom (gz = 18.75, gx = 28..38)
  {
    id: 'ff_w_bath_north',
    floor: 'first',
    gx1: 28,
    gz1: 18.75,
    gx2: 38,
    gz2: 18.75,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
  },
  // West Wall of Upper Stair Landing & Upper Living (gx = 14, gz = 12..30.75)
  {
    id: 'ff_w_upper_living_west',
    floor: 'first',
    gx1: 14,
    gz1: 12,
    gx2: 14,
    gz2: 30.75,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 14.0, maxFt: 17.5, sillFt: 2.0, headFt: 7.0, windowCode: 'W9' },
      { minFt: 23.0, maxFt: 26.5, sillFt: 0, headFt: 7.0, doorId: 'door_ff_upper_living_west' },
    ],
  },
  // Double-Height VOID Safety Glass Balustrade (West edge along gx = 28, gz = 18.75..30.75)
  {
    id: 'ff_void_railing_west',
    floor: 'first',
    gx1: 28,
    gz1: 18.75,
    gx2: 28,
    gz2: 30.75,
    baseFt: 11.0,
    heightFt: 3.2,
    thicknessFt: 0.25,
    isRailing: true,
    isGlass: true,
  },
  // Double-Height VOID Safety Glass Balustrade (East edge along gx = 35.5, gz = 18.75..30.75)
  {
    id: 'ff_void_railing_east',
    floor: 'first',
    gx1: 35.5,
    gz1: 18.75,
    gx2: 35.5,
    gz2: 30.75,
    baseFt: 11.0,
    heightFt: 3.2,
    thicknessFt: 0.25,
    isRailing: true,
    isGlass: true,
  },
  // East Exterior Wall of First Floor Gallery Bridge (gx = 38, gz = 12..30.75)
  {
    id: 'ff_w_gallery_east',
    floor: 'first',
    gx1: 38,
    gz1: 12,
    gx2: 38,
    gz2: 30.75,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 21.0, maxFt: 28.0, sillFt: 2.0, headFt: 7.5, windowCode: 'W7' },
    ],
  },
  // Wall between Upper Living/Void and Master Bed Room Suite (Grid D: gz = 30.75, gx = 14..41)
  {
    id: 'ff_w_grid_d',
    floor: 'first',
    gx1: 14,
    gz1: 30.75,
    gx2: 41,
    gz2: 30.75,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 15.5, maxFt: 18.9, sillFt: 0, headFt: 7.0, doorId: 'door_ff_master_entry' },
    ],
  },
  // West Wall of Master Bed Room (gx = 14, gz = 30.75..42.75)
  {
    id: 'ff_w_master_west',
    floor: 'first',
    gx1: 14,
    gz1: 30.75,
    gx2: 14,
    gz2: 42.75,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 34.5, maxFt: 39.0, sillFt: 0, headFt: 7.0, windowCode: 'DW2' },
    ],
  },
  // North Rear Wall of Master Bed Room Suite (Grid E: gz = 42.75, gx = 14..41)
  {
    id: 'ff_w_master_north',
    floor: 'first',
    gx1: 14,
    gz1: 42.75,
    gx2: 41,
    gz2: 42.75,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 21.0, maxFt: 25.0, sillFt: 0, headFt: 7.0, doorId: 'door_ff_master_north' },
      { minFt: 27.5, maxFt: 31.5, sillFt: 2.5, headFt: 7.0, windowCode: 'W3' },
    ],
  },
  // Partition inside Master Suite for Dressing & Attached Bath (gx = 34, gz = 30.75..42.75)
  {
    id: 'ff_w_master_bath_div',
    floor: 'first',
    gx1: 34,
    gz1: 30.75,
    gx2: 34,
    gz2: 42.75,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.6,
    openings: [
      { minFt: 33.0, maxFt: 35.6, sillFt: 0, headFt: 7.0, doorId: 'door_ff_master_bath' },
      { minFt: 38.5, maxFt: 41.5, sillFt: 0, headFt: 7.0 }, // Open arch into Dressing Room
    ],
  },
  // East Exterior Wall of Master Suite (gx = 41, gz = 30.75..42.75)
  {
    id: 'ff_w_master_east',
    floor: 'first',
    gx1: 41,
    gz1: 30.75,
    gx2: 41,
    gz2: 42.75,
    baseFt: 11.0,
    heightFt: 9.5,
    thicknessFt: 0.75,
    openings: [
      { minFt: 32.5, maxFt: 35.0, sillFt: 5.0, headFt: 7.5, windowCode: 'F1' },
    ],
  },
  // First Floor Terrace South Balustrade (gz = -4, gx = 14..24)
  {
    id: 'ff_terrace_railing_south',
    floor: 'first',
    gx1: 14,
    gz1: -4,
    gx2: 24,
    gz2: -4,
    baseFt: 10.5,
    heightFt: 3.2,
    thicknessFt: 0.25,
    isRailing: true,
    isGlass: true,
  },
];

/**
 * Determine whether a coordinate (gx, gz) is inside the First Floor VOID
 * (between Grid 5..7 and C..D: gx = 28.2..35.3, gz = 19.0..30.5)
 */
export function isInsideFirstFloorVoid(gx: number, gz: number): boolean {
  return gx > 28.2 && gx < 35.3 && gz > 19.0 && gz < 30.5;
}

/**
 * Compute exact floor elevation in feet at plan coordinates (gx, gz) given current player elevation currentGy.
 * Handles:
 *  - Central Dog-Leg Staircase between Ground Floor (+1'-0") and First Floor (+11'-0")
 *  - First Floor rooms (+11'-0"), Bathrooms (+10'-9"), Terrace & Balconies (+10'-6")
 *  - Double-Height Void drop-through to Ground Floor Living Area (+1'-0")
 *  - Ground Floor rooms (+1'-0"), Bathroom (+0'-9"), Verandah & Car Porch (+0'-6"), and Site Garden (+0'-0")
 */
export function getFloorElevationFt(gx: number, gz: number, currentGy: number): number {
  // 1. Check Central Staircase Zone (Grid 3..5: gx = 17.5..27.8, Grid B..C: gz = 12.0..18.75)
  if (gx >= 17.5 && gx <= 27.8 && gz >= 12.0 && gz <= 18.75) {
    // Mid-landing on East side of stair box (gx = 24.5..27.8, gz = 12.0..18.75) -> +6'-0"
    if (gx >= 24.5) {
      if (currentGy >= 2.5) {
        return ELEVATIONS_FT.STAIR_LANDING; // 6.0 ft
      }
    }
    // Lower flight (South half: gz = 12.0..15.35, gx = 17.5..24.5) rising Eastward from +1'-0" to +6'-0"
    if (gz <= 15.35 && gx >= 17.5 && gx <= 24.5) {
      const t = Math.max(0, Math.min(1, (gx - 17.5) / (24.5 - 17.5)));
      const stairY = ELEVATIONS_FT.GROUND_FLOOR + t * (ELEVATIONS_FT.STAIR_LANDING - ELEVATIONS_FT.GROUND_FLOOR);
      // If player is within reasonable step distance of the lower flight, lock to stair ramp
      if (currentGy <= 7.5) {
        return stairY;
      }
    }
    // Upper flight (North half: gz = 15.35..18.75, gx = 17.5..24.5) rising Westward from +6'-0" to +11'-0"
    if (gz > 15.35 && gx >= 17.5 && gx <= 24.5) {
      const t = Math.max(0, Math.min(1, (24.5 - gx) / (24.5 - 17.5)));
      const stairY = ELEVATIONS_FT.STAIR_LANDING + t * (ELEVATIONS_FT.FIRST_FLOOR - ELEVATIONS_FT.STAIR_LANDING);
      if (currentGy >= 3.8) {
        return stairY;
      }
    }
  }

  // 2. If currently at First Floor height (currentGy >= 7.5 ft)
  if (currentGy >= 7.5) {
    // Check if inside the Double-Height Void (drops down to Ground Floor Living Area +1'-0")
    if (isInsideFirstFloorVoid(gx, gz)) {
      return ELEVATIONS_FT.GROUND_FLOOR;
    }

    // Check First Floor footprint bounds (including balconies and terrace)
    const inFirstFloorMain =
      (gx >= 0 && gx <= 34 && gz >= -2 && gz <= 12) ||
      (gx >= 14 && gx <= 38 && gz >= 12 && gz <= 30.75) ||
      (gx >= 14 && gx <= 41 && gz >= 30.75 && gz <= 42.75);

    if (inFirstFloorMain) {
      // Upper bathrooms at +10'-9"
      if (
        (gx >= 28 && gx <= 38 && gz >= 12 && gz <= 18.75) ||
        (gx >= 34 && gx <= 41 && gz >= 30.75 && gz <= 37.25)
      ) {
        return ELEVATIONS_FT.FIRST_BATH;
      }
      return ELEVATIONS_FT.FIRST_FLOOR;
    }

    // First Floor Terrace & Cantilevered Balcony Corridors (+10'-6")
    const inFirstFloorBalcony =
      (gx >= 14 && gx <= 24 && gz >= -4 && gz <= 0) || // Front Terrace
      (gx >= -3 && gx <= 14 && gz >= -6 && gz <= 15) || // Bed 03 South & NW Corridors
      (gx >= 34 && gx <= 38 && gz >= -2 && gz <= 12) || // Bed 04 East Corridor
      (gx >= 11 && gx <= 14 && gz >= 18.75 && gz <= 45.75) || // Upper Living & Master West Corridor
      (gx >= 14 && gx <= 41 && gz >= 42.75 && gz <= 45.75); // Master North Corridor

    if (inFirstFloorBalcony) {
      return ELEVATIONS_FT.FIRST_CORRIDOR;
    }
  }

  // 3. Ground Floor Interior (+1'-0" and +0'-9")
  const inGroundFloorInterior =
    (gx >= 0 && gx <= 14 && gz >= -2 && gz <= 12) || // Bed Room 01
    (gx >= 14 && gx <= 24 && gz >= 0 && gz <= 12) || // TV Lobby
    (gx >= 14 && gx <= 38 && gz >= 12 && gz <= 30.75) || // Stair, Bath, Dining, Living
    (gx >= 6 && gx <= 41 && gz >= 30.75 && gz <= 42.75); // Store, Kitchen, Bed Room 02

  if (inGroundFloorInterior) {
    if (gx >= 28 && gx <= 38 && gz >= 12 && gz <= 18.75) {
      return ELEVATIONS_FT.GROUND_BATH;
    }
    return ELEVATIONS_FT.GROUND_FLOOR;
  }

  // 4. Ground Floor Verandah, Car Porch, Perimeter Corridors & East Garden (+0'-6")
  const inGroundCorridorOrPorch =
    (gx >= -3 && gx <= 38 && gz >= -6 && gz <= 12) ||
    (gx >= 10 && gx <= 44 && gz >= 12 && gz <= 46);

  if (inGroundCorridorOrPorch) {
    return ELEVATIONS_FT.GROUND_CORRIDOR;
  }

  // 5. Outer Gardens & 6.6m Road (+0'-0")
  return ELEVATIONS_FT.SITE_GARDEN;
}

/**
 * Identify the architectural room or outdoor zone containing (gx, gz, gy).
 */
export function findRoomAt(gx: number, gz: number, gy: number): RoomSpec {
  const isUpper = gy >= 7.0;
  const targetFloor = isUpper ? 'first' : 'ground';

  // First check exact floor match (excluding catch-all site lot)
  for (const room of ARCHITECTURAL_ROOMS) {
    if (room.id === 'outdoor_gardens') continue;
    if (isUpper && room.floor !== 'first') continue;
    if (!isUpper && room.floor === 'first') continue;

    if (gx >= room.gxMin && gx <= room.gxMax && gz >= room.gzMin && gz <= room.gzMax) {
      return room;
    }
  }

  // Fallback to matching floor or outdoor gardens
  const fallback = ARCHITECTURAL_ROOMS.find(
    (r) =>
      r.floor === targetFloor &&
      gx >= r.gxMin - 3 &&
      gx <= r.gxMax + 3 &&
      gz >= r.gzMin - 3 &&
      gz <= r.gzMax + 3
  );
  return fallback || ARCHITECTURAL_ROOMS[ARCHITECTURAL_ROOMS.length - 1];
}

/**
 * Check if a point (gx, gz) at player elevation gy collides with any wall segment or closed door.
 */
export function resolvePlayerMovement(
  curGx: number,
  curGz: number,
  curGy: number,
  nextGx: number,
  nextGz: number,
  playerRadiusFt: number,
  doors: DoorSpec[],
  props: PlacedPropInstance[]
): { gx: number; gz: number; gy: number; hitWall: boolean } {
  // Clamp to generous site boundaries (West drain to East wall, South road to North garden)
  let gx = Math.max(-10, Math.min(45, nextGx));
  let gz = Math.max(-26, Math.min(55, nextGz));
  let hitWall = false;

  const isUpper = curGy >= 7.0;
  const activeFloor = isUpper ? 'first' : 'ground';

  // Check against all walls on the active floor
  for (const wall of ARCHITECTURAL_WALLS) {
    if (wall.floor !== activeFloor) continue;

    const halfThick = wall.thicknessFt * 0.5 + playerRadiusFt;
    const isHorizontal = Math.abs(wall.gz1 - wall.gz2) < 0.01; // Along X axis

    if (isHorizontal) {
      const minX = Math.min(wall.gx1, wall.gx2);
      const maxX = Math.max(wall.gx1, wall.gx2);
      const wallZ = wall.gz1;

      if (gx >= minX - playerRadiusFt * 0.5 && gx <= maxX + playerRadiusFt * 0.5) {
        if (Math.abs(gz - wallZ) < halfThick) {
          // Check if player is passing through an open doorway
          let canPass = false;
          if (wall.openings) {
            for (const op of wall.openings) {
              const isWalkableOpening = (op.sillFt ?? 0) <= 0.5;
              if (
                isWalkableOpening &&
                gx >= op.minFt + playerRadiusFt * 0.35 &&
                gx <= op.maxFt - playerRadiusFt * 0.35
              ) {
                if (!op.doorId) {
                  canPass = true;
                } else {
                  const door = doors.find((d) => d.id === op.doorId);
                  if (door && door.isOpen) {
                    canPass = true;
                  }
                }
              }
            }
          }

          if (!canPass) {
            hitWall = true;
            gz = curGz >= wallZ ? wallZ + halfThick : wallZ - halfThick;
          }
        }
      }
    } else {
      // Vertical wall along Z axis
      const minZ = Math.min(wall.gz1, wall.gz2);
      const maxZ = Math.max(wall.gz1, wall.gz2);
      const wallX = wall.gx1;

      if (gz >= minZ - playerRadiusFt * 0.5 && gz <= maxZ + playerRadiusFt * 0.5) {
        if (Math.abs(gx - wallX) < halfThick) {
          let canPass = false;
          if (wall.openings) {
            for (const op of wall.openings) {
              const isWalkableOpening = (op.sillFt ?? 0) <= 0.5;
              if (
                isWalkableOpening &&
                gz >= op.minFt + playerRadiusFt * 0.35 &&
                gz <= op.maxFt - playerRadiusFt * 0.35
              ) {
                if (!op.doorId) {
                  canPass = true;
                } else {
                  const door = doors.find((d) => d.id === op.doorId);
                  if (door && door.isOpen) {
                    canPass = true;
                  }
                }
              }
            }
          }

          if (!canPass) {
            hitWall = true;
            gx = curGx >= wallX ? wallX + halfThick : wallX - halfThick;
          }
        }
      }
    }
  }

  // Also prevent walking through the First Floor Void north/south open edges unless jumping
  if (isUpper && isInsideFirstFloorVoid(gx, gz)) {
    hitWall = true;
    gx = curGx;
    gz = curGz;
  }

  // Resolve soft collision against placed non-grabbed furniture props on the same floor
  for (const prop of props) {
    if (prop.isGrabbed) continue;
    if (Math.abs(prop.gy - curGy) > 4.0) continue;
    const spec = PLACEABLE_CATALOG.find((c) => c.type === prop.type);
    const propR = (spec ? spec.radiusFt : 1.0) * 0.75 + playerRadiusFt * 0.7;
    const dx = gx - prop.gx;
    const dz = gz - prop.gz;
    const distSq = dx * dx + dz * dz;
    if (distSq < propR * propR && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const push = propR - dist;
      gx += (dx / dist) * push;
      gz += (dz / dist) * push;
    }
  }

  const targetGy = getFloorElevationFt(gx, gz, curGy);
  return { gx, gz, gy: targetGy, hitWall };
}

/**
 * Find the nearest interactive door within reach (e.g. 6.5 ft) of (gx, gz, gy).
 */
export function findNearestDoor(
  gx: number,
  gz: number,
  gy: number,
  doors: DoorSpec[],
  maxDistFt: number = 6.5
): DoorSpec | null {
  let nearest: DoorSpec | null = null;
  let bestDist = maxDistFt;

  for (const door of doors) {
    if (Math.abs(door.elevationFt - gy) > 4.5) continue;
    const centerGx = door.axis === 'x' ? door.gx + door.widthFt * 0.5 : door.gx;
    const centerGz = door.axis === 'z' ? door.gz + door.widthFt * 0.5 : door.gz;
    const d = Math.hypot(gx - centerGx, gz - centerGz);
    if (d < bestDist) {
      bestDist = d;
      nearest = door;
    }
  }
  return nearest;
}

/**
 * Step gravity and floor/table settling physics for movable props.
 */
export function stepPropsPhysics(
  props: PlacedPropInstance[],
  dt: number
): PlacedPropInstance[] {
  const gravityFtPerSec2 = 32.17;
  let changed = false;

  const next = props.map((p) => {
    if (p.isGrabbed) return p;
    const floorY = getFloorElevationFt(p.gx, p.gz, p.gy);
    const isMoving =
      Math.abs(p.gy - floorY) > 0.02 ||
      Math.abs(p.vy) > 0.05 ||
      Math.abs(p.vx) > 0.05 ||
      Math.abs(p.vz) > 0.05;

    if (!isMoving) return p;
    changed = true;

    let gx = Math.max(-8, Math.min(43, p.gx + p.vx * dt));
    let gz = Math.max(-20, Math.min(50, p.gz + p.vz * dt));
    let vy = p.vy - gravityFtPerSec2 * dt;
    let gy = p.gy + vy * dt;
    let vx = p.vx * Math.exp(-4 * dt);
    let vz = p.vz * Math.exp(-4 * dt);

    const newFloorY = getFloorElevationFt(gx, gz, gy);
    if (gy <= newFloorY) {
      gy = newFloorY;
      if (Math.abs(vy) > 3.5) {
        vy = -vy * 0.28; // Damped physical bounce
      } else {
        vy = 0;
        vx = 0;
        vz = 0;
      }
    }

    const room = findRoomAt(gx, gz, gy);
    return {
      ...p,
      gx,
      gz,
      gy,
      vy,
      vx,
      vz,
      roomId: room.id,
    };
  });

  return changed ? next : props;
}

/** Convert plan feet (gx, gy, gz) to Three.js world meters (x, y, z) */
export function planFtToWorldMeters(gx: number, gy: number, gz: number): [number, number, number] {
  return [gx * FT_TO_M, gy * FT_TO_M, -gz * FT_TO_M];
}

/** Convert Three.js world meters (x, y, z) to plan feet (gx, gy, gz) */
export function worldMetersToPlanFt(x: number, y: number, z: number): [number, number, number] {
  return [x / FT_TO_M, y / FT_TO_M, -z / FT_TO_M];
}
