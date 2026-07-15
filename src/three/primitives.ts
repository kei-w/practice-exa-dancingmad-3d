import * as THREE from 'three/src/Three.js';
import { ARENA_R, LANE_W } from '../config';

export type BasicMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;

const SHARED_RESOURCE = 'sharedResource';

export function markSharedResource<T extends THREE.BufferGeometry | THREE.Texture>(resource: T): T {
  resource.userData[SHARED_RESOURCE] = true;
  return resource;
}

function isSharedResource(resource: THREE.BufferGeometry | THREE.Texture): boolean {
  return resource.userData[SHARED_RESOURCE] === true;
}

export function disposeTree(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as Partial<THREE.Mesh>;
    if (mesh.geometry && !isSharedResource(mesh.geometry)) mesh.geometry.dispose();
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        const mapped = m as THREE.Material & { map?: THREE.Texture };
        if (mapped.map && !isSharedResource(mapped.map)) mapped.map.dispose();
        m.dispose();
      }
    }
  });
}

export function clearGroup(g: THREE.Group): void {
  for (const c of [...g.children]) {
    disposeTree(c);
    g.remove(c);
  }
}

export function makeTextSprite(text: string, color: string, worldH = 5, glow = false): THREE.Sprite {
  const px = 96;
  const pad = glow ? 56 : 28;
  const canvas = document.createElement('canvas');
  const font = `900 ${px}px "Segoe UI","Hiragino Sans","Yu Gothic","Meiryo",sans-serif`;
  const measureCtx = canvas.getContext('2d');
  if (!measureCtx) throw new Error('2D context unavailable');
  measureCtx.font = font;
  canvas.width = Math.ceil(measureCtx.measureText(text).width) + pad * 2;
  canvas.height = px + pad * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (glow) {
    // ネオン風: 色付きのにじみを重ねて、中心を白く光らせる
    ctx.shadowColor = color;
    ctx.shadowBlur = 30;
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx.globalAlpha = 1;
  } else {
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#000';
    ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set((worldH * canvas.width) / canvas.height, worldH, 1);
  sprite.renderOrder = 10;
  return sprite;
}

// 光柱用の縦グラデーションテクスチャ（下が濃く上へ消える＋横縞の質感）
export function makeBeamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0, 'rgba(255,255,255,0.75)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  for (let y = 4; y < 256; y += 10) ctx.fillRect(0, y, 64, 3);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 地面のグロー用ラジアルグラデーションテクスチャ
export function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// エクサ着弾面用。白熱した中心と、放射状に走る亀裂を1枚の加算テクスチャにまとめる。
function makeExplosionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');

  const glow = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
  glow.addColorStop(0, 'rgba(255,155,42,0.82)');
  glow.addColorStop(0.55, 'rgba(255,112,28,0.72)');
  glow.addColorStop(0.88, 'rgba(255,77,20,0.58)');
  glow.addColorStop(1, 'rgba(255,54,10,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);

  let seed = 0x5e71;
  const random = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  ctx.lineCap = 'round';
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + (random() - 0.5) * 0.28;
    let radius = 14 + random() * 8;
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(angle) * radius, 64 + Math.sin(angle) * radius);
    for (let j = 0; j < 4; j++) {
      radius += 9 + random() * 5;
      const bend = angle + (random() - 0.5) * 0.22;
      ctx.lineTo(64 + Math.cos(bend) * radius, 64 + Math.sin(bend) * radius);
    }
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(255,255,225,0.92)' : 'rgba(255,180,54,0.78)';
    ctx.lineWidth = i % 3 === 0 ? 1.8 : 1.1;
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface ExplosionDiscResources {
  geometry: THREE.PlaneGeometry;
  texture: THREE.CanvasTexture;
}

export function createExplosionDiscResources(r: number): ExplosionDiscResources {
  return {
    geometry: markSharedResource(new THREE.PlaneGeometry(r * 2, r * 2).rotateX(-Math.PI / 2)),
    texture: markSharedResource(makeExplosionTexture()),
  };
}

export function disposeExplosionDiscResources(resources: ExplosionDiscResources): void {
  resources.geometry.dispose();
  resources.texture.dispose();
}

export function explosionDisc(
  r: number,
  opacity = 0.9,
  renderOrder = 5,
  resources?: ExplosionDiscResources,
): BasicMesh {
  const mesh = new THREE.Mesh(
    resources?.geometry ?? new THREE.PlaneGeometry(r * 2, r * 2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: resources?.texture ?? makeExplosionTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
  );
  mesh.renderOrder = renderOrder;
  return mesh;
}

// 地面用の円ディスク（上向き）
export function flatDisc(r: number, color: number, opacity: number, renderOrder = 3): BasicMesh {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(r, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }),
  );
  mesh.renderOrder = renderOrder;
  return mesh;
}

export function flatRing(rIn: number, rOut: number, color: number, opacity: number, renderOrder = 3): BasicMesh {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(rIn, rOut, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }),
  );
  mesh.renderOrder = renderOrder;
  return mesh;
}

