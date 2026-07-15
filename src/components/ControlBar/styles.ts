import styled from '@emotion/styled';

export const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--trainer-surface);
  border: 1px solid var(--trainer-border);
  border-radius: 8px;
  backdrop-filter: blur(8px);
`;

export const Tabs = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgb(0 0 0 / 40%);
  border: 1px solid var(--trainer-border);
  border-radius: 9999px;
`;

export const TabButton = styled.button<{ $active: boolean }>`
  padding: 8px 20px;
  color: ${({ $active }) => ($active ? '#fff' : 'var(--trainer-text-dim)')};
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'var(--trainer-accent)' : 'transparent')};
  border: 0;
  border-radius: 9999px;
  box-shadow: ${({ $active }) => ($active ? '0 10px 15px -3px rgb(46 16 101 / 50%)' : 'none')};
  transition:
    color 150ms ease,
    background-color 150ms ease;

  &:hover {
    color: var(--trainer-text-soft);
  }
`;

export const ControlGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

export const SliderChip = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  color: var(--trainer-text-muted);
  font-size: 11px;
  font-weight: 700;
  background: var(--trainer-control);
  border: 1px solid var(--trainer-border);
  border-radius: 9999px;
`;

export const Slider = styled.input`
  width: 96px;
  accent-color: var(--trainer-accent-hover);
`;

export const SliderValue = styled.span`
  min-width: 32px;
  color: var(--trainer-text);
  text-align: right;
`;
