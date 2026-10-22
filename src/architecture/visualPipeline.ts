/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Exposure-safe post stack. Bloom is OFF for Day/Golden (it was white-washing
 * interiors). Optional soft bloom only for Blue Hour.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export interface VisualPipeline {
  setPreset: (preset: 'daylight' | 'golden_hour' | 'night_warm') => void;
  setSize: (w: number, h: number) => void;
  render: (scene: THREE.Scene, camera: THREE.Camera) => void;
  dispose: () => void;
}

export function createVisualPipeline(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  width: number,
  height: number,
  isSoftwareGl: boolean
): VisualPipeline {
  // Avoid double tone-mapping: OutputPass owns tone mapping when composer is used
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;

  const composerDpr = isSoftwareGl ? 1 : Math.min(renderer.getPixelRatio(), 1.25);
  const composer = new EffectComposer(renderer);
  composer.setSize(width, height);
  composer.setPixelRatio(composerDpr);

  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.12,
    0.25,
    0.98
  );
  bloom.enabled = false;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let useComposer = false; // Day/Golden = direct render (no bloom washout)

  const setPreset = (preset: 'daylight' | 'golden_hour' | 'night_warm') => {
    if (preset === 'daylight') {
      bloom.enabled = false;
      useComposer = false;
      renderer.toneMappingExposure = 0.62;
    } else if (preset === 'golden_hour') {
      bloom.enabled = false;
      useComposer = false;
      renderer.toneMappingExposure = 0.65;
    } else {
      // Blue hour only — very conservative bloom on fixtures
      bloom.enabled = !isSoftwareGl;
      bloom.strength = 0.18;
      bloom.radius = 0.3;
      bloom.threshold = 0.92;
      useComposer = !isSoftwareGl;
      renderer.toneMappingExposure = 0.6;
    }
  };

  setPreset('daylight');

  return {
    setPreset,
    setSize: (w, h) => composer.setSize(w, h),
    render: (sc, cam) => {
      if (useComposer) {
        composer.render();
      } else {
        renderer.render(sc, cam);
      }
    },
    dispose: () => composer.dispose(),
  };
}
