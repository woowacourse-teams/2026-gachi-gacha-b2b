# B2B Frontend

## 기술 구성

- React 19, TypeScript 6
- Webpack 5
- Emotion
- MSW 2
- Vitest, Testing Library
- ESLint, Prettier

기존 가치가챠 프론트엔드의 Node·pnpm 버전과 lint, format, TypeScript strict 설정을 동일하게 사용합니다.

점주용 재고관리의 데이터 계약과 구현 순서는 [store-inventory-roadmap.md](docs/store-inventory-roadmap.md)에 정리했습니다.

## 프론트엔드 협업 규칙

- 이슈는 기본 브랜치 `main`의 `.github/ISSUE_TEMPLATE/`에서 유형에 맞는 템플릿을 사용하고, 제목은 `[FEAT]`, `[BUG]`, `[REFACTOR]`처럼 대문자 유형으로 시작합니다.
- PR은 `main`의 `.github/pull_request_template.md` 섹션을 빠짐없이 채우고, 제목은 `[FEAT]`, `[FIX]`, `[REFACTOR]` 등 작업 유형으로 시작합니다. 관련 이슈는 PR 본문의 `Closes #번호`로 연결합니다. 스크린샷을 첨부할 수 없으면 이유를 적고, 체크리스트는 실제 충족한 항목만 표시합니다.
- 새 작업 브랜치에는 이슈 번호를 포함합니다. 예: `feature/33-store-operations`.
- 커밋은 Angular 유형과 기능 범위를 사용하되, 콜론 앞뒤에 공백을 둔 `feat(store-inventory) : 한글 설명` 형식을 따릅니다. 수정·리팩터링도 `fix(범위) : 한글 설명`, `refactor(범위) : 한글 설명`처럼 작성합니다.

## 실행 명령어

```bash
pnpm install
pnpm run dev
pnpm run dev:bff
pnpm run test
pnpm run check
```

기본 개발 환경은 `B2B_USE_MSW=true`이며 브라우저 목 API로 동작을 확인할 수 있습니다. 운영 API와 통합 검색을 함께 확인할 때는 한 터미널에서 `pnpm run dev:bff`, 다른 터미널에서 `B2B_USE_MSW=false pnpm run dev`를 실행합니다.

## 환경변수

```bash
cp .env.example .env
```

| 이름                   | 기본값                         | 실행 위치    | 설명                                       |
| ---------------------- | ------------------------------ | ------------ | ------------------------------------------ |
| `B2B_API_BASE_URL`     | `/api/v1`                      | Webpack 빌드 | Spring B2B API 기준 경로                   |
| `B2B_BFF_API_BASE_URL` | `/api/b2b-ai`                  | Webpack 빌드 | 통합 검색 BFF 기준 경로                    |
| `B2B_USE_MSW`          | 개발 `true`, 배포 `false`      | Webpack 빌드 | MSW 사용 여부                              |
| `B2B_BACKEND_ORIGIN`   | `http://127.0.0.1:8080`        | 개발 서버    | MSW 비활성화 시 Spring 프록시 대상         |
| `B2B_BACKEND_BASE_URL` | `http://127.0.0.1:8080/api/v1` | BFF 런타임   | BFF가 읽을 Spring API 기준 URL             |
| `B2B_CATALOG_CSV_URL`  | 빈 값                          | BFF 런타임   | 선택형 공개 Google Sheet CSV 읽기 전용 URL |
| `BFF_HOST`             | `127.0.0.1`                    | BFF 런타임   | 수신 주소                                  |
| `BFF_PORT`             | `8787`                         | BFF 런타임   | 수신 포트                                  |

기존 배포를 위해 `B2B_AI_API_BASE_URL`, `AI_HOST`, `AI_PORT`도 각각 새 환경변수의 대체값으로 읽습니다. HTTP 경로 `/api/b2b-ai/catalog-search`는 기존 Nginx 설정과의 호환을 위해 유지합니다.

## 설계 경계

```text
pages/components
      ↓ domain model
classificationApi
      ↓ DTO mapper
HTTP API 또는 MSW

StoreListPage / StoreInventoryPage
      ↓ storeInventoryApi
매장·가챠 관계 API 및 통합 검색 BFF

통합 검색 BFF (server/)
      ↓ 기존 Spring 가챠 목록 조회·캐시
검색 결과
```

