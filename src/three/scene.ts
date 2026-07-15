import * as THREE from 'three';
import { ARENA_R, TARGET_CIRCLE_R } from '../config';
import { SPREAD_OFFSETS, type Vec2, type Volley } from '../game/lanes';
import type { BandEmphasis } from '../game/slides';
import { buildMarkers, updateMarkerRadius } from './markers';
import {
  createExaFxResources,
  createStaticWarningTelegraph,
  createVolleyFx,
  disposeExaFxResources,
  type ExaFxResources,
  type VolleyFx,
  type VolleyPhase,
  updateVolleyFx,
  volleyRotation,
} from './exaFx';
import { bandGeometry, clearGroup, disposeTree, flatRing, makeTextSprite } from './primitives';

export type { VolleyPhase } from './exaFx';

interface CameraRig {
  yaw: number;
  pitch: number;
  dist: number;
  target: THREE.Vector3;
}

export class Scene3D {
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly markersG: THREE.Group;
  private readonly volleyRoot: THREE.Group;
  private readonly slideLayer: THREE.Group;
  private readonly judgeMarks: THREE.Group;
  private readonly raycaster: THREE.Raycaster;
  private readonly exaResources: ExaFxResources;
  private readonly cleanupCallbacks: Array<() => void> = [];
  private resizeObserver: ResizeObserver | null = null;
  private disposed = false;
  private markerPreset: string | null = null;
  private volleyFx: VolleyFx[] = [];
  private player!: THREE.Group;
  private drag: { id: number; x: number; y: number } | null = null;

  readonly cam: CameraRig;
  onLeftClick: ((pt: Vec2) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1017);
    this.scene.fog = new THREE.Fog(0x0d1017, 160, 420);

    this.camera = new THREE.PerspectiveCamera(55, 4 / 3, 0.5, 600);

    this.scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x2a241c, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(40, 80, 30);
    this.scene.add(sun);

    // レイヤー用グループ
    this.markersG = new THREE.Group();
    this.volleyRoot = new THREE.Group();
    this.slideLayer = new THREE.Group();
    this.judgeMarks = new THREE.Group();
    this.scene.add(this.markersG, this.volleyRoot, this.slideLayer, this.judgeMarks);

    this.buildArena();
    this.buildPlayer();

    // カメラリグ（FF14風: プレイヤー追従＋右ドラッグ回転＋ホイールズーム）
    this.cam = { yaw: 0, pitch: 0.78, dist: 52, target: new THREE.Vector3(0, 0, 0) };
    this.raycaster = new THREE.Raycaster();
    this.exaResources = createExaFxResources();
    this.setupInput();

