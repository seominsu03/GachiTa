This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## 사용자 승인 및 단계별 진행

- 작업은 단계별로 제안한다. 각 단계의 목적, 대상 파일, 생성·수정 여부, 실행할 명령과 완료 기준을 먼저 보고한다.
- 사용자가 요청한 파일 읽기와 Git 상태·차이 조회는 읽기 전용으로 진행할 수 있다.
- 코드·문서·설정 파일의 생성·수정·삭제와 테스트·서버 실행은 해당 작업이 포함된 단계에 대한 사용자 승인 후 수행한다. 패키지 설치와 Git 브랜치 생성·commit·push·merge도 명시적인 승인 범위에 포함되어야 한다.
- 사용자가 특정 작업을 직접 수행하라고 명시적으로 요청한 경우 그 요청 범위를 승인으로 취급한다. 범위가 명확한 승인에 대해 같은 허락을 반복해서 요청하지 않는다.
- 사용자의 “진행해”, “승인”, “N단계 진행해”는 현재 제안한 해당 단계에만 적용한다. 전체 계획 설명에 대한 동의와 이전 단계의 승인을 후속 단계 실행 승인으로 확대하지 않는다. 대상 단계가 불명확하면 확인한다.
- 승인된 단계 안에서만 작업한다. 검증 중 코드 수정이 필요하지만 현재 승인에 수정이 포함되어 있지 않으면 증상과 수정안을 보고하고 승인을 기다린다.
- 각 단계가 끝나면 변경 파일, 실제 실행 결과, 미완료 항목과 다음 단계 제안을 보고한 뒤 사용자 응답을 기다린다. 다음 단계는 별도 승인 후 시작한다.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

For code changes, include lint and typecheck in the proposed verification step and run them after that step is approved. Report unavailable checks without automatically installing dependencies. For documentation-only changes, verify the document diff.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
