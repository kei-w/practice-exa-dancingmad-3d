import { describe, expect, it } from 'vitest';
import { TrainerController, type TrainerScene } from './controller';
import type { TrainerViewState } from './trainerView';

function createSceneStub(): TrainerScene {
  return {
    onLeftClick: null,
    renderMarkers: () => undefined,
    setPlayerVisible: () => undefined,
    clearSlideLayer: () => undefined,
    clearJudgeMarks: () => undefined,
    clearVolleys: () => undefined,
    buildVolleys: () => undefined,
    setCameraPose: () => undefined,
    setPlayer: () => undefined,
    showBand: () => undefined,
    showWarnTelegraph: () => undefined,
    addJudgeMark: () => undefined,
    getForwardRight: () => ({ fx: 0, fz: -1, rx: 1, rz: 0 }),
    updateVolley: () => undefined,
    zoomCamera: () => undefined,
    rotateCamera: () => undefined,
    updateCamera: () => undefined,
    render: () => undefined,
    dispose: () => undefined,
  };
}

function createHarness() {
  let now = 0;
  let frame: FrameRequestCallback = () => undefined;
  const views: TrainerViewState[] = [];
  const controller = new TrainerController({} as HTMLElement, (view) => views.push(view), {
    createScene: createSceneStub,
    exposeDebug: false,
    runtime: {
      now: () => now,
      requestFrame: (callback) => {
        frame = callback;
        return 1;
      },
      cancelFrame: () => undefined,
      setTimer: () => 1,
      clearTimer: () => undefined,
      initKeyboard: () => () => undefined,
      initGamepad: () => () => undefined,
      pollGamepad: () => null,
      getKeys: () => ({ up: false, down: false, left: false, right: false }),
    },
  });
  return {
    controller,
    latest: () => views.at(-1),
    runFrame: (timestamp: number) => {
      now = timestamp;
      frame(timestamp);
    },
  };
}

describe('TrainerController', () => {
  it('starts the initially generated problem as the first problem', () => {
    const harness = createHarness();
    harness.controller.startCurrentProblem();
    expect(harness.latest()?.runActive).toBe(true);
    expect(harness.latest()?.logs[0]).toMatchObject({ key: 'practiceStartedLog', params: { number: 1 } });
    harness.controller.startNewProblem();
    expect(harness.latest()?.logs[0]).toMatchObject({ key: 'practiceStartedLog', params: { number: 2 } });
    harness.controller.dispose();
  });

  it('resets the finished state when changing modes', () => {
    const harness = createHarness();
    harness.controller.startCurrentProblem();
    harness.runFrame(24000);
    expect(harness.latest()?.runFinished).toBe(true);
    harness.controller.setMode('quiz');
    harness.controller.setMode('rt');
    expect(harness.latest()?.runFinished).toBe(false);
    harness.controller.dispose();
  });

  it('regenerates slide copy when the locale changes', () => {
    const harness = createHarness();
    harness.controller.setMode('quiz');
    expect(harness.latest()?.slideTitle).toBe('1回目の予兆');
    harness.controller.setLocale('en');
    expect(harness.latest()?.slideTitle).toBe('Wave 1 telegraph');
    harness.controller.dispose();
  });
});
