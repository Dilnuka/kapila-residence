/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Procedural PBR Material Library, Multi-Part 3D Architectural & Furniture Builders,
 * and Web Audio Synthesizer for the Kapila Residence 3D Twin.
 */

import * as THREE from 'three';
import {
  ARCHITECTURAL_ROOMS,
  CatalogItemType,
  DoorSpec,
  FT_TO_M,
  ft,
} from './blueprintData';
import { ARCHITECTURAL_WALLS, WallSegment } from './spatialEngine';
import { buildExteriorStructure, buildKapilaRoofSystem } from './roofSystem';
import {
  buildArchitecturalLighting,
  type ArchitecturalLightingHandles,
} from './architecturalLighting';
import {
  buildRoomInteriors,
  type InteriorLightingHandles,
} from './roomInteriors';

// ==================== PROCEDURAL WEB AUDIO SYNTH ====================
let audioCtx: AudioContext | null = null;

export function playArchitecturalSound(
  type: 'step' | 'door_open' | 'door_close' | 'place' | 'grab' | 'switch',
  muted: boolean = false
): void {
  if (muted || typeof window === 'undefined') return;
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'step') {
      osc.type = 'triangle';
      const baseFreq = 95 + (Math.random() - 0.5) * 14;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.06);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'door_open' || type === 'door_close') {
      osc.type = 'sine';
      const startF = type === 'door_open' ? 180 : 240;
      const endF = type === 'door_open' ? 260 : 140;
      osc.frequency.setValueAtTime(startF, now);
      osc.frequency.exponentialRampToValueAtTime(endF, now + 0.16);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (type === 'place') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'grab' || type === 'switch') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.065);
    }
  } catch {
    // Ignore audio errors on restricted autoplay
  }
}

// ==================== PROCEDURAL PBR TEXTURES ====================
export interface ArchitecturalMaterialSet {
  wallInterior: THREE.MeshStandardMaterial;
  wallExterior: THREE.MeshStandardMaterial;
  wallFeatureStone: THREE.MeshStandardMaterial;
  teakFloor: THREE.MeshStandardMaterial;
  porcelainFloor: THREE.MeshStandardMaterial;
  terracottaFloor: THREE.MeshStandardMaterial;
  graniteFloor: THREE.MeshStandardMaterial;
  nonslipTileFloor: THREE.MeshStandardMaterial;
  paverFloor: THREE.MeshStandardMaterial;
  grassTerrain: THREE.MeshStandardMaterial;
  asphaltRoad: THREE.MeshStandardMaterial;
  teakTimber: THREE.MeshStandardMaterial;
  darkWalnut: THREE.MeshStandardMaterial;
  brushedSteel: THREE.MeshStandardMaterial;
  brushedBrass: THREE.MeshStandardMaterial;
  architecturalGlass: THREE.MeshPhysicalMaterial;
  frostedGlass: THREE.MeshStandardMaterial;
  fabricCream: THREE.MeshStandardMaterial;
  fabricCharcoal: THREE.MeshStandardMaterial;
  fabricTerracotta: THREE.MeshStandardMaterial;
  foliageGreen: THREE.MeshStandardMaterial;
  roofTileMat: THREE.MeshStandardMaterial;
  roofMembrane: THREE.MeshStandardMaterial;
  concreteRaw: THREE.MeshStandardMaterial;
  whitePlaster: THREE.MeshStandardMaterial;
  darkPolishedStone: THREE.MeshStandardMaterial;
  woodSoffit: THREE.MeshStandardMaterial;
  blackMetal: THREE.MeshStandardMaterial;
  ledgerStone: THREE.MeshStandardMaterial;
}

