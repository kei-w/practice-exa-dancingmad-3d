import { ARENA_R, COUNTDOWN_MS, RUN_SPEED, WARN_MS, WAVE_GAP_MS } from '../config';
import {
  initGamepad,
  PAD_CAM_PITCH_SPEED,
  PAD_CAM_YAW_SPEED,
  PAD_ZOOM_SPEED,
  type GamepadConnectionEvent,
  type PadState,
  pollGamepad,
} from '../input/gamepad';
import { initKeyboard, keys, type MoveKey } from '../input/keyboard';
import type { Locale, TranslationKey, TranslationParams } from '../i18n/translations';
import { Scene3D } from '../three/scene';
import { hitByVolley, inVolleyLanes, type Vec2, type Volley } from './lanes';
import {
  getPracticeEndAt,
  getVolleyStatus,
  PracticeSession,
  type PracticeVolleyPhase,
  type VolleyTiming,
} from './practiceSession';
import { ProblemHistory } from './problem';
import { MARKER_RADIUS, type MarkerPreset, RESOLVE_SPEED } from './settings';
import { makeSlides, type BandEmphasis } from './slides';
import { INITIAL_TRAINER_VIEW, type LogClass, type LogEntry, type Mode, type TrainerViewState } from './trainerView';

type PresentationState = Omit<TrainerViewState, 'runActive' | 'runPaused' | 'runFinished' | 'rtHits'>;

const INITIAL_PRESENTATION_STATE: PresentationState = {
  mode: INITIAL_TRAINER_VIEW.mode,
  markerPreset: INITIAL_TRAINER_VIEW.markerPreset,
  markerRadius: INITIAL_TRAINER_VIEW.markerRadius,
  page: INITIAL_TRAINER_VIEW.page,
  slideTotal: INITIAL_TRAINER_VIEW.slideTotal,
  slideTitle: INITIAL_TRAINER_VIEW.slideTitle,
  oneByOne: INITIAL_TRAINER_VIEW.oneByOne,
  resolveMs: INITIAL_TRAINER_VIEW.resolveMs,
  activeWave: INITIAL_TRAINER_VIEW.activeWave,
  countdown: INITIAL_TRAINER_VIEW.countdown,
  hitFlash: INITIAL_TRAINER_VIEW.hitFlash,
  logs: INITIAL_TRAINER_VIEW.logs,
};

export interface TrainerScene {
  onLeftClick: ((point: Vec2) => void) | null;
  renderMarkers(preset: string, radius: number): void;
  setPlayerVisible(visible: boolean): void;
  clearSlideLayer(): void;
  clearJudgeMarks(): void;
  clearVolleys(): void;
  buildVolleys(volleys: Volley[]): void;
  setCameraPose(pose: { yaw?: number; pitch?: number; dist?: number }): void;
  setPlayer(x: number, z: number, facing?: number | null): void;
  showBand(volley: Volley, emphasis: BandEmphasis, caption: string): void;
  showWarnTelegraph(volley: Volley): void;
  addJudgeMark(point: Vec2, safe: boolean): void;
  getForwardRight(): { fx: number; fz: number; rx: number; rz: number };
  updateVolley(index: number, phase: PracticeVolleyPhase, progress: number): void;
  zoomCamera(scale: number): void;
  rotateCamera(yaw: number, pitch: number): void;
  updateCamera(follow: Vec2, dt: number): void;
  render(): void;
  dispose(): void;
}

interface TrainerRuntime {
  now: () => number;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  setTimer: (callback: () => void, milliseconds: number) => number;
  clearTimer: (id: number) => void;
  initKeyboard: () => () => void;
  initGamepad: (onEvent: (event: GamepadConnectionEvent) => void) => () => void;
  pollGamepad: () => PadState | null;
  getKeys: () => Record<MoveKey, boolean>;
}

export interface TrainerControllerOptions {
  createScene?: (stage: HTMLElement) => TrainerScene;
  runtime?: Partial<TrainerRuntime>;
  exposeDebug?: boolean;
  locale?: Locale;
}

declare global {
  interface Window {
    __dbg?: {
      scene: TrainerScene;
      judgeClick: (point: Vec2) => void;
      moveSlide: (delta: number) => void;
      getVolleys: () => Volley[];
      getPage: () => number;
    };
  }
}

const browserRuntime: TrainerRuntime = {
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (id) => cancelAnimationFrame(id),
  setTimer: (callback, milliseconds) => window.setTimeout(callback, milliseconds),
  clearTimer: (id) => window.clearTimeout(id),
  initKeyboard,
  initGamepad,
  pollGamepad,
  getKeys: () => keys,
};

