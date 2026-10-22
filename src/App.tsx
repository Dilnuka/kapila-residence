/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Kapila Residence — 3D Architectural Spatial Twin & First-Person Physics Environment
 * Proposed Residence for Mr. Kapila Liyanage at Yatiyana (Archt. Nelum Idamgedara, Studio Red)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sky } from 'three/addons/objects/Sky.js';
import {
  ARCHITECTURAL_ROOMS,
  CatalogItemType,
  DoorSpec,
  FT_TO_M,
  ft,
  INITIAL_DOORS,
  INITIAL_PHYSICS_PROPS,
  PLACEABLE_CATALOG,
  PlacedPropInstance,
  RoomSpec,
} from './architecture/blueprintData';
import {
  buildCompleteKapilaResidence,
  createArchitecturalMaterials,
  createCatalogPropMesh,
  playArchitecturalSound,
} from './architecture/materialsAndBuilder';
import {
  findNearestDoor,
  findRoomAt,
  getFloorElevationFt,
  resolvePlayerMovement,
  stepPropsPhysics,
} from './architecture/spatialEngine';
import { BlueprintInspectorModal } from './components/BlueprintInspectorModal';
import { createVisualPipeline } from './architecture/visualPipeline';

type AppState = 'title' | 'playing' | 'paused';
type CameraMode = 'first_person' | 'dollhouse_orbit';
type FloorCutaway = 'all' | 'first_only' | 'ground_only';
type LightingPreset = 'daylight' | 'golden_hour' | 'night_warm';
type DockTab = 'navigate' | 'furnish';