function createProceduralCanvasTexture(
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  maxAnisotropy: number,
  repeatX: number = 4,
  repeatY: number = 4,
  isColor: boolean = true,
  size: number = 256
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  drawFn(ctx, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export function createArchitecturalMaterials(
  renderer: THREE.WebGLRenderer,
  isSoftwareGl: boolean
): ArchitecturalMaterialSet {
  const maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  // 1. Ceylon Teak Wood Grain Texture
  const teakTex = createProceduralCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#9c6234';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const y = (i * h) / 90 + Math.sin(i * 0.7) * 1.5;
        ctx.fillStyle =
          i % 3 === 0 ? 'rgba(55, 28, 10, 0.14)' : 'rgba(220, 170, 110, 0.1)';
        ctx.fillRect(0, y, w, 2 + (i % 3));
      }
      ctx.strokeStyle = 'rgba(40, 18, 6, 0.5)';
      ctx.lineWidth = 3;
      for (let y = 0; y < h; y += 85) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + 2);
        ctx.stroke();
      }
    },
    maxAniso,
    5,
    5
  );

  // 2. Polished Porcelain Tile Texture
  const porcelainTex = createProceduralCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#f0ebe3';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(170, 160, 145, 0.35)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 30 + i * 70);
        ctx.bezierCurveTo(w * 0.3, 10 + i * 40, w * 0.7, 90 + i * 30, w, 40 + i * 50);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(140, 132, 120, 0.55)';
      ctx.lineWidth = 4;
      ctx.strokeRect(3, 3, w - 6, h - 6);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(18, 18, w * 0.35, h * 0.2);
    },
    maxAniso,
    7,
    7
  );

  // 3. Terracotta Verandah & Balcony Tile
  const terracottaTex = createProceduralCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#b95c3c';
      ctx.fillRect(0, 0, w, h);
      const cell = w / 2;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#c46845' : '#a85232';
          ctx.fillRect(c * cell + 4, r * cell + 4, cell - 8, cell - 8);
          ctx.strokeStyle = '#6e3011';
          ctx.lineWidth = 5;
          ctx.strokeRect(c * cell + 2, r * cell + 2, cell - 4, cell - 4);
        }
      }
    },
    maxAniso,
    5,
    5
  );

  // 4. Exterior Architectural Stone Cladding
  const stoneTex = createProceduralCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#7d786f';
      ctx.fillRect(0, 0, w, h);
      const colors = ['#6b665e', '#8e887e', '#5e5a52', '#999287', '#747069'];
      const rows = 12;
      const rowH = h / rows;
      for (let r = 0; r < rows; r++) {
        const y = r * rowH;
        const cols = 5;
        const colW = w / cols;
        for (let c = 0; c < cols; c++) {
          const x = c * colW + (r % 2 === 0 ? 0 : colW * 0.5);
          ctx.fillStyle = colors[(r + c) % colors.length];
          ctx.fillRect((x % w) + 2, y + 2, colW - 4, rowH - 4);
          ctx.strokeStyle = 'rgba(40,38,34,0.35)';
          ctx.strokeRect((x % w) + 2, y + 2, colW - 4, rowH - 4);
        }
      }
    },
    maxAniso,
    3,
    2
  );

  // 5. Grass / lawn detail
  const grassTex = createProceduralCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#3a6b34';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1200; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.strokeStyle =
          Math.random() > 0.5 ? 'rgba(70, 120, 55, 0.55)' : 'rgba(30, 70, 30, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 6 - Math.random() * 8);
        ctx.stroke();
      }
    },
    maxAniso,
    10,
    10
  );

  // 6. Roof membrane / waterproofing sheet
  const membraneTex = createProceduralCanvasTexture(
    (ctx, w, h) => {
      ctx.fillStyle = '#5c5f66';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(30, 32, 36, 0.45)';
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = 0; x < w; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
    },
    maxAniso,
    8,
    8
  );

  // 7. Clay roof sheet corrugation accent
  const clayRoofTex = createProceduralCanvasTexture(
    (ctx, w, h) => {
      for (let x = 0; x < w; x++) {
        const shade = 110 + Math.sin(x * 0.35) * 18;
        ctx.fillStyle = `rgb(${shade + 40},${shade - 20},${shade - 40})`;
        ctx.fillRect(x, 0, 1, h);
      }
      ctx.fillStyle = 'rgba(60, 25, 15, 0.25)';
      for (let y = 40; y < h; y += 48) {
        ctx.fillRect(0, y, w, 3);
      }
    },
    maxAniso,
    6,
    3
  );

  return {
    wallInterior: new THREE.MeshStandardMaterial({
      color: 0xd4d0c6,
      roughness: 0.9,
      metalness: 0.0,
      envMapIntensity: 0.3,
    }),
    wallExterior: new THREE.MeshStandardMaterial({
      color: 0xd8d4ca,
      roughness: 0.88,
      metalness: 0.0,
      envMapIntensity: 0.3,
    }),
    wallFeatureStone: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: stoneTex,
      roughness: 0.9,
      metalness: 0.04,
    }),
    teakFloor: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: teakTex,
      roughness: 0.34,
      metalness: 0.06,
    }),
    porcelainFloor: new THREE.MeshStandardMaterial({
      color: 0xe8e4dc,
      map: porcelainTex,
      roughness: 0.35,
      metalness: 0.06,
      envMapIntensity: 0.4,
    }),
    terracottaFloor: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: terracottaTex,
      roughness: 0.62,
      metalness: 0.04,
    }),
    graniteFloor: new THREE.MeshStandardMaterial({
      color: 0x3b3d40,
      roughness: 0.26,
      metalness: 0.18,
    }),
    nonslipTileFloor: new THREE.MeshStandardMaterial({
      color: 0xcbd5d8,
      roughness: 0.55,
      metalness: 0.05,
    }),
    paverFloor: new THREE.MeshStandardMaterial({
      color: 0x8c8881,
      roughness: 0.82,
      metalness: 0.04,
    }),
    grassTerrain: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: grassTex,
      roughness: 0.95,
      metalness: 0.0,
    }),
    asphaltRoad: new THREE.MeshStandardMaterial({
      color: 0x2a2d33,
      roughness: 0.9,
      metalness: 0.04,
    }),
    teakTimber: new THREE.MeshStandardMaterial({
      color: 0x8b4f28,
      map: teakTex,
      roughness: 0.4,
      metalness: 0.07,
    }),
    darkWalnut: new THREE.MeshStandardMaterial({
      color: 0x3d2314,
      roughness: 0.35,
      metalness: 0.1,
    }),
    brushedSteel: new THREE.MeshStandardMaterial({
      color: 0xd0d5dd,
      roughness: 0.22,
      metalness: 0.88,
    }),
    brushedBrass: new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.9,
    }),
    architecturalGlass: new THREE.MeshPhysicalMaterial({
      color: 0xa8c0ce,
      metalness: 0.0,
      roughness: 0.18,
      transmission: isSoftwareGl ? 0 : 0.28,
      transparent: true,
      opacity: isSoftwareGl ? 0.4 : 0.62,
      ior: 1.5,
      thickness: 0.05,
      envMapIntensity: 0.28,
      specularIntensity: 0.45,
      clearcoat: 0.08,
      clearcoatRoughness: 0.25,
      depthWrite: false,
    }),
    frostedGlass: new THREE.MeshStandardMaterial({
      color: 0xe2eef2,
      roughness: 0.45,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
    fabricCream: new THREE.MeshStandardMaterial({
      color: 0xeae3d5,
      roughness: 0.88,
      metalness: 0.0,
    }),
    fabricCharcoal: new THREE.MeshStandardMaterial({
      color: 0x343840,
      roughness: 0.84,
      metalness: 0.0,
    }),
    fabricTerracotta: new THREE.MeshStandardMaterial({
      color: 0xc86446,
      roughness: 0.82,
      metalness: 0.0,
    }),
    foliageGreen: new THREE.MeshStandardMaterial({
      color: 0x2e6b3e,
      roughness: 0.68,
      metalness: 0.02,
    }),
    roofTileMat: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: clayRoofTex,
      roughness: 0.7,
      metalness: 0.08,
    }),
    roofMembrane: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: membraneTex,
      roughness: 0.78,
      metalness: 0.12,
    }),
    concreteRaw: new THREE.MeshStandardMaterial({
      color: 0xc8c4bb,
      roughness: 0.92,
      metalness: 0.03,
    }),
    // Hyper-real archviz facade language from references
    whitePlaster: new THREE.MeshStandardMaterial({
      color: 0xd8d4cc,
      roughness: 0.88,
      metalness: 0.0,
      envMapIntensity: 0.35,
    }),
    // note: wallInterior kept slightly warmer/darker than pure white to avoid washout
    darkPolishedStone: new THREE.MeshStandardMaterial({
      color: 0x2a2d33,
      roughness: 0.22,
      metalness: 0.35,
    }),
    woodSoffit: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: teakTex,
      roughness: 0.55,
      metalness: 0.05,
    }),
    blackMetal: new THREE.MeshStandardMaterial({
      color: 0x15171c,
      roughness: 0.4,
      metalness: 0.85,
    }),
    ledgerStone: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: stoneTex,
      roughness: 0.85,
      metalness: 0.04,
    }),
  };
}