// 正方形の枠（数字マーカーの地面表示用）
export function flatSquareRing(
  half: number,
  thickness: number,
  color: number,
  opacity: number,
  renderOrder = 2,
): BasicMesh {
  const outer = new THREE.Shape();
  outer.moveTo(-half, -half);
  outer.lineTo(half, -half);
  outer.lineTo(half, half);
  outer.lineTo(-half, half);
  outer.closePath();
  const inner = new THREE.Path();
  const ih = half - thickness;
  inner.moveTo(-ih, -ih);
  inner.lineTo(ih, -ih);
  inner.lineTo(ih, ih);
  inner.lineTo(-ih, ih);
  inner.closePath();
  outer.holes.push(inner);
  const geo = new THREE.ShapeGeometry(outer);
  geo.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }),
  );
  mesh.renderOrder = renderOrder;
  return mesh;
}

export function flatSquare(half: number, color: number, opacity: number, renderOrder = 2): BasicMesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(half * 2, half * 2).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }),
  );
  mesh.renderOrder = renderOrder;
  return mesh;
}

// ローカル座標（x=横断軸, z=進行軸）の太いシェブロン。進行方向(+z)を指す。
// LineBasicMaterialでは線幅が環境依存になるため、2本の帯メッシュとして描画する。
export function chevron(x: number, zTip: number, zSide: number, h: number, opacity = 0.95): THREE.Group {
  const group = new THREE.Group();
  const halfWidth = 6.1;
  const makeMaterial = (color: number, alpha: number, additive: boolean): THREE.MeshBasicMaterial => {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: alpha,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    material.userData.baseOpacity = alpha;
    return material;
  };

  const chevronMesh = (thickness: number, color: number, alpha: number, y: number, additive: boolean): THREE.Mesh => {
    const left = { x: x - halfWidth, z: zSide };
    const tip = { x, z: zTip };
    const right = { x: x + halfWidth, z: zSide };
    const leftLength = Math.hypot(tip.x - left.x, tip.z - left.z);
    const rightLength = Math.hypot(right.x - tip.x, right.z - tip.z);
    const leftNormal = { x: -(tip.z - left.z) / leftLength, z: (tip.x - left.x) / leftLength };
    const rightNormal = { x: -(right.z - tip.z) / rightLength, z: (right.x - tip.x) / rightLength };
    const miterRaw = { x: leftNormal.x + rightNormal.x, z: leftNormal.z + rightNormal.z };
    const miterLength = Math.hypot(miterRaw.x, miterRaw.z);
    const miter = { x: miterRaw.x / miterLength, z: miterRaw.z / miterLength };
    const miterScale = thickness / (miter.x * leftNormal.x + miter.z * leftNormal.z);
    const shape = new THREE.Shape();
    shape.moveTo(left.x + leftNormal.x * thickness, left.z + leftNormal.z * thickness);
    shape.lineTo(tip.x + miter.x * miterScale, tip.z + miter.z * miterScale);
    shape.lineTo(right.x + rightNormal.x * thickness, right.z + rightNormal.z * thickness);
    shape.lineTo(right.x - rightNormal.x * thickness, right.z - rightNormal.z * thickness);
    shape.lineTo(tip.x - miter.x * miterScale, tip.z - miter.z * miterScale);
    shape.lineTo(left.x - leftNormal.x * thickness, left.z - leftNormal.z * thickness);
    shape.closePath();
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape).rotateX(Math.PI / 2),
      makeMaterial(color, alpha, additive),
    );
    mesh.position.y = y;
    mesh.renderOrder = 6;
    return mesh;
  };

  // 赤橙のにじみを下に敷き、その上へゲーム画面に近い白い太線を重ねる。
  group.add(
    chevronMesh(1.45, 0xff5a28, opacity * 0.48, h, true),
    chevronMesh(0.72, 0xfff8e8, opacity, h + 0.025, true),
  );
  return group;
}

// レーン帯（帯∩フィールド円）のジオメトリ。横断軸上のレーン中心座標を受け取り、
// フィールド円との交差領域を輪郭サンプリングで作る
export function bandGeometry(centerOffset: number): THREE.ShapeGeometry {
  const x0 = Math.max(centerOffset - LANE_W / 2, -ARENA_R + 0.01);
  const x1 = Math.min(centerOffset + LANE_W / 2, ARENA_R - 0.01);
  const N = 28;
  const edge = (x: number): number => Math.sqrt(Math.max(0, ARENA_R * ARENA_R - x * x));
  const shape = new THREE.Shape();
  for (let i = 0; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    if (i === 0) shape.moveTo(x, -edge(x));
    else shape.lineTo(x, -edge(x));
  }
  for (let i = N; i >= 0; i--) {
    const x = x0 + ((x1 - x0) * i) / N;
    shape.lineTo(x, edge(x));
  }
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(Math.PI / 2); // shape(x,y) → (x,0,y): 横断軸×進行軸の水平面に
  return geo;
}
