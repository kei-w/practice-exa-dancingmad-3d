import { css } from '@emotion/react';
import styled from '@emotion/styled';

export type ButtonVariant = 'default' | 'primary' | 'ghost';

export const buttonStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 16px;
  color: var(--trainer-text-soft);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  text-decoration: none;
  cursor: pointer;
  background: var(--trainer-control);
  border: 1px solid var(--trainer-border);
  border-radius: 9999px;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    border-color 150ms ease;

  &:hover {
    background: var(--trainer-control-hover);
    border-color: var(--trainer-accent-border);
  }
`;

export const Button = styled.button<{ $active?: boolean; $variant?: ButtonVariant }>`
  ${buttonStyles};
  color: ${({ $active, $variant }) =>
    $active || $variant === 'primary'
      ? '#fff'
      : $variant === 'ghost'
        ? 'var(--trainer-text-muted)'
        : 'var(--trainer-text-soft)'};
  background: ${({ $active, $variant }) =>
    $active ? 'rgb(124 58 237 / 80%)' : $variant === 'primary' ? 'var(--trainer-accent)' : 'var(--trainer-control)'};
  border-color: ${({ $active, $variant }) =>
    $active
      ? 'rgb(167 139 250 / 70%)'
      : $variant === 'primary'
        ? 'var(--trainer-accent-border)'
        : 'var(--trainer-border)'};

  &:hover {
    color: ${({ $variant }) => ($variant === 'ghost' ? 'var(--trainer-text-soft)' : '#fff')};
    background: ${({ $variant }) =>
      $variant === 'primary' ? 'var(--trainer-accent-hover)' : 'var(--trainer-control-hover)'};
    border-color: var(--trainer-accent-border);
  }
`;

export const Panel = styled.section`
  padding: 20px;
  background: var(--trainer-surface);
  border: 1px solid var(--trainer-border);
  border-radius: 8px;
  backdrop-filter: blur(8px);
`;

export const PanelLabel = styled.div`
  margin-bottom: 8px;
  color: var(--trainer-text-dim);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

export const StatNumber = styled.div<{ $danger?: boolean }>`
  color: ${({ $danger }) => ($danger ? 'var(--trainer-danger)' : 'inherit')};
  font-size: 36px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

export const BodyCopy = styled.p`
  margin: 12px 0 0;
  color: var(--trainer-text-dim);
  font-size: 13px;
  line-height: 1.625;
`;

export const Strong = styled.b`
  color: var(--trainer-text-soft);
`;
