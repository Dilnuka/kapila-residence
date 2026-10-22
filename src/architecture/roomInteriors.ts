/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Plan-accurate room furniture + soft luminaires for Kapila Residence.
 * Coordinates are plan feet (gx, gz) with clearance from walls; beds drive
 * nightstand placement from known builder bed poses.
 */

import * as THREE from 'three';
import { ft } from './blueprintData';
import type { ArchitecturalMaterialSet } from './materialsAndBuilder';

export interface InteriorLightingHandles {
  lights: THREE.PointLight[];
  emissives: THREE.Mesh[];
  setDayScale: (scale: number) => void;
}

function shadow(mesh: THREE.Object3D) {
  mesh.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
}

function rug(w: number, d: number, color = 0xc9b8a0): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.02, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0 })
  );
}

function pillow(mat: THREE.Material, w = 0.32, h = 0.28, d = 0.12): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

function sideTable(mats: ArchitecturalMaterialSet): THREE.Group {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), mats.teakTimber);
  top.position.y = 0.48;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.46, 8), mats.darkWalnut);
  leg.position.y = 0.23;
  g.add(top, leg);
  return g;
}

function nightLamp(mats: ArchitecturalMaterialSet): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 12), mats.brushedBrass);
  base.position.y = 0.02;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.32, 8), mats.brushedBrass);
  stem.position.y = 0.2;
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 0.16, 14, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xfff0d6,
      emissive: 0xffc070,
      emissiveIntensity: 0.22,
      side: THREE.DoubleSide,
      roughness: 0.7,
    })
  );
  shade.position.y = 0.42;
  g.add(base, stem, shade);
  return g;
}

function floorLamp(mats: ArchitecturalMaterialSet, emissives: THREE.Mesh[]): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 14), mats.blackMetal);
  base.position.y = 0.02;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 1.45, 8), mats.brushedBrass);
  pole.position.y = 0.75;
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 0.28, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xfff3e0,
      emissive: 0xffc878,
      emissiveIntensity: 0.26,
      side: THREE.DoubleSide,
      roughness: 0.65,
    })
  );
  shade.position.y = 1.55;
  g.add(base, pole, shade);
  emissives.push(shade);
  return g;
}

function pendantFixture(
  mats: ArchitecturalMaterialSet,
  emissives: THREE.Mesh[],
  drop = 0.55
): THREE.Group {
  const g = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, drop, 6), mats.blackMetal);
  cord.position.y = -drop * 0.5;
  const shade = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.65),
    new THREE.MeshStandardMaterial({
      color: 0xffe8c8,
      emissive: 0xffb860,
      emissiveIntensity: 0.28,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide,
    })
  );
  shade.position.y = -drop;
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xfff5e0,
      emissive: 0xffd090,
      emissiveIntensity: 0.4,
    })
  );
  bulb.position.y = -drop + 0.02;
  g.add(cord, shade, bulb);
  emissives.push(shade, bulb);
  return g;
}

function wardrobe(mats: ArchitecturalMaterialSet, w = 1.6, h = 2.1, d = 0.55): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.darkWalnut);
  body.position.y = h * 0.5;
  const doorL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.48, h * 0.92, 0.03), mats.teakTimber);
  doorL.position.set(-w * 0.24, h * 0.5, d * 0.52);
  const doorR = doorL.clone();
  doorR.position.x = w * 0.24;
  const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.04), mats.brushedBrass);
  handleL.position.set(-0.08, h * 0.5, d * 0.56);
  const handleR = handleL.clone();
  handleR.position.x = 0.08;
  g.add(body, doorL, doorR, handleL, handleR);
  return g;
}

function deskChair(mats: ArchitecturalMaterialSet): THREE.Group {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), mats.fabricCharcoal);
  seat.position.y = 0.42;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.06), mats.fabricCharcoal);
  back.position.set(0, 0.64, -0.18);
  for (const [x, z] of [
    [-0.16, -0.16],
    [0.16, -0.16],
    [-0.16, 0.16],
    [0.16, 0.16],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), mats.teakTimber);
    leg.position.set(x, 0.2, z);
    g.add(leg);
  }
  g.add(seat, back);
  return g;
}

function coffeeTable(mats: ArchitecturalMaterialSet): THREE.Group {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.05, 0.55), mats.teakTimber);
  top.position.y = 0.38;
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.45), mats.darkWalnut);
  shelf.position.y = 0.14;
  for (const [x, z] of [
    [-0.42, -0.2],
    [0.42, -0.2],
    [-0.42, 0.2],
    [0.42, 0.2],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.05), mats.darkWalnut);
    leg.position.set(x, 0.18, z);
    g.add(leg);
  }
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.22), mats.brushedBrass);
  tray.position.set(-0.15, 0.42, 0);
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.16), mats.fabricTerracotta);
  book.position.set(0.25, 0.43, 0.05);
  g.add(top, shelf, tray, book);
  return g;
}

