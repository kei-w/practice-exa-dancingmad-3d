import type { TrainerActions } from '../../hooks/useTrainer';
import { useI18n } from '../../i18n/I18nContext';
import { MARKER_RADIUS, RESOLVE_SPEED } from '../../game/settings';
import type { TrainerViewState } from '../../game/trainerView';
import { formatSeconds } from '../../game/viewFormatters';
import { Button } from '../shared/styles';
import { Bar, ControlGroup, Slider, SliderChip, SliderValue, TabButton, Tabs } from './styles';

interface ControlBarProps {
  actions: TrainerActions;
  view: TrainerViewState;
}

export function ControlBar({ actions, view }: ControlBarProps) {
  const { t } = useI18n();
  return (
    <Bar>
      <Tabs>
        <TabButton
          type="button"
          $active={view.mode === 'quiz'}
          aria-pressed={view.mode === 'quiz'}
          onClick={() => actions.setMode('quiz')}
        >
          {t('positionReview')}
        </TabButton>
        <TabButton
          type="button"
          $active={view.mode === 'rt'}
          aria-pressed={view.mode === 'rt'}
          onClick={() => actions.setMode('rt')}
        >
          {t('practice')}
        </TabButton>
      </Tabs>

      {view.mode === 'quiz' ? (
        <QuizControls actions={actions} view={view} />
      ) : (
        <PracticeControls actions={actions} view={view} />
      )}
    </Bar>
  );
}

function QuizControls({ actions, view }: ControlBarProps) {
  const { t } = useI18n();
  return (
    <ControlGroup>
      <Button type="button" $variant="ghost" onClick={actions.quizBack}>
        {t('previousProblem')}
      </Button>
      <Button type="button" $variant="primary" onClick={actions.quizNew}>
        {t('newProblem')}
      </Button>
      <StepButton actions={actions} active={view.oneByOne} />
      <MarkerControls actions={actions} view={view} />
    </ControlGroup>
  );
}

function PracticeControls({ actions, view }: ControlBarProps) {
  const { t } = useI18n();
  const speedSeconds = formatSeconds(view.resolveMs);
  return (
    <ControlGroup>
      <Button type="button" $variant="primary" onClick={actions.startCurrentProblem}>
        {t('start')}
      </Button>
      <Button type="button" onClick={actions.togglePause}>
        {view.runPaused ? t('resume') : t('pause')}
      </Button>
      <Button type="button" onClick={actions.startCurrentProblem}>
        {t('sameProblem')}
      </Button>
      <Button type="button" onClick={actions.runPrevProblem}>
        {t('previousProblem')}
      </Button>
      <Button type="button" onClick={actions.startNewProblem}>
        {t('newProblem')}
      </Button>
      <StepButton actions={actions} active={view.oneByOne} />
      <SliderChip>
        {t('speed')}
        <Slider
          aria-label={t('speed')}
          type="range"
          min={RESOLVE_SPEED.minSeconds}
          max={RESOLVE_SPEED.maxSeconds}
          step={RESOLVE_SPEED.stepSeconds}
          value={speedSeconds}
          onChange={(event) => actions.setResolveSpeed(Number(event.target.value))}
        />
        <SliderValue>{speedSeconds}s</SliderValue>
      </SliderChip>
      <MarkerControls actions={actions} view={view} />
    </ControlGroup>
  );
}

function StepButton({ actions, active }: { actions: TrainerActions; active: boolean }) {
  const { t } = useI18n();
  return (
    <Button type="button" $active={active} $variant="ghost" aria-pressed={active} onClick={actions.toggleStepMode}>
      {t('oneByOne')}
    </Button>
  );
}

function MarkerControls({ actions, view }: ControlBarProps) {
  const { t } = useI18n();
  return (
    <>
      <Button type="button" $variant="ghost" onClick={actions.toggleMarkerPreset}>
        {view.markerPreset}
      </Button>
      <SliderChip>
        {t('waymarks')}
        <Slider
          aria-label={t('waymarks')}
          type="range"
          min={MARKER_RADIUS.min}
          max={MARKER_RADIUS.max}
          step={MARKER_RADIUS.step}
          value={view.markerRadius}
          onChange={(event) => actions.setMarkerRadius(Number(event.target.value))}
        />
        <SliderValue>{view.markerRadius}</SliderValue>
      </SliderChip>
    </>
  );
}