- 화면은 `ClassificationItemDto`를 직접 사용하지 않습니다.
- `toClassification.ts`가 임시 API 응답을 화면 모델로 변환합니다.
- 실제 백엔드 응답이 확정되면 DTO, 변환 함수, API 경로를 먼저 수정합니다.
- MSW 핸들러는 실제 서버의 상태 전이를 흉내 내며 목 데이터 원본은 `src/mocks/data.ts`에 있습니다.
- 통합 검색 BFF는 기존 가챠 목록을 읽어 검색하며 재고 수량이나 점주별 정보를 저장하지 않습니다.

## 실제 backend-dev 계약과 프론트엔드 대응

`backend-dev`의 Spring 서버는 `8080` 포트와 `/api/v1` context path를 사용합니다. 성공 응답은 모두 `{ code, message, data }`로 감싸며, 가챠 목록의 `data`는 Spring `Page` 형식입니다. 프론트엔드는 이 외부 계약을 API 어댑터에서 화면 모델로 변환합니다.

```text
GET          /api/v1/categories
POST         /api/v1/categories
PATCH/DELETE /api/v1/categories/{categoryId}
GET/POST     /api/v1/gachas
GET/PATCH    /api/v1/gachas/{gachaId}
PUT          /api/v1/gachas/{gachaId}/thumbnail (multipart image)
GET          /api/v1/stores
GET          /api/v1/stores/{storeId}
GET          /api/v1/stores/{storeId}/gachas
POST/DELETE  /api/v1/stores/{storeId}/gachas/{gachaId}
GET          /api/b2b-ai/catalog-search
GET          /api/b2b-ai/catalog-items?gachaId=...
```

현재 연동 범위:

| 기능                    | 운영 API 연동 | 동작 방식                                                                                                           |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| 가챠 목록·상세          | 완료          | Spring Page를 `id,asc`로 조회하고 DTO를 화면 모델로 변환                                                            |
| 가챠 통합 검색          | BFF 연동      | 기존 가챠 목록을 30초간 캐시하고 이름·카테고리로 검색. 선택형 CSV 연결 시 한·일 이름·별칭·작품·시리즈·캐릭터도 검색 |
| 이름·카테고리 분류 저장 | 완료          | `PATCH /gachas/{id}`에 이름과 카테고리 ID 전달                                                                      |
| 카테고리 조회·추가·삭제 | 완료          | 실제 카테고리 CRUD 사용. 삭제 시 연결된 가챠에서도 해당 카테고리가 제거됨                                           |
| 현장 사진 등록          | 완료          | 가챠 생성 후 백엔드 multipart 썸네일 업로드                                                                         |
| 매장 보유 가챠 관리     | 완료          | 매장을 선택해 가챠를 등록·제거하고 등록 종류의 카탈로그 정보를 표시                                                 |
| 건너뛰기·복구           | 미지원        | 백엔드 상태/API가 없어 운영 UI에서 숨김                                                                             |

백엔드에는 별도 분류 상태가 없으므로, 운영 프론트엔드는 카테고리가 없으면 `UNCLASSIFIED`, 하나 이상이면 `CLASSIFIED`로 해석합니다. ID 범위와 카테고리 다중 필터도 아직 서버 쿼리가 없어 조회한 페이지 안에서 적용하며, 일치 데이터가 나올 때까지 다음 Spring Page를 순차 조회합니다. 데이터가 수천 건으로 늘어나면 아래 조건을 백엔드 목록 API에 추가해야 네트워크 비용과 응답시간이 안정적입니다.

```text
classificationStatus, minId, maxId, categoryIds, cursor(or page), size
```

첫 화면은 이미지를 제외한 압축 목록을 보여줍니다. 분류 화면에서는 관리자가 이름과 카테고리를 직접 입력합니다. 미등록 카테고리는 최종 저장 시 목록을 보여주고 확인받은 뒤 생성합니다.

매장 가챠 관리 화면은 `stores` 목록에서 매장을 선택하고, 카테고리가 하나 이상인 분류 완료 가챠만 검색해 `store_gacha` 관계를 생성하거나 제거합니다. 화면은 동일 항목의 연속 클릭을 막고 서버가 `409 Conflict`를 반환하면 관계 목록을 다시 동기화합니다. 여러 카테고리를 선택하면 현재는 OR 조건으로 조회합니다. 생성된 관계는 소비자용 `GET /stores/{storeId}/gachas`에도 그대로 노출됩니다.

