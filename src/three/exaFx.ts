import * as THREE from 'three/src/Three.js';
import { SHOT_R, SHOT_STEPS } from '../config';
import { SPREAD_OFFSETS, stepDistance, TRAVEL, type Volley } from '../game/lanes';
import { activeGroundFade, firingStep, residualFade, warningArrowFrame } from './exaAnimation';
import { EXA_VISUAL } from './exaVisual';
import {
  type BasicMesh,
  chevron,
  createExplosionDiscResources,
  disposeExplosionDiscResources,
  explosionDisc,
  type ExplosionDiscResources,
  flatDisc,
  flatRing,
  markSharedResource,
} from './primitives';

export type VolleyPhase = 'idle' | 'warning' | 'firing' | 'ended';

interface ParticleFx {
  mesh: BasicMesh;
  angle: number;
  lift: number;
}

interface ShotFx {
  root: THREE.Group;
  fill: BasicMesh;
  rim: BasicMesh;
  surface: BasicMesh;
  flare: BasicMesh;
  smoke: ParticleFx[];
  debris: ParticleFx[];
}

interface WarningFx {
  root: THREE.Group;
  disc: THREE.Group;
  arrows: THREE.Group;
}

interface LaneFx {
  warning: WarningFx;
  shots: ShotFx[];
}

export interface VolleyFx {
  root: THREE.Group;
  lanes: LaneFx[];
}

export interface ExaFxResources {
  explosionDisc: ExplosionDiscResources;
  flareGeometry: THREE.SphereGeometry;
  smokeGeometries: THREE.SphereGeometry[];
  debrisGeometries: THREE.IcosahedronGeometry[];
}

export function createExaFxResources(): ExaFxResources {
  const { flare, smoke, debris } = EXA_VISUAL;
  return {
    explosionDisc: createExplosionDiscResources(SHOT_R),
    flareGeometry: markSharedResource(
      new THREE.SphereGeometry(SHOT_R * flare.geometryRadius, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    ),
    smokeGeometries: Array.from({ length: smoke.count }, (_, index) =>
      markSharedResource(new THREE.SphereGeometry(SHOT_R * (smoke.radius + index * smoke.radiusStep), 12, 7)),
    ),
    debrisGeometries: Array.from({ length: debris.geometryCount }, (_, index) =>
      markSharedResource(new THREE.IcosahedronGeometry(SHOT_R * (debris.radius + index * debris.radiusStep), 0)),
    ),
  };
}

export function disposeExaFxResources(resources: ExaFxResources): void {
  disposeExplosionDiscResources(resources.explosionDisc);
  resources.flareGeometry.dispose();
  for (const geometry of [...resources.smokeGeometries, ...resources.debrisGeometries]) geometry.dispose();
}

export function volleyRotation(v: Volley): number {
  const travel = TRAVEL[v.source];
  return Math.atan2(travel.x, travel.z);
}

function setGroupOpacity(root: THREE.Object3D, factor: number): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshBasicMaterial)) return;
    const baseOpacity = object.material.userData.baseOpacity;
    object.material.opacity = (typeof baseOpacity === 'number' ? baseOpacity : 1) * factor;
  });
}

function createWarningFx(x: number, z: number, arrowOpacities: readonly number[]): WarningFx {
  const warning = EXA_VISUAL.warning;
  const root = new THREE.Group();
  const disc = new THREE.Group();
  disc.add(flatDisc(SHOT_R, warning.fillColor, warning.fillOpacity, 3));
  disc.add(flatRing(SHOT_R * warning.rimInnerRatio, SHOT_R, warning.rimColor, warning.rimOpacity, 4));
  disc.add(
    flatRing(
      SHOT_R * warning.glowInnerRatio,
      SHOT_R * warning.glowOuterRatio,
      warning.innerGlowColor,
      warning.innerGlowOpacity,
      3,
    ),
  );
  disc.position.set(x, 0.2, z);

  const arrows = new THREE.Group();
  for (const opacity of arrowOpacities) {
    arrows.add(
      chevron(
        x,
        z + SHOT_R * warning.arrowTipOffset,
        z + SHOT_R * warning.arrowSideOffset,
        warning.arrowHeight,
        opacity,
      ),
    );
  }
  root.add(disc, arrows);
  return { root, disc, arrows };
}

