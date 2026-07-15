import styled from '@emotion/styled';
import { Button } from '../shared/styles';

export const StageWrapper = styled.div`
  position: relative;
  flex: 1 1 640px;
  min-width: 0;
  user-select: none;
`;

export const StageSurface = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  touch-action: none;
  background: var(--trainer-stage-bg);
  border: 1px solid var(--trainer-border);
  border-radius: 8px;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

export const CountOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  color: #fff;
  font-size: 72px;
  font-weight: 900;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  text-shadow: 0 0 32px rgb(139 92 246 / 90%);
  transform: translate(-50%, -50%);
  transition: opacity 150ms ease;
`;

export const CenterStartButton = styled(Button)`
  position: absolute;
  z-index: 10;
  top: 50%;
  left: 50%;
  padding: 16px 32px;
  font-size: 18px;
  box-shadow: 0 20px 25px -5px rgb(46 16 101 / 60%);
  transform: translate(-50%, -50%);
`;

export const SlideNavigation = styled.div`
  position: absolute;
  z-index: 10;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: rgb(0 0 0 / 60%);
  border: 1px solid var(--trainer-border);
  border-radius: 9999px;
  backdrop-filter: blur(8px);
`;

export const SlideButton = styled(Button)`
  min-height: 0;
  padding: 4px 10px;
  background: transparent;
  border: 0;
`;

export const SlideNumber = styled.span`
  min-width: 64px;
  font-size: 12px;
  font-weight: 900;
  text-align: center;
`;

export const CameraHelp = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  padding: 6px 12px;
  color: var(--trainer-text-muted);
  font-size: 11px;
  pointer-events: none;
  background: rgb(0 0 0 / 50%);
  border-radius: 9999px;
  backdrop-filter: blur(8px);
`;

export const HitFlash = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgb(244 63 94 / 35%);
  border-radius: 8px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: ${({ $visible }) => ($visible ? 'none' : 'opacity 300ms ease')};
`;