    this.resize();
    const onResize = (): void => this.resize();
    window.addEventListener('resize', onResize);
    this.cleanupCallbacks.push(() => window.removeEventListener('resize', onResize));
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(onResize);
      this.resizeObserver.observe(container);
    }
  }

  resize(): void {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const cleanup of this.cleanupCallbacks.splice(0)) cleanup();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    disposeTree(this.scene);
    disposeExaFxResources(this.exaResources);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.volleyFx = [];
    this.onLeftClick = null;
  }

  // ================= フィールド =================
  private buildArena(): void {
    // 周辺の床
    const outer = new THREE.Mesh(
      new THREE.CircleGeometry(400, 64).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x0b0e15 }),
    );
    outer.position.y = -0.3;
    this.scene.add(outer);

    // アリーナ本体
    const arena = new THREE.Mesh(
      new THREE.CircleGeometry(ARENA_R, 96).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x151d2e }),
    );
    this.scene.add(arena);

    // 外周・内周リング
    const border = flatRing(ARENA_R - 0.35, ARENA_R + 0.35, 0x33435f, 1, 1);
    border.material.transparent = false;
    border.position.y = 0.03;
    this.scene.add(border);

    const inner = flatRing(TARGET_CIRCLE_R - 0.38, TARGET_CIRCLE_R + 0.38, 0xff8993, 0.78, 1);
    inner.position.y = 0.04;
    this.scene.add(inner);

    // アリーナ側面（少し立体感を出す）
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(ARENA_R, ARENA_R, 2.4, 96, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x1d2942, side: THREE.DoubleSide }),
    );
    rim.position.y = -1.2;
    this.scene.add(rim);

    // グリッド（フィールドを10分割、円でクリップ）
    const cell = (ARENA_R * 2) / 10;
    const pts: THREE.Vector3[] = [];
    for (let i = 1; i < 10; i++) {
      const d = -ARENA_R + i * cell;
      const half = Math.sqrt(Math.max(0, ARENA_R * ARENA_R - d * d));
      pts.push(new THREE.Vector3(d, 0, -half), new THREE.Vector3(d, 0, half));
      pts.push(new THREE.Vector3(-half, 0, d), new THREE.Vector3(half, 0, d));
    }
    const grid = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, depthWrite: false }),
    );
    grid.position.y = 0.05;
    grid.renderOrder = 1;
    this.scene.add(grid);
  }

  renderMarkers(preset: string, radius = 35): void {
    if (preset !== this.markerPreset) {
      buildMarkers(this.markersG, preset, radius);
      this.markerPreset = preset;
    } else {
      updateMarkerRadius(this.markersG, radius);
    }
  }

  // ================= プレイヤー =================
  private buildPlayer(): void {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(1.2, 2.0, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0x5ee0a0, roughness: 0.55 }),
    );
    body.position.y = 2.2;
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.55, 1.1, 12).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xe4fff2, roughness: 0.4 }),
    );
    nose.position.set(0, 2.4, 1.55);
    const ring = flatRing(1.5, 1.9, 0xffffff, 0.55, 6);
    ring.position.y = 0.3;
    g.add(body, nose, ring);
    this.player = g;
    this.scene.add(g);
  }

  setPlayerVisible(v: boolean): void {
    this.player.visible = v;
  }

  setPlayer(x: number, z: number, facing: number | null = null): void {
    this.player.position.set(x, 0, z);
    if (facing !== null) this.player.rotation.y = facing;
  }

  // ================= カメラ・入力 =================
  private setupInput(): void {
    const el = this.renderer.domElement;
    const onContextMenu = (e: MouseEvent): void => e.preventDefault();
    const onPointerDown = (e: PointerEvent): void => {
      if (e.button === 2) {
        this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
        el.setPointerCapture(e.pointerId);
      } else if (e.button === 0 && this.onLeftClick) {
        const pt = this.groundPoint(e);
        if (pt) this.onLeftClick(pt);
      }
    };
    const onPointerMove = (e: PointerEvent): void => {
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const dx = e.clientX - this.drag.x;
      const dy = e.clientY - this.drag.y;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.rotateCamera(-dx * 0.006, dy * 0.006);
    };
    const endDrag = (e: PointerEvent): void => {
      if (this.drag && e.pointerId === this.drag.id) this.drag = null;
    };
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      this.zoomCamera(Math.exp(e.deltaY * 0.0012));
    };
    el.addEventListener('contextmenu', onContextMenu);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('wheel', onWheel, { passive: false });
    this.cleanupCallbacks.push(() => {
      el.removeEventListener('contextmenu', onContextMenu);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endDrag);
      el.removeEventListener('pointercancel', endDrag);
      el.removeEventListener('wheel', onWheel);
    });
  }

  // カメラ回転（マウスドラッグ／ゲームパッド共用）
  rotateCamera(dYaw: number, dPitch: number): void {
    this.cam.yaw += dYaw;
    this.cam.pitch = Math.min(1.45, Math.max(0.12, this.cam.pitch + dPitch));
  }

  // ズーム（距離の倍率）
  zoomCamera(scale: number): void {
    this.cam.dist = Math.min(120, Math.max(12, this.cam.dist * scale));
  }

  // モード切替時などにカメラ姿勢をリセット
  setCameraPose(pose: { yaw?: number; pitch?: number; dist?: number } = {}): void {
    if (pose.yaw !== undefined) this.cam.yaw = pose.yaw;
    if (pose.pitch !== undefined) this.cam.pitch = pose.pitch;
    if (pose.dist !== undefined) this.cam.dist = pose.dist;
  }

  // WASD移動用: カメラ基準の前方・右方（水平）
  getForwardRight(): { fx: number; fz: number; rx: number; rz: number } {
    const { yaw } = this.cam;
    return {
      fx: -Math.sin(yaw),
      fz: -Math.cos(yaw),
      rx: Math.cos(yaw),
      rz: -Math.sin(yaw),
    };
  }

  // follow: 追従対象（world座標）
  updateCamera(follow: Vec2, dt: number): void {
    const desired = new THREE.Vector3(follow.x, 0, follow.z);
    this.cam.target.lerp(desired, Math.min(1, 1 - Math.exp(-dt * 0.012)));
    const { yaw, pitch, dist, target } = this.cam;
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    this.camera.position.set(target.x + dist * cp * Math.sin(yaw), 2 + dist * sp, target.z + dist * cp * Math.cos(yaw));
    this.camera.lookAt(target.x, 2.2, target.z);
  }

  // クリック位置 → 地面(y=0)上のworld座標
  groundPoint(e: PointerEvent): Vec2 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const dirY = this.raycaster.ray.direction.y;
    if (Math.abs(dirY) < 1e-6) return null;
    const t = -this.raycaster.ray.origin.y / dirY;
    if (t < 0) return null;
    const p = this.raycaster.ray.at(t, new THREE.Vector3());
    return { x: p.x, z: p.z };
  }

  // ================= ウェーブ描画（実践練習） =================
  clearVolleys(): void {
    clearGroup(this.volleyRoot);
    this.volleyFx = [];
  }

  buildVolleys(volleys: Volley[]): void {
    this.clearVolleys();
    this.volleyFx = volleys.map((volley) => createVolleyFx(volley, this.exaResources));
    this.volleyRoot.add(...this.volleyFx.map((fx) => fx.root));
  }

  // 毎フレームのウェーブ表示更新
  updateVolley(k: number, phase: VolleyPhase, progress: number): void {
    const fx = this.volleyFx[k];
    if (!fx) return;
    updateVolleyFx(fx, phase, progress);
  }

  // ================= 位置確認モードの描画 =================
  clearSlideLayer(): void {
    clearGroup(this.slideLayer);
  }
  clearJudgeMarks(): void {
    clearGroup(this.judgeMarks);
  }

  // 攻撃レーンの帯。emphasis: line=濃い表示、warn=薄い表示
  showBand(v: Volley, emphasis: BandEmphasis, caption: string): void {
    const g = new THREE.Group();
    g.rotation.y = volleyRotation(v);
    const isWarn = emphasis === 'warn';
    for (const centerOffset of SPREAD_OFFSETS[v.spread]) {
      const mesh = new THREE.Mesh(
        bandGeometry(centerOffset),
        new THREE.MeshBasicMaterial({
          color: 0xe59b2f,
          transparent: true,
          opacity: isWarn ? 0.13 : 0.34,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      mesh.position.y = isWarn ? 0.14 : 0.1;
      mesh.renderOrder = 2;
      g.add(mesh);
    }
    this.slideLayer.add(g);
    if (caption) {
      const sprite = makeTextSprite(caption, '#f1eadf', 4.5);
      sprite.position.set(0, 3.2, isWarn ? -42 : 44);
      this.slideLayer.add(sprite);
    }
  }

  // 予兆円＋矢印の静止表示（スライド用）
  showWarnTelegraph(v: Volley): void {
    this.slideLayer.add(createStaticWarningTelegraph(v));
  }

  // 安地判定マーク
  addJudgeMark(p: Vec2, safe: boolean): void {
    const ring = flatRing(2.1, 2.7, safe ? 0x3dd68c : 0xf75f6e, 0.95, 6);
    ring.position.set(p.x, 0.42, p.z);
    this.judgeMarks.add(ring);
  }
}
