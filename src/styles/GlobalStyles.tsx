import { Global, css } from '@emotion/react';

const globalStyles = css`
  :root {
    --trainer-bg: #09090b;
    --trainer-stage-bg: #0d1017;
    --trainer-text: #f4f4f5;
    --trainer-text-soft: #e4e4e7;
    --trainer-text-muted: #a1a1aa;
    --trainer-text-dim: #71717a;
    --trainer-surface: rgb(255 255 255 / 4%);
    --trainer-control: rgb(255 255 255 / 5%);
    --trainer-control-hover: rgb(255 255 255 / 10%);
    --trainer-border: rgb(255 255 255 / 10%);
    --trainer-accent: #7c3aed;
    --trainer-accent-hover: #8b5cf6;
    --trainer-accent-border: rgb(167 139 250 / 60%);
    --trainer-danger: #fb7185;
    --trainer-success: #6ee7b7;
    --trainer-info: #67e8f9;
    color-scheme: dark;
    font-family: 'Segoe UI', 'Hiragino Sans', 'Yu Gothic UI', Meiryo, system-ui, sans-serif;
    font-synthesis: none;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    min-width: 320px;
    min-height: 100%;
    background: var(--trainer-bg);
  }

  body {
    min-height: 100vh;
    margin: 0;
    color: var(--trainer-text);
    background-color: var(--trainer-bg);
    background-image: radial-gradient(1100px 520px at 50% -8%, rgb(91 33 182 / 28%), transparent 70%);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  button,
  input {
    font: inherit;
  }
`;

export function GlobalStyles() {
  return <Global styles={globalStyles} />;
}