function tvConsole(mats: ArchitecturalMaterialSet): THREE.Group {
  const g = new THREE.Group();
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 2.0), mats.teakTimber);
  cab.position.y = 0.25;
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.78, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.25, metalness: 0.6 })
  );
  screen.position.set(-0.12, 1.15, 0);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.2), mats.blackMetal);
  stand.position.set(-0.12, 0.65, 0);
  g.add(cab, screen, stand);
  return g;
}

function diningChair(mats: ArchitecturalMaterialSet): THREE.Group {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), mats.fabricCream);
  seat.position.y = 0.42;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.05), mats.teakTimber);
  back.position.set(0, 0.65, -0.17);
  for (const [x, z] of [
    [-0.15, -0.15],
    [0.15, -0.15],
    [-0.15, 0.15],
    [0.15, 0.15],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 6), mats.teakTimber);
    leg.position.set(x, 0.2, z);
    g.add(leg);
  }
  g.add(seat, back);
  return g;
}

function planter(mats: ArchitecturalMaterialSet, scale = 1): THREE.Group {
  const g = new THREE.Group();
  g.scale.setScalar(scale);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.32, 12), mats.wallInterior);
  pot.position.y = 0.16;
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 10), mats.darkWalnut);
  soil.position.y = 0.3;
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mats.foliageGreen);
  leaf.scale.set(0.7, 0.55, 1.1);
  leaf.position.y = 0.52;
  g.add(pot, soil, leaf);
  return g;
}

function bathroomVanity(mats: ArchitecturalMaterialSet): THREE.Group {
  const g = new THREE.Group();
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.48), mats.teakTimber);
  cab.position.y = 0.38;
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.52), mats.porcelainFloor);
  top.position.y = 0.78;
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.08, 16), mats.porcelainFloor);
  basin.position.set(0, 0.82, 0);
  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), mats.brushedSteel);
  faucet.position.set(0, 0.95, -0.12);
  const mirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.7, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xb8d4e8, metalness: 0.55, roughness: 0.12 })
  );
  mirror.position.set(0, 1.45, -0.2);
  const lightBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.04, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0xfff5e8,
      emissive: 0xffe0a8,
      emissiveIntensity: 0.32,
    })
  );
  lightBar.position.set(0, 1.85, -0.18);
  g.add(cab, top, basin, faucet, mirror, lightBar);
  return g;
}

function toilet(mats: ArchitecturalMaterialSet): THREE.Group {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.55), mats.porcelainFloor);
  bowl.position.y = 0.2;
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.18), mats.porcelainFloor);
  tank.position.set(0, 0.55, -0.22);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.42), mats.fabricCream);
  seat.position.set(0, 0.42, 0.02);
  g.add(bowl, tank, seat);
  return g;
}

function kitchenIsland(mats: ArchitecturalMaterialSet): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 0.8), mats.teakTimber);
  base.position.y = 0.42;
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.9), mats.graniteFloor);
  top.position.y = 0.88;
  const sink = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.35), mats.brushedSteel);
  sink.position.set(-0.45, 0.92, 0);
  const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), mats.brushedSteel);
  faucet.position.set(-0.45, 1.05, -0.12);
  g.add(base, top, sink, faucet);
  return g;
}

function loungeChair(mats: ArchitecturalMaterialSet, fabric: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), fabric);
  seat.position.y = 0.42;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.1), fabric);
  back.position.set(0, 0.72, -0.28);
  back.rotation.x = -0.15;
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.55), fabric);
  armL.position.set(-0.35, 0.55, -0.05);
  const armR = armL.clone();
  armR.position.x = 0.35;
  for (const [x, z] of [
    [-0.28, -0.28],
    [0.28, -0.28],
    [-0.28, 0.28],
    [0.28, 0.28],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.38, 8), mats.teakTimber);
    leg.position.set(x, 0.19, z);
    g.add(leg);
  }
  g.add(seat, back, armL, armR);
  return g;
}

function sofa3Seat(
  mats: ArchitecturalMaterialSet,
  fabric: THREE.Material,
  accent: THREE.Material,
  width = 2.2
): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.38, 0.9), fabric);
  base.position.y = 0.22;
  const back = new THREE.Mesh(new THREE.BoxGeometry(width, 0.68, 0.2), fabric);
  back.position.set(0, 0.5, -0.35);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.88), fabric);
  armL.position.set(-width * 0.5 + 0.07, 0.42, 0);
  const armR = armL.clone();
  armR.position.x = width * 0.5 - 0.07;
  const seatPad = new THREE.Mesh(new THREE.BoxGeometry(width - 0.32, 0.1, 0.72), fabric);
  seatPad.position.set(0, 0.44, 0.04);
  const p1 = pillow(accent, 0.3, 0.26, 0.1);
  p1.position.set(-width * 0.22, 0.62, -0.18);
  p1.rotation.y = 0.25;
  const p2 = pillow(mats.fabricCream, 0.28, 0.24, 0.1);
  p2.position.set(width * 0.18, 0.62, -0.18);
  p2.rotation.y = -0.2;
  g.add(base, back, armL, armR, seatPad, p1, p2);
  return g;
}

