import { SHOT_R, SHOT_STEPS } from '../config';
import { EXA_VISUAL } from './exaVisual';

export interface WarningArrowFrame {
  visible: boolean;
  zOffset: number;
  opacity: number;
}

export interface FiringStep {
  index: number;
  progress: number;
}

export interface GroundFade {
  fill: number;
  rim: number;
  surface: number;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function pulseOpacity(phase: number): number {
  const { fadeInEndPhase, holdEndPhase } = EXA_VISUAL.pulse;
  if (phase < fadeInEndPhase) return phase / fadeInEndPhase;
  if (phase < holdEndPhase) return 1;
  return Math.max(0, (1 - phase) / (1 - holdEndPhase));
}

export function warningArrowFrame(progress: number, trailIndex: number): WarningArrowFrame {
  const normalized = Math.min(Math.max(progress, 0), 1);
  const pulsePosition = Math.min(normalized * EXA_VISUAL.pulse.count, EXA_VISUAL.pulse.count - Number.EPSILON);
  const pulseIndex = Math.floor(pulsePosition);
  const pulsePhase = pulsePosition - pulseIndex;
  const rawPhase = pulsePhase - trailIndex * EXA_VISUAL.pulse.trailPhaseLag;
  const wrapsPreviousPulse = rawPhase < 0;
  const samplePhase = wrapsPreviousPulse ? rawPhase + 1 : rawPhase;
  const visible = !(pulseIndex === 0 && wrapsPreviousPulse);
  const movePhase = Math.min(samplePhase / EXA_VISUAL.pulse.moveEndPhase, 1);
  const travel = easeOutCubic(movePhase);
  return {
    visible,
    zOffset: (travel - 0.5) * SHOT_R * EXA_VISUAL.pulse.travelDistance,
    opacity: visible ? pulseOpacity(samplePhase) : 0,
  };
}

export function firingStep(progress: number): FiringStep {
  const exact = Math.min(Math.max(progress, 0), 0.999) * SHOT_STEPS;
  const index = Math.min(SHOT_STEPS - 1, Math.floor(exact));
  return { index, progress: exact - index };
}

export function activeGroundFade(progress: number): GroundFade {
  return {
    fill: 0.08 + 0.92 * (1 - progress) ** 1.35,
    rim: 0.04 + 0.96 * (1 - progress) ** 1.8,
    surface: 0.1 + 0.9 * (1 - progress) ** 1.25,
  };
}

export function residualFade(progress: number): number {
  const duration = EXA_VISUAL.explosion.residualDuration;
  if (progress >= duration) return 0;
  return (1 - progress / duration) ** 1.35;
}
