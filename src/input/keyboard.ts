export type MoveKey = 'up' | 'down' | 'left' | 'right';

export const keys: Record<MoveKey, boolean> = { up: false, down: false, left: false, right: false };

const KEYMAP: Record<string, MoveKey> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

export function initKeyboard(): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    const k = KEYMAP[e.code];
    if (!k) return;
    if (e.target instanceof HTMLInputElement) return;
    keys[k] = true;
    if (e.code.startsWith('Arrow')) e.preventDefault();
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    const k = KEYMAP[e.code];
    if (k) keys[k] = false;
  };
  const onBlur = (): void => {
    keys.up = keys.down = keys.left = keys.right = false;
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    onBlur();
  };
}
