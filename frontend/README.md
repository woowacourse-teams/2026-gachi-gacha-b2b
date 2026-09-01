# B2B Frontend

## 기술 구성

- React 19, TypeScript 6
- Webpack 5
- Emotion
- MSW 2
- Vitest, Testing Library
- ESLint, Prettier

기존 가치가챠 프론트엔드의 Node·pnpm 버전과 lint, format, TypeScript strict 설정을 동일하게 사용합니다.

## 실행 명령어

```bash
pnpm install
pnpm run dev
pnpm run dev:ai
pnpm run test
pnpm run check
```

기본 개발 환경은 `B2B_USE_MSW=true`이므로 프론트엔드만 실행해도 AI 추천까지 목 데이터로 확인할 수 있습니다. 실제 OpenAI 연동을 확인할 때는 한 터미널에서 `pnpm run dev:ai`, 다른 터미널에서 `B2B_USE_MSW=false pnpm run dev`를 실행합니다.

## 환경변수

```bash
cp .env.example .env
```

| 이름                       | 기본값                    | 실행 위치     | 설명                               |
| -------------------------- | ------------------------- | ------------- | ---------------------------------- |
| `B2B_API_BASE_URL`         | `/api/v1`                 | Webpack 빌드  | Spring B2B API 기준 경로           |
| `B2B_AI_API_BASE_URL`      | `/api/b2b-ai`             | Webpack 빌드  | AI BFF 기준 경로                   |
| `B2B_USE_MSW`              | 개발 `true`, 배포 `false` | Webpack 빌드  | MSW 사용 여부                      |
| `B2B_BACKEND_ORIGIN`       | `http://127.0.0.1:8080`   | 개발 서버     | MSW 비활성화 시 Spring 프록시 대상 |
| `OPENAI_API_KEY`           | 없음                      | AI BFF 런타임 | OpenAI 비밀 키                     |
| `OPENAI_MODEL`             | `gpt-4o-mini-2024-07-18`  | AI BFF 런타임 | 이미지 분류 모델                   |
| `AI_IMAGE_HOST_ALLOWLIST`  | 없음                      | AI BFF 런타임 | 허용 이미지 호스트 목록(쉼표 구분) |
| `AI_HOST`                  | `127.0.0.1`               | AI BFF 런타임 | 수신 주소                          |
| `AI_PORT`                  | `8787`                    | AI BFF 런타임 | 수신 포트                          |
| `AI_RATE_LIMIT_PER_MINUTE` | `20`                      | AI BFF 런타임 | 클라이언트별 분당 AI 요청 상한     |

`OPENAI_API_KEY`를 포함한 AI BFF 변수는 Webpack의 `DefinePlugin`에 주입하지 않습니다. 따라서 브라우저 번들에는 포함되지 않습니다. 실제 API 연결 전에는 `B2B_USE_MSW=true`로 실행합니다.

## 설계 경계

```text
pages/components
      ↓ domain model
classificationApi
      ↓ DTO mapper
HTTP API 또는 MSW

ClassificationPage
      ↓ same-origin /api/b2b-ai
Node AI BFF (server/)
      ↓ Responses API
OpenAI
```

- 화면은 `ClassificationItemDto`를 직접 사용하지 않습니다.
- `toClassification.ts`가 임시 API 응답을 화면 모델로 변환합니다.
- 실제 백엔드 응답이 확정되면 DTO, 변환 함수, API 경로를 먼저 수정합니다.
- MSW 핸들러는 실제 서버의 상태 전이를 흉내 내며 목 데이터 원본은 `src/mocks/data.ts`에 있습니다.
- AI BFF는 OpenAI 키 보호, 입력 검증, 이미지 호스트 제한, 호출량 제한만 담당합니다. 분류 저장은 기존 B2B API의 책임으로 분리합니다.

## 실제 backend-dev 계약과 프론트엔드 대응

`backend-dev`의 Spring 서버는 `8080` 포트와 `/api/v1` context path를 사용합니다. 성공 응답은 모두 `{ code, message, data }`로 감싸며, 가챠 목록의 `data`는 Spring `Page` 형식입니다. 프론트엔드는 이 외부 계약을 API 어댑터에서 화면 모델로 변환합니다.

```text
GET          /api/v1/categories
POST         /api/v1/categories
PATCH/DELETE /api/v1/categories/{categoryId}
GET/POST     /api/v1/gachas
GET/PATCH    /api/v1/gachas/{gachaId}
PUT          /api/v1/gachas/{gachaId}/thumbnail (multipart image)
POST         /api/b2b-ai/suggest-categories
```

