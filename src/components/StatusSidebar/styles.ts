import styled from '@emotion/styled';

export const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;

  @media (min-width: 1024px) {
    flex: 0 0 auto;
    width: 320px;
  }
`;

export const SlideTitle = styled.div`
  min-height: 56px;
  font-size: 13px;
  line-height: 1.625;
`;

export const PageBlock = styled.div`
  margin-top: 8px;
`;

export const StatusRow = styled.div`
  display: flex;
  gap: 24px;
`;

export const LogBox = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  height: 240px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.625;
`;

export const LogEntry = styled.div<{ $kind: 'e' | 'ok' | 'ng' | 'sys' }>`
  padding: 2px 6px;
  color: ${({ $kind }) =>
    $kind === 'ok'
      ? 'var(--trainer-success)'
      : $kind === 'ng'
        ? '#fda4af'
        : $kind === 'sys'
          ? 'var(--trainer-info)'
          : 'var(--trainer-text-muted)'};
  background: ${({ $kind }) =>
    $kind === 'ok' ? 'rgb(16 185 129 / 10%)' : $kind === 'ng' ? 'rgb(244 63 94 / 10%)' : 'transparent'};
  border-radius: 4px;
`;