매장에 등록된 가챠의 이름·카테고리·출처·카탈로그 등록일은 검색 BFF의 ID 일괄 조회로 보강합니다. 목록 새로고침으로 다른 관리자가 변경한 등록 종류를 다시 확인할 수 있습니다. 현재 관계 API에는 수량이 없으므로 등록 수는 종류 수로만 표시합니다.

`전체 종류 CSV`는 매장에 연결된 상품 메타데이터만 내보냅니다. 현재 목록 필터와 무관하게 등록 종류 전체를 포함하며, 카탈로그에서 찾지 못한 항목은 `미확인`으로 표시합니다. 상세조회 오류 중에는 내보내기를 막습니다. 재고 수량·판매량은 포함하지 않습니다.

### 선택형 Google Sheet 카탈로그 보강

`B2B_CATALOG_CSV_URL`에 Google Sheet의 **웹에 게시한 CSV URL**을 설정하면 BFF가 기존 가챠 ID에 읽기 전용 메타데이터를 붙입니다. 게시 URL은 `https://docs.google.com/spreadsheets/d/e/<게시 ID>/pub?output=csv&gid=<시트 ID>` 또는 `https://docs.google.com/spreadsheets/d/<문서 ID>/export?format=csv&gid=<시트 ID>` 형식이어야 합니다. 일반 편집 링크나 로그인이 필요한 비공개 시트는 지원하지 않으며, 공개 파일에 점주·고객 개인정보나 비밀 값을 넣지 않습니다. 저장소의 `.env.example`에는 URL이 비어 있고 실제 시트는 아직 연결하지 않았습니다.

