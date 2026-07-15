import * as THREE from 'three';
import {
  clearGroup,
  flatDisc,
  flatRing,
  flatSquare,
  flatSquareRing,
  makeBeamTexture,
  makeGlowTexture,
  makeTextSprite,
} from './primitives';

interface MarkerColor {
  hex: number;
  css: string;
}

interface MarkerDef {
  label: string;
  deg: number;
  color: MarkerColor;
  shape: 'round' | 'square';
}

// FF14のマーカー色: 1/A=赤, 2/B=黄, 3/C=青, 4/D=紫
const PALETTE = {
  red: { hex: 0xff6b6b, css: '#ff9a9a' },
  yellow: { hex: 0xffd75e, css: '#ffe08a' },
  blue: { hex: 0x66baff, css: '#9ad0ff' },
  purple: { hex: 0xc98cff, css: '#dcb2ff' },
} satisfies Record<string, MarkerColor>;

const NUMBER_DEGREES = [45, 135, 225, 315] as const;
const LETTER_DEGREES = [0, 90, 180, 270] as const;
const MARKER_DEGREES = [...NUMBER_DEGREES, ...LETTER_DEGREES] as const;

function setMarkerPosition(marker: THREE.Object3D, degrees: number, radius: number): void {
  const radians = ((degrees - 90) * Math.PI) / 180;
  marker.position.set(radius * Math.cos(radians), 0, radius * Math.sin(radians));
}

export function updateMarkerRadius(root: THREE.Group, radius: number): void {
  root.children.forEach((marker, index) => {
    const degrees = MARKER_DEGREES[index];
    if (degrees !== undefined) setMarkerPosition(marker, degrees, radius);
  });
}

// フィールドマーカー（FF14風: 数字=四角、アルファベット=丸、色分け＋光柱）
// 配置: A(北)から時計回りに90度刻みで A/B/C/D、数字はその45度ずれ（コーナー）
// preset '2341': 北西=1 北東=2 南東=3 南西=4 ／ '1234': 北東=1 南東=2 南西=3 北西=4
export function buildMarkers(root: THREE.Group, preset: string, radius: number): void {
  clearGroup(root);
  const numColor = [PALETTE.red, PALETTE.yellow, PALETTE.blue, PALETTE.purple]; // 1,2,3,4
  const numOrder = preset === '2341' ? [2, 3, 4, 1] : [1, 2, 3, 4];
  const defs: MarkerDef[] = numOrder.map((n, i) => ({
    label: String(n),
    deg: NUMBER_DEGREES[i],
    color: numColor[n - 1],
    shape: 'square' as const,
  }));
  defs.push(
    { label: 'A', deg: 0, color: PALETTE.red, shape: 'round' },
    { label: 'B', deg: 90, color: PALETTE.yellow, shape: 'round' },
    { label: 'C', deg: 180, color: PALETTE.blue, shape: 'round' },
    { label: 'D', deg: 270, color: PALETTE.purple, shape: 'round' },
  );
  const beamTex = makeBeamTexture();
  const glowTex = makeGlowTexture();
  for (const def of defs) {
    const g = new THREE.Group();
    setMarkerPosition(g, def.deg, radius);
    // 地面のグロー
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: def.color.hex,
        map: glowTex,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    glow.position.y = 0.06;
    glow.renderOrder = 2;
    // 地面の枠＋うっすら塗り
    const frame =
      def.shape === 'round'
        ? flatRing(2.15, 2.45, def.color.hex, 0.85, 2)
        : flatSquareRing(2.4, 0.28, def.color.hex, 0.85, 2);
    frame.position.y = 0.09;
    const fill =
      def.shape === 'round' ? flatDisc(2.0, def.color.hex, 0.18, 2) : flatSquare(1.9, def.color.hex, 0.18, 2);
    fill.position.y = 0.08;
    // 光柱: 地面の枠と同じ形の輪/枠を積み上げる。
    // 上に行くほど間隔が広く・薄くなり、高さ12あたりで途切れる
    let sliceY = 0.7;
    let gap = 0.5;
    let alpha = 0.5;
    while (sliceY < 12) {
      const slice =
        def.shape === 'round'
          ? flatRing(2.05, 2.35, def.color.hex, alpha, 7)
          : flatSquareRing(2.2, 0.24, def.color.hex, alpha, 7);
      slice.material.blending = THREE.AdditiveBlending;
      slice.material.fog = false;
      slice.position.y = sliceY;
      g.add(slice);
      sliceY += gap;
      gap *= 1.28;
      alpha *= 0.8;
    }
    // うっすら連続した光（丸マーカーは円筒、四角マーカーは四角柱）
    const seg = def.shape === 'round' ? 24 : 4;
    const beamR = def.shape === 'round' ? 2.2 : 2.2 * Math.SQRT2;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(beamR, beamR, 12, seg, 1, true),
      new THREE.MeshBasicMaterial({
        color: def.color.hex,
        map: beamTex,
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    if (def.shape === 'square') beam.rotation.y = Math.PI / 4; // 面を軸に合わせる
    beam.position.y = 6;
    beam.renderOrder = 7;
    // グリフ（ネオン風）
    const sprite = makeTextSprite(def.label, def.color.css, 6, true);
    sprite.position.y = 12;
    g.add(glow, frame, fill, beam, sprite);
    root.add(g);
  }
}
