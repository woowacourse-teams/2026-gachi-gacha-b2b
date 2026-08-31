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
pnpm run test
pnpm run check
```

## 환경변수

```bash
cp .env.example .env
```

| 이름               | 기본값                    | 설명              |
| ------------------ | ------------------------- | ----------------- |
| `B2B_API_BASE_URL` | `/api/b2b`                | B2B API 기준 경로 |
| `B2B_USE_MSW`      | 개발 `true`, 배포 `false` | MSW 사용 여부     |

Webpack을 실행하는 프로세스의 환경변수를 사용합니다. 실제 API 연결 전에는 `B2B_USE_MSW=true`로 실행합니다.

## 설계 경계

```text
pages/components
      ↓ domain model
classificationApi
      ↓ DTO mapper
HTTP API 또는 MSW
```

- 화면은 `ClassificationItemDto`를 직접 사용하지 않습니다.
- `toClassification.ts`가 임시 API 응답을 화면 모델로 변환합니다.
- 실제 백엔드 응답이 확정되면 DTO, 변환 함수, API 경로를 먼저 수정합니다.
- MSW 핸들러는 실제 서버의 상태 전이를 흉내 내며 목 데이터 원본은 `src/mocks/data.ts`에 있습니다.

현재 저장소에는 백엔드 애플리케이션이 없으므로 MSW 저장 결과만 검증할 수 있습니다. 실제 DB 반영 여부는 백엔드 API가 추가된 뒤 통합 환경에서 별도로 검증해야 합니다.

## 임시 API 계약

이 계약은 프론트엔드 개발을 위한 초안이며 백엔드 계약으로 확정된 것이 아닙니다.

```text
GET  /api/b2b/classifications?status=UNCLASSIFIED&minId=100&maxId=200&query=
GET  /api/b2b/classifications?status=CLASSIFIED&query=산리오&categoryIds=2,5
GET  /api/b2b/classifications/:gachaId
PUT  /api/b2b/classifications/:gachaId/classify
POST /api/b2b/classifications/:gachaId/skip
POST /api/b2b/classifications/:gachaId/restore
GET  /api/b2b/categories
POST /api/b2b/categories
DELETE /api/b2b/categories/:categoryId
POST /api/b2b/gachas/upload-url
PUT  {uploadUrl}
POST /api/b2b/gachas
```

분류 저장 요청 예시:

```json
{
  "name": "산리오 캐릭터 미니 피규어",
  "categoryIds": [2, 5],
  "version": 1
}
```

건너뛰기는 삭제가 아니라 `SKIPPED` 상태 전환으로 모델링했습니다. 실제 백엔드도 작업자·시각·사유를 기록하고 복구 API를 제공해야 합니다.

첫 화면은 미분류 데이터를 `gachaId` 오름차순으로 보여줍니다. 작업자는 시작 ID와 종료 ID를 입력해 담당 범위만 조회할 수 있고, 저장하거나 건너뛴 뒤에도 같은 범위 안의 다음 ID로 이동합니다. `source`와 `location`은 수집 경로를 추적하기 위한 카드 메타데이터로만 사용합니다.

현장 등록은 JPG, PNG, WebP 형식과 10MB 이하의 이미지를 허용합니다. 브라우저가 업로드 URL을 발급받아 파일을 직접 업로드하고, 성공한 `objectKey`와 이름·카테고리를 `POST /gachas`로 전달합니다. MSW에서는 S3 업로드를 별도 엔드포인트로 모사하며 생성된 데이터는 `FIELD` 출처의 분류 완료 데이터로 저장합니다.

분류 완료 목록은 이름 검색과 카테고리 다중 필터를 지원합니다. `categoryIds`를 여러 개 전달하면 하나 이상의 카테고리가 일치하는 OR 조건으로 조회합니다.

이번 구현에는 SHA-256 체크섬과 pHash 유사 이미지 검사를 포함하지 않습니다.

카테고리 삭제는 분류 데이터에서 사용되지 않은 경우에만 허용합니다. 이미 사용 중인 카테고리는 `409 Conflict`를 반환하며, 실제 백엔드에서는 물리 삭제보다 비활성화 정책을 우선 검토해야 합니다.

## 실제 API 연결 체크리스트

- 관리자 인증 및 `credentials: include` 쿠키 정책 확정
- CSRF 정책 확정
- S3가 비공개라면 조회용 Presigned URL 응답 적용
- 업로드용 Presigned URL의 만료 시간, 허용 MIME, 최대 크기와 object key 규칙 확정
- 업로드 완료 후 DB 저장 실패 시 미참조 S3 객체 정리 정책 확정
- 모바일 HEIC 이미지를 허용할지와 서버 변환 정책 확정
- `gachaId` 오름차순 정렬과 `minId`·`maxId` 포함 범위 조회 규약 확정
- ID 범위를 유지하는 목록 페이지네이션 또는 커서 규약 반영
- `version`을 이용한 낙관적 잠금과 `409 Conflict` 처리 연결
- 다중 작업자 claim/lease 정책 반영
- 카테고리 중복 판정 및 비활성화 정책 반영
- source 종류와 location 필드의 실제 DB 규약 반영(조회 그룹 기준으로 사용하지 않음)
- 분류 저장 후 DB 재조회 통합 테스트 추가
- 현장 등록 API의 멱등성 키와 저장 완료 응답 규약 확정
- 건너뛰기 사유와 감사 로그 저장 확인
- MSW 계약 테스트를 실제 API 계약 테스트로 갱신

## 키보드 조작

- 숫자 `1~9`: 해당 카테고리 선택 또는 해제
- `Enter`: 이름과 카테고리가 유효할 때 저장 후 다음 항목으로 이동
- `Escape`: 열린 카테고리 또는 건너뛰기 다이얼로그 닫기

입력창에 포커스가 있을 때는 전역 단축키가 실행되지 않습니다.
