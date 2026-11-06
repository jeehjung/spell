# spell — Iun's Word Study

사진 속 영어 단어를 인식해 단어장을 만들고, 플래시카드·철자 시험·뜻 맞히기 퀴즈·영어 사전·책 읽기 모드로 공부하는 웹앱입니다. 앱 전체가 `index.html` 한 파일로 되어 있습니다.

## 환경과 배포

| 환경 | 브랜치 | 주소 |
|------|--------|------|
| 운영 | `main` | https://jeehjung.github.io/spell/ |
| 개발 | `dev`  | https://jeehjung.github.io/spell/dev/ |

- `main` 또는 `dev`에 푸시하면 GitHub Actions(`.github/workflows/deploy-pages.yml`)가 두 브랜치를 함께 받아 GitHub Pages에 배포합니다. `main`은 루트에, `dev`는 `/dev/`에 올라갑니다.
- 화면 하단의 "Latest update"에는 배포 시각(KST)이 자동으로 표시됩니다.
- 변경은 항상 `dev`에서 먼저 확인한 뒤 `main`에 반영합니다.

## 데이터 저장

- 단어장, 사전 기록, 설정, Gemini API 키는 모두 브라우저(localStorage·IndexedDB)에만 저장되며 서버로 보내지 않습니다.
- 운영과 개발은 같은 도메인을 쓰기 때문에, 개발(`/dev/`)에서는 모든 저장 키 앞에 `dev:`(IndexedDB는 `dev_`)를 붙여 운영 데이터와 분리합니다. 따라서 개발 화면에서는 운영에 저장된 단어장과 API 키가 보이지 않으며, 개발용 API 키를 따로 입력해야 합니다.

## Gemini API

- 사용자가 앱에 직접 입력한 Gemini API 키로, 브라우저에서 Google Gemini API를 바로 호출합니다.
- 사용 모델은 `index.html`의 `GEMINI_MODEL` 상수에서 바꿀 수 있습니다.
