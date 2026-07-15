import { VOLLEY_COUNT, WARN_MS } from '../../config';
import type { TrainerViewState } from '../../game/trainerView';
import { formatPageLabel, formatSeconds, formatWaveLabel } from '../../game/viewFormatters';
import { useI18n } from '../../i18n/I18nContext';
import { BodyCopy, Panel, PanelLabel, StatNumber } from '../shared/styles';
import { LogBox, LogEntry, PageBlock, Sidebar, SlideTitle, StatusRow } from './styles';

interface StatusSidebarProps {
  view: TrainerViewState;
}

export function StatusSidebar({ view }: StatusSidebarProps) {
  const { t } = useI18n();
  const pageLabel = formatPageLabel(view.page, view.slideTotal);
  const speedSeconds = formatSeconds(view.resolveMs);
  const warningSeconds = formatSeconds(WARN_MS);
  return (
    <Sidebar>
      {view.mode === 'quiz' ? (
        <Panel>
          <PanelLabel>{t('slide')}</PanelLabel>
          <SlideTitle>{view.slideTitle}</SlideTitle>
          <PageBlock>
            <PanelLabel>{t('page')}</PanelLabel>
            <StatNumber>{pageLabel}</StatNumber>
          </PageBlock>
          <BodyCopy>{t('clickSafetyHelp')}</BodyCopy>
        </Panel>
      ) : (
        <Panel>
          <PanelLabel>{t('status')}</PanelLabel>
          <StatusRow>
            <div>
              <PanelLabel>{t('wave')}</PanelLabel>
              <StatNumber>{formatWaveLabel(view.activeWave, VOLLEY_COUNT)}</StatNumber>
            </div>
            <div>
              <PanelLabel>{t('hits')}</PanelLabel>
              <StatNumber $danger>{view.rtHits}</StatNumber>
            </div>
          </StatusRow>
          <BodyCopy>
            {t('movementHelp')}
            <br />
            {t('timingHelp', { warningSeconds, speedSeconds, waveCount: VOLLEY_COUNT })}
            <br />
            {t('postExaflareHelp')}
          </BodyCopy>
        </Panel>
      )}
      <Panel>
        <PanelLabel>{t('log')}</PanelLabel>
        <LogBox aria-live="polite">
          {view.logs.map((entry) => (
            <LogEntry $kind={entry.className} key={entry.id}>
              {t(entry.key, entry.params)}
            </LogEntry>
          ))}
        </LogBox>
      </Panel>
    </Sidebar>
  );
}