시트를 쓰기로 결정했다면 가챠 정보만 담는 별도 Google Sheet를 만들고 아래 헤더로 시작합니다. `gacha_id`는 B2B에서 확인한 기존 상품 ID를 사용하고, 한국어/일본어 이름을 각각 입력합니다. Google Sheets에서 `파일 > 공유 > 웹에 게시`를 선택해 **해당 탭만 CSV 형식**으로 게시한 뒤 발급된 URL을 BFF 실행 환경의 `B2B_CATALOG_CSV_URL`에 설정하고 BFF를 재시작합니다. 게시본은 누구나 읽을 수 있으므로 매장 재고나 개인정보는 넣지 않습니다. 게시본 갱신과 BFF 캐시 때문에 화면 반영까지 몇 분 걸릴 수 있습니다. [Google의 웹 게시 안내](https://support.google.com/docs/answer/183965?hl=ko)를 따릅니다.

첫 행에 다음 헤더를 모두 넣습니다. `gacha_id`는 기존 가챠의 양의 정수 ID여야 하며 새 상품을 만드는 값이 아닙니다. `aliases`와 `characters`의 여러 값은 `|`로 구분하고, `reviewed_at`은 비우거나 `YYYY-MM-DD` 형식으로 입력합니다. 메타데이터 열은 비울 수 있지만 한 행에는 이름·별칭·작품·시리즈·캐릭터 중 적어도 한 값이 있어야 합니다.

```csv
gacha_id,name_ko,name_ja,aliases,work,series,characters,reviewed_at
```

지원하는 보강 값은 한국어 이름(`name_ko`), 일본어 이름(`name_ja`), 검색 별칭(`aliases`), 작품(`work`), 시리즈(`series`), 등장 캐릭터(`characters`), 정보 검수일(`reviewed_at`)입니다. 기존 이름·카테고리·썸네일은 Spring 카탈로그에서 유지합니다. 검색은 기존 이름·카테고리와 보강 값을 함께 사용하지만 카테고리 필터는 기존 카테고리만 사용합니다. 중복 `gacha_id`와 잘못된 행은 제외하고, 보강 데이터가 없거나 읽기 실패해도 기존 카탈로그 검색을 사용합니다.

기존 가챠의 한·일 이름을 따로 관리하려면 시트에서 해당 `gacha_id`의 `name_ko`, `name_ja`를 각각 입력합니다. 이 두 칸은 B2B 검색·매장 화면의 읽기 전용 보강 값이며, 원본 API의 단일 `name`을 수정하거나 소비자 앱에 자동 반영하지 않습니다. 예를 들어 요청받은 `gacha_id=1697`은 실제 B2B 카탈로그의 ID와 상품을 먼저 대조한 뒤 시트 행을 작성해야 합니다. 기존 평면 카테고리만 보고 작품·시리즈·캐릭터를 자동 분리하지 않습니다.

BFF의 기존 카탈로그 캐시는 30초, CSV 보강 데이터 캐시는 5분입니다. CSV 캐시 만료 후에는 마지막 정상본을 제공하면서 갱신하고, 실패 시 30초 뒤 재시도합니다. 응답의 `metadataStatus`는 `disabled`(미설정), `fresh`(정상), `stale`(마지막 정상본), `unavailable`(정상본 없음) 중 하나이고, `metadataAsOf`는 마지막 정상 CSV를 BFF가 가져온 시각입니다. 이 시각은 시트 행의 `reviewed_at`과 다릅니다. BFF는 시트에 쓰지 않습니다.

### 쿠지 현장 기록 양식

`쿠지 기록 양식 CSV` 다운로드는 선택한 매장 ID·이름만 채운 빈 양식을 기기에 저장합니다. 한 행을 한 상자의 한 등급으로 사용하며, 타이틀·상자 ID·1회 가격·등급·초기/현재 장수·라스트원 유무/지급 여부·최종 실사일·메모를 직접 기입할 수 있습니다. 예시 수량이나 총 잔여 장수는 넣지 않습니다. 이 파일은 사이트에 업로드되거나 저장되지 않고, 다른 기기나 소비자 화면의 재고에도 반영되지 않습니다. 현재 쿠지 상자·등급별 잔여를 저장·조회하는 API와 실시간 현황판은 없습니다.

### 기기 배치·쿠지 운영 화면 시안

매장 보유 가챠 화면에서 `기기 배치·쿠지 현황판 시안 보기`를 누르면 `/stores/:storeId/operations-preview`를 열 수 있습니다. 이 화면은 기존 API에서 매장 이름·기계 대수·연결된 가챠를 **조회**하지만, 기기 위치·슬롯·회당 가격·기기 내 수량과 쿠지 타이틀·상자·등급별 장수는 브라우저 메모리에서만 시험합니다. 새로고침 또는 페이지 이동 시 입력값이 사라지며 서버·다른 기기·소비자 화면에 저장/동기화되지 않습니다. 기기 배치 CSV를 다운로드해 초안을 보관할 수 있지만, CSV도 자동 업로드되지 않습니다.

같은 쿠지 타이틀이라도 상자/로트마다 잔여 장수가 달라질 수 있으므로 화면은 한 상자 단위로 편집합니다. 등급별 초기/남은 장수의 합계를 일반 티켓 총수로 표시하고, 라스트원은 별도 혜택으로 취급합니다. 수기 실사 차이는 판매 기록이 아니므로 이 시안에서 판매량·매출 분석은 제공하지 않습니다. 실제 운영에는 점주·매장별 접근 권한, 기기·슬롯·보관/기기 재고와 이동 이력, 쿠지 상자·등급·추첨 이력을 안전하게 저장하는 API가 필요합니다.

로컬 개발용 MSW 가상 매장으로 촬영한 시안: [기기 배치 화면](docs/screenshots/operations-gacha-mock.png), [쿠지 현황판](docs/screenshots/operations-kuji-mock.png). 이는 실제 운영 데이터나 배포 화면을 증명하는 스크린샷이 아닙니다.

현재 백엔드 계약에는 다음 제약이 있습니다.

- `store_gacha`의 `(store_id, gacha_id)` 조합에 DB 유니크 제약이 없어 여러 관리자의 동시 요청까지 프론트엔드만으로 완전히 막을 수 없습니다. 유니크 제약과 중복 시 `409 Conflict` 응답이 필요합니다.
- 매장 보유 가챠 요약에는 `gachaId`, `thumbnailUrl`만 있습니다. 프론트 BFF에서 세부 정보를 일괄 조회하며, 조회 실패 또는 카탈로그 누락 시 DB ID로 표시합니다. 이름과 카테고리를 요약 응답에 추가하면 별도 조회 없이 보강할 수 있습니다.
- 가챠 목록의 서버 필터는 이름 `keyword`만 지원합니다. 매장 관리 화면은 프론트 소유 BFF가 기존 목록 API를 500건씩 읽어 30초간 캐시하고 이름·카테고리 통합 검색과 페이지네이션을 제공합니다. 장기적으로는 백엔드의 `categoryIds` 및 통합 검색 지원이 더 효율적입니다.
- 매장 상세의 `ownedGachaAmount`는 현재 백엔드 구현에서 고정값이므로 관리 화면은 실제 관계 목록 개수를 표시합니다. 백엔드는 관계 개수를 집계하도록 수정해야 합니다.

현장 등록은 실제 백엔드 계약상 하나의 원자적 요청이 아니라 `POST /gachas` 후 `PUT /gachas/{id}/thumbnail`의 2단계입니다. 두 번째 요청만 실패하면 DB 행은 남으므로 UI가 신규 등록을 성공으로 표시하되 썸네일 보완 경고를 제공합니다. 장기적으로는 단일 multipart 생성 API, 실패 시 생성 데이터 정리 API 또는 멱등성 키가 필요합니다. 브라우저는 S3 키나 IAM 권한을 사용하지 않습니다.

MSW 모드는 복구 가능한 건너뛰기, ID 커서, 업로드 티켓 등 목표 계약까지 포함해 프론트엔드 UX를 검증합니다. 운영 모드는 실제 백엔드가 지원하는 기능만 노출합니다. 이번 구현에는 SHA-256 체크섬과 pHash 유사 이미지 검사가 포함되지 않습니다.

## 프론트 BFF 배포 결정

현재 프론트엔드는 정적 파일입니다. 기존 백엔드 계약에 없는 카테고리 통합 검색을 위해 프론트엔드 팀이 관리하는 작은 Node BFF를 둡니다. AWS Lambda와 API Gateway를 새로 만들려면 IAM 권한과 배포 설정이 필요하므로, 현재 구성은 프론트 EC2의 Node 프로세스를 사용합니다.

```text
관리자 브라우저
  ├─ /api/v1/*     → Nginx → 127.0.0.1:8080 Spring 백엔드
  └─ /api/b2b-ai/* → Nginx → 127.0.0.1:8787 Node BFF
                                              └─ 기존 Spring 읽기 API 캐시·검색
```

검색 BFF는 S3 객체를 직접 읽지 않습니다. 기존 B2B API가 내려주는 `thumbnailUrl`을 화면에서 사용하며, 비공개 객체라면 조회 가능한 URL을 백엔드가 제공해야 합니다.

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
Description=Gachi Gacha B2B Search API
After=network-online.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/srv/gachi-gacha-b2b/frontend
EnvironmentFile=/etc/gachi-gacha-b2b-bff.env
ExecStart=/usr/bin/node server/index.mjs
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

`/etc/gachi-gacha-b2b-bff.env`에는 `B2B_BACKEND_BASE_URL`과 필요한 수신 주소·포트를 저장합니다. 기존 배포가 다른 환경파일 경로를 사용한다면 서비스 설정을 변경하기 전까지 그 경로를 유지해야 합니다. BFF는 기본적으로 `127.0.0.1`에 바인딩합니다.

B2B 사이트 전체의 관리자 인증과 매장별 접근 권한은 별도로 확정해야 합니다. 검색 BFF는 읽기 전용이며 인증을 대신하지 않습니다.

현재 B2B 저장소에는 배포 워크플로가 없으므로 코드만으로 자동 배포가 완성된 상태는 아닙니다. 최초 1회 EC2에 Nginx·systemd·런타임 환경파일을 구성할 sudo 권한이 필요합니다. 이후 self-hosted runner가 이 저장소에도 할당돼 있고 제한된 `systemctl restart` 권한이 있다면, CI에서 정적 `dist`와 `server/`를 복사한 뒤 BFF를 재시작하도록 자동화할 수 있습니다. 이는 AWS IAM이 아니라 EC2 OS 권한의 문제입니다.

## 실제 API 연결 체크리스트

- 프론트엔드 빌드 시 `B2B_USE_MSW=false`, `B2B_API_BASE_URL=/api/v1` 적용
- BFF 런타임의 `B2B_BACKEND_BASE_URL`을 내부 Spring API 주소로 설정
- Nginx `/api/v1/`과 `/api/b2b-ai/` upstream 및 SPA fallback 순서 확인
- 관리자 인증 및 `credentials: include` 쿠키 정책 확정
- CSRF 정책 확정
- S3가 비공개라면 조회용 Presigned URL 응답 적용
- `thumbnailUrl`의 S3/CDN 조회 권한과 URL 유효시간 확인
- 운영 관리자 인증과 매장별 접근 권한 확정
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
