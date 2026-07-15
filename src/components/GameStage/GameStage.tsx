import type { RefObject } from 'react';
import type { TrainerViewState } from '../../game/trainerView';
import type { TrainerActions } from '../../hooks/useTrainer';
import { useI18n } from '../../i18n/I18nContext';
import { formatPageLabel } from '../../game/viewFormatters';
import {
  CameraHelp,
  CenterStartButton,
  CountOverlay,
  HitFlash,
  SlideButton,
  SlideNavigation,
  SlideNumber,
  StageSurface,
  StageWrapper,
} from './styles';

interface GameStageProps {
  actions: TrainerActions;
  stageRef: RefObject<HTMLDivElement | null>;
  view: TrainerViewState;
}

export function GameStage({ actions, stageRef, view }: GameStageProps) {
  const { t } = useI18n();
  const pageLabel = formatPageLabel(view.page, view.slideTotal);
  return (
    <StageWrapper>
      <StageSurface ref={stageRef} />
      <CountOverlay $visible={view.countdown !== null} aria-live="assertive">
        {view.countdown}
      </CountOverlay>
      {view.mode === 'rt' && !view.runActive && !view.runFinished && (
        <CenterStartButton type="button" $variant="primary" onClick={actions.startCurrentProblem}>
          {t('start')}
        </CenterStartButton>
      )}
      {view.mode === 'quiz' && (
        <SlideNavigation>
          <SlideButton type="button" aria-label={t('previousSlide')} onClick={() => actions.moveSlide(-1)}>
            ＜
          </SlideButton>
          <SlideNumber>{pageLabel}</SlideNumber>
          <SlideButton type="button" aria-label={t('nextSlide')} onClick={() => actions.moveSlide(1)}>
            ＞
          </SlideButton>
        </SlideNavigation>
      )}
      <CameraHelp>{t('cameraHelp')}</CameraHelp>
      <HitFlash $visible={view.hitFlash} />
    </StageWrapper>
  );
}