현재 연동 범위:

| 기능                    | 운영 API 연동 | 동작 방식                                                                 |
| ----------------------- | ------------- | ------------------------------------------------------------------------- |
| 가챠 목록·상세          | 완료          | Spring Page를 `id,asc`로 조회하고 DTO를 화면 모델로 변환                  |
| 이름 검색               | 완료          | 백엔드 `keyword` 쿼리 사용                                                |
| 이름·카테고리 분류 저장 | 완료          | `PATCH /gachas/{id}`에 이름과 카테고리 ID 전달                            |
| 카테고리 조회·추가·삭제 | 완료          | 실제 카테고리 CRUD 사용. 삭제 시 연결된 가챠에서도 해당 카테고리가 제거됨 |
| 현장 사진 등록          | 완료          | 가챠 생성 후 백엔드 multipart 썸네일 업로드                               |
| AI 카테고리 제안        | BFF 연동      | 추천값만 편집란에 채우며 관리자 저장 전에는 DB를 변경하지 않음            |
| 건너뛰기·복구           | 미지원        | 백엔드 상태/API가 없어 운영 UI에서 숨김                                   |

백엔드에는 별도 분류 상태가 없으므로, 운영 프론트엔드는 카테고리가 없으면 `UNCLASSIFIED`, 하나 이상이면 `CLASSIFIED`로 해석합니다. ID 범위와 카테고리 다중 필터도 아직 서버 쿼리가 없어 조회한 페이지 안에서 적용하며, 일치 데이터가 나올 때까지 다음 Spring Page를 순차 조회합니다. 데이터가 수천 건으로 늘어나면 아래 조건을 백엔드 목록 API에 추가해야 네트워크 비용과 응답시간이 안정적입니다.

```text
classificationStatus, minId, maxId, categoryIds, cursor(or page), size
```

첫 화면은 이미지를 제외한 압축 목록을 보여주고, 분류 화면에 들어갈 때만 썸네일과 AI 추천을 사용합니다. 동일한 `gachaId`와 `updatedAt` 기반 버전의 AI 결과는 세션에 캐시하며, 관리자가 편집한 뒤 늦게 도착한 추천은 입력을 덮어쓰지 않습니다.

현장 등록은 실제 백엔드 계약상 하나의 원자적 요청이 아니라 `POST /gachas` 후 `PUT /gachas/{id}/thumbnail`의 2단계입니다. 두 번째 요청만 실패하면 DB 행은 남으므로 UI가 신규 등록을 성공으로 표시하되 썸네일 보완 경고를 제공합니다. 장기적으로는 단일 multipart 생성 API, 실패 시 생성 데이터 정리 API 또는 멱등성 키가 필요합니다. 브라우저는 S3 키나 IAM 권한을 사용하지 않습니다.

MSW 모드는 복구 가능한 건너뛰기, ID 커서, 업로드 티켓 등 목표 계약까지 포함해 프론트엔드 UX를 검증합니다. 운영 모드는 실제 백엔드가 지원하는 기능만 노출합니다. 이번 구현에는 SHA-256 체크섬과 pHash 유사 이미지 검사가 포함되지 않습니다.

## AI BFF 배포 결정

현재 프론트엔드는 정적 파일이므로 OpenAI를 직접 호출하면 API 키가 사용자에게 노출됩니다. 또한 AWS Lambda와 API Gateway를 새로 만들려면 IAM 권한과 배포 설정이 필요합니다. 현재 AWS 권한 제약에서는 기존 EC2에 작은 Node 프로세스를 함께 실행하는 방식이 가장 현실적입니다. 엄밀히 말하면 이 구성은 서버리스가 아니라 프론트엔드 팀이 관리하는 BFF입니다.

```text
관리자 브라우저
  ├─ /api/v1/*     → Nginx → 127.0.0.1:8080 Spring 백엔드
  └─ /api/b2b-ai/* → Nginx → 127.0.0.1:8787 Node BFF → OpenAI
```

EC2에서 OpenAI로 HTTPS 요청을 보내는 데 AWS 액세스 키나 IAM 역할은 필요하지 않습니다. BFF가 S3 SDK로 객체를 읽지 않고, 기존 B2B API가 내려준 외부 접근 가능한 HTTPS 이미지 URL을 OpenAI에 전달하기 때문입니다. S3 객체가 비공개라면 백엔드가 만료 시간이 충분한 조회용 Presigned URL을 내려줘야 합니다. 객체 key만 반환하는 계약이라면 프론트엔드만으로는 OpenAI가 이미지를 읽을 수 없습니다.

Nginx 예시:

