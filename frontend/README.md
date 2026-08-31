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

## 임시 API 계약

이 계약은 프론트엔드 개발을 위한 초안이며 백엔드 계약으로 확정된 것이 아닙니다.

```text
GET  /api/b2b/classifications?status=UNCLASSIFIED&query=
GET  /api/b2b/classifications/:gachaId
PUT  /api/b2b/classifications/:gachaId/classify
POST /api/b2b/classifications/:gachaId/skip
POST /api/b2b/classifications/:gachaId/restore
GET  /api/b2b/categories
POST /api/b2b/categories
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

## 실제 API 연결 체크리스트

- 관리자 인증 및 `credentials: include` 쿠키 정책 확정
- CSRF 정책 확정
- S3가 비공개라면 조회용 Presigned URL 응답 적용
- 목록 페이지네이션 또는 커서 규약 반영
- `version`을 이용한 낙관적 잠금과 `409 Conflict` 처리 연결
- 다중 작업자 claim/lease 정책 반영
- 카테고리 중복 판정 및 비활성화 정책 반영
- 건너뛰기 사유와 감사 로그 저장 확인
- MSW 계약 테스트를 실제 API 계약 테스트로 갱신

## 키보드 조작

- 숫자 `1~9`: 해당 카테고리 선택 또는 해제
- `Enter`: 이름과 카테고리가 유효할 때 저장 후 다음 항목으로 이동
- `Escape`: 열린 카테고리 또는 건너뛰기 다이얼로그 닫기

입력창에 포커스가 있을 때는 전역 단축키가 실행되지 않습니다.
