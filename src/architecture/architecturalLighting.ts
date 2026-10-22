/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Fixture meshes for night/golden cues. Daytime intensity scale should be ~0
 * so interiors are not flooded by emissives + fill lights.
 */

import * as THREE from 'three';
import { ft } from './blueprintData';
import type { ArchitecturalMaterialSet } from './materialsAndBuilder';

export interface ArchitecturalLightingHandles {
  root: THREE.Group;
  spotLights: THREE.SpotLight[];
  pointLights: THREE.PointLight[];
  emissiveMeshes: THREE.Mesh[];
  setIntensityScale: (scale: number) => void;
}

function makeBulbMesh(color = 0xffe0a8, intensity = 0.35): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xf5e6c8,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.55,
      metalness: 0.05,
    })
  );
}

function blackMat(mats: ArchitecturalMaterialSet): THREE.MeshStandardMaterial {
  const m = mats.blackMetal.clone();
  m.color.setHex(0x1a1c20);
  return m;
}

function buildSconce(
  mats: ArchitecturalMaterialSet,
  gx: number,
  gy: number,
  gz: number,
  face: 'south' | 'north' | 'east' | 'west'
): { group: THREE.Group; emissives: THREE.Mesh[] } {
  const group = new THREE.Group();
  group.position.set(ft(gx), ft(gy), -ft(gz));

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.26, 10),
    blackMat(mats)
  );
  group.add(body);

  const topBulb = makeBulbMesh(0xffd29a, 0.45);
  topBulb.position.y = 0.15;
  const botBulb = makeBulbMesh(0xffd29a, 0.45);
  botBulb.position.y = -0.15;
  group.add(topBulb, botBulb);

  const normal = {
    south: new THREE.Vector3(0, 0, 1),
    north: new THREE.Vector3(0, 0, -1),
    east: new THREE.Vector3(1, 0, 0),
    west: new THREE.Vector3(-1, 0, 0),
  }[face];
  group.position.add(normal.clone().multiplyScalar(0.1));

  return { group, emissives: [topBulb, botBulb] };
}

function buildSoffitPot(
  gx: number,
  gy: number,
  gz: number
): { group: THREE.Group; emissives: THREE.Mesh[] } {
  const group = new THREE.Group();
  group.position.set(ft(gx), ft(gy), -ft(gz));

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.09, 16),
    new THREE.MeshStandardMaterial({
      color: 0x22252b,
      metalness: 0.8,
      roughness: 0.35,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const lens = makeBulbMesh(0xffe4b5, 0.55);
  lens.scale.setScalar(0.85);
  lens.position.y = -0.02;
  group.add(lens);

  return { group, emissives: [lens] };
}

export function buildArchitecturalLighting(
  mats: ArchitecturalMaterialSet
): ArchitecturalLightingHandles {
  const root = new THREE.Group();
  root.name = 'architectural_lighting';
  const spotLights: THREE.SpotLight[] = [];
  const pointLights: THREE.PointLight[] = [];
  const emissiveMeshes: THREE.Mesh[] = [];

  const sconces: Array<[number, number, number, 'south' | 'north' | 'east' | 'west']> = [
    [16.5, 7.2, 0.15, 'south'],
    [21.5, 7.2, 0.15, 'south'],
    [24.2, 6.5, 4, 'east'],
    [13.85, 7.0, 24.5, 'west'],
    [26.8, 6.8, 20.5, 'west'],
    [28.2, 7.0, 24.75, 'east'],
    [14.2, 6.8, 36, 'east'],
    [16.5, 16.8, 0.15, 'south'],
    [21, 16.8, 42.9, 'north'],
    [18, 16.5, 22, 'south'],
    [24, 16.5, 36.5, 'north'],
  ];
  for (const [gx, gy, gz, face] of sconces) {
    const b = buildSconce(mats, gx, gy, gz, face);
    root.add(b.group);
    emissiveMeshes.push(...b.emissives);
  }

  const soffits: Array<[number, number, number]> = [
    [19, 9.15, -2.2],
    [29, 9.35, 2],
    [29, 9.35, 7],
    [21, 9.2, 15.3],
    [33, 9.2, 24.75],
    [19, 20.55, -2],
    [21, 20.55, 44],
    [24, 20.4, 36.5],
    [19, 20.4, 6],
  ];
  for (const [gx, gy, gz] of soffits) {
    const b = buildSoffitPot(gx, gy, gz);
    root.add(b.group);
    emissiveMeshes.push(...b.emissives);
  }

  // One gentle fill only (second fill removed — was flooding interiors)
  const pt = new THREE.PointLight(0xffe0b8, 0.55, 16, 2);
  pt.position.set(ft(22), ft(8.5), -ft(18));
  root.add(pt);
  pointLights.push(pt);

  const ledStrip = new THREE.Mesh(
    new THREE.BoxGeometry(ft(24), 0.03, 0.035),
    new THREE.MeshStandardMaterial({
      color: 0xe8dcc0,
      emissive: 0xffb86b,
      emissiveIntensity: 0.4,
    })
  );
  ledStrip.position.set(ft(20), ft(20.55), -ft(-4.4));
  root.add(ledStrip);
  emissiveMeshes.push(ledStrip);

  const setIntensityScale = (scale: number) => {
    const visible = scale > 0.05;
    root.visible = visible || scale > 0; // keep geometry; lights scale to 0
    for (const p of pointLights) {
      if (p.userData.baseIntensity == null) p.userData.baseIntensity = p.intensity;
      p.intensity = p.userData.baseIntensity * scale;
      p.visible = scale > 0.05;
    }
    for (const m of emissiveMeshes) {
      const mat = m.material as THREE.MeshStandardMaterial;
      if (mat.userData.baseEmissive == null) {
        mat.userData.baseEmissive = mat.emissiveIntensity;
      }
      mat.emissiveIntensity = mat.userData.baseEmissive * Math.max(0, scale);
    }
  };

  setIntensityScale(0); // default: daytime = fixtures off
  return { root, spotLights, pointLights, emissiveMeshes, setIntensityScale };
}