```nginx
location /api/v1/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 10m;
}

location /api/b2b-ai/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_read_timeout 60s;
}

location / {
    try_files $uri /index.html;
}
```

systemd 예시:

```ini
[Unit]
Description=Gachi Gacha B2B AI API
After=network-online.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/srv/gachi-gacha-b2b/frontend
EnvironmentFile=/etc/gachi-gacha-b2b-ai.env
ExecStart=/usr/bin/node server/index.mjs
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

`/etc/gachi-gacha-b2b-ai.env`에는 `OPENAI_API_KEY`, 모델, 실제 S3 또는 CDN 호스트 allowlist만 저장하고 Git에 커밋하지 않습니다. BFF는 `127.0.0.1`에만 바인딩합니다. B2B 사이트 전체는 관리자 로그인, VPN, IP 제한 또는 최소한 Nginx Basic Auth로 보호해야 합니다. 그렇지 않으면 제3자가 같은 API를 호출해 과금을 발생시킬 수 있습니다.

팀원 개인 키를 브라우저에 입력하거나 여러 개인 키를 서버가 임의로 순환시키는 방식은 사용하지 않습니다. 키 소유자별 비용 책임이 불명확해지고 유출·폐기·사용량 추적이 어려워집니다. 운영에서는 B2B 전용 OpenAI Project의 서버용 키 하나를 런타임 secret으로 두고 프로젝트 예산·사용량 제한을 적용하는 방식을 권장합니다. 개인별 비용 분리가 꼭 필요하다면 로그인 사용자별 키를 암호화 저장하고 감사 로그와 폐기 절차까지 갖춘 별도 비밀 관리 기능이 필요하므로 현재 범위에 포함하지 않습니다.

현재 B2B 저장소에는 배포 워크플로가 없으므로 코드만으로 자동 배포가 완성된 상태는 아닙니다. 최초 1회 EC2에 Nginx·systemd·런타임 환경파일을 구성할 sudo 권한이 필요합니다. 이후 self-hosted runner가 이 저장소에도 할당돼 있고 제한된 `systemctl restart` 권한이 있다면, CI에서 정적 `dist`와 `server/`를 복사한 뒤 BFF를 재시작하도록 자동화할 수 있습니다. 이는 AWS IAM이 아니라 EC2 OS 권한의 문제입니다.

## 실제 API 연결 체크리스트

- 프론트엔드 빌드 시 `B2B_USE_MSW=false`, `B2B_API_BASE_URL=/api/v1` 적용
- Nginx `/api/v1/`과 `/api/b2b-ai/` upstream 및 SPA fallback 순서 확인
- 관리자 인증 및 `credentials: include` 쿠키 정책 확정
- CSRF 정책 확정
- S3가 비공개라면 조회용 Presigned URL 응답 적용
- AI 분석 시점까지 조회용 Presigned URL이 유효한지 확인
- `thumbnailUrl`의 S3/CDN 호스트를 `AI_IMAGE_HOST_ALLOWLIST`에 등록
- OpenAI 호출 감사 로그에는 item ID, 모델, 성공 여부, 지연시간만 남기고 이미지 URL의 서명 쿼리와 API 키는 기록하지 않기
- 운영 관리자 인증과 AI 호출 사용자별 제한 적용
- AI 추천 정확도·빈 추천률·관리자 수정률을 수집해 자동화 효과 검증
- 현장 등록의 DB 생성 성공·썸네일 실패 데이터 보완 또는 정리 정책 확정
- 모바일 HEIC 이미지를 허용할지와 서버 변환 정책 확정
- 백엔드에 분류 상태, `minId`·`maxId`, `categoryIds` 목록 필터 추가
- `version`을 이용한 낙관적 잠금과 `409 Conflict` 처리 연결
- 다중 작업자 claim/lease 정책 반영
- 카테고리 중복 판정 및 비활성화 정책 반영
- location 필드가 필요하다면 실제 DB 규약 추가(현재 API에는 없음)
- 분류 저장 후 DB 재조회 통합 테스트 추가
- 현장 등록 API의 원자성 또는 멱등성 키 확정
- 건너뛰기 상태·복구 API와 사유·감사 로그 추가
- 배포 환경에서 실제 PostgreSQL·S3를 사용하는 smoke test 수행

## 키보드 조작

- `Enter`: 이름과 카테고리가 유효할 때 저장 후 다음 항목으로 이동
- `Escape`: 열린 카테고리 또는 건너뛰기 다이얼로그 닫기

입력창에 포커스가 있을 때는 전역 단축키가 실행되지 않습니다.