function bookshelf(mats: ArchitecturalMaterialSet, w = 1.0, h = 1.8): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.32), mats.darkWalnut);
  frame.position.y = h * 0.5;
  g.add(frame);
  const colors = [0x8b4513, 0x2c4a6e, 0xc45c26, 0x3d5a3d, 0x5c4033, 0x6b4c7a];
  for (let shelf = 0; shelf < 4; shelf++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.03, 0.3), mats.teakTimber);
    board.position.set(0, 0.25 + shelf * 0.4, 0.02);
    g.add(board);
    for (let b = 0; b < 4; b++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.22 + (b % 3) * 0.04, 0.18),
        new THREE.MeshStandardMaterial({
          color: colors[(shelf * 4 + b) % colors.length],
          roughness: 0.85,
        })
      );
      book.position.set(-w * 0.32 + b * 0.22, 0.38 + shelf * 0.4, 0.02);
      g.add(book);
    }
  }
  return g;
}

function wallArt(mats: ArchitecturalMaterialSet, w = 0.7, h = 0.9): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.04), mats.darkWalnut);
  const canvas = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.9, metalness: 0 })
  );
  canvas.position.z = 0.025;
  const accent = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.55, h * 0.35, 0.015),
    mats.fabricTerracotta
  );
  accent.position.set(-w * 0.1, h * 0.1, 0.04);
  const accent2 = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.35, h * 0.5, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.88 })
  );
  accent2.position.set(w * 0.15, -h * 0.05, 0.04);
  g.add(frame, canvas, accent, accent2);
  return g;
}

function sheerCurtain(w: number, h: number): THREE.Group {
  const g = new THREE.Group();
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, w + 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.7, roughness: 0.35 })
  );
  rod.rotation.z = Math.PI / 2;
  rod.position.y = h * 0.5;
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0xe8e0d4,
      roughness: 0.95,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  g.add(rod, panel);
  return g;
}

function ottoman(mats: ArchitecturalMaterialSet, fabric: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.38, 16), fabric);
  body.position.y = 0.19;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.04, 16), mats.fabricCream);
  top.position.y = 0.4;
  g.add(body, top);
  return g;
}

function ceilingDisc(emissiveIntensity = 0.16): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfff5e8,
      emissive: 0xffd9a0,
      emissiveIntensity,
      side: THREE.DoubleSide,
      roughness: 0.6,
    })
  );
}

function addCeilingLuminaire(
  parent: THREE.Group,
  mats: ArchitecturalMaterialSet,
  gx: number,
  gy: number,
  gz: number,
  lights: THREE.PointLight[],
  emissives: THREE.Mesh[],
  intensity = 0.38,
  withRealLight = false
) {
  const disc = ceilingDisc(withRealLight ? 0.22 : 0.14);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(ft(gx), ft(gy), -ft(gz));
  parent.add(disc);
  emissives.push(disc);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.18, 20), mats.blackMetal);
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(disc.position);
  ring.position.y -= 0.005;
  parent.add(ring);

  if (withRealLight) {
    const light = new THREE.PointLight(0xffe2b8, intensity, 7.0, 2);
    light.position.set(ft(gx), ft(gy - 0.35), -ft(gz));
    parent.add(light);
    lights.push(light);
  }
}

function placeNightPair(
  zone: THREE.Group,
  mats: ArchitecturalMaterialSet,
  gx: number,
  gy: number,
  gzA: number,
  gzB: number
) {
  const stL = sideTable(mats);
  stL.position.set(ft(gx), ft(gy), -ft(gzA));
  const stR = sideTable(mats);
  stR.position.set(ft(gx), ft(gy), -ft(gzB));
  const lampL = nightLamp(mats);
  lampL.position.set(ft(gx), ft(gy + 0.48), -ft(gzA));
  const lampR = nightLamp(mats);
  lampR.position.set(ft(gx), ft(gy + 0.48), -ft(gzB));
  zone.add(stL, stR, lampL, lampR);
}

/**
 * Furnish every major room with plan-accurate placement + soft ceiling lighting.
 */
