/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Plan-accurate contemporary tropical RCC roof system for Kapila Residence:
 * multi-slab flat roofs with deep eaves, parapets, fascia, rain gutters,
 * car-porch canopy under Bed Room 04, and planter troughs.
 */

import * as THREE from 'three';
import { FT_TO_M, ft } from './blueprintData';
import type { ArchitecturalMaterialSet } from './materialsAndBuilder';

function slab(
  mats: ArchitecturalMaterialSet,
  gx0: number,
  gx1: number,
  gz0: number,
  gz1: number,
  topFt: number,
  thickFt: number,
  mat: THREE.Material,
  overhangFt = 0
): THREE.Mesh {
  const w = gx1 - gx0 + overhangFt * 2;
  const d = gz1 - gz0 + overhangFt * 2;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(ft(w), ft(thickFt), ft(d)),
    mat
  );
  mesh.position.set(
    ft((gx0 + gx1) * 0.5),
    ft(topFt - thickFt * 0.5),
    -ft((gz0 + gz1) * 0.5)
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function parapetRing(
  group: THREE.Group,
  mats: ArchitecturalMaterialSet,
  gx0: number,
  gx1: number,
  gz0: number,
  gz1: number,
  baseFt: number,
  heightFt: number,
  thickFt: number
) {
  const t = thickFt;
  const h = heightFt;
  const y = baseFt + h * 0.5;
  const segments: Array<[number, number, number, number]> = [
    [gx0, gx1, gz0, gz0 + t], // south
    [gx0, gx1, gz1 - t, gz1], // north
    [gx0, gx0 + t, gz0, gz1], // west
    [gx1 - t, gx1, gz0, gz1], // east
  ];
  for (const [x0, x1, z0, z1] of segments) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(ft(x1 - x0), ft(h), ft(z1 - z0)),
      mats.wallExterior
    );
    m.position.set(ft((x0 + x1) * 0.5), ft(y), -ft((z0 + z1) * 0.5));
    m.castShadow = true;
    group.add(m);
  }
  // Cap coping
  const coping = new THREE.Mesh(
    new THREE.BoxGeometry(ft(gx1 - gx0 + 0.2), ft(0.12), ft(gz1 - gz0 + 0.2)),
    mats.paverFloor
  );
  coping.position.set(ft((gx0 + gx1) * 0.5), ft(baseFt + h + 0.06), -ft((gz0 + gz1) * 0.5));
  group.add(coping);
}

function fasciaAndGutter(
  group: THREE.Group,
  mats: ArchitecturalMaterialSet,
  gx0: number,
  gx1: number,
  gz0: number,
  gz1: number,
  soffitFt: number
) {
  const edgeY = soffitFt;
  const edges: Array<{
    cx: number;
    cz: number;
    w: number;
    d: number;
  }> = [
    { cx: (gx0 + gx1) * 0.5, cz: gz0 - 0.15, w: gx1 - gx0 + 0.6, d: 0.18 },
    { cx: (gx0 + gx1) * 0.5, cz: gz1 + 0.15, w: gx1 - gx0 + 0.6, d: 0.18 },
    { cx: gx0 - 0.15, cz: (gz0 + gz1) * 0.5, w: 0.18, d: gz1 - gz0 + 0.6 },
    { cx: gx1 + 0.15, cz: (gz0 + gz1) * 0.5, w: 0.18, d: gz1 - gz0 + 0.6 },
  ];
  for (const e of edges) {
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(ft(e.w), ft(0.55), ft(e.d)),
      mats.darkWalnut
    );
    fascia.position.set(ft(e.cx), ft(edgeY - 0.2), -ft(e.cz));
    group.add(fascia);

    const gutter = new THREE.Mesh(
      new THREE.BoxGeometry(ft(e.w * 0.98), ft(0.12), ft(e.d + 0.08)),
      mats.brushedSteel
    );
    gutter.position.set(ft(e.cx), ft(edgeY - 0.5), -ft(e.cz));
    group.add(gutter);
  }
}

function planterTrough(
  group: THREE.Group,
  mats: ArchitecturalMaterialSet,
  gx: number,
  gz: number,
  lengthFt: number,
  _depthFt: number,
  elevFt: number,
  alongX: boolean
) {
  const trough = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.BoxGeometry(
      ft(alongX ? lengthFt : 2.0),
      ft(1.4),
      ft(alongX ? 2.0 : lengthFt)
    ),
    mats.wallFeatureStone
  );
  outer.position.y = ft(0.7);
  trough.add(outer);

  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(
      ft(alongX ? lengthFt - 0.35 : 1.55),
      ft(0.2),
      ft(alongX ? 1.55 : lengthFt - 0.35)
    ),
    mats.darkWalnut
  );
  soil.position.y = ft(1.15);
  trough.add(soil);

  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 6),
      mats.foliageGreen
    );
    leaf.scale.set(0.7, 0.45, 1.1);
    const offset = (i - 2) * (lengthFt / 6) * FT_TO_M;
    leaf.position.set(
      alongX ? offset : 0,
      ft(1.45),
      alongX ? 0 : offset
    );
    trough.add(leaf);
  }

  trough.position.set(ft(gx), ft(elevFt), -ft(gz));
  group.add(trough);
}

/**
 * Build the complete roof assembly aligned to Ground/First Floor Option 03 footprints.
 */
