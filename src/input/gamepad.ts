// ゲームパッド（FF14標準コンフィグ風）
// 左スティック: 移動（カメラ基準・アナログ）
// 右スティック: カメラ回転（左右=旋回、上下=仰角）
// L1(LB)ホールド＋右スティック上下: ズーム

const PAD_DEADZONE = 0.18;
export const PAD_CAM_YAW_SPEED = 2.6; // rad/s
export const PAD_CAM_PITCH_SPEED = 1.8; // rad/s
export const PAD_ZOOM_SPEED = 1.1; // 倍率/s

export interface PadState {
  lx: number;
  ly: number;
  rx: number;
  ry: number;
  zoomHeld: boolean;
}

export interface GamepadConnectionEvent {
  type: 'connected' | 'disconnected';
  id: string;
}

export function initGamepad(onEvent: (event: GamepadConnectionEvent) => void): () => void {
  const onConnected = (e: GamepadEvent): void => {
    onEvent({ type: 'connected', id: e.gamepad.id });
  };
  const onDisconnected = (e: GamepadEvent): void => {
    onEvent({ type: 'disconnected', id: e.gamepad.id });
  };
  window.addEventListener('gamepadconnected', onConnected);
  window.addEventListener('gamepaddisconnected', onDisconnected);
  return () => {
    window.removeEventListener('gamepadconnected', onConnected);
    window.removeEventListener('gamepaddisconnected', onDisconnected);
  };
}

export function pollGamepad(): PadState | null {
  if (!navigator.getGamepads) return null;
  // デッドゾーンを除いた範囲を 0..1 に再スケール
  const dz = (v: number): number =>
    Math.abs(v) < PAD_DEADZONE ? 0 : (v - Math.sign(v) * PAD_DEADZONE) / (1 - PAD_DEADZONE);
  // 複数デバイスがある場合は、実際に入力があるパッドを優先する
  let best: PadState | null = null;
  let bestActivity = -1;
  for (const p of navigator.getGamepads()) {
    if (!p?.connected) continue;
    const s: PadState = {
      lx: dz(p.axes[0] ?? 0),
      ly: dz(p.axes[1] ?? 0),
      rx: dz(p.axes[2] ?? 0),
      ry: dz(p.axes[3] ?? 0),
      zoomHeld: p.buttons[4]?.pressed === true,
    };
    const activity = Math.abs(s.lx) + Math.abs(s.ly) + Math.abs(s.rx) + Math.abs(s.ry) + (s.zoomHeld ? 1 : 0);
    if (activity > bestActivity) {
      bestActivity = activity;
      best = s;
    }
  }
  return best;
}