export default function App() {
  // Check ?autostart=1
  const initialAutoStart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [appState, setAppState] = useState<AppState>(
    initialAutoStart ? 'playing' : 'title'
  );
  const [cameraMode, setCameraMode] = useState<CameraMode>('first_person');
  const [floorCutaway, setFloorCutaway] = useState<FloorCutaway>('all');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('daylight');
  const [dockTab, setDockTab] = useState<DockTab>('navigate');
  // Start collapsed so the 3D viewport stays primary (standard viewer UX)
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(true);
  const [blueprintOpen, setBlueprintOpen] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  // Player & World React HUD State (throttled to discrete updates)
  const [activeRoom, setActiveRoom] = useState<RoomSpec>(ARCHITECTURAL_ROOMS[1]); // GF TV Lobby
  const [playerCoordsFt, setPlayerCoordsFt] = useState<{
    gx: number;
    gy: number;
    gz: number;
    yaw: number;
  }>({
    gx: 19.5,
    gy: 1.0,
    gz: 3.5,
    yaw: 0,
  });
  const [doors, setDoors] = useState<DoorSpec[]>(INITIAL_DOORS);
  const [nearestDoor, setNearestDoor] = useState<DoorSpec | null>(
    INITIAL_DOORS[0]
  );
  const [placedProps, setPlacedProps] = useState<PlacedPropInstance[]>(
    INITIAL_PHYSICS_PROPS
  );
  const [selectedCatalogType, setSelectedCatalogType] =
    useState<CatalogItemType>('teak_armchair');
  const [grabbedPropId, setGrabbedPropId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string>(
    'TV Lobby · Click canvas to look · WASD walk · E doors · F furniture'
  );

  // Refs for 60Hz loop decoupling
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const appStateRef = useRef<AppState>(appState);
  const cameraModeRef = useRef<CameraMode>(cameraMode);
  const floorCutawayRef = useRef<FloorCutaway>(floorCutaway);
  const lightingPresetRef = useRef<LightingPreset>(lightingPreset);
  const doorsRef = useRef<DoorSpec[]>(doors);
  const propsRef = useRef<PlacedPropInstance[]>(placedProps);
  const grabbedIdRef = useRef<string | null>(grabbedPropId);
  const mutedRef = useRef<boolean>(muted);

  const playerRef = useRef({
    gx: 19.5,
    gy: 1.0,
    gz: 3.5,
    vy: 0,
    vx: 0,
    vz: 0,
    yaw: 0, // 0 = looking North (-Z) into the TV Lobby & Staircase
    pitch: -0.04,
    walkBobDist: 0,
    stepAccum: 0,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const virtualMoveRef = useRef<{ forward: number; turn: number; strafe: number }>({
    forward: 0,
    turn: 0,
    strafe: 0,
  });

  // Sync body dataset state for Ultra Mode verification
  useEffect(() => {
    document.body.dataset.state = appState;
    appStateRef.current = appState;
    if (appState !== 'playing') {
      keysRef.current.clear();
      document.exitPointerLock?.();
    }
  }, [appState]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    floorCutawayRef.current = floorCutaway;
  }, [floorCutaway]);

  useEffect(() => {
    lightingPresetRef.current = lightingPreset;
  }, [lightingPreset]);

  useEffect(() => {
    doorsRef.current = doors;
  }, [doors]);

  useEffect(() => {
    propsRef.current = placedProps;
  }, [placedProps]);

  useEffect(() => {
    grabbedIdRef.current = grabbedPropId;
  }, [grabbedPropId]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  // Start exploration handler
  const handleStartExploration = useCallback(() => {
    document.body.dataset.state = 'playing';
    appStateRef.current = 'playing';
    setAppState('playing');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, []);

  // Teleport to any room in Ground Floor, First Floor Option 03, or Outdoor Site
  const handleTeleportToRoom = useCallback((room: RoomSpec) => {
    playerRef.current.gx = room.spawnGx;
    playerRef.current.gz = room.spawnGz;
    playerRef.current.gy = room.elevationFt;
    playerRef.current.vy = 0;
    playerRef.current.yaw = room.spawnYaw;
    // Slight downward look keeps teleports framed on furniture, not blown exterior sky
    playerRef.current.pitch = room.floor === 'outdoor' ? -0.12 : -0.08;

    setActiveRoom(room);
    setPlayerCoordsFt({
      gx: room.spawnGx,
      gy: room.elevationFt,
      gz: room.spawnGz,
      yaw: room.spawnYaw,
    });

    // If in ground_only cutaway and teleporting to First Floor, automatically reveal First Floor
    if (room.floor === 'first' && floorCutawayRef.current === 'ground_only') {
      setFloorCutaway('all');
    }
    setStatusBanner(
      `Teleported to ${room.code} ${room.name} (${room.levelLabel} · ${room.dimensionsLabel})`
    );
    playArchitecturalSound('step', mutedRef.current);
  }, []);

  // Toggle a specific or nearest door open/closed
  const handleToggleDoor = useCallback((targetDoorId?: string) => {
    const p = playerRef.current;
    const doorToToggle = targetDoorId
      ? doorsRef.current.find((d) => d.id === targetDoorId)
      : findNearestDoor(p.gx, p.gz, p.gy, doorsRef.current, 7.5);

    if (!doorToToggle) {
      setStatusBanner('Move closer to a doorway (D1 / D2 / D3 / DW1 / DW2) to open or close it.');
      return;
    }

    const nextOpen = !doorToToggle.isOpen;
    playArchitecturalSound(
      nextOpen ? 'door_open' : 'door_close',
      mutedRef.current
    );

    setDoors((prev) => {
      const updated = prev.map((d) =>
        d.id === doorToToggle.id ? { ...d, isOpen: nextOpen } : d
      );
      doorsRef.current = updated;
      return updated;
    });

    setStatusBanner(
      `${doorToToggle.code} — ${doorToToggle.label}: ${nextOpen ? 'Opened' : 'Closed'}`
    );
  }, []);

  // Grab or Drop/Toss nearest physics prop
  const handleGrabOrDropProp = useCallback((toss: boolean = false) => {
    const p = playerRef.current;
    const currentGrabbed = grabbedIdRef.current;

    if (currentGrabbed) {
      // Release or toss the held prop
      const fwdGx = -Math.sin(p.yaw);
      const fwdGz = Math.cos(p.yaw);
      const throwSpeed = toss ? 14.0 : 1.5;

      setPlacedProps((prev) => {
        const next = prev.map((item) =>
          item.id === currentGrabbed
            ? {
                ...item,
                isGrabbed: false,
                vx: fwdGx * throwSpeed,
                vz: fwdGz * throwSpeed,
                vy: toss ? 6.5 : 0.5,
              }
            : item
        );
        propsRef.current = next;
        return next;
      });
      setGrabbedPropId(null);
      grabbedIdRef.current = null;
      playArchitecturalSound('place', mutedRef.current);
      setStatusBanner(
        toss
          ? 'Tossed object forward with physics impulse.'
          : 'Released object onto surface.'
      );
      return;
    }

    // Find nearest grabbable prop within 7.5 ft
    let bestProp: PlacedPropInstance | null = null;
    let bestDist = 7.5;
    for (const item of propsRef.current) {
      if (Math.abs(item.gy - p.gy) > 4.5) continue;
      const d = Math.hypot(item.gx - p.gx, item.gz - p.gz);
      if (d < bestDist) {
        bestDist = d;
        bestProp = item;
      }
    }

    if (!bestProp) {
      setStatusBanner('No movable prop within reach. Place an item from the Furnish Studio or step closer.');
      return;
    }

    setGrabbedPropId(bestProp.id);
    grabbedIdRef.current = bestProp.id;
    setPlacedProps((prev) => {
      const next = prev.map((item) =>
        item.id === bestProp!.id ? { ...item, isGrabbed: true, vx: 0, vy: 0, vz: 0 } : item
      );
      propsRef.current = next;
      return next;
    });
    playArchitecturalSound('grab', mutedRef.current);
    setStatusBanner(
      `Carrying "${bestProp.name}" · Press [F] to Place Gently, [G] to Toss, or [R] to Rotate`
    );
  }, []);

  // Place a new 3D furniture/decor item 4.2 ft in front of the player
  const handlePlaceCatalogItem = useCallback(
    (typeToPlace: CatalogItemType = selectedCatalogType) => {
      const spec = PLACEABLE_CATALOG.find((c) => c.type === typeToPlace)!;
      const p = playerRef.current;
      const fwdGx = -Math.sin(p.yaw);
      const fwdGz = Math.cos(p.yaw);
      const targetGx = Math.max(-6, Math.min(42, p.gx + fwdGx * 4.2));
      const targetGz = Math.max(-18, Math.min(48, p.gz + fwdGz * 4.2));
      const floorY = getFloorElevationFt(targetGx, targetGz, p.gy);
      const room = findRoomAt(targetGx, targetGz, floorY);

      const newProp: PlacedPropInstance = {
        id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: spec.type,
        name: spec.name,
        gx: Number(targetGx.toFixed(2)),
        gz: Number(targetGz.toFixed(2)),
        gy: floorY + 1.2, // Drops slightly with gravity onto the floor
        vy: 0,
        vx: 0,
        vz: 0,
        rotationY: p.yaw,
        roomId: room.id,
      };

      setPlacedProps((prev) => {
        const next = [newProp, ...prev];
        propsRef.current = next;
        return next;
      });

      playArchitecturalSound('place', mutedRef.current);
      setStatusBanner(
        `Placed "${spec.name}" in ${room.name} (${room.levelLabel})`
      );
    },
    [selectedCatalogType]
  );

  // Rotate held or most recently placed prop by 45 degrees
  const handleRotateActiveProp = useCallback(() => {
    const targetId = grabbedIdRef.current || propsRef.current[0]?.id;
    if (!targetId) return;
    setPlacedProps((prev) => {
      const next = prev.map((item) =>
        item.id === targetId
          ? { ...item, rotationY: item.rotationY + Math.PI / 4 }
          : item
      );
      propsRef.current = next;
      return next;
    });
    playArchitecturalSound('switch', mutedRef.current);
  }, []);

  // Remove most recently placed custom prop
  const handleRemoveLastProp = useCallback(() => {
    setPlacedProps((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(1);
      propsRef.current = next;
      return next;
    });
    setGrabbedPropId(null);
    grabbedIdRef.current = null;
    playArchitecturalSound('switch', mutedRef.current);
  }, []);

  // ==================== THREE.JS SCENE INITIALIZATION & LOOP ====================
  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.7;
    // Cap DPR — 2× with post-processing was a major lag source
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9eb6d0);
    scene.fog = new THREE.FogExp2(0xa8bdd4, 0.005);
    // RoomEnvironment is bright studio IBL — keep it dim or interiors wash white
    scene.environmentIntensity = 0.22;

    // Physically-based sky dome for outdoor realism
    const sky = new Sky();
    sky.scale.setScalar(450);
    scene.add(sky);
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 2.5;
    skyUniforms['rayleigh'].value = 1.0;
    skyUniforms['mieCoefficient'].value = 0.003;
    skyUniforms['mieDirectionalG'].value = 0.8;
    const sunPosition = new THREE.Vector3();
    const applySkySun = (elevationDeg: number, azimuthDeg: number) => {
      const phi = THREE.MathUtils.degToRad(90 - elevationDeg);
      const theta = THREE.MathUtils.degToRad(azimuthDeg);
      sunPosition.setFromSphericalCoords(1, phi, theta);
      skyUniforms['sunPosition'].value.copy(sunPosition);
    };
    applySkySun(48, 150);

    // Low-intensity studio env for subtle reflections only
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.08
    ).texture;
    pmremGenerator.dispose();

    // Camera & OrbitControls (for Dollhouse mode)
    const camera = new THREE.PerspectiveCamera(68, width / height, 0.08, 220);
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = !isSoftwareGl;
    orbitControls.dampingFactor = 0.06;
    orbitControls.maxPolarAngle = Math.PI * 0.48;
    orbitControls.minDistance = 3;
    orbitControls.maxDistance = 48;
    orbitControls.target.set(ft(21), ft(5), -ft(20));
    orbitControls.enabled = false;

    // Balanced lighting rig — keep totals low so white plaster stays readable
    const hemiLight = new THREE.HemisphereLight(0xd7e6f5, 0x5a635c, 0.45);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff2e0, 1.05);
    sunLight.position.set(18, 28, 20);
    sunLight.target.position.set(ft(21), 0, -ft(21));
    scene.add(sunLight, sunLight.target);

    if (!isSoftwareGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(1024, 1024);
      const d = 20;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 70;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.03;
    }

    const rimLight = new THREE.DirectionalLight(0xa8c4e0, 0.22);
    rimLight.position.set(-16, 18, -24);
    scene.add(rimLight);

    // Build Complete 2-Story Kapila Residence
    const mats = createArchitecturalMaterials(renderer, isSoftwareGl);
    const houseHandles = buildCompleteKapilaResidence(mats, doorsRef.current);
    scene.add(houseHandles.rootGroup);

    // Hyper-real post stack: GTAO + bloom + SMAA
    const visualFx = createVisualPipeline(
      renderer,
      scene,
      camera,
      width,
      height,
      isSoftwareGl
    );
    visualFx.setPreset('daylight');
    houseHandles.archLighting.setIntensityScale(0.25);
    houseHandles.interiorLighting.setDayScale(0.85);

    // Container for dynamic physics props
    const dynamicPropsGroup = new THREE.Group();
    scene.add(dynamicPropsGroup);
    const propMeshMap = new Map<string, THREE.Group>();

    const syncDynamicPropMeshes = () => {
      const currentIds = new Set(propsRef.current.map((p) => p.id));
      // Remove deleted meshes
      for (const [id, mesh] of propMeshMap.entries()) {
        if (!currentIds.has(id)) {
          dynamicPropsGroup.remove(mesh);
          propMeshMap.delete(id);
        }
      }
      // Add or update existing meshes
      for (const prop of propsRef.current) {
        let mesh = propMeshMap.get(prop.id);
        if (!mesh) {
          mesh = createCatalogPropMesh(prop.type, mats);
          dynamicPropsGroup.add(mesh);
          propMeshMap.set(prop.id, mesh);
        }
        mesh.position.set(
          prop.gx * FT_TO_M,
          prop.gy * FT_TO_M,
          -prop.gz * FT_TO_M
        );
        mesh.rotation.y = prop.rotationY;
      }
    };
    syncDynamicPropMeshes();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer look: click canvas to lock cursor (standard FPS UX) + drag fallback
    let isPointerDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (appStateRef.current !== 'playing') return;
      if (cameraModeRef.current !== 'first_person') return;
      if (e.button === 0 && document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock?.();
      }
      isPointerDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (appStateRef.current !== 'playing') return;
      if (cameraModeRef.current !== 'first_person') return;
      const sens = document.pointerLockElement === renderer.domElement ? 0.0020 : 0.0038;
      if (document.pointerLockElement === renderer.domElement) {
        playerRef.current.yaw -= e.movementX * sens;
        playerRef.current.pitch = Math.max(
          -1.2,
          Math.min(1.2, playerRef.current.pitch - e.movementY * sens)
        );
      } else if (isPointerDragging) {
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        playerRef.current.yaw -= dx * sens;
        playerRef.current.pitch = Math.max(
          -1.2,
          Math.min(1.2, playerRef.current.pitch - dy * sens)
        );
      }
    };

    const onPointerUp = () => {
      isPointerDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.style.touchAction = 'none';
    domEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Resize listener
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      visualFx.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Software WebGL frame pacing (`afterDraw`)
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    let hudSyncAccum = 0;
    let titleOrbitAngle = 0.55;
    let lastAppliedPreset: LightingPreset | null = null;

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);

      // 1. Update Floor Cutaway & Roof Visibility
      const cut = floorCutawayRef.current;
      const isTitle = appStateRef.current === 'title';
      houseHandles.groundFloorGroup.visible = true;
      houseHandles.firstFloorGroup.visible = cut !== 'ground_only';
      // Keep roof on for title / exterior hero shots; hide only for plan cutaways
      houseHandles.roofGroup.visible =
        isTitle || cut === 'all' || cut === 'first_only';
      if (cut === 'first_only') {
        houseHandles.roofGroup.visible = false;
      }

      // 2. Lighting preset — apply only when changed (was thrashing GPU every frame)
      const preset = lightingPresetRef.current;
      if (preset !== lastAppliedPreset) {
        lastAppliedPreset = preset;
        visualFx.setPreset(preset);
        sky.visible = preset !== 'night_warm';
        if (preset === 'daylight') {
          scene.background = new THREE.Color(0x7f97b0);
          if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color.setHex(0x849ab2);
            scene.fog.density = 0.0075;
          }
          scene.environmentIntensity = 0.16;
          sunLight.color.setHex(0xfff2e0);
          sunLight.intensity = 0.82;
          hemiLight.intensity = 0.35;
          hemiLight.color.setHex(0xc8d8e8);
          rimLight.intensity = 0.14;
          skyUniforms['turbidity'].value = 3.2;
          skyUniforms['rayleigh'].value = 1.15;
          applySkySun(42, 155);
          sunLight.position.copy(sunPosition).multiplyScalar(42);
          houseHandles.archLighting.setIntensityScale(0.28);
          houseHandles.interiorLighting.setDayScale(0.88);
        } else if (preset === 'golden_hour') {
          scene.background = new THREE.Color(0x8f6a4a);
          if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color.setHex(0x8f6a4a);
            scene.fog.density = 0.006;
          }
          scene.environmentIntensity = 0.18;
          sunLight.color.setHex(0xff9a4a);
          sunLight.intensity = 0.85;
          hemiLight.intensity = 0.28;
          hemiLight.color.setHex(0x7a90b0);
          rimLight.intensity = 0.15;
          skyUniforms['turbidity'].value = 5.5;
          skyUniforms['rayleigh'].value = 1.8;
          applySkySun(10, 178);
          sunLight.position.copy(sunPosition).multiplyScalar(38);
          houseHandles.archLighting.setIntensityScale(0.7);
          houseHandles.interiorLighting.setDayScale(1.05);
        } else {
          scene.background = new THREE.Color(0x0a1220);
          if (scene.fog instanceof THREE.FogExp2) {
            scene.fog.color.setHex(0x0a1220);
            scene.fog.density = 0.009;
          }
          scene.environmentIntensity = 0.08;
          sunLight.color.setHex(0x6b8cff);
          sunLight.intensity = 0.12;
          hemiLight.intensity = 0.1;
          hemiLight.color.setHex(0x4a6090);
          rimLight.intensity = 0.08;
          houseHandles.archLighting.setIntensityScale(1.05);
          houseHandles.interiorLighting.setDayScale(1.25);
        }
      }

      // 3. Spin Ceiling Fans & Smoothly Interpolate Hinged Doors
      for (const fan of houseHandles.ceilingFans) {
        fan.rotation.y += dt * 3.2;
      }
      for (const door of doorsRef.current) {
        const pivot = houseHandles.doorPivots.get(door.id);
        if (pivot) {
          const targetRot = door.isOpen ? door.swingDir * (Math.PI * 0.48) : 0;
          pivot.rotation.y = THREE.MathUtils.damp(
            pivot.rotation.y,
            targetRot,
            8,
            dt
          );
        }
      }

      // 4. Advance Camera & Player Physics based on AppState
      if (appStateRef.current === 'title') {
        orbitControls.enabled = false;
        titleOrbitAngle += dt * 0.12;
        const centerX = ft(20);
        const centerZ = -ft(18);
        // Elevated three-quarter hero orbit (matches reference exterior shots)
        camera.position.set(
          centerX + Math.sin(titleOrbitAngle) * 24,
          14.5,
          centerZ + Math.cos(titleOrbitAngle) * 26
        );
        camera.lookAt(centerX, ft(7.5), centerZ);
      } else if (appStateRef.current === 'playing') {
        if (cameraModeRef.current === 'dollhouse_orbit') {
          if (!orbitControls.enabled) {
            orbitControls.enabled = true;
            camera.position.set(ft(20) + 14, 16, -ft(20) + 16);
            orbitControls.target.set(ft(20), ft(5), -ft(20));
          }
          orbitControls.update();
        } else {
          orbitControls.enabled = false;
          const p = playerRef.current;
          const keys = keysRef.current;

          // Keyboard & Virtual Turn (smooth)
          let turnInput = virtualMoveRef.current.turn;
          if (keys.has('KeyQ')) turnInput += 1;
          if (keys.has('ArrowLeft')) turnInput += 0.9;
          if (keys.has('ArrowRight')) turnInput -= 0.9;
          p.yaw += turnInput * 2.05 * dt;

          // Desired move direction (accelerated velocity for natural feel)
          let moveFwd = virtualMoveRef.current.forward;
          let moveStrafe = virtualMoveRef.current.strafe;
          if (keys.has('KeyW') || keys.has('ArrowUp')) moveFwd += 1;
          if (keys.has('KeyS') || keys.has('ArrowDown')) moveFwd -= 1;
          if (keys.has('KeyA')) moveStrafe -= 1;
          if (keys.has('KeyD')) moveStrafe += 1;

          const isSprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
          const maxSpeed = isSprinting ? 15.5 : 9.8;
          const accel = isSprinting ? 38 : 28;
          const friction = 14;

          const fwdGx = -Math.sin(p.yaw);
          const fwdGz = Math.cos(p.yaw);
          const rightGx = Math.cos(p.yaw);
          const rightGz = Math.sin(p.yaw);

          let dirGx = fwdGx * moveFwd + rightGx * moveStrafe;
          let dirGz = fwdGz * moveFwd + rightGz * moveStrafe;
          const len = Math.hypot(dirGx, dirGz);
          if (len > 0.001) {
            dirGx /= len;
            dirGz /= len;
            p.vx += dirGx * accel * dt;
            p.vz += dirGz * accel * dt;
          } else {
            p.vx = THREE.MathUtils.damp(p.vx, 0, friction, dt);
            p.vz = THREE.MathUtils.damp(p.vz, 0, friction, dt);
          }

          const speed = Math.hypot(p.vx, p.vz);
          if (speed > maxSpeed) {
            p.vx = (p.vx / speed) * maxSpeed;
            p.vz = (p.vz / speed) * maxSpeed;
          }

          if (Math.hypot(p.vx, p.vz) > 0.02) {
            const nextGx = p.gx + p.vx * dt;
            const nextGz = p.gz + p.vz * dt;

            const resolved = resolvePlayerMovement(
              p.gx,
              p.gz,
              p.gy,
              nextGx,
              nextGz,
              0.85,
              doorsRef.current,
              propsRef.current
            );
            const distMoved = Math.hypot(resolved.gx - p.gx, resolved.gz - p.gz);
            // Kill velocity component into walls for sticky-free sliding
            if (resolved.hitWall) {
              if (Math.abs(resolved.gx - nextGx) > 0.001) p.vx *= 0.15;
              if (Math.abs(resolved.gz - nextGz) > 0.001) p.vz *= 0.15;
            }
            p.gx = resolved.gx;
            p.gz = resolved.gz;
            p.walkBobDist += distMoved;
            p.stepAccum += distMoved;
            if (p.stepAccum >= 4.6) {
              p.stepAccum = 0;
              playArchitecturalSound('step', mutedRef.current);
            }
          }

          // Vertical physics (staircase smooth stepping + jump)
          const floorElevFt = getFloorElevationFt(p.gx, p.gz, p.gy);
          if (p.gy > floorElevFt + 0.05 || p.vy > 0) {
            p.vy -= 32.17 * dt;
            p.gy += p.vy * dt;
            if (p.gy <= floorElevFt) {
              p.gy = floorElevFt;
              p.vy = 0;
            }
          } else {
            p.gy = THREE.MathUtils.damp(p.gy, floorElevFt, 14, dt);
            p.vy = 0;
          }

          // Update Held Physics Prop in front of player
          if (grabbedIdRef.current) {
            const holdGx = p.gx + fwdGx * 3.2;
            const holdGz = p.gz + fwdGz * 3.2;
            const holdGy = p.gy + 2.8;
            propsRef.current = propsRef.current.map((item) =>
              item.id === grabbedIdRef.current
                ? {
                    ...item,
                    gx: THREE.MathUtils.damp(item.gx, holdGx, 16, dt),
                    gz: THREE.MathUtils.damp(item.gz, holdGz, 16, dt),
                    gy: THREE.MathUtils.damp(item.gy, holdGy, 16, dt),
                  }
                : item
            );
          }

          // Step gravity on dropped/tossed props
          propsRef.current = stepPropsPhysics(propsRef.current, dt);
          syncDynamicPropMeshes();

          // Set First-Person Eye Camera Pose (eye height = 5'-4" above current floor)
          const eyeHeightFt = 5.35 + Math.sin(p.walkBobDist * 1.6) * 0.06;
          const camX = p.gx * FT_TO_M;
          const camY = (p.gy + eyeHeightFt) * FT_TO_M;
          const camZ = -p.gz * FT_TO_M;

          camera.position.set(camX, camY, camZ);
          const lookDist = 10;
          const lookX =
            camX - Math.sin(p.yaw) * Math.cos(p.pitch) * lookDist;
          const lookY = camY + Math.sin(p.pitch) * lookDist;
          const lookZ =
            camZ - Math.cos(p.yaw) * Math.cos(p.pitch) * lookDist;
          camera.lookAt(lookX, lookY, lookZ);

          // Throttle React HUD state updates to ~6Hz
          hudSyncAccum += dt;
          if (hudSyncAccum >= 0.16) {
            hudSyncAccum = 0;
            const curRoom = findRoomAt(p.gx, p.gz, p.gy);
            setActiveRoom((prev) => (prev.id === curRoom.id ? prev : curRoom));
            setPlayerCoordsFt({
              gx: Number(p.gx.toFixed(1)),
              gy: Number(p.gy.toFixed(1)),
              gz: Number(p.gz.toFixed(1)),
              yaw: Number(p.yaw.toFixed(2)),
            });
            const nd = findNearestDoor(p.gx, p.gz, p.gy, doorsRef.current, 7.5);
            setNearestDoor(nd);
          }
        }
      }

      visualFx.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      domEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      orbitControls.dispose();
      visualFx.dispose();
      renderer.dispose();
    };
  }, []);

  // ==================== UNIFIED KEYBOARD INPUT HYGIENE ====================
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Title screen start shortcuts
      if (appStateRef.current === 'title') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartExploration();
        }
        return;
      }

      // One-shot edge triggers
      if (!e.repeat) {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          if (blueprintOpen) {
            setBlueprintOpen(false);
          } else {
            setAppState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
          }
          return;
        }
        if (e.code === 'KeyB') {
          setBlueprintOpen((prev) => !prev);
          return;
        }
        if (e.code === 'KeyH') {
          setDockCollapsed((prev) => !prev);
          return;
        }
        if (e.code === 'KeyM') {
          setMuted((prev) => !prev);
          return;
        }
        if (e.code === 'KeyE') {
          handleToggleDoor();
          return;
        }
        if (e.code === 'KeyF') {
          handleGrabOrDropProp(false);
          return;
        }
        if (e.code === 'KeyG') {
          handleGrabOrDropProp(true);
          return;
        }
        if (e.code === 'KeyR') {
          handleRotateActiveProp();
          return;
        }
        if (e.code === 'Space' && appStateRef.current === 'playing') {
          e.preventDefault();
          const p = playerRef.current;
          const floorY = getFloorElevationFt(p.gx, p.gz, p.gy);
          if (Math.abs(p.gy - floorY) < 0.4) {
            p.vy = 11.5;
          }
        }
      }

      keysRef.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const onBlur = () => {
      keysRef.current.clear();
      virtualMoveRef.current = { forward: 0, turn: 0, strafe: 0 };
      document.exitPointerLock?.();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    blueprintOpen,
    handleGrabOrDropProp,
    handleRotateActiveProp,
    handleStartExploration,
    handleToggleDoor,
  ]);

  const groundRooms = ARCHITECTURAL_ROOMS.filter(
    (r) => r.floor === 'ground' || r.floor === 'outdoor'
  );
  const firstRooms = ARCHITECTURAL_ROOMS.filter((r) => r.floor === 'first');

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0c0f14] select-none">
      {/* 1. ISOLATED WEBGL CANVAS MOUNT */}
      <div
        ref={canvasMountRef}
        data-testid="architectural-canvas"
        className="fixed inset-0 w-full h-full z-0"
      />

      {/* 2. TITLE SCREEN — brand-led, single composition hero */}
      {appState === 'title' && (
        <div className="fixed inset-0 z-30 flex flex-col justify-between p-6 md:p-10 lg:p-14 pointer-events-auto ui-scrim-title">
          <header className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 44 44" className="w-11 h-11">
                  <rect x="2" y="2" width="40" height="40" rx="6" fill="#141b26" stroke="#d4a017" strokeWidth="2" />
                  <path d="M8 26 L22 12 L36 26 M13 24 V34 H31 V24" fill="none" stroke="#f4f1ea" strokeWidth="2.2" />
                  <rect x="19" y="26" width="6" height="8" fill="#d4a017" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs font-semibold tracking-[0.14em] text-amber-400/95 uppercase">
                  Studio Red
                </p>
                <p className="text-xs text-slate-300/90">Chartered Architects · Yatiyana</p>
              </div>
            </div>
            <p className="hidden md:block text-xs text-slate-300/80 font-mono tabular-nums text-right">
              2,262.45 sq.ft · Scale 8′ = 1″
            </p>
          </header>

          <div className="max-w-xl my-auto space-y-6">
            <p className="text-[11px] font-mono tracking-[0.18em] text-amber-300/90 uppercase">
              Spatial Twin · Ground &amp; First Floor Option 03
            </p>
            <h1 className="text-[2.35rem] sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight text-white font-display leading-[1.08]">
              Kapila Residence
            </h1>
            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-md">
              Walk the 1:1 digital twin — accurate rooms, dog-leg stair, double-height void,
              car porch, and gardens — with smooth first-person movement and plan-aligned detailing.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-start="true"
                onClick={handleStartExploration}
                className="ui-btn-primary"
              >
                Start walkthrough
              </button>
              <button
                type="button"
                onClick={() => {
                  handleStartExploration();
                  setBlueprintOpen(true);
                }}
                className="ui-btn-secondary"
              >
                View floor plans
              </button>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
            Click viewport to look · WASD move · Shift sprint · E doors · B plans · Esc pause
          </p>
        </div>
      )}

      {/* 3. PLAYING HUD — slim perimeter chrome, clear viewport */}
      {appState !== 'title' && (
        <div className="hud-root">
          {/* Subtle center reticle only (door hint sits bottom-right, not stacked mid-screen) */}
          {cameraMode === 'first_person' && (
            <div className="hud-reticle" aria-hidden="true">
              <span className="hud-reticle-dot" />
            </div>
          )}

          {/* Top bar */}
          <header className="hud-top">
            <button
              type="button"
              className="hud-room-chip"
              onClick={() => setBlueprintOpen(true)}
              title="Open blueprint map [B]"
            >
              <span className="hud-room-code">{activeRoom.code}</span>
              <span data-testid="active-room-name" className="hud-room-name">
                {activeRoom.name.split(' (')[0]}
              </span>
              <span className="hud-room-meta">{activeRoom.levelLabel.replace(' LEVEL', '')}</span>
            </button>

            <div className="hud-top-actions">
              <button type="button" className="hud-icon-btn hud-icon-btn-accent" onClick={() => setBlueprintOpen(true)}>
                Plans
              </button>
              <button
                type="button"
                className="hud-icon-btn"
                aria-label={muted ? 'Unmute' : 'Mute'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setMuted((m) => !m);
                }}
              >
                {muted ? 'Unmute' : 'Sound'}
              </button>
              <button
                type="button"
                className="hud-icon-btn"
                aria-label="Pause"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setAppState((s) => (s === 'paused' ? 'playing' : 'paused'));
                }}
              >
                Pause
              </button>
            </div>
          </header>

          {/* Bottom-left: touch move pad (hidden on large desktop via CSS if preferred — keep for accessibility) */}
          {cameraMode === 'first_person' && (
            <div className="hud-move-wrap pointer-events-auto" role="group" aria-label="Movement">
              <div className="ui-move-pad ui-move-pad-compact">
                <button type="button" className="ui-pad-btn" aria-label="Strafe left"
                  onPointerDown={() => { virtualMoveRef.current.strafe = -1; }}
                  onPointerUp={() => { virtualMoveRef.current.strafe = 0; }}
                  onPointerLeave={() => { virtualMoveRef.current.strafe = 0; }}>A</button>
                <button type="button" className="ui-pad-btn ui-pad-btn-accent" aria-label="Forward"
                  onPointerDown={() => { virtualMoveRef.current.forward = 1; }}
                  onPointerUp={() => { virtualMoveRef.current.forward = 0; }}
                  onPointerLeave={() => { virtualMoveRef.current.forward = 0; }}>W</button>
                <button type="button" className="ui-pad-btn" aria-label="Strafe right"
                  onPointerDown={() => { virtualMoveRef.current.strafe = 1; }}
                  onPointerUp={() => { virtualMoveRef.current.strafe = 0; }}
                  onPointerLeave={() => { virtualMoveRef.current.strafe = 0; }}>D</button>
                <button type="button" className="ui-pad-btn" aria-label="Turn left"
                  onPointerDown={() => { virtualMoveRef.current.turn = 1; }}
                  onPointerUp={() => { virtualMoveRef.current.turn = 0; }}
                  onPointerLeave={() => { virtualMoveRef.current.turn = 0; }}>↺</button>
                <button type="button" className="ui-pad-btn" aria-label="Back"
                  onPointerDown={() => { virtualMoveRef.current.forward = -1; }}
                  onPointerUp={() => { virtualMoveRef.current.forward = 0; }}
                  onPointerLeave={() => { virtualMoveRef.current.forward = 0; }}>S</button>
                <button type="button" className="ui-pad-btn" aria-label="Turn right"
                  onPointerDown={() => { virtualMoveRef.current.turn = -1; }}
                  onPointerUp={() => { virtualMoveRef.current.turn = 0; }}
                  onPointerLeave={() => { virtualMoveRef.current.turn = 0; }}>↻</button>
              </div>
            </div>
          )}

          {/* Bottom-right contextual actions — only when relevant */}
          <div className="hud-context pointer-events-auto">
            {nearestDoor && (
              <button type="button" className="hud-context-btn" onClick={() => handleToggleDoor()}>
                {nearestDoor.isOpen ? 'Close' : 'Open'} {nearestDoor.code}
                <kbd>E</kbd>
              </button>
            )}
            <button type="button" className="hud-context-btn" onClick={() => handleGrabOrDropProp(false)}>
              {grabbedPropId ? 'Release' : 'Grab'}
              <kbd>F</kbd>
            </button>
          </div>

          {/* Bottom toolbar — always one slim row; expand for rooms/furnish */}
          <footer className="hud-bottom pointer-events-auto">
            <div className="hud-toolbar">
              <div className="hud-seg">
                <button
                  type="button"
                  className={cameraMode === 'first_person' ? 'hud-seg-active' : ''}
                  onClick={() => setCameraMode('first_person')}
                >
                  Walk
                </button>
                <button
                  type="button"
                  className={cameraMode === 'dollhouse_orbit' ? 'hud-seg-active' : ''}
                  onClick={() => {
                    setCameraMode('dollhouse_orbit');
                    if (floorCutaway === 'all') setFloorCutaway('first_only');
                  }}
                >
                  Orbit
                </button>
              </div>

              <div className="hud-seg">
                <button type="button" className={floorCutaway === 'all' ? 'hud-seg-active' : ''} onClick={() => setFloorCutaway('all')}>Full</button>
                <button type="button" className={floorCutaway === 'first_only' ? 'hud-seg-active' : ''} onClick={() => setFloorCutaway('first_only')}>1F</button>
                <button type="button" className={floorCutaway === 'ground_only' ? 'hud-seg-active' : ''} onClick={() => setFloorCutaway('ground_only')}>GF</button>
              </div>

              <div className="hud-seg">
                <button type="button" className={lightingPreset === 'daylight' ? 'hud-seg-active' : ''} onClick={() => setLightingPreset('daylight')}>Day</button>
                <button type="button" className={lightingPreset === 'golden_hour' ? 'hud-seg-active' : ''} onClick={() => setLightingPreset('golden_hour')}>Golden</button>
                <button type="button" className={lightingPreset === 'night_warm' ? 'hud-seg-active' : ''} onClick={() => setLightingPreset('night_warm')}>Blue</button>
              </div>

              <div className="hud-seg">
                <button
                  type="button"
                  className={!dockCollapsed && dockTab === 'navigate' ? 'hud-seg-active' : ''}
                  onClick={() => {
                    if (!dockCollapsed && dockTab === 'navigate') setDockCollapsed(true);
                    else {
                      setDockTab('navigate');
                      setDockCollapsed(false);
                    }
                  }}
                >
                  Rooms
                </button>
                <button
                  type="button"
                  className={!dockCollapsed && dockTab === 'furnish' ? 'hud-seg-active' : ''}
                  onClick={() => {
                    if (!dockCollapsed && dockTab === 'furnish') setDockCollapsed(true);
                    else {
                      setDockTab('furnish');
                      setDockCollapsed(false);
                    }
                  }}
                >
                  Furnish
                </button>
              </div>

              <button
                type="button"
                className="hud-toolbar-toggle"
                onClick={() => setDockCollapsed((c) => !c)}
                aria-expanded={!dockCollapsed}
                title="Toggle panel [H]"
              >
                {dockCollapsed ? '▴' : '▾'}
              </button>
            </div>

            {!dockCollapsed && (
              <div className="hud-panel">
                {dockTab === 'navigate' ? (
                  <div className="hud-panel-scroll">
                    <div className="hud-panel-row">
                      <span className="hud-panel-label">Ground</span>
                      {groundRooms.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className={activeRoom.id === r.id ? 'hud-chip hud-chip-active' : 'hud-chip'}
                          onClick={() => handleTeleportToRoom(r)}
                        >
                          {r.name.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                    <div className="hud-panel-row">
                      <span className="hud-panel-label hud-panel-label-sky">First</span>
                      {firstRooms.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className={activeRoom.id === r.id ? 'hud-chip hud-chip-active' : 'hud-chip'}
                          onClick={() => handleTeleportToRoom(r)}
                        >
                          {r.name.split(' (')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="hud-panel-scroll hud-panel-furnish">
                    {PLACEABLE_CATALOG.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        className={
                          selectedCatalogType === item.type
                            ? 'hud-chip hud-chip-active'
                            : 'hud-chip'
                        }
                        onClick={() => setSelectedCatalogType(item.type)}
                      >
                        {item.name}
                      </button>
                    ))}
                    <button type="button" className="hud-chip hud-chip-cta" onClick={() => handlePlaceCatalogItem(selectedCatalogType)}>
                      Place
                    </button>
                    <button type="button" className="hud-chip" onClick={handleRotateActiveProp}>Rotate</button>
                    <button type="button" className="hud-chip" onClick={handleRemoveLastProp}>Undo</button>
                  </div>
                )}
                <p data-testid="hud-status-banner" className="hud-status">{statusBanner}</p>
              </div>
            )}
          </footer>
        </div>
      )}

      {/* 4. PAUSE & ARCHITECTURAL SPECIFICATION MODAL */}
      {appState === 'paused' && (
        <div
          role="dialog"
          aria-label="Walkthrough Paused & Architectural Summary"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 pointer-events-auto"
        >
          <div className="w-full max-w-lg rounded-xl border border-amber-500/30 bg-[#101620] p-6 text-[#f4f1ea] shadow-2xl space-y-5">
            <div>
              <div className="text-xs font-mono text-amber-400">
                STUDIO RED · YATIYANA RESIDENCE
              </div>
              <h2 className="text-2xl font-bold text-white font-display mt-1">
                Architectural Walkthrough Paused
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Proposed Residence for Mr. Kapila Liyanage · Ground Floor &amp;
                First Floor Option 03
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-[#161f2e] border border-white/10">
                <div className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                  2,262
                </div>
                <div className="text-[11px] text-slate-300">Total Sq.Ft</div>
              </div>
              <div className="p-3 rounded-lg bg-[#161f2e] border border-white/10">
                <div className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                  19
                </div>
                <div className="text-[11px] text-slate-300">Spatial Zones</div>
              </div>
              <div className="p-3 rounded-lg bg-[#161f2e] border border-white/10">
                <div className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                  {placedProps.length}
                </div>
                <div className="text-[11px] text-slate-300">Physics Props</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 font-mono bg-[#0b0f17] p-3.5 rounded-lg border border-white/10">
              <div>• Move &amp; Climb Stairs: WASD or Arrow Keys (Shift to Sprint)</div>
              <div>• Look Around: Drag Mouse on Viewport or Turn L/R</div>
              <div>• Open / Close Doors (D1–DW3): Press [E] or click Door Button</div>
              <div>• Grab / Place / Toss Physics Props: Press [F] / [G] / [R]</div>
              <div>• 2D Blueprint CAD &amp; Original PDFs: Press [B]</div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAppState('title')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                Return to Title Showcase
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppState('playing');
                  setBlueprintOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 transition-colors cursor-pointer"
              >
                Inspect 2D Plans
              </button>
              <button
                type="button"
                data-start="true"
                onClick={() => setAppState('playing')}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                Resume Walkthrough
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE 2D BLUEPRINT & ORIGINAL ARCHITECT PDF MODAL */}
      <BlueprintInspectorModal
        isOpen={blueprintOpen}
        onClose={() => setBlueprintOpen(false)}
        playerGx={playerCoordsFt.gx}
        playerGz={playerCoordsFt.gz}
        playerGy={playerCoordsFt.gy}
        playerYaw={playerCoordsFt.yaw}
        doors={doors}
        placedProps={placedProps}
        onTeleportToRoom={handleTeleportToRoom}
        onToggleDoor={handleToggleDoor}
      />
    </main>
  );
}