export class TrainerController {
  private readonly scene: TrainerScene;
  private readonly runtime: TrainerRuntime;
  private readonly problem = new ProblemHistory();
  private readonly practice = new PracticeSession();
  private readonly onView: (view: TrainerViewState) => void;
  private readonly disposeKeyboard: () => void;
  private readonly disposeGamepad: () => void;
  private locale: Locale;
  private state: PresentationState = { ...INITIAL_PRESENTATION_STATE, logs: [] };
  private lastView: TrainerViewState = { ...INITIAL_TRAINER_VIEW, logs: [] };
  private advanceTimer: number | null = null;
  private autoTimer: number | null = null;
  private hitFlashTimer: number | null = null;
  private pad: PadState | null = null;
  private lastFrame: number;
  private animationFrameId = 0;
  private logSequence = 0;
  private disposed = false;

  constructor(stage: HTMLElement, onView: (view: TrainerViewState) => void, options: TrainerControllerOptions = {}) {
    this.onView = onView;
    this.locale = options.locale ?? 'ja';
    this.runtime = { ...browserRuntime, ...options.runtime };
    this.scene = (options.createScene ?? ((element) => new Scene3D(element)))(stage);
    this.lastFrame = this.runtime.now();
    this.scene.onLeftClick = (point) => {
      if (this.state.mode === 'quiz') this.judgeClick(point);
    };
    this.disposeKeyboard = this.runtime.initKeyboard();
    this.disposeGamepad = this.runtime.initGamepad((event) => {
      this.log(event.type === 'connected' ? 'gamepadConnectedLog' : 'gamepadDisconnectedLog', 'sys', {
        id: event.id,
      });
    });

    this.problem.push();
    this.scene.renderMarkers(this.state.markerPreset, this.state.markerRadius);
    this.setMode(this.state.mode);
    this.scene.setPlayer(this.practice.pos.x, this.practice.pos.z, this.practice.facing);
    this.log('readyLog', 'sys');
    this.animationFrameId = this.runtime.requestFrame(this.frame);

    const exposeDebug = options.exposeDebug ?? import.meta.env.DEV;
    if (exposeDebug && typeof window !== 'undefined') {
      window.__dbg = {
        scene: this.scene,
        judgeClick: (point) => this.judgeClick(point),
        moveSlide: (delta) => this.moveSlide(delta),
        getVolleys: () => this.problem.current,
        getPage: () => this.state.page,
      };
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.runtime.cancelFrame(this.animationFrameId);
    this.cancelAdvance();
    this.cancelAutoNext();
    if (this.hitFlashTimer !== null) this.runtime.clearTimer(this.hitFlashTimer);
    this.disposeKeyboard();
    this.disposeGamepad();
    this.scene.dispose();
    if (typeof window !== 'undefined' && window.__dbg?.scene === this.scene) delete window.__dbg;
  }

  setMode(mode: Mode): void {
    this.stopRun(true);
    if (mode !== 'quiz') this.cancelAdvance();
    this.patch({ mode });
    this.scene.setPlayerVisible(mode === 'rt');
    if (mode === 'quiz') {
      this.patch({ page: 0 });
      this.renderSlide();
      this.scene.setCameraPose({ pitch: 1.25, dist: 105 });
    } else {
      this.scene.clearSlideLayer();
      this.scene.clearJudgeMarks();
      this.scene.buildVolleys(this.problem.current);
      this.scene.setCameraPose({ pitch: 0.78, dist: 52 });
    }
  }

  setLocale(locale: Locale): void {
    if (locale === this.locale) return;
    this.locale = locale;
    if (this.state.mode === 'quiz') this.renderSlide();
  }

  toggleStepMode(): void {
    this.cancelAdvance();
    this.patch({ oneByOne: !this.state.oneByOne });
    this.log(this.state.oneByOne ? 'oneByOneLog' : 'continuousLog', 'sys');
  }

  toggleMarkerPreset(): void {
    const markerPreset: MarkerPreset = this.state.markerPreset === '1234' ? '2341' : '1234';
    this.scene.renderMarkers(markerPreset, this.state.markerRadius);
    this.patch({ markerPreset });
  }

  setMarkerRadius(value: number): void {
    const markerRadius = Math.min(MARKER_RADIUS.max, Math.max(MARKER_RADIUS.min, Math.round(value)));
    this.scene.renderMarkers(this.state.markerPreset, markerRadius);
    this.patch({ markerRadius });
  }

  setResolveSpeed(seconds: number): void {
    const clamped = Math.min(RESOLVE_SPEED.maxSeconds, Math.max(RESOLVE_SPEED.minSeconds, seconds));
    this.patch({ resolveMs: Math.round(clamped * 1000) });
  }

  quizBack(toPage = 0): void {
    if (!this.problem.back()) {
      this.log('noPreviousProblemLog', 'sys');
      return;
    }
    this.patch({ page: toPage });
    this.renderSlide();
    this.log('positionReviewProblemLog', 'sys', { number: this.problem.number });
  }

  quizNew(): void {
    this.problem.push();
    this.patch({ page: 0 });
    this.renderSlide();
    this.log('positionReviewProblemLog', 'sys', { number: this.problem.number });
  }

  moveSlide(delta: number): void {
    this.cancelAdvance();
    const total = makeSlides(this.problem.current, this.locale).length;
    if (delta < 0 && this.state.page === 0) {
      this.quizBack(total - 1);
      return;
    }
    if (delta > 0 && this.state.page === total - 1) {
      this.quizNew();
      return;
    }
    this.patch({ page: (this.state.page + delta + total) % total });
    this.renderSlide();
  }

  startCurrentProblem(): void {
    this.startRun();
  }

  startNewProblem(): void {
    this.problem.push();
    this.startRun();
  }

  togglePause(): void {
    this.practice.togglePause(this.runtime.now());
    this.emit();
  }

  runPrevProblem(): void {
    if (!this.problem.back()) {
      this.log('noPreviousProblemLog', 'sys');
      return;
    }
    this.log('practiceProblemLog', 'sys', { number: this.problem.number });
    this.startRun();
  }

  private startRun(): void {
    this.cancelAutoNext();
    this.stopRun();
    this.scene.buildVolleys(this.problem.current);
    this.scene.clearJudgeMarks();
    this.practice.start(this.problem.current.length, this.runtime.now());
    this.scene.setPlayer(this.practice.pos.x, this.practice.pos.z, this.practice.facing);
    this.patch({ activeWave: null, countdown: null, hitFlash: false });
    this.log('practiceStartedLog', 'sys', { number: this.problem.number });
  }

  private currentView(): TrainerViewState {
    return {
      ...this.state,
      runActive: this.practice.active,
      runPaused: this.practice.paused,
      runFinished: this.practice.finished,
      rtHits: this.practice.hits,
    };
  }

  private emit(): void {
    const next = this.currentView();
    const changed = (Object.keys(next) as Array<keyof TrainerViewState>).some(
      (key) => !Object.is(this.lastView[key], next[key]),
    );
    if (!changed) return;
    this.lastView = next;
    this.onView(next);
  }

  private patch(next: Partial<PresentationState>): void {
    this.state = { ...this.state, ...next };
    this.emit();
  }

  private log(key: TranslationKey, className: LogClass = 'e', params?: TranslationParams): void {
    const entry: LogEntry = { id: ++this.logSequence, key, params, className };
    this.patch({ logs: [entry, ...this.state.logs].slice(0, 80) });
  }

  private cancelAdvance(): void {
    if (this.advanceTimer === null) return;
    this.runtime.clearTimer(this.advanceTimer);
    this.advanceTimer = null;
  }

  private cancelAutoNext(): void {
    if (this.autoTimer === null) return;
    this.runtime.clearTimer(this.autoTimer);
    this.autoTimer = null;
  }

  private renderSlide(): void {
    this.scene.clearVolleys();
    this.scene.clearSlideLayer();
    this.scene.clearJudgeMarks();
    const slides = makeSlides(this.problem.current, this.locale);
    const page = Math.min(this.state.page, slides.length - 1);
    const slide = slides[page];
    for (const band of slide.bands) this.scene.showBand(band.volley, band.emphasis, band.caption);
    if (slide.warnTelegraph) this.scene.showWarnTelegraph(slide.warnTelegraph);
    this.patch({ page, slideTotal: slides.length, slideTitle: slide.title });
  }

  private judgeClick(point: Vec2): void {
    if (Math.hypot(point.x, point.z) > ARENA_R - 1) return;
    const slide = makeSlides(this.problem.current, this.locale)[this.state.page];
    const danger = slide.dangerIndex !== null && inVolleyLanes(point, this.problem.current[slide.dangerIndex]);
    this.scene.addJudgeMark(point, !danger);
    if (danger) {
      this.log('slideDangerLog', 'ng', { slide: this.state.page + 1 });
      return;
    }
    this.log('slideSafeLog', 'ok', { slide: this.state.page + 1 });
    if (!this.state.oneByOne) {
      this.cancelAdvance();
      this.advanceTimer = this.runtime.setTimer(() => {
        this.advanceTimer = null;
        this.moveSlide(1);
      }, 700);
    }
  }

  private stopRun(resetFinished = false): void {
    this.cancelAutoNext();
    this.practice.stop(resetFinished);
    this.patch({ activeWave: null, countdown: null });
  }

  private movePlayer(dt: number): void {
    const { fx, fz, rx, rz } = this.scene.getForwardRight();
    const moveKeys = this.runtime.getKeys();
    let x = 0;
    let z = 0;
    if (moveKeys.up) {
      x += fx;
      z += fz;
    }
    if (moveKeys.down) {
      x -= fx;
      z -= fz;
    }
    if (moveKeys.left) {
      x -= rx;
      z -= rz;
    }
    if (moveKeys.right) {
      x += rx;
      z += rz;
    }
    if (this.pad) {
      x += fx * -this.pad.ly + rx * this.pad.lx;
      z += fz * -this.pad.ly + rz * this.pad.lx;
    }
    this.practice.move({ x, z }, dt, RUN_SPEED, ARENA_R - 2);
    this.scene.setPlayer(this.practice.pos.x, this.practice.pos.z, this.practice.facing);
  }

  private runTick(now: number, dt: number): void {
    const elapsed = this.practice.elapsed(now);
    this.patch({ countdown: elapsed < COUNTDOWN_MS ? Math.ceil((COUNTDOWN_MS - elapsed) / 1000) : null });
    this.movePlayer(dt);

    const volleys = this.problem.current;
    let activeWave: number | null = null;
    const timing: VolleyTiming = {
      countdownMs: COUNTDOWN_MS,
      warnMs: WARN_MS,
      waveGapMs: WAVE_GAP_MS,
      resolveMs: this.state.resolveMs,
    };
    volleys.forEach((volley, index) => {
      const status = getVolleyStatus(index, elapsed, timing);
      this.scene.updateVolley(index, status.phase, status.progress);
      if (status.phase !== 'firing') return;
      activeWave = index + 1;
      if (this.practice.isTagged(index) || !hitByVolley(this.practice.pos, volley, status.progress)) return;
      this.practice.markHit(index);
      this.patch({ hitFlash: true });
      this.log('waveHitLog', 'ng', { wave: index + 1 });
      if (this.hitFlashTimer !== null) this.runtime.clearTimer(this.hitFlashTimer);
      this.hitFlashTimer = this.runtime.setTimer(() => {
        this.hitFlashTimer = null;
        this.patch({ hitFlash: false });
      }, 90);
    });
    this.patch({ activeWave });

    if (elapsed <= getPracticeEndAt(volleys.length, timing) + 600 || this.practice.finished) return;
    this.practice.finish();
    this.patch({ activeWave: null, countdown: null });
    volleys.forEach((_volley, index) => {
      this.scene.updateVolley(index, 'ended', 1);
    });
    if (this.practice.hits === 0) {
      this.log('noDamageLog', 'ok');
    } else if (this.practice.hits === 1) {
      this.log('finishedOneHitLog', 'sys');
    } else {
      this.log('finishedHitsLog', 'sys', { hits: this.practice.hits });
    }
    if (!this.state.oneByOne) {
      this.autoTimer = this.runtime.setTimer(() => {
        this.autoTimer = null;
        if (this.state.mode === 'rt' && !this.state.oneByOne && !this.practice.active) this.startNewProblem();
      }, 3000);
    }
  }

  private applyPadCamera(dt: number): void {
    if (!this.pad) return;
    if (this.pad.zoomHeld) {
      if (this.pad.ry !== 0) this.scene.zoomCamera(Math.exp((this.pad.ry * PAD_ZOOM_SPEED * dt) / 1000));
    } else if (this.pad.rx !== 0 || this.pad.ry !== 0) {
      this.scene.rotateCamera(
        (-this.pad.rx * PAD_CAM_YAW_SPEED * dt) / 1000,
        (this.pad.ry * PAD_CAM_PITCH_SPEED * dt) / 1000,
      );
    }
  }

  private readonly frame = (now: number): void => {
    if (this.disposed) return;
    const dt = Math.min(50, now - this.lastFrame);
    this.lastFrame = now;
    this.pad = this.runtime.pollGamepad();
    this.applyPadCamera(dt);
    if (this.practice.active && !this.practice.paused) this.runTick(now, dt);
    this.scene.updateCamera(this.state.mode === 'rt' ? this.practice.pos : { x: 0, z: 0 }, dt);
    this.scene.render();
    this.animationFrameId = this.runtime.requestFrame(this.frame);
  };
}
