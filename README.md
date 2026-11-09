# spell — Iun's Word Study

사진 속 영어 단어를 인식해 단어장을 만들고, 플래시카드·철자 시험·뜻 맞히기 퀴즈·영어 사전·책 읽기 모드로 공부하는 웹앱입니다. 앱 전체가 `index.html` 한 파일로 되어 있습니다.

## 환경과 배포

| 환경 | 브랜치 | 주소 |
|------|--------|------|
| 운영 | `main` | https://jeehjung.github.io/spell/ (GitHub Pages)<br>https://wordstudy-6cw.pages.dev/ (Cloudflare Pages `wordstudy`) |
| 개발 | `dev`  | https://wordstudy-dev.pages.dev/ (Cloudflare Pages `wordstudy-dev`만) |

- `main`에 푸시하면 두 곳에 배포됩니다.
  - `.github/workflows/deploy-pages.yml` → GitHub Pages
  - `.github/workflows/deploy-cloudflare.yml` → Cloudflare Pages `wordstudy`
- `dev`에 푸시하면 `deploy-cloudflare.yml`만 실행되어 Cloudflare Pages `wordstudy-dev`에 배포됩니다. GitHub Pages에는 개발 버전이 올라가지 않습니다.
- Cloudflare 배포에는 레포 Secrets `CLOUDFLARE_API_TOKEN`(Cloudflare Pages 편집 권한), `CLOUDFLARE_ACCOUNT_ID`가 필요합니다.
- 화면 하단의 "Latest update"에는 배포 시각(KST)이 자동으로 표시됩니다.
- 변경은 항상 `dev`에서 먼저 확인한 뒤 `main`에 반영합니다.

## 데이터 저장

- 단어장, 사전 기록, 설정, Gemini API 키는 모두 브라우저(localStorage·IndexedDB)에만 저장되며 서버로 보내지 않습니다.
- 저장 데이터는 주소(도메인)별로 따로 보관됩니다. GitHub Pages 운영, Cloudflare 운영, Cloudflare 개발은 서로의 단어장과 API 키를 볼 수 없으니 주소마다 API 키를 따로 입력하세요.
- (코드에는 예전 GitHub Pages `/dev/` 경로용 `dev:` 접두어 처리가 남아 있지만, 지금 구성에서는 쓰이지 않습니다.)

## Gemini API

- 사용자가 앱에 직접 입력한 Gemini API 키로, 브라우저에서 Google Gemini API를 바로 호출합니다.
- 사용 모델은 `index.html`의 `GEMINI_MODEL` 상수에서 바꿀 수 있습니다.