// ==================== COMPOSITE 3-12 PART PROCEDURAL PROP BUILDER ====================
export function createCatalogPropMesh(
  type: CatalogItemType,
  mats: ArchitecturalMaterialSet
): THREE.Group {
  const group = new THREE.Group();

  if (type === 'teak_armchair') {
    const baseFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.08, 0.78),
      mats.teakTimber
    );
    baseFrame.position.y = 0.38;
    baseFrame.castShadow = true;
    group.add(baseFrame);

    const seatCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.14, 0.7),
      mats.fabricCream
    );
    seatCushion.position.set(0, 0.48, 0.02);
    group.add(seatCushion);

    const lumbar = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.12, 0.08),
      mats.fabricTerracotta
    );
    lumbar.position.set(0, 0.62, -0.28);
    group.add(lumbar);

    const backRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.52, 0.1),
      mats.fabricCream
    );
    backRest.position.set(0, 0.78, -0.3);
    backRest.rotation.x = -0.16;
    group.add(backRest);

    const backSlats = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.48, 0.04),
      mats.teakTimber
    );
    backSlats.position.set(0, 0.78, -0.36);
    backSlats.rotation.x = -0.16;
    group.add(backSlats);

    const legGeo = new THREE.CylinderGeometry(0.028, 0.018, 0.38, 10);
    for (const [lx, lz] of [
      [-0.34, -0.33],
      [0.34, -0.33],
      [-0.34, 0.33],
      [0.34, 0.33],
    ]) {
      const leg = new THREE.Mesh(legGeo, mats.teakTimber);
      leg.position.set(lx, 0.19, lz);
      leg.castShadow = true;
      group.add(leg);
    }
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.05, 0.74),
        mats.teakTimber
      );
      arm.position.set(side * 0.38, 0.6, 0);
      group.add(arm);
      const armSupport = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.28, 8),
        mats.teakTimber
      );
      armSupport.position.set(side * 0.38, 0.48, 0.28);
      group.add(armSupport);
    }
  } else if (type === 'tropical_planter') {
    // 1. Primary: Ribbed ceramic/brass pot
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.18, 0.42, 16),
      mats.wallInterior
    );
    pot.position.y = 0.25;
    group.add(pot);

    // 2. Secondary: Brass stand legs + dark soil disc
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.018, 8, 24),
      mats.brushedBrass
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.46;
    group.add(rim);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.04, 12),
      mats.darkWalnut
    );
    soil.position.y = 0.44;
    group.add(soil);

    // 3. Accent: 6 layered tropical leaves fanning out
    const leafGeo = new THREE.SphereGeometry(0.18, 8, 6);
    leafGeo.scale(0.65, 0.12, 1.35);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const stemH = 0.35 + (i % 2) * 0.12;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.014, stemH, 6),
        mats.foliageGreen
      );
      stem.position.set(Math.cos(angle) * 0.05, 0.45 + stemH * 0.5, Math.sin(angle) * 0.05);
      stem.rotation.z = Math.cos(angle) * 0.25;
      stem.rotation.x = Math.sin(angle) * 0.25;
      group.add(stem);

      const leaf = new THREE.Mesh(leafGeo, mats.foliageGreen);
      leaf.position.set(
        Math.cos(angle) * 0.18,
        0.52 + stemH * 0.7,
        Math.sin(angle) * 0.18
      );
      leaf.rotation.y = -angle + Math.PI / 2;
      leaf.rotation.x = 0.35;
      group.add(leaf);
    }
  } else if (type === 'floor_lamp') {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.04, 20),
      mats.brushedBrass
    );
    base.position.y = 0.02;
    group.add(base);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 1.5, 10),
      mats.brushedBrass
    );
    pole.position.y = 0.77;
    group.add(pole);

    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.26, 0.32, 20, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xf0e2c4,
        emissive: 0xffb84d,
        emissiveIntensity: 0.12,
        roughness: 0.7,
        side: THREE.DoubleSide,
      })
    );
    shade.position.y = 1.52;
    group.add(shade);
  } else if (type === 'coffee_table') {
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 0.05, 24),
      mats.porcelainFloor
    );
    top.position.y = 0.42;
    group.add(top);

    const underShelf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.03, 20),
      mats.teakTimber
    );
    underShelf.position.y = 0.18;
    group.add(underShelf);

    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.016, 0.4, 8),
        mats.teakTimber
      );
      leg.position.set(Math.cos(a) * 0.38, 0.2, Math.sin(a) * 0.38);
      group.add(leg);
    }
  } else if (type === 'study_desk') {
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.65),
      mats.teakTimber
    );
    top.position.y = 0.74;
    group.add(top);

    const drawerBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.28, 0.58),
      mats.darkWalnut
    );
    drawerBox.position.set(0.38, 0.57, 0);
    group.add(drawerBox);

    const legPositions = [
      [-0.55, -0.28],
      [-0.55, 0.28],
      [0.55, -0.28],
      [0.55, 0.28],
    ];
    for (const [lx, lz] of legPositions) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.72, 0.04),
        mats.brushedSteel
      );
      leg.position.set(lx, 0.36, lz);
      group.add(leg);
    }
  } else if (type === 'bookshelf_unit') {
    for (const sx of [-0.46, 0.46]) {
      const upright = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 1.68, 0.36),
        mats.darkWalnut
      );
      upright.position.set(sx, 0.84, 0);
      group.add(upright);
    }
    for (let s = 0; s < 5; s++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 0.03, 0.36),
        mats.teakTimber
      );
      shelf.position.set(0, 0.12 + s * 0.38, 0);
      group.add(shelf);
    }
  } else if (type === 'ceramic_vase') {
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12),
      mats.fabricTerracotta
    );
    body.scale.set(1, 1.45, 1);
    body.position.y = 0.23;
    group.add(body);

    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 0.16, 14),
      mats.fabricTerracotta
    );
    neck.position.y = 0.48;
    group.add(neck);

    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(0.065, 0.012, 8, 16),
      mats.brushedBrass
    );
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 0.56;
    group.add(lip);
  } else {
    // lounge_ottoman
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.28, 0.08, 20),
      mats.teakTimber
    );
    base.position.y = 0.04;
    group.add(base);

    const cushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.34, 24),
      mats.fabricCream
    );
    cushion.position.y = 0.24;
    group.add(cushion);

    const piping = new THREE.Mesh(
      new THREE.TorusGeometry(0.315, 0.012, 8, 24),
      mats.fabricTerracotta
    );
    piping.rotation.x = Math.PI / 2;
    piping.position.y = 0.4;
    group.add(piping);
  }

  // Soft contact shadow disc at y = 0.01m
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 16),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.01;
  group.add(shadowDisc);

  return group;
}

// ==================== ARCHITECTURAL HOUSE & SITE SCENE BUILDER ====================
export interface BuiltHouseHandles {
  rootGroup: THREE.Group;
  groundFloorGroup: THREE.Group;
  firstFloorGroup: THREE.Group;
  roofGroup: THREE.Group;
  doorPivots: Map<string, THREE.Group>;
  ceilingFans: THREE.Group[];
  roomLightMeshes: THREE.Mesh[];
  interiorPointLights: THREE.PointLight[];
  archLighting: ArchitecturalLightingHandles;
  interiorLighting: InteriorLightingHandles;
}

/**
 * Helper to build a single wall segment with accurate window/door cutouts.
 */
