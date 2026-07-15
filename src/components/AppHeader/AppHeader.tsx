import { useI18n } from '../../i18n/I18nContext';
import type { Locale } from '../../i18n/translations';
import { Header, HeaderActions, LanguageSelect, LanguageSelectWrapper, ReferenceLink, Subtitle, Title } from './styles';

export function AppHeader() {
  const { locale, setLocale, t } = useI18n();
  return (
    <Header>
      <div>
        <Title>{t('appTitle')}</Title>
        <Subtitle>{t('appSubtitle')}</Subtitle>
      </div>
      <HeaderActions>
        <LanguageSelectWrapper>
          <LanguageSelect
            aria-label={t('language')}
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            <option value="ja">{t('japanese')}</option>
            <option value="en">{t('english')}</option>
          </LanguageSelect>
        </LanguageSelectWrapper>
        <ReferenceLink
          href="https://github.com/pilsnerdrinker/practice-exa-dancingmad#readme"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('referenceLink')}
        </ReferenceLink>
      </HeaderActions>
    </Header>
  );
}