function createShotFx(x: number, z: number, resources: ExaFxResources): ShotFx {
  const { explosion, flare: flareStyle, smoke: smokeStyle, debris: debrisStyle } = EXA_VISUAL;
  const root = new THREE.Group();
  const fill = flatDisc(SHOT_R, explosion.initialFillColor, explosion.initialFillOpacity, 4);
  const rim = flatRing(
    SHOT_R * explosion.rimInnerRatio,
    SHOT_R,
    explosion.initialRimColor,
    explosion.initialRimOpacity,
    5,
  );
  const surface = explosionDisc(SHOT_R, 0.94, 6, resources.explosionDisc);
  const flare: BasicMesh = new THREE.Mesh(
    resources.flareGeometry,
    new THREE.MeshBasicMaterial({
      color: flareStyle.color,
      transparent: true,
      opacity: flareStyle.initialOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  flare.renderOrder = 7;

  const smoke = resources.smokeGeometries.map((geometry, index): ParticleFx => {
    const mesh: BasicMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: smokeStyle.colors[index % smokeStyle.colors.length],
        transparent: true,
        opacity: smokeStyle.initialOpacity,
        depthWrite: false,
      }),
    );
    mesh.renderOrder = 7;
    return {
      mesh,
      angle: (index / smokeStyle.count) * Math.PI * 2 + smokeStyle.angleOffset,
      lift: smokeStyle.lift + index * smokeStyle.liftStep,
    };
  });

  const debris = Array.from({ length: debrisStyle.count }, (_, index): ParticleFx => {
    const mesh: BasicMesh = new THREE.Mesh(
      resources.debrisGeometries[index % resources.debrisGeometries.length],
      new THREE.MeshBasicMaterial({ color: debrisStyle.colors[index % debrisStyle.colors.length] }),
    );
    mesh.renderOrder = 8;
    return {
      mesh,
      angle: (index / debrisStyle.count) * Math.PI * 2 + debrisStyle.angleOffset,
      lift: debrisStyle.lift + (index % 4) * debrisStyle.liftStep,
    };
  });

  surface.visible = false;
  flare.visible = false;
  for (const particle of [...smoke, ...debris]) particle.mesh.visible = false;
  root.add(fill, rim, surface, flare, ...smoke.map((p) => p.mesh), ...debris.map((p) => p.mesh));
  root.position.set(x, 0.28, z);
  root.visible = false;
  return { root, fill, rim, surface, flare, smoke, debris };
}

export function createVolleyFx(v: Volley, resources: ExaFxResources): VolleyFx {
  const root = new THREE.Group();
  root.rotation.y = volleyRotation(v);
  const entry = stepDistance(0);
  const lanes = SPREAD_OFFSETS[v.spread].map((offset): LaneFx => {
    const warning = createWarningFx(offset, entry, EXA_VISUAL.warning.arrowOpacities);
    warning.disc.visible = false;
    warning.arrows.visible = false;
    const shots = Array.from({ length: SHOT_STEPS }, (_, index) =>
      createShotFx(offset, stepDistance(index), resources),
    );
    root.add(warning.root, ...shots.map((shot) => shot.root));
    return { warning, shots };
  });
  return { root, lanes };
}

function updateWarning(warning: WarningFx, phase: VolleyPhase, progress: number): void {
  const visible = phase === 'warning';
  warning.disc.visible = visible;
  warning.disc.scale.setScalar(1);
  warning.arrows.visible = visible;
  warning.arrows.children.forEach((arrow, trailIndex) => {
    const frame = warningArrowFrame(progress, trailIndex);
    arrow.visible = frame.visible;
    arrow.position.z = frame.zOffset;
    setGroupOpacity(arrow, frame.opacity);
  });
}