function buildWallSegmentGroup(
  wall: WallSegment,
  mats: ArchitecturalMaterialSet
): THREE.Group {
  const wg = new THREE.Group();
  const isHorizontal = Math.abs(wall.gz1 - wall.gz2) < 0.01;
  const startCoord = isHorizontal
    ? Math.min(wall.gx1, wall.gx2)
    : Math.min(wall.gz1, wall.gz2);
  const endCoord = isHorizontal
    ? Math.max(wall.gx1, wall.gx2)
    : Math.max(wall.gz1, wall.gz2);
  const fixedCoord = isHorizontal ? wall.gz1 : wall.gx1;
  // White plaster exterior language (archviz references); soft interior plaster indoors
  const wallMat = wall.isGlass
    ? mats.architecturalGlass
    : wall.isRailing
      ? mats.architecturalGlass
      : wall.floor === 'first' || wall.floor === 'ground'
        ? mats.whitePlaster
        : mats.wallExterior;
  const thickM = wall.thicknessFt * FT_TO_M;
  const baseM = wall.baseFt * FT_TO_M;
  const fullHeightM = wall.heightFt * FT_TO_M;

  // Sort openings along axis
  const ops = [...(wall.openings || [])].sort((a, b) => a.minFt - b.minFt);

  const addSpanBox = (
    spanMinFt: number,
    spanMaxFt: number,
    yBottomFt: number,
    yTopFt: number,
    mat: THREE.Material
  ) => {
    const lenFt = spanMaxFt - spanMinFt;
    if (lenFt <= 0.05 || yTopFt - yBottomFt <= 0.05) return;
    const lenM = lenFt * FT_TO_M;
    const hM = (yTopFt - yBottomFt) * FT_TO_M;
    const midSpanFt = (spanMinFt + spanMaxFt) * 0.5;
    const midY = baseM + (yBottomFt + yTopFt) * 0.5 * FT_TO_M;

    const geo = isHorizontal
      ? new THREE.BoxGeometry(lenM, hM, thickM)
      : new THREE.BoxGeometry(thickM, hM, lenM);
    const mesh = new THREE.Mesh(geo, mat);
    if (isHorizontal) {
      mesh.position.set(midSpanFt * FT_TO_M, midY, -fixedCoord * FT_TO_M);
    } else {
      mesh.position.set(fixedCoord * FT_TO_M, midY, -midSpanFt * FT_TO_M);
    }
    mesh.castShadow = !wall.isGlass;
    mesh.receiveShadow = true;
    wg.add(mesh);
  };

  if (wall.isRailing) {
    // Glass balustrade with slim black metal handrail (archviz language)
    addSpanBox(startCoord, endCoord, 0.1, wall.heightFt - 0.15, mats.architecturalGlass);
    addSpanBox(startCoord, endCoord, wall.heightFt - 0.15, wall.heightFt, mats.blackMetal);
    return wg;
  }

  let cursor = startCoord;
  for (const op of ops) {
    const opMin = Math.max(startCoord, op.minFt);
    const opMax = Math.min(endCoord, op.maxFt);
    if (opMin > cursor) {
      addSpanBox(cursor, opMin, 0, wall.heightFt, wallMat);
    }
    const sillFt = op.sillFt ?? 0;
    // Sill wall below window
    if (sillFt > 0.05) {
      addSpanBox(opMin, opMax, 0, sillFt, wallMat);
    }
    // Header lintel wall above door/window
    if (op.headFt < wall.heightFt) {
      addSpanBox(opMin, opMax, op.headFt, wall.heightFt, wallMat);
    }
    // Timber jamb frame around opening
    addSpanBox(opMin, opMin + 0.15, sillFt, op.headFt, mats.teakTimber);
    addSpanBox(opMax - 0.15, opMax, sillFt, op.headFt, mats.teakTimber);

    // Window: recessed glass pane, mullions, and projecting sill for depth
    if (op.windowCode && !op.doorId) {
      addSpanBox(opMin + 0.15, opMax - 0.15, sillFt + 0.1, op.headFt - 0.1, mats.architecturalGlass);
      addSpanBox(opMin, opMax, sillFt, sillFt + 0.12, mats.teakTimber);
      addSpanBox(opMin, opMax, op.headFt - 0.12, op.headFt, mats.teakTimber);
      // Mid mullion
      const mid = (opMin + opMax) * 0.5;
      addSpanBox(mid - 0.08, mid + 0.08, sillFt + 0.12, op.headFt - 0.12, mats.teakTimber);
      // Projecting exterior sill ledge
      const sillLen = opMax - opMin;
      const sillMesh = new THREE.Mesh(
        isHorizontal
          ? new THREE.BoxGeometry(sillLen * FT_TO_M, 0.05, wall.thicknessFt * FT_TO_M + 0.08)
          : new THREE.BoxGeometry(wall.thicknessFt * FT_TO_M + 0.08, 0.05, sillLen * FT_TO_M),
        mats.concreteRaw
      );
      const midSpan = (opMin + opMax) * 0.5;
      const sillY = baseM + (sillFt + 0.04) * FT_TO_M;
      if (isHorizontal) {
        sillMesh.position.set(midSpan * FT_TO_M, sillY, -fixedCoord * FT_TO_M);
      } else {
        sillMesh.position.set(fixedCoord * FT_TO_M, sillY, -midSpan * FT_TO_M);
      }
      wg.add(sillMesh);
    }

    cursor = opMax;
  }

  if (cursor < endCoord) {
    addSpanBox(cursor, endCoord, 0, wall.heightFt, wallMat);
  }

  // Timber baseboard skirting along solid spans
  if (!wall.isGlass) {
    addSpanBox(startCoord, endCoord, 0, 0.25, mats.teakTimber);
  }

  return wg;
}

/**
 * Build an interactive hinged door assembly (`D1`, `D2`, `D3`, `DW1`, `DW2`, `DW3`).
 */
function buildInteractiveDoor(
  door: DoorSpec,
  mats: ArchitecturalMaterialSet
): THREE.Group {
  const pivot = new THREE.Group();
  const hingeX = door.gx * FT_TO_M;
  const hingeY = door.elevationFt * FT_TO_M;
  const hingeZ = -door.gz * FT_TO_M;
  pivot.position.set(hingeX, hingeY, hingeZ);

  const wM = door.widthFt * FT_TO_M;
  const hM = door.heightFt * FT_TO_M;
  const leafGroup = new THREE.Group();

  // Door leaf offset from hinge
  const panelMat = door.isGlassDoor ? mats.architecturalGlass : mats.teakTimber;
  const leafGeo =
    door.axis === 'x'
      ? new THREE.BoxGeometry(wM, hM, 0.055)
      : new THREE.BoxGeometry(0.055, hM, wM);
  const leafMesh = new THREE.Mesh(leafGeo, panelMat);
  if (door.axis === 'x') {
    leafMesh.position.set(wM * 0.5, hM * 0.5, 0);
  } else {
    leafMesh.position.set(0, hM * 0.5, -wM * 0.5);
  }
  leafGroup.add(leafMesh);

  // Outer timber stile frame + brushed brass lever handle
  const stileGeo =
    door.axis === 'x'
      ? new THREE.BoxGeometry(wM, 0.12, 0.068)
      : new THREE.BoxGeometry(0.068, 0.12, wM);
  const topStile = new THREE.Mesh(stileGeo, mats.darkWalnut);
  const botStile = new THREE.Mesh(stileGeo, mats.darkWalnut);
  if (door.axis === 'x') {
    topStile.position.set(wM * 0.5, hM - 0.06, 0);
    botStile.position.set(wM * 0.5, 0.06, 0);
  } else {
    topStile.position.set(0, hM - 0.06, -wM * 0.5);
    botStile.position.set(0, 0.06, -wM * 0.5);
  }
  leafGroup.add(topStile, botStile);

  // Brass door handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.03, 0.14),
    mats.brushedBrass
  );
  if (door.axis === 'x') {
    handle.position.set(wM * 0.85, 1.02, 0);
  } else {
    handle.position.set(0, 1.02, -wM * 0.85);
  }
  leafGroup.add(handle);

  pivot.add(leafGroup);
  pivot.rotation.y = door.isOpen ? door.swingDir * (Math.PI * 0.48) : 0;
  return pivot;
}

