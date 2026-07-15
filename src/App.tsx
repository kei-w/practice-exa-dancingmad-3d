import { AppHeader } from './components/AppHeader/AppHeader';
import { ControlBar } from './components/ControlBar/ControlBar';
import { GameStage } from './components/GameStage/GameStage';
import { StatusSidebar } from './components/StatusSidebar/StatusSidebar';
import { useTrainer } from './hooks/useTrainer';
import { useI18n } from './i18n/I18nContext';
import { Content, Page } from './App.styles';

export function App() {
  const { locale } = useI18n();
  const { actions, stageRef, view } = useTrainer(locale);

  return (
    <Page>
      <AppHeader />
      <ControlBar actions={actions} view={view} />
      <Content>
        <GameStage actions={actions} stageRef={stageRef} view={view} />
        <StatusSidebar view={view} />
      </Content>
    </Page>
  );
}
