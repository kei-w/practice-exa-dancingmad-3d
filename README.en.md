# P5 Exaflare Practice 3D (Stray Apocalypse)

English | [日本語](README.md)

An unofficial 3D practice tool for the P5 Exaflare sequence, **Stray Apocalypse**, in FINAL FANTASY XIV's **Dancing Mad (Ultimate)**.

The mechanics available for practice—including the six waves and the left, center, and right patterns—are based on the
[original 2D practice tool](https://github.com/pilsnerdrinker/practice-exa-dancingmad).
The code itself is an independent implementation of the mechanic; its coordinate system, hit detection, and rendering do not reuse the original tool's code.

The Exaflare positions, radii, and timing have been calibrated against overhead reference footage.
Hit detection uses circular areas matching the in-game Exaflares.
In Practice Mode, collision is checked against impact positions that advance two timing steps ahead of the displayed effects.

Use the language selector in the upper-right corner to switch between Japanese and English.
The app uses the browser language on the first visit and saves the selected language in the browser.

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` or arrow keys | Move your character (`W` moves in the direction the camera is facing) |
| Right mouse drag | Rotate the third-person camera around your character |
| Mouse wheel | Zoom in or out |
| Left click in Position Review Mode | Check whether the clicked position is safe |
| Left stick | Move your character with analog, camera-relative controls |
| Right stick | Rotate the camera |
| `L1` (`LB`) + right stick up/down | Zoom in or out |

The gamepad controls are modeled after FFXIV's default controller configuration.
Due to browser restrictions, the gamepad is not detected until you press one of its buttons at least once.

## Modes

- **Position Review**: Step through each wave's line attacks and the next telegraph. Click the arena to check whether a position is safe.
- **Practice**: After a countdown, control your character and avoid all six waves of Stray Apocalypse.

The interval between Exaflare impacts can be adjusted from 2.5 to 5.0 seconds with the speed slider; the default is 4.4 seconds.
Enable the one-at-a-time option to stop automatic progression, then switch between the previous, current, and a new problem.

The arena waymarks are rendered as FFXIV-style pillars of light.
The lettered waymarks `A/B/C/D` are placed at 90-degree intervals clockwise from `A` at north, while the numbered waymarks are placed on the intercardinal points offset by 45 degrees.
Their distance from the center can be adjusted from 25 to 50 with the Waymark slider; the default is 35.
Use the `2341` layout (1 = northwest, 2 = northeast, 3 = southeast, 4 = southwest) or the `1234` layout (1 = northeast, then clockwise) to change the number assignments.

## Development

The toolchain is managed with [mise](https://mise.jdx.dev/) and uses Node.js LTS with pnpm.

```sh
mise install        # Set up Node.js and pnpm
pnpm install        # Install dependencies
pnpm dev            # Start the development server (http://localhost:5173)
pnpm build          # Create a production build in dist/
pnpm format         # Format with Biome
pnpm lint           # Lint with Biome
pnpm check          # Format and lint, applying automatic fixes
pnpm typecheck      # Run TypeScript type checking with tsc --noEmit
```

## Project Structure

The UI is built with React 19 and styled components from [Emotion](https://emotion.sh/).

- [index.html](index.html) — React mount point
- [src/App.tsx](src/App.tsx) — Top-level component composition
- [src/App.styles.ts](src/App.styles.ts) — Top-level layout styles
- [src/components/](src/components) — Header, controls, 3D stage, and status panel
- [src/hooks/useTrainer.ts](src/hooks/useTrainer.ts) — Connects React to the game controller
- [src/i18n/](src/i18n) — Japanese/English dictionaries and language-switching context
- [src/styles/GlobalStyles.tsx](src/styles/GlobalStyles.tsx) — Global styles
- [src/game/controller.ts](src/game/controller.ts) — Bridge between React, the game loop, and Three.js
- [src/config.ts](src/config.ts) — Game configuration such as arena radius, lane count, and timing
- [src/game/](src/game) — Game logic
  - `lanes.ts` — Lane geometry, direction vectors, lane checks, and circular impact hit detection
  - `problem.ts` — Problem generation and history (`ProblemHistory`)
  - `practiceSession.ts` — Practice state, timing, and movement logic
  - `settings.ts` — User-adjustable practice settings
  - `slides.ts` — Slide generation for Position Review Mode
  - `viewFormatters.ts` — Formatting helpers for the React UI
- [src/three/](src/three) — Three.js rendering
  - `primitives.ts` — Disc, ring, and strip geometry; text sprites; and textures
  - `markers.ts` — FFXIV-style arena waymarks
  - `scene.ts` — `Scene3D`, including the arena, Exaflares, player, camera, and mouse input
- [src/input/](src/input) — `keyboard.ts` for WASD/arrow keys and `gamepad.ts` for FFXIV-style gamepad controls
- [src/main.tsx](src/main.tsx) — React entry point

## Disclaimer

- This is an unofficial, fan-made practice tool.
- Follow your group's chosen strategy and callouts in the actual encounter.