export function buildRoomInteriors(
  mats: ArchitecturalMaterialSet,
  ground: THREE.Group,
  first: THREE.Group
): InteriorLightingHandles {
  const lights: THREE.PointLight[] = [];
  const emissives: THREE.Mesh[] = [];
  const root = new THREE.Group();
  root.name = 'room_interiors';
  ground.add(root);
  const upper = new THREE.Group();
  upper.name = 'room_interiors_ff';
  first.add(upper);

  const navy = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.82 });
  const sage = new THREE.MeshStandardMaterial({ color: 0x5f6f52, roughness: 0.85 });
  const linen = mats.fabricCream;
  const terracotta = mats.fabricTerracotta;

  // ========== TV LOBBY (14–24 × 0–12) — complements builder L-sofa @21.5,6.5 + TV @14.6,5.5 ==========
  {
    const zone = new THREE.Group();
    const r = rug(2.4, 2.0, 0xb8a992);
    r.position.set(ft(19.0), ft(1.02), -ft(6.2));
    zone.add(r);
    const table = coffeeTable(mats);
    table.position.set(ft(18.6), ft(1.0), -ft(6.0));
    zone.add(table);
    const plant = planter(mats, 1.05);
    plant.position.set(ft(15.6), ft(1.0), -ft(1.8));
    zone.add(plant);
    const chair = loungeChair(mats, linen);
    chair.position.set(ft(22.2), ft(1.0), -ft(3.5));
    chair.rotation.y = -1.0;
    zone.add(chair);
    const ott = ottoman(mats, sage);
    ott.position.set(ft(19.8), ft(1.0), -ft(4.2));
    zone.add(ott);
    const lamp = floorLamp(mats, emissives);
    lamp.position.set(ft(22.6), ft(1.0), -ft(9.5));
    zone.add(lamp);
    // Inside east wall (gxMax=24) — was incorrectly at 24.5
    const books = bookshelf(mats, 0.8, 1.6);
    books.position.set(ft(23.2), ft(1.0), -ft(2.4));
    books.rotation.y = -Math.PI / 2;
    zone.add(books);
    const art = wallArt(mats, 0.6, 0.8);
    art.position.set(ft(17.5), ft(3.1), -ft(0.55));
    zone.add(art);
    shadow(zone);
    root.add(zone);
    addCeilingLuminaire(root, mats, 19, 9.9, 6, lights, emissives, 0.34, true);
  }

  // ========== BED 01 (0–14 × -2–12) — bed @4.5,5.5 rot+90° headboard west ==========
  {
    const zone = new THREE.Group();
    const r = rug(2.0, 1.5, 0xc4b09a);
    r.position.set(ft(6.5), ft(1.02), -ft(5.5));
    zone.add(r);
    // Wardrobe on north wall — keep clear of west wall / bed headboard
    const ward = wardrobe(mats, 1.7, 2.1, 0.52);
    ward.position.set(ft(7.5), ft(1.0), -ft(10.8));
    zone.add(ward);
    // Desk against east wall, south of center
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.5), mats.teakTimber);
    desk.position.set(ft(12.2), ft(1.72), -ft(2.8));
    for (const [lx, lz] of [
      [-0.42, -0.2],
      [0.42, -0.2],
      [-0.42, 0.2],
      [0.42, 0.2],
    ]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.05), mats.brushedSteel);
      leg.position.set(ft(12.2) + lx, ft(1.35), -ft(2.8) + lz);
      zone.add(leg);
    }
    zone.add(desk);
    const chair = deskChair(mats);
    chair.position.set(ft(12.2), ft(1.0), -ft(3.7));
    zone.add(chair);
    // Nightstands flanking bed @5.5,5.5 (headboard west)
    placeNightPair(zone, mats, 4.0, 1.0, 3.9, 7.1);
    const p = planter(mats, 0.85);
    p.position.set(ft(12.0), ft(1.0), -ft(10.2));
    zone.add(p);
    const art = wallArt(mats, 0.5, 0.65);
    art.position.set(ft(8.0), ft(3.3), -ft(0.55));
    zone.add(art);
    shadow(zone);
    root.add(zone);
    addCeilingLuminaire(root, mats, 7, 9.9, 5, lights, emissives, 0.3);
  }

  // ========== BATH GF (28–38 × 12–18.75) ==========
  {
    const zone = new THREE.Group();
    const vanity = bathroomVanity(mats);
    vanity.position.set(ft(35.2), ft(0.75), -ft(13.8));
    vanity.rotation.y = Math.PI;
    zone.add(vanity);
    const wc = toilet(mats);
    wc.position.set(ft(30.5), ft(0.75), -ft(16.8));
    zone.add(wc);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.85, 1.0), mats.frostedGlass);
    glass.position.set(ft(33.2), ft(1.7), -ft(16.2));
    zone.add(glass);
    shadow(zone);
    root.add(zone);
    addCeilingLuminaire(root, mats, 33, 9.5, 15.3, lights, emissives, 0.28);
  }

  // ========== DINING (14–28 × 18.75–30.75) — table @21,24.75 ==========
  {
    const zone = new THREE.Group();
    const r = rug(2.6, 3.0, 0xb5a48c);
    r.position.set(ft(21), ft(1.02), -ft(24.75));
    zone.add(r);
    for (const [dx, dz, rot] of [
      [-0.82, -0.65, 1.57],
      [-0.82, 0.0, 1.57],
      [-0.82, 0.65, 1.57],
      [0.82, -0.65, -1.57],
      [0.82, 0.0, -1.57],
      [0.82, 0.65, -1.57],
    ] as Array<[number, number, number]>) {
      const c = diningChair(mats);
      c.position.set(ft(21) + dx, ft(1.0), -ft(24.75) + dz);
      c.rotation.y = rot;
      zone.add(c);
    }
    // East wall sideboard — clear of door to living
    const sideboard = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.85, 1.7), mats.darkWalnut);
    sideboard.position.set(ft(26.8), ft(1.42), -ft(21.5));
    zone.add(sideboard);
    const vase = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), terracotta);
    vase.scale.set(1, 1.45, 1);
    vase.position.set(ft(26.8), ft(2.05), -ft(21.2));
    zone.add(vase);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.08, 12), mats.brushedBrass);
    bowl.position.set(ft(21), ft(1.82), -ft(24.75));
    zone.add(bowl);
    const art = wallArt(mats, 0.85, 0.55);
    art.position.set(ft(14.55), ft(3.4), -ft(24.75));
    art.rotation.y = Math.PI / 2;
    zone.add(art);
    for (const [ox, oz, drop] of [
      [-0.4, -0.3, 0.65],
      [0, 0.1, 0.5],
      [0.38, -0.15, 0.72],
    ] as Array<[number, number, number]>) {
      const pen = pendantFixture(mats, emissives, drop);
      pen.position.set(ft(21) + ox, ft(9.5), -ft(24.75) + oz);
      zone.add(pen);
    }
    shadow(zone);
    root.add(zone);
    addCeilingLuminaire(root, mats, 21, 9.9, 24.75, lights, emissives, 0.36, true);
  }

  // ========== LIVING VOID (28–38 × 18.75–30.75) — built-in seat @36.8 ==========
  {
    const zone = new THREE.Group();
    const r = rug(2.4, 2.6, 0xa89880);
    r.position.set(ft(32.2), ft(1.02), -ft(24.8));
    zone.add(r);
    const sofa = sofa3Seat(mats, navy, terracotta, 2.2);
    sofa.position.set(ft(30.8), ft(1.0), -ft(27.5));
    sofa.rotation.y = 0.15;
    zone.add(sofa);
    const chair1 = loungeChair(mats, sage);
    chair1.position.set(ft(34.5), ft(1.0), -ft(22.2));
    chair1.rotation.y = -2.3;
    zone.add(chair1);
    const chair2 = loungeChair(mats, linen);
    chair2.position.set(ft(29.8), ft(1.0), -ft(22.0));
    chair2.rotation.y = 2.5;
    zone.add(chair2);
    const ct = coffeeTable(mats);
    ct.position.set(ft(32.2), ft(1.0), -ft(24.8));
    zone.add(ct);
    const ott = ottoman(mats, terracotta);
    ott.position.set(ft(33.5), ft(1.0), -ft(26.2));
    zone.add(ott);
    const plant = planter(mats, 1.1);
    plant.position.set(ft(35.8), ft(1.0), -ft(20.5));
    zone.add(plant);
    const lamp = floorLamp(mats, emissives);
    lamp.position.set(ft(29.5), ft(1.0), -ft(28.8));
    zone.add(lamp);
    const art = wallArt(mats, 0.7, 1.0);
    art.position.set(ft(28.45), ft(3.6), -ft(24.75));
    art.rotation.y = Math.PI / 2;
    zone.add(art);
    shadow(zone);
    root.add(zone);
    addCeilingLuminaire(root, mats, 32.5, 18.5, 24.75, lights, emissives, 0.34, true);
  }

  // ========== KITCHEN (14–25.5 × 30.75–42.75) — counters on N+E; island clear of both ==========
  {
    const zone = new THREE.Group();
    const island = kitchenIsland(mats);
    island.position.set(ft(18.8), ft(1.0), -ft(35.8));
    zone.add(island);
    for (const oz of [-0.5, 0, 0.5]) {
      const s = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.08, 12), mats.fabricCharcoal);
      seat.position.y = 0.68;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.62, 8), mats.brushedSteel);
      stem.position.y = 0.34;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.04, 12), mats.blackMetal);
      base.position.y = 0.02;
      s.add(seat, stem, base);
      s.position.set(ft(18.8), ft(1.0), -ft(35.8) + oz + 0.72);
      zone.add(s);
    }
    // Wall uppers sit on north counter run (clear of east L-return)
    const uppers = new THREE.Mesh(new THREE.BoxGeometry(ft(7.5), ft(1.8), ft(1.0)), mats.teakTimber);
    uppers.position.set(ft(18.8), ft(6.2), -ft(41.15));
    zone.add(uppers);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.4), mats.brushedSteel);
    hood.position.set(ft(21.8), ft(5.4), -ft(40.55));
    zone.add(hood);
    const cooktop = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.03, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.35 })
    );
    cooktop.position.set(ft(21.8), ft(2.95), -ft(41.15));
    zone.add(cooktop);
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(ft(6.5), 0.02, 0.03),
      new THREE.MeshStandardMaterial({
        color: 0xfff5e8,
        emissive: 0xffe0a0,
        emissiveIntensity: 0.28,
      })
    );
    led.position.set(ft(18.8), ft(5.15), -ft(40.55));
    zone.add(led);
    emissives.push(led);
    shadow(zone);
    root.add(zone);
    addCeilingLuminaire(root, mats, 19.5, 9.9, 36.5, lights, emissives, 0.32, true);
  }

  // ========== STORE (6–14 × 30.75–39.5) ==========
  {
    const zone = new THREE.Group();
    const shelves = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.7, 1.4), mats.darkWalnut);
    shelves.position.set(ft(7.5), ft(1.85), -ft(34.2));
    zone.add(shelves);
    const boxes = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.45), mats.fabricTerracotta);
    boxes.position.set(ft(10.2), ft(1.15), -ft(36.5));
    zone.add(boxes);
    shadow(zone);
    root.add(zone);
    addCeilingLuminaire(root, mats, 10.5, 9.5, 34, lights, emissives, 0.24);
  }

  // ========== BED 02 (25.5–41 × 30.75–42.75) — bed @36.5,36.5 rot-90° headboard east ==========
  {
    const zone = new THREE.Group();
    const r = rug(1.9, 1.4, 0xc2ae96);
    r.position.set(ft(34.5), ft(1.02), -ft(36.5));
    zone.add(r);
    const ward = wardrobe(mats, 1.4, 2.05, 0.5);
    ward.position.set(ft(39.2), ft(1.0), -ft(33.5));
    ward.rotation.y = -Math.PI / 2;
    zone.add(ward);
    // Dressing wardrobe near partition gx=25.5
    const dress = wardrobe(mats, 1.1, 2.0, 0.48);
    dress.position.set(ft(26.8), ft(1.0), -ft(35.5));
    zone.add(dress);
    // Nightstands north/south of bed @35.5,36.5 (headboard east)
    placeNightPair(zone, mats, 37.2, 1.0, 34.8, 38.2);
    const p = planter(mats, 0.8);
    p.position.set(ft(39.0), ft(1.0), -ft(41.0));
    zone.add(p);
    const chair = loungeChair(mats, linen);
    chair.position.set(ft(30.5), ft(1.0), -ft(40.5));
    chair.rotation.y = 0.9;
    zone.add(chair);
    const art = wallArt(mats, 0.5, 0.65);
    art.position.set(ft(34), ft(3.2), -ft(42.2));
    zone.add(art);
    shadow(zone);
    root.add(zone);
    addCeilingLuminaire(root, mats, 34.5, 9.9, 36.75, lights, emissives, 0.3, true);
  }

  // ========== VERANDAH (14–24 × -4–0) ==========
  {
    const zone = new THREE.Group();
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 0.48), mats.teakTimber);
    bench.position.set(ft(19), ft(0.7), -ft(-2.5));
    zone.add(bench);
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.4), terracotta);
    cushion.position.set(ft(19), ft(0.94), -ft(-2.5));
    zone.add(cushion);
    const p1 = planter(mats, 0.8);
    p1.position.set(ft(15.8), ft(0.5), -ft(-2.2));
    const p2 = planter(mats, 0.8);
    p2.position.set(ft(22.2), ft(0.5), -ft(-2.2));
    zone.add(p1, p2);
    shadow(zone);
    root.add(zone);
    addCeilingLuminaire(root, mats, 19, 9.0, -2, lights, emissives, 0.26);
  }

  addCeilingLuminaire(root, mats, 29, 9.1, 4, lights, emissives, 0.24);

  // ========== UPPER TV LOBBY (14–24 × 0–12) @ +11' ==========
  {
    const zone = new THREE.Group();
    const r = rug(2.2, 1.8, 0xb9a88e);
    r.position.set(ft(19), ft(11.02), -ft(6.2));
    zone.add(r);
    const sofa = sofa3Seat(mats, sage, terracotta, 2.0);
    sofa.position.set(ft(19), ft(11.0), -ft(8.8));
    zone.add(sofa);
    const tv = tvConsole(mats);
    tv.position.set(ft(15.0), ft(11.0), -ft(5.5));
    zone.add(tv);
    const ct = coffeeTable(mats);
    ct.position.set(ft(19), ft(11.0), -ft(6.4));
    zone.add(ct);
    const lamp = floorLamp(mats, emissives);
    lamp.position.set(ft(22.4), ft(11.0), -ft(9.2));
    zone.add(lamp);
    const plant = planter(mats, 0.95);
    plant.position.set(ft(22.6), ft(11.0), -ft(2.8));
    zone.add(plant);
    const art = wallArt(mats, 0.55, 0.75);
    art.position.set(ft(19), ft(13.4), -ft(0.55));
    zone.add(art);
    shadow(zone);
    upper.add(zone);
    addCeilingLuminaire(upper, mats, 19, 19.9, 6, lights, emissives, 0.32, true);
  }

  // ========== BED 03 — same layout as Bed 01 @ +11' ==========
  {
    const zone = new THREE.Group();
    const r = rug(1.9, 1.4, 0xc6b49c);
    r.position.set(ft(6.5), ft(11.02), -ft(5.5));
    zone.add(r);
    const ward = wardrobe(mats, 1.6, 2.1, 0.52);
    ward.position.set(ft(1.5), ft(11.0), -ft(9.5));
    ward.rotation.y = Math.PI / 2;
    zone.add(ward);
    placeNightPair(zone, mats, 4.0, 11.0, 3.9, 7.1);
    const chair = loungeChair(mats, linen);
    chair.position.set(ft(11.2), ft(11.0), -ft(9.5));
    chair.rotation.y = 2.4;
    zone.add(chair);
    const books = bookshelf(mats, 0.7, 1.45);
    books.position.set(ft(12.2), ft(11.0), -ft(2.5));
    zone.add(books);
    shadow(zone);
    upper.add(zone);
    addCeilingLuminaire(upper, mats, 7, 19.9, 5, lights, emissives, 0.3);
  }

  // ========== BED 04 (24–34 × -2–12) — bed @29,3.5 rot 0 headboard south ==========
  {
    const zone = new THREE.Group();
    const r = rug(1.7, 1.3, 0xc0ad95);
    r.position.set(ft(29), ft(11.02), -ft(5.0));
    zone.add(r);
    const ward = wardrobe(mats, 1.35, 2.0, 0.48);
    ward.position.set(ft(32.5), ft(11.0), -ft(9.8));
    zone.add(ward);
    // Nightstands east/west of bed near south headboard
    const stL = sideTable(mats);
    stL.position.set(ft(27.2), ft(11.0), -ft(2.6));
    const stR = sideTable(mats);
    stR.position.set(ft(30.8), ft(11.0), -ft(2.6));
    const lampL = nightLamp(mats);
    lampL.position.set(ft(27.2), ft(11.48), -ft(2.6));
    const lampR = nightLamp(mats);
    lampR.position.set(ft(30.8), ft(11.48), -ft(2.6));
    zone.add(stL, stR, lampL, lampR);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.48), mats.teakTimber);
    desk.position.set(ft(26.2), ft(11.72), -ft(8.5));
    zone.add(desk);
    const chair = deskChair(mats);
    chair.position.set(ft(26.2), ft(11.0), -ft(7.6));
    zone.add(chair);
    const art = wallArt(mats, 0.48, 0.65);
    art.position.set(ft(29), ft(13.3), -ft(0.55));
    zone.add(art);
    shadow(zone);
    upper.add(zone);
    addCeilingLuminaire(upper, mats, 29, 19.9, 5, lights, emissives, 0.3);
  }

  // ========== UPPER BATH ==========
  {
    const zone = new THREE.Group();
    const vanity = bathroomVanity(mats);
    vanity.position.set(ft(35.2), ft(10.75), -ft(13.8));
    vanity.rotation.y = Math.PI;
    zone.add(vanity);
    const wc = toilet(mats);
    wc.position.set(ft(30.5), ft(10.75), -ft(16.8));
    zone.add(wc);
    shadow(zone);
    upper.add(zone);
    addCeilingLuminaire(upper, mats, 33, 19.5, 15.3, lights, emissives, 0.26);
  }

  // ========== UPPER LIVING (14–28 × 18.75–30.75) — pantry on north @23.5,29.6 ==========
  {
    const zone = new THREE.Group();
    const r = rug(2.5, 2.3, 0xb4a38a);
    r.position.set(ft(20.5), ft(11.02), -ft(23.5));
    zone.add(r);
    const sofa = sofa3Seat(mats, navy, terracotta, 2.3);
    sofa.position.set(ft(17.8), ft(11.0), -ft(22.2));
    sofa.rotation.y = 0.2;
    zone.add(sofa);
    const chair = loungeChair(mats, linen);
    chair.position.set(ft(23.5), ft(11.0), -ft(26.5));
    chair.rotation.y = -0.9;
    zone.add(chair);
    const chair2 = loungeChair(mats, sage);
    chair2.position.set(ft(23.2), ft(11.0), -ft(21.2));
    chair2.rotation.y = -1.9;
    zone.add(chair2);
    const ct = coffeeTable(mats);
    ct.position.set(ft(20.5), ft(11.0), -ft(23.5));
    zone.add(ct);
    const plant = planter(mats, 1.0);
    plant.position.set(ft(25.5), ft(11.0), -ft(20.2));
    zone.add(plant);
    const lamp = floorLamp(mats, emissives);
    lamp.position.set(ft(15.8), ft(11.0), -ft(26.5));
    zone.add(lamp);
    const books = bookshelf(mats, 0.85, 1.55);
    books.position.set(ft(15.2), ft(11.0), -ft(21.5));
    books.rotation.y = Math.PI / 2;
    zone.add(books);
    const art = wallArt(mats, 0.7, 0.9);
    art.position.set(ft(20.5), ft(13.6), -ft(19.2));
    zone.add(art);
    shadow(zone);
    upper.add(zone);
    addCeilingLuminaire(upper, mats, 20.5, 19.9, 23.5, lights, emissives, 0.34, true);
  }

  // ========== MASTER (14–41 × 30.75–42.75) — bed @24.5,37.8 rot180 headboard north; bath east of gx34 ==========
  {
    const zone = new THREE.Group();
    const r = rug(2.8, 2.2, 0xc8b6a0);
    r.position.set(ft(24.5), ft(11.02), -ft(36.5));
    zone.add(r);
    // Nightstands at headboard sides (north)
    const stL = sideTable(mats);
    stL.position.set(ft(22.4), ft(11.0), -ft(39.0));
    const stR = sideTable(mats);
    stR.position.set(ft(26.6), ft(11.0), -ft(39.0));
    const lampL = nightLamp(mats);
    lampL.position.set(ft(22.4), ft(11.48), -ft(39.0));
    const lampR = nightLamp(mats);
    lampR.position.set(ft(26.6), ft(11.48), -ft(39.0));
    zone.add(stL, stR, lampL, lampR);
    // Foot bench south of bed
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.38, 0.4), terracotta);
    bench.position.set(ft(24.5), ft(11.19), -ft(35.2));
    zone.add(bench);
    const chair = loungeChair(mats, sage);
    chair.position.set(ft(16.8), ft(11.0), -ft(38.5));
    chair.rotation.y = 0.7;
    zone.add(chair);
    const ott = ottoman(mats, linen);
    ott.position.set(ft(18.0), ft(11.0), -ft(36.5));
    zone.add(ott);
    // Dressing wardrobe east of partition
    const ward = wardrobe(mats, 1.8, 2.15, 0.55);
    ward.position.set(ft(36.2), ft(11.0), -ft(40.0));
    zone.add(ward);
    const vanity = bathroomVanity(mats);
    vanity.position.set(ft(37.8), ft(11.0), -ft(33.8));
    zone.add(vanity);
    const wc = toilet(mats);
    wc.position.set(ft(38.5), ft(11.0), -ft(36.8));
    zone.add(wc);
    const plant = planter(mats, 0.95);
    plant.position.set(ft(16.5), ft(11.0), -ft(41.5));
    zone.add(plant);
    const art = wallArt(mats, 0.65, 0.85);
    art.position.set(ft(24.5), ft(13.6), -ft(42.05));
    zone.add(art);
    // Soft sheers flanking north openings (inset from wall face)
    const c1 = sheerCurtain(1.0, 1.9);
    c1.position.set(ft(18.2), ft(12.3), -ft(41.9));
    const c2 = sheerCurtain(1.0, 1.9);
    c2.position.set(ft(29.0), ft(12.3), -ft(41.9));
    zone.add(c1, c2);
    for (const ox of [-0.85, 0.85]) {
      const pen = pendantFixture(mats, emissives, 0.42);
      pen.position.set(ft(24.5) + ox, ft(19.4), -ft(37.0));
      zone.add(pen);
    }
    shadow(zone);
    upper.add(zone);
    addCeilingLuminaire(upper, mats, 24.5, 19.9, 36.5, lights, emissives, 0.36, true);
    addCeilingLuminaire(upper, mats, 37.5, 19.5, 35, lights, emissives, 0.26);
  }

  // ========== TERRACE (14–24 × -4–0) @ +10.5' ==========
  {
    const zone = new THREE.Group();
    const lounger = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 1.55), linen);
    lounger.position.set(ft(17.2), ft(10.65), -ft(-2.0));
    zone.add(lounger);
    const lounger2 = lounger.clone();
    lounger2.position.set(ft(19.5), ft(10.65), -ft(-2.0));
    zone.add(lounger2);
    const table = sideTable(mats);
    table.position.set(ft(18.35), ft(10.5), -ft(-1.3));
    zone.add(table);
    const p = planter(mats, 0.9);
    p.position.set(ft(21.8), ft(10.5), -ft(-2.1));
    const p2 = planter(mats, 0.85);
    p2.position.set(ft(15.5), ft(10.5), -ft(-2.1));
    zone.add(p, p2);
    shadow(zone);
    upper.add(zone);
    addCeilingLuminaire(upper, mats, 19, 19.5, -2, lights, emissives, 0.24);
  }

  addCeilingLuminaire(root, mats, 21, 15.5, 15.3, lights, emissives, 0.28);
  addCeilingLuminaire(root, mats, 21, 9.9, 15.3, lights, emissives, 0.24);
  addCeilingLuminaire(upper, mats, 21, 19.9, 15.3, lights, emissives, 0.24);

  const setDayScale = (scale: number) => {
    for (const l of lights) {
      if (l.userData.base == null) l.userData.base = l.intensity;
      l.intensity = l.userData.base * scale;
    }
    for (const m of emissives) {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat.userData.base == null) mat.userData.base = mat.emissiveIntensity;
      mat.emissiveIntensity = mat.userData.base * Math.max(0.18, scale);
    }
  };

  setDayScale(1);
  return { lights, emissives, setDayScale };
}
