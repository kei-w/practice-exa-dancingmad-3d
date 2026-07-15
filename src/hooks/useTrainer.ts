import { useEffect, useMemo, useRef, useState } from 'react';
import type { TrainerController } from '../game/controller';
import { INITIAL_TRAINER_VIEW, type Mode, type TrainerViewState } from '../game/trainerView';
import type { Locale } from '../i18n/translations';

export interface TrainerActions {
  setMode: (mode: Mode) => void;
  quizBack: () => void;
  quizNew: () => void;
  toggleStepMode: () => void;
  toggleMarkerPreset: () => void;
  setMarkerRadius: (value: number) => void;
  setResolveSpeed: (seconds: number) => void;
  startCurrentProblem: () => void;
  togglePause: () => void;
  runPrevProblem: () => void;
  startNewProblem: () => void;
  moveSlide: (delta: number) => void;
}

export function useTrainer(locale: Locale) {
  const stageRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<TrainerController | null>(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const [view, setView] = useState<TrainerViewState>(INITIAL_TRAINER_VIEW);

  useEffect(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    let cancelled = false;
    let controller: TrainerController | null = null;
    void import('../game/controller').then(({ TrainerController }) => {
      if (cancelled) return;
      controller = new TrainerController(stage, setView, { locale: localeRef.current });
      controllerRef.current = controller;
    });
    return () => {
      cancelled = true;
      if (controllerRef.current === controller) controllerRef.current = null;
      controller?.dispose();
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setLocale(locale);
  }, [locale]);

  const actions = useMemo<TrainerActions>(
    () => ({
      setMode: (mode) => controllerRef.current?.setMode(mode),
      quizBack: () => controllerRef.current?.quizBack(),
      quizNew: () => controllerRef.current?.quizNew(),
      toggleStepMode: () => controllerRef.current?.toggleStepMode(),
      toggleMarkerPreset: () => controllerRef.current?.toggleMarkerPreset(),
      setMarkerRadius: (value) => controllerRef.current?.setMarkerRadius(value),
      setResolveSpeed: (seconds) => controllerRef.current?.setResolveSpeed(seconds),
      startCurrentProblem: () => controllerRef.current?.startCurrentProblem(),
      togglePause: () => controllerRef.current?.togglePause(),
      runPrevProblem: () => controllerRef.current?.runPrevProblem(),
      startNewProblem: () => controllerRef.current?.startNewProblem(),
      moveSlide: (delta) => controllerRef.current?.moveSlide(delta),
    }),
    [],
  );

  return { actions, stageRef, view };
}