export function buildKapilaRoofSystem(
  mats: ArchitecturalMaterialSet
): THREE.Group {
  const roof = new THREE.Group();
  roof.name = 'kapila_roof_system';

  // Main first-floor roof slab over occupied rooms (+21'-0" LEVEL per plan)
  // Footprint approx Grid 2..8 / A..E with overhangs
  const mainTop = 21.0;
  roof.add(
    slab(mats, -1, 42, -4, 44.5, mainTop, 0.85, mats.roofMembrane, 0.75)
  );
  parapetRing(roof, mats, -1.5, 42.5, -4.5, 45, mainTop, 2.4, 0.55);
  fasciaAndGutter(roof, mats, -1.75, 42.75, -4.75, 45.25, mainTop - 0.2);

  // Warm wood soffit underside (archviz cantilever cue)
  const soffit = slab(
    mats,
    -1,
    42,
    -4,
    44.5,
    mainTop - 0.85,
    0.12,
    mats.woodSoffit,
    0.9
  );
  roof.add(soffit);

  // Cascading roof-edge planter troughs (tropical contemporary language)
  planterTrough(roof, mats, 19, -5.2, 9.5, 2, 20.9, true);
  planterTrough(roof, mats, 43, 21, 14, 2, 20.9, false);
  planterTrough(roof, mats, 29, 45.5, 12, 2, 20.9, true);

  // Lightweight insulated sheet bay over double-height living void (steel + sheet)
  const voidRoof = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(ft(9.5), ft(0.2), ft(13), 1, 1, 1),
    mats.brushedSteel
  );
  frame.position.set(ft(31.5), ft(21.35), -ft(24.75));
  voidRoof.add(frame);
  for (let i = 0; i < 5; i++) {
    const purlin = new THREE.Mesh(
      new THREE.BoxGeometry(ft(9.2), ft(0.08), ft(0.12)),
      mats.brushedSteel
    );
    purlin.position.set(ft(31.5), ft(21.55), -ft(19.5 + i * 2.6));
    voidRoof.add(purlin);
  }
  const sheet = new THREE.Mesh(
    new THREE.BoxGeometry(ft(9.0), ft(0.06), ft(12.5)),
    mats.roofTileMat
  );
  sheet.position.set(ft(31.5), ft(21.7), -ft(24.75));
  sheet.rotation.x = -0.04;
  voidRoof.add(sheet);
  roof.add(voidRoof);

  // Downpipes at NE / NW corners
  for (const [gx, gz] of [
    [-1.2, -4.2],
    [42.2, -4.2],
    [-1.2, 44.2],
    [42.2, 44.2],
  ] as Array<[number, number]>) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, ft(20.5), 10),
      mats.brushedSteel
    );
    pipe.position.set(ft(gx), ft(10.5), -ft(gz));
    roof.add(pipe);
  }

  return roof;
}

/** Exterior structural columns + beam grid accents for car porch & verandah. */
export function buildExteriorStructure(
  mats: ArchitecturalMaterialSet
): THREE.Group {
  const g = new THREE.Group();

  // Verandah posts + beam
  for (const gx of [15, 19, 23]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(ft(0.7), ft(8.6), ft(0.7)),
      mats.wallExterior
    );
    post.position.set(ft(gx), ft(4.8), -ft(-3.2));
    post.castShadow = true;
    g.add(post);
  }
  const verandahBeam = new THREE.Mesh(
    new THREE.BoxGeometry(ft(11), ft(0.55), ft(0.7)),
    mats.wallExterior
  );
  verandahBeam.position.set(ft(19), ft(9.4), -ft(-3.6));
  g.add(verandahBeam);

  // Car porch dark polished stone pillars + beam (reference look)
  for (const gx of [25.5, 29, 32.5]) {
    const col = new THREE.Mesh(
      new THREE.BoxGeometry(ft(1.0), ft(9.2), ft(1.0)),
      mats.darkPolishedStone
    );
    col.position.set(ft(gx), ft(4.6), -ft(-1.5));
    col.castShadow = true;
    g.add(col);
  }
  const porchBeam = new THREE.Mesh(
    new THREE.BoxGeometry(ft(11), ft(0.75), ft(0.95)),
    mats.darkPolishedStone
  );
  porchBeam.position.set(ft(29), ft(9.6), -ft(-3.2));
  porchBeam.castShadow = true;
  g.add(porchBeam);

  // White plaster cladding volumes on front facade for contemporary box massing
  const plasterBay = new THREE.Mesh(
    new THREE.BoxGeometry(ft(10.5), ft(8.8), ft(0.45)),
    mats.whitePlaster
  );
  plasterBay.position.set(ft(19), ft(5.5), -ft(-0.2));
  plasterBay.castShadow = true;
  g.add(plasterBay);

  // First-floor balcony railing posts (visual density)
  const railPosts: Array<[number, number, number]> = [
    [14, -4, 10.5],
    [19, -4, 10.5],
    [24, -4, 10.5],
    [0, -2, 10.5],
    [7, -2, 10.5],
    [34, 5, 10.5],
    [38, 5, 10.5],
  ];
  for (const [gx, gz, gy] of railPosts) {
    const p = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, ft(3.0), 8),
      mats.brushedSteel
    );
    p.position.set(ft(gx), ft(gy + 1.5), -ft(gz));
    g.add(p);
  }

  // Entrance steps from garden to verandah (+0'-0" -> +0'-6")
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(ft(8), ft(0.18), ft(1.1)),
      mats.terracottaFloor
    );
    step.position.set(ft(19), ft(0.12 + i * 0.18), -ft(-5.5 - i * 0.9));
    step.receiveShadow = true;
    g.add(step);
  }

  return g;
}
