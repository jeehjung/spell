# spell — Word Study

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

## PWA (홈 화면 설치)

- `manifest.webmanifest`, `sw.js`(서비스 워커), `icons/`로 홈 화면에 앱처럼 설치할 수 있고, 한 번 열어 둔 뒤에는 오프라인에서도 열립니다.
- 서비스 워커는 화면(HTML)을 항상 네트워크에서 먼저 받아서, 배포 후 자동 새로고침(`version.json` 확인)이 그대로 동작합니다. 배포마다 캐시 이름이 바뀌어 예전 캐시는 자동으로 지워집니다.
- 사진 인식 등 Gemini 호출은 인터넷이 있어야 합니다.

## 데이터 저장

- 단어장, 사전 기록, 설정, Gemini API 키는 모두 브라우저(localStorage·IndexedDB)에만 저장되며 서버로 보내지 않습니다.
- 저장 데이터는 주소(도메인)별로 따로 보관됩니다. GitHub Pages 운영, Cloudflare 운영, Cloudflare 개발은 서로의 단어장과 API 키를 볼 수 없으니 주소마다 API 키를 따로 입력하세요.
- (코드에는 예전 GitHub Pages `/dev/` 경로용 `dev:` 접두어 처리가 남아 있지만, 지금 구성에서는 쓰이지 않습니다.)

## Gemini API

- **기본 키**: 개인 키가 없으면 Cloudflare Pages Function `functions/api/gemini.js`(`/api/gemini`)가 Pages 프로젝트 비밀값 `GEMINI_API_KEY`로 Gemini를 대신 호출합니다. 키는 브라우저로 내려가지 않습니다.
  - Cloudflare 운영·개발 화면은 각자 자기 서버(`wordstudy`, `wordstudy-dev`)를 사용합니다.
  - GitHub Pages 운영 화면은 서버가 없어서 Cloudflare 운영 서버(`https://wordstudy-6cw.pages.dev/api/gemini`)를 빌려 씁니다.
  - 서버는 자기 주소와 `https://jeehjung.github.io`에서 온 요청만 받습니다.
  - 비밀값 `GEMINI_API_KEY`는 Cloudflare 대시보드의 Pages 프로젝트 `wordstudy`, `wordstudy-dev`에 각각 등록합니다(등록·변경 후 다시 배포해야 적용).
- **개인 키(선택)**: 앱의 API Key 버튼에서 입력하면 이 브라우저에만 저장되고, 요청은 브라우저에서 Google Gemini API로 직접 보냅니다.
- 사용 모델은 `index.html`의 `GEMINI_MODEL` 상수에서 바꿀 수 있습니다.