function updateActiveShot(shot: ShotFx, progress: number): void {
  const groundFade = activeGroundFade(progress);
  const { explosion, flare, smoke, debris } = EXA_VISUAL;
  shot.root.visible = true;
  shot.root.scale.setScalar(explosion.baseScale + Math.sin(progress * Math.PI) * explosion.pulseScale);
  shot.fill.material.color.setHex(explosion.fillColor);
  shot.fill.material.opacity = explosion.activeFillOpacity * groundFade.fill;
  shot.rim.material.color.setHex(explosion.rimColor);
  shot.rim.material.opacity = explosion.activeRimOpacity * groundFade.rim;
  shot.surface.visible = true;
  shot.surface.material.opacity = explosion.activeSurfaceOpacity * groundFade.surface;
  shot.flare.visible = progress < flare.visibleUntil;
  shot.flare.position.y = SHOT_R * (flare.startHeight + progress * flare.travelHeight);
  shot.flare.scale.set(
    1 + progress * flare.horizontalGrowth,
    flare.startVerticalScale + progress * flare.verticalGrowth,
    1 + progress * flare.horizontalGrowth,
  );
  shot.flare.material.opacity = Math.max(0, flare.opacity * (1 - progress / flare.visibleUntil));

  for (const particle of shot.smoke) {
    const spread = SHOT_R * (smoke.spread + progress * smoke.spreadGrowth);
    particle.mesh.visible = progress > smoke.visibleAfter;
    particle.mesh.position.set(
      Math.cos(particle.angle) * spread,
      SHOT_R * (smoke.startHeight + progress * particle.lift),
      Math.sin(particle.angle) * spread,
    );
    particle.mesh.scale.setScalar(smoke.scale + progress * smoke.scaleGrowth);
    particle.mesh.material.opacity = Math.max(0, smoke.opacity * (1 - progress * smoke.opacityDecay));
  }
  shot.debris.forEach((particle, index) => {
    const spread = SHOT_R * progress * (debris.spread + (index % debris.geometryCount) * debris.spreadStep);
    particle.mesh.visible = progress > debris.visibleAfter && progress < debris.visibleUntil;
    particle.mesh.position.set(
      Math.cos(particle.angle) * spread,
      SHOT_R * (debris.startHeight + debris.arcHeight * progress * (1 - progress) * particle.lift),
      Math.sin(particle.angle) * spread,
    );
    particle.mesh.rotation.set(progress * (4 + index), progress * (6 + index), progress * 3);
  });
}

function updateResidualShot(shot: ShotFx, progress: number): void {
  const fade = residualFade(progress);
  const explosion = EXA_VISUAL.explosion;
  shot.root.visible = fade > 0;
  shot.root.scale.setScalar(1);
  shot.fill.material.color.setHex(explosion.residualFillColor);
  shot.fill.material.opacity = explosion.residualFillOpacity * fade;
  shot.rim.material.color.setHex(explosion.residualRimColor);
  shot.rim.material.opacity = explosion.residualRimOpacity * fade;
  shot.surface.visible = true;
  shot.surface.material.opacity = explosion.residualSurfaceOpacity * fade;
  shot.flare.visible = false;
  for (const particle of [...shot.smoke, ...shot.debris]) particle.mesh.visible = false;
}

export function updateVolleyFx(fx: VolleyFx, phase: VolleyPhase, progress: number): void {
  for (const lane of fx.lanes) {
    updateWarning(lane.warning, phase, progress);
    if (phase !== 'firing') {
      for (const shot of lane.shots) shot.root.visible = false;
      continue;
    }
    const step = firingStep(progress);
    lane.shots.forEach((shot, index) => {
      if (index === step.index) updateActiveShot(shot, step.progress);
      else if (index === step.index - 1) updateResidualShot(shot, step.progress);
      else shot.root.visible = false;
    });
  }
}

export function createStaticWarningTelegraph(v: Volley): THREE.Group {
  const root = new THREE.Group();
  root.rotation.y = volleyRotation(v);
  const entry = stepDistance(0);
  for (const offset of SPREAD_OFFSETS[v.spread]) {
    root.add(createWarningFx(offset, entry, [0.9]).root);
  }
  return root;
}
