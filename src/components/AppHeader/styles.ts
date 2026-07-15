import styled from '@emotion/styled';
import { buttonStyles } from '../shared/styles';

export const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
`;

export const Title = styled.h1`
  margin: 0;
  color: transparent;
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.025em;
  background: linear-gradient(90deg, #c4b5fd, #f0abfc, #67e8f9);
  background-clip: text;
`;

export const Subtitle = styled.p`
  margin: 4px 0 0;
  color: #71717a;
  font-size: 14px;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const LanguageSelect = styled.select`
  ${buttonStyles};
  color: var(--trainer-text-soft);
  cursor: pointer;

  option {
    color: var(--trainer-text);
    background: #18181b;
  }
`;

export const ReferenceLink = styled.a`
  ${buttonStyles};
`;