/**
 * Build the complete 2-Story Kapila Residence + Outdoor Site, Gardens, Car Porch Vehicle,
 * Dog-leg Staircase, Built-in Furniture, and Room Fixtures.
 */
export function buildCompleteKapilaResidence(
  mats: ArchitecturalMaterialSet,
  doors: DoorSpec[]
): BuiltHouseHandles {
  const rootGroup = new THREE.Group();
  const groundFloorGroup = new THREE.Group();
  const firstFloorGroup = new THREE.Group();
  const roofGroup = new THREE.Group();
  const doorPivots = new Map<string, THREE.Group>();
  const ceilingFans: THREE.Group[] = [];
  const roomLightMeshes: THREE.Mesh[] = [];
  const interiorPointLights: THREE.PointLight[] = [];

  rootGroup.add(groundFloorGroup, firstFloorGroup, roofGroup);

  // ==================== 1. SITE TERRAIN, 6.6m ROAD, DRAIN & BOUNDARY WALLS ====================
  const lawnMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(65, 65),
    mats.grassTerrain
  );
  lawnMesh.rotation.x = -Math.PI / 2;
  lawnMesh.position.set(ft(20), -0.02, -ft(15));
  lawnMesh.receiveShadow = true;
  rootGroup.add(lawnMesh);

  // 6.6m Wide Southern Access Road & Storm Drain (at gz = -22'-7" to -44')
  const roadMesh = new THREE.Mesh(
    new THREE.BoxGeometry(64, 0.08, 6.6),
    mats.asphaltRoad
  );
  roadMesh.position.set(ft(20), 0.01, ft(33));
  roadMesh.receiveShadow = true;
  rootGroup.add(roadMesh);

  // Concrete storm drain channel along North side of the 6.6m road (gz = -22.5')
  const drainMesh = new THREE.Mesh(
    new THREE.BoxGeometry(ft(62), 0.14, 0.45),
    mats.paverFloor
  );
  drainMesh.position.set(ft(20), 0.04, ft(22.5));
  rootGroup.add(drainMesh);

  // Driveway connecting 6.6m Road to Car Porch (gx = 24..34, gz = -22.5..-4)
  const drivewayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(ft(10), 0.08, ft(19)),
    mats.paverFloor
  );
  drivewayMesh.position.set(ft(29), 0.05, ft(13));
  drivewayMesh.receiveShadow = true;
  rootGroup.add(drivewayMesh);

  // Stepping stone garden walkway from Road to Front Verandah (gx = 19, gz = -22..-4)
  for (let s = 0; s < 7; s++) {
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.06, 0.52),
      mats.porcelainFloor
    );
    stone.position.set(ft(19), 0.04, ft(5.5 + s * 2.5));
    rootGroup.add(stone);
  }

  // Angled Western Site Boundary Wall & Eastern Boundary Wall
  const eastBoundaryWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 1.85, ft(82)),
    mats.wallExterior
  );
  eastBoundaryWall.position.set(ft(45), 0.92, -ft(15));
  rootGroup.add(eastBoundaryWall);

  const northBoundaryWall = new THREE.Mesh(
    new THREE.BoxGeometry(ft(45), 1.85, 0.22),
    mats.wallExterior
  );
  northBoundaryWall.position.set(ft(22.5), 0.92, -ft(56));
  rootGroup.add(northBoundaryWall);

  // Septic Tank & Soakage Pit in NE Rear Space Garden (per Ground Floor Plan)
  const septicSlab = new THREE.Mesh(
    new THREE.BoxGeometry(ft(6.5), 0.12, ft(4.0)),
    mats.paverFloor
  );
  septicSlab.position.set(ft(36), 0.06, -ft(51));
  rootGroup.add(septicSlab);

  for (const offset of [-0.6, 0.6]) {
    const manhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16),
      mats.graniteFloor
    );
    manhole.position.set(ft(36) + offset, 0.08, -ft(51));
    rootGroup.add(manhole);
  }

  // Organic / Polythene / Glass Eco Waste Sorting Bins at NW Rear Corridor (per Plan)
  const binColors = [0x2e6b3e, 0xd97724, 0x2b6cb0];
  for (let b = 0; b < 3; b++) {
    const binGroup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.17, 0.55, 14),
      new THREE.MeshStandardMaterial({ color: binColors[b], roughness: 0.5 })
    );
    body.position.y = 0.28;
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.21, 0.05, 14),
      mats.darkWalnut
    );
    lid.position.y = 0.57;
    binGroup.add(body, lid);
    binGroup.position.set(ft(15.5 + b * 1.8), ft(0.5), -ft(44.5));
    groundFloorGroup.add(binGroup);
  }

  // ==================== 2. FLOOR SLABS BY ROOM & LEVEL ====================
  const getMatForRoom = (m: string) => {
    switch (m) {
      case 'teak':
        return mats.teakFloor;
      case 'porcelain':
        return mats.porcelainFloor;
      case 'terracotta':
        return mats.terracottaFloor;
      case 'granite':
        return mats.graniteFloor;
      case 'nonslip_tile':
        return mats.nonslipTileFloor;
      case 'paver':
        return mats.paverFloor;
      default:
        return mats.porcelainFloor;
    }
  };

  for (const room of ARCHITECTURAL_ROOMS) {
    if (room.id === 'outdoor_gardens') continue;
    const wM = (room.gxMax - room.gxMin) * FT_TO_M;
    const dM = (room.gzMax - room.gzMin) * FT_TO_M;
    const cxM = (room.gxMin + room.gxMax) * 0.5 * FT_TO_M;
    const czM = -(room.gzMin + room.gzMax) * 0.5 * FT_TO_M;
    const topY = room.elevationFt * FT_TO_M;
    const slabThick = 0.18;

    const slabMesh = new THREE.Mesh(
      new THREE.BoxGeometry(wM, slabThick, dM),
      getMatForRoom(room.floorMaterial)
    );
    slabMesh.position.set(cxM, topY - slabThick * 0.5, czM);
    slabMesh.receiveShadow = true;

    if (room.floor === 'first') {
      firstFloorGroup.add(slabMesh);
    } else {
      groundFloorGroup.add(slabMesh);
    }

    // Add Ceiling Fan & Warm Architectural Luminaire where specified
    if (room.lightPosFt) {
      const [lx, ly, lz] = room.lightPosFt;
      const worldX = lx * FT_TO_M;
      const worldY = ly * FT_TO_M;
      const worldZ = -lz * FT_TO_M;
      const targetGroup = room.floor === 'first' ? firstFloorGroup : groundFloorGroup;

      if (room.hasCeilingFan) {
        const fanGroup = new THREE.Group();
        fanGroup.position.set(worldX, worldY, worldZ);

        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8),
          mats.brushedBrass
        );
        rod.position.y = 0.17;
        fanGroup.add(rod);

        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.12, 0.08, 16),
          mats.brushedBrass
        );
        fanGroup.add(hub);

        const lampBowl = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 12, 8),
          new THREE.MeshStandardMaterial({
            color: 0xe8dcc8,
            emissive: 0xffc266,
            emissiveIntensity: 0.16,
            roughness: 0.65,
          })
        );
        lampBowl.position.y = -0.05;
        fanGroup.add(lampBowl);
        roomLightMeshes.push(lampBowl);

        for (let b = 0; b < 4; b++) {
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.58, 0.015, 0.12),
            mats.teakTimber
          );
          const angle = (b * Math.PI) / 2;
          blade.position.set(Math.cos(angle) * 0.36, 0, Math.sin(angle) * 0.36);
          blade.rotation.y = -angle;
          fanGroup.add(blade);
        }

        targetGroup.add(fanGroup);
        ceilingFans.push(fanGroup);
      }
    }
  }

  // First Floor Eastern Gallery Bridge across the Double-Height Void (gx = 35.5..38, gz = 18.75..30.75)
  const bridgeSlab = new THREE.Mesh(
    new THREE.BoxGeometry(ft(2.5), 0.18, ft(12)),
    mats.teakFloor
  );
  bridgeSlab.position.set(ft(36.75), ft(11) - 0.09, -ft(24.75));
  firstFloorGroup.add(bridgeSlab);

  // Cantilevered First Floor Balcony Corridors (+10'-6" LEVEL)
  const balconyCorridors: Array<[number, number, number, number]> = [
    [-3, 14, -5.5, -2],     // Bed Room 03 South Balcony Corridor
    [-3, 0, -2, 14],        // Bed Room 03 West Balcony Corridor
    [0, 14, 12, 15],        // Bed Room 03 North Balcony Corridor
    [34, 38, -2, 12],       // Bed Room 04 East Balcony Corridor
    [11, 14, 18.75, 45.75], // Upper Living & Master West Balcony Corridor
    [14, 41, 42.75, 45.75], // Master North Balcony Corridor
  ];
  for (const [x1, x2, z1, z2] of balconyCorridors) {
    const bSlab = new THREE.Mesh(
      new THREE.BoxGeometry(ft(x2 - x1), 0.16, ft(z2 - z1)),
      mats.terracottaFloor
    );
    bSlab.position.set(ft((x1 + x2) * 0.5), ft(10.5) - 0.08, -ft((z1 + z2) * 0.5));
    firstFloorGroup.add(bSlab);
  }

  // ==================== 3. CENTRAL DOG-LEG STAIRCASE (+1'-0" -> +6'-0" -> +11'-0") ====================
  const stairGroup = new THREE.Group();
  // Lower flight: 10 timber steps rising from gx=17.8 (+1'-0") to gx=24.5 (+6'-0") along gz=12.3..15.2
  const numSteps = 10;
  for (let i = 0; i < numSteps; i++) {
    const t = (i + 0.5) / numSteps;
    const gx = 17.8 + t * (24.5 - 17.8);
    const gy = 1.0 + ((i + 1) / numSteps) * 5.0;
    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(ft(0.72), ft(0.18), ft(2.8)),
      mats.teakTimber
    );
    stepMesh.position.set(ft(gx), ft(gy - 0.09), -ft(13.75));
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;
    stairGroup.add(stepMesh);
  }
  // Mid-landing at +6'-0" (gx=24.5..27.8, gz=12.1..18.6)
  const midLanding = new THREE.Mesh(
    new THREE.BoxGeometry(ft(3.3), ft(0.35), ft(6.5)),
    mats.teakFloor
  );
  midLanding.position.set(ft(26.15), ft(6.0 - 0.175), -ft(15.35));
  stairGroup.add(midLanding);

  // Upper flight: 10 timber steps rising Westward from gx=24.5 (+6'-0") to gx=17.8 (+11'-0") along gz=15.5..18.5
  for (let i = 0; i < numSteps; i++) {
    const t = (i + 0.5) / numSteps;
    const gx = 24.5 - t * (24.5 - 17.8);
    const gy = 6.0 + ((i + 1) / numSteps) * 5.0;
    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(ft(0.72), ft(0.18), ft(2.8)),
      mats.teakTimber
    );
    stepMesh.position.set(ft(gx), ft(gy - 0.09), -ft(17.0));
    stepMesh.castShadow = true;
    stepMesh.receiveShadow = true;
    stairGroup.add(stepMesh);
  }

  // Structural sloped steel stringers & central balustrade under staircase flights
  const stringerLen = Math.hypot(ft(6.7), ft(5.0));
  const stringerAngle = Math.atan2(ft(5.0), ft(6.7));
  const lowerStringer = new THREE.Mesh(
    new THREE.BoxGeometry(stringerLen, 0.14, 0.18),
    mats.darkWalnut
  );
  lowerStringer.position.set(ft(21.15), ft(3.3), -ft(13.75));
  lowerStringer.rotation.z = stringerAngle;
  stairGroup.add(lowerStringer);

  const upperStringer = new THREE.Mesh(
    new THREE.BoxGeometry(stringerLen, 0.14, 0.18),
    mats.darkWalnut
  );
  upperStringer.position.set(ft(21.15), ft(8.3), -ft(17.0));
  upperStringer.rotation.z = -stringerAngle;
  stairGroup.add(upperStringer);

  // Slim black handrails along both flights
  const lowerRail = new THREE.Mesh(
    new THREE.BoxGeometry(stringerLen, 0.04, 0.04),
    mats.blackMetal
  );
  lowerRail.position.set(ft(21.15), ft(4.15), -ft(12.4));
  lowerRail.rotation.z = stringerAngle;
  stairGroup.add(lowerRail);
  const upperRail = new THREE.Mesh(
    new THREE.BoxGeometry(stringerLen, 0.04, 0.04),
    mats.blackMetal
  );
  upperRail.position.set(ft(21.15), ft(9.15), -ft(18.35));
  upperRail.rotation.z = -stringerAngle;
  stairGroup.add(upperRail);
  for (let i = 0; i < 6; i++) {
    const t = (i + 0.5) / 6;
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6), mats.blackMetal);
    postL.position.set(ft(17.8 + t * 6.7), ft(1.0 + t * 5.0 + 0.4), -ft(12.4));
    stairGroup.add(postL);
    const postU = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6), mats.blackMetal);
    postU.position.set(ft(24.5 - t * 6.7), ft(6.0 + t * 5.0 + 0.4), -ft(18.35));
    stairGroup.add(postU);
  }

  groundFloorGroup.add(stairGroup);

  // ==================== 4. WALLS, WINDOWS & HINGED DOORS ====================
  for (const wall of ARCHITECTURAL_WALLS) {
    const wg = buildWallSegmentGroup(wall, mats);
    if (wall.floor === 'first') {
      firstFloorGroup.add(wg);
    } else {
      groundFloorGroup.add(wg);
    }
  }

  for (const door of doors) {
    const dp = buildInteractiveDoor(door, mats);
    doorPivots.set(door.id, dp);
    if (door.floor === 'first') {
      firstFloorGroup.add(dp);
    } else {
      groundFloorGroup.add(dp);
    }
  }

  // ==================== 5. SIGNATURE ARCHITECTURAL BUILT-INS & FURNITURE ====================
  // A. Car Porch Composite Luxury SUV / Sedan (gx=29, gz=4, gy=0.5) + Flower Trough (gx=34.8)
  const carGroup = new THREE.Group();
  carGroup.position.set(ft(29), ft(0.5), -ft(4.2));
  const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.82, 0.58, 4.15),
    new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.75,
      roughness: 0.18,
      clearcoat: 1.0,
    })
  );
  carBody.position.y = 0.58;
  carGroup.add(carBody);

  const carCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.56, 0.48, 2.15),
    mats.architecturalGlass
  );
  carCabin.position.set(0, 1.08, -0.15);
  carGroup.add(carCabin);

  const carRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.52, 0.06, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.2 })
  );
  carRoof.position.set(0, 1.33, -0.15);
  carGroup.add(carRoof);

  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  for (const [wx, wz] of [
    [-0.88, -1.3],
    [0.88, -1.3],
    [-0.88, 1.3],
    [0.88, 1.3],
  ]) {
    const wheel = new THREE.Mesh(wheelGeo, mats.asphaltRoad);
    wheel.position.set(wx, 0.32, wz);
    carGroup.add(wheel);
  }
  groundFloorGroup.add(carGroup);

  // Flower Troughs (Car Porch East Edge & Bed Room 04 South Edge)
  const gfTrough = new THREE.Mesh(
    new THREE.BoxGeometry(ft(2.0), ft(1.6), ft(14.0)),
    mats.wallFeatureStone
  );
  gfTrough.position.set(ft(35.0), ft(1.3), -ft(5.0));
  groundFloorGroup.add(gfTrough);

  const ffTrough = new THREE.Mesh(
    new THREE.BoxGeometry(ft(10.0), ft(1.5), ft(2.0)),
    mats.wallFeatureStone
  );
  ffTrough.position.set(ft(29.0), ft(11.2), ft(3.0));
  firstFloorGroup.add(ffTrough);

  // B. Ground Floor TV Lobby: Deep navy L-Sofa (archviz floor-plan language)
  const gfSofa = new THREE.Group();
  gfSofa.position.set(ft(21.8), ft(1.0), -ft(7.0));
  const navyMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.82,
    metalness: 0.02,
  });
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 2.35), navyMat);
  sofaBase.position.y = 0.21;
  sofaBase.castShadow = true;
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.82, 2.35), navyMat);
  sofaBack.position.set(0.48, 0.42, 0);
  const sofaChaise = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 0.95), navyMat);
  sofaChaise.position.set(-0.15, 0.21, 0.85);
  const pillow1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.28, 0.12),
    mats.fabricCream
  );
  pillow1.position.set(0.28, 0.62, 0.4);
  const pillow2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.28, 0.12),
    mats.fabricTerracotta
  );
  pillow2.position.set(0.28, 0.62, -0.35);
  const pillow3 = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.22, 0.1),
    mats.fabricCharcoal
  );
  pillow3.position.set(0.22, 0.58, 0.05);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.28, 0.14), navyMat);
  arm.position.set(0, 0.5, -1.05);
  gfSofa.add(sofaBase, sofaBack, sofaChaise, pillow1, pillow2, pillow3, arm);
  groundFloorGroup.add(gfSofa);

  const tvWallUnit = new THREE.Group();
  tvWallUnit.position.set(ft(14.6), ft(1.0), -ft(5.5));
  const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 2.2), mats.teakTimber);
  consoleBox.position.y = 0.24;
  const tvScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.85, 1.55),
    new THREE.MeshStandardMaterial({ color: 0x0b0f17, roughness: 0.12, metalness: 0.5 })
  );
  tvScreen.position.set(-0.1, 1.25, 0);
  tvWallUnit.add(consoleBox, tvScreen);
  groundFloorGroup.add(tvWallUnit);

  // C. Ground Floor Dining Area: 6-Seater Teak Dining Table & West Garden Deck
  const diningSet = new THREE.Group();
  diningSet.position.set(ft(21.0), ft(1.0), -ft(24.75));
  const dTableTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 2.1), mats.teakTimber);
  dTableTop.position.y = 0.76;
  diningSet.add(dTableTop);
  for (const [lx, lz] of [
    [-0.46, -0.92],
    [0.46, -0.92],
    [-0.46, 0.92],
    [0.46, 0.92],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.74, 0.07), mats.darkWalnut);
    leg.position.set(lx, 0.37, lz);
    diningSet.add(leg);
  }
  // Chairs come from roomInteriors (detailed dining chairs) — avoid duplicate boxes
  groundFloorGroup.add(diningSet);

  // D. Living Area Built-in Window Seat ("BUILT IN SEAT 2'-3" × 1'-6" height" on plan)
  const builtInSeat = new THREE.Group();
  builtInSeat.position.set(ft(36.8), ft(1.0), -ft(24.75));
  const seatBase = new THREE.Mesh(
    new THREE.BoxGeometry(ft(2.25), ft(1.2), ft(8.5)),
    mats.teakTimber
  );
  seatBase.position.y = ft(0.6);
  const seatMattress = new THREE.Mesh(
    new THREE.BoxGeometry(ft(2.15), ft(0.3), ft(8.3)),
    mats.fabricTerracotta
  );
  seatMattress.position.y = ft(1.35);
  builtInSeat.add(seatBase, seatMattress);
  groundFloorGroup.add(builtInSeat);

  // E. Kitchen L-Shaped Granite Counter, Sink, Stove & Refrigerator
  const kitchenGroup = new THREE.Group();
  kitchenGroup.position.set(0, ft(1.0), 0);
  const northCounter = new THREE.Mesh(
    new THREE.BoxGeometry(ft(10.5), ft(2.8), ft(2.1)),
    mats.teakTimber
  );
  northCounter.position.set(ft(19.8), ft(1.4), -ft(41.5));
  const northGranite = new THREE.Mesh(
    new THREE.BoxGeometry(ft(10.7), ft(0.15), ft(2.2)),
    mats.graniteFloor
  );
  northGranite.position.set(ft(19.8), ft(2.85), -ft(41.5));

  const eastCounter = new THREE.Mesh(
    new THREE.BoxGeometry(ft(2.1), ft(2.8), ft(8.5)),
    mats.teakTimber
  );
  eastCounter.position.set(ft(24.2), ft(1.4), -ft(36.5));
  const fridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 1.82, 0.75),
    mats.brushedSteel
  );
  fridge.position.set(ft(15.4), 0.91, -ft(32.5));
  kitchenGroup.add(northCounter, northGranite, eastCounter, fridge);
  groundFloorGroup.add(kitchenGroup);

  // F. Bedrooms (Bed 01, Bed 02 on Ground Floor; Bed 03, Bed 04, Master Bed Room on First Floor)
  const addArchitecturalBed = (
    parent: THREE.Group,
    gx: number,
    gy: number,
    gz: number,
    rotY: number,
    isKing: boolean = false
  ) => {
    const bg = new THREE.Group();
    bg.position.set(ft(gx), ft(gy), -ft(gz));
    bg.rotation.y = rotY;
    const w = isKing ? 1.95 : 1.55;
    const l = 2.05;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.32, l + 0.12), mats.teakTimber);
    frame.position.y = 0.16;
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(w, 0.26, l - 0.05), mats.fabricCream);
    mattress.position.y = 0.42;
    const duvet = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.02, 0.28, l * 0.58),
      mats.fabricTerracotta
    );
    duvet.position.set(0, 0.43, l * 0.2);
    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.16, 1.15, 0.12),
      mats.darkWalnut
    );
    headboard.position.set(0, 0.58, -l * 0.5);
    const pillowL = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.38, 0.14, 0.32),
      mats.fabricCream
    );
    pillowL.position.set(-w * 0.22, 0.58, -l * 0.28);
    const pillowR = pillowL.clone();
    pillowR.position.x = w * 0.22;
    const accentPillow = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.28, 0.18, 0.12),
      mats.fabricTerracotta
    );
    accentPillow.position.set(0, 0.62, -l * 0.18);
    bg.add(frame, mattress, duvet, headboard, pillowL, pillowR, accentPillow);
    parent.add(bg);
  };

  addArchitecturalBed(groundFloorGroup, 5.5, 1.0, 5.5, Math.PI / 2); // Bed 01 — clear of west wall
  addArchitecturalBed(groundFloorGroup, 35.5, 1.0, 36.5, -Math.PI / 2); // Bed 02 — clear of east wall
  addArchitecturalBed(firstFloorGroup, 5.5, 11.0, 5.5, Math.PI / 2); // Bed 03
  addArchitecturalBed(firstFloorGroup, 29.0, 11.0, 4.5, 0); // Bed 04 — headboard south
  addArchitecturalBed(firstFloorGroup, 24.5, 11.0, 37.5, Math.PI, true); // Master — headboard north

  // Upper Living Pantry Counter (Option 03 First Floor: 2'-0" pantry along North wall of Upper Living)
  const upperPantry = new THREE.Mesh(
    new THREE.BoxGeometry(ft(7.5), ft(2.8), ft(2.0)),
    mats.teakTimber
  );
  upperPantry.position.set(ft(23.5), ft(11.0 + 1.4), -ft(29.6));
  firstFloorGroup.add(upperPantry);

  // ==================== 6. PLAN-ACCURATE CONTEMPORARY RCC ROOF SYSTEM ====================
  roofGroup.add(buildKapilaRoofSystem(mats));
  groundFloorGroup.add(buildExteriorStructure(mats));

  // ==================== 7. OUTDOOR TROPICAL TREES (layered canopy) ====================
  const treeCoords: Array<[number, number, number]> = [
    [6, -12, 1.0],
    [39, -10, 1.15],
    [-5, 18, 0.95],
    [8, 49, 1.2],
    [26, 51, 1.05],
    [42, 28, 0.9],
    [-2, 38, 1.05],
  ];
  for (const [tx, tz, scale] of treeCoords) {
    const tg = new THREE.Group();
    tg.position.set(ft(tx), 0, -ft(tz));
    tg.scale.setScalar(scale);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.2, 2.8, 12),
      mats.darkWalnut
    );
    trunk.position.y = 1.4;
    trunk.castShadow = true;
    tg.add(trunk);
    for (let c = 0; c < 5; c++) {
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.05 - c * 0.12, 1),
        mats.foliageGreen
      );
      crown.position.set(
        Math.cos(c * 1.4) * 0.35,
        2.7 + c * 0.38,
        Math.sin(c * 1.4) * 0.35
      );
      crown.castShadow = true;
      tg.add(crown);
    }
    rootGroup.add(tg);
  }

  // Soft exterior fixtures + full room furniture & interior luminaires
  const archLighting = buildArchitecturalLighting(mats);
  rootGroup.add(archLighting.root);
  const interiorLighting = buildRoomInteriors(mats, groundFloorGroup, firstFloorGroup);
  interiorPointLights.push(...archLighting.pointLights, ...interiorLighting.lights);

  // Dark polished stone cladding band between floors (reference language)
  const stoneBand = new THREE.Mesh(
    new THREE.BoxGeometry(ft(42), ft(1.1), ft(0.35)),
    mats.darkPolishedStone
  );
  stoneBand.position.set(ft(20), ft(10.4), -ft(-0.3));
  groundFloorGroup.add(stoneBand);

  // Black metal balcony rail accent strips (visual cue from references)
  for (const [gx0, gx1, gz, gy] of [
    [14, 24, -4, 12.0],
    [14, 41, 45.5, 12.0],
  ] as Array<[number, number, number, number]>) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(ft(gx1 - gx0), 0.04, 0.04),
      mats.blackMetal
    );
    rail.position.set(ft((gx0 + gx1) * 0.5), ft(gy), -ft(gz));
    firstFloorGroup.add(rail);
  }

  return {
    rootGroup,
    groundFloorGroup,
    firstFloorGroup,
    roofGroup,
    doorPivots,
    ceilingFans,
    roomLightMeshes,
    interiorPointLights,
    archLighting,
    interiorLighting,
  };
}
