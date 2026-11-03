# 운영자용 가챠 정보 정제 보조 구상

이 도구는 점주 화면에서 제거한 AI 자동 보조를 되살리는 기능이 아니다. 내부 데이터 담당자가 **기존 DB 가챠의 섬네일을 보고** 일본어 원문·한국어 제목·작품·시리즈·캐릭터 후보를 검수하는 별도 작업 흐름이다. 자동 판독 결과를 즉시 DB에 쓰지 않는다.

## 현재 가능한 연결

- 기존 B2B 카탈로그에서 가챠 ID·이름·섬네일 URL을 읽을 수 있다. 가챠 제목·카테고리는 현재 B2B의 수동 분류 화면에서 저장할 수 있다.
- 기존 DB는 가챠 이름 한 칸만 제공한다. 일본어 이름·별칭·작품·시리즈·캐릭터의 별도 검색 보강은 선택형 `B2B_CATALOG_CSV_URL`로 읽을 수 있지만, 시트가 없어도 기존 DB 검색·매장 등록은 동작한다.
- `store_gacha` 등록은 소비자 목록에도 즉시 노출된다. 정제 도구의 후보 상태를 점주 재고 상태와 섞지 않는다.

## 최소 파일럿: 비공개 검수 시트 + Apps Script

1. 내부 전용 Google Sheet에 `gacha_id`, `thumbnail_url`, `db_name`, `ocr_ja`, `name_ja_candidate`, `name_ko_candidate`, `work_candidate`, `series_candidate`, `characters_candidate`, `review_status`, `reviewer`, `reviewed_at`, `notes` 열을 둔다. 최초에는 소수의 기존 ID만 시험한다.
2. 시트에 바인딩된 [Apps Script 사용자 메뉴](https://developers.google.com/apps-script/guides/menus)의 `선택 행 후보 생성`을 실행한다. [UrlFetchApp](https://developers.google.com/apps-script/reference/url-fetch)으로 이미지 판독 모델을 호출하거나, [Google Cloud Vision OCR](https://docs.cloud.google.com/vision/docs/ocr)로 일본어 텍스트를 먼저 읽을 수 있다. 원문은 별도 열에 보존한다.
3. 이미지 모델에는 기존 DB 이름·카테고리와 원문을 함께 주고, [구조화된 출력](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)으로 한국어 제목·작품·시리즈·캐릭터 **후보**를 분리한다. 번역만 필요한 경우 [LanguageApp.translate](https://developers.google.com/apps-script/reference/language/language-app)도 시험할 수 있다. 원문에 없거나 확신할 수 없는 값은 비운다.
4. 담당자가 섬네일 원본과 후보를 대조해 수정·승인한다. 승인 전 행은 카탈로그에 내보내지 않는다. 승인된 한국어 이름/기존 카테고리는 B2B 수동 분류에서 반영하고, 일본어 이름 등 DB에 없는 필드는 필요한 ID만 별도 공개 CSV로 보강할 수 있다. 비공개 검수 시트 전체를 웹에 게시하지 않는다.

모델 API 키는 브라우저 번들·시트 셀에 넣지 않고 신뢰할 수 있는 Apps Script 편집자만 접근 가능한 [Script Properties](https://developers.google.com/apps-script/guides/properties)에 둔다. 공개 `execute as owner` 웹 앱은 소유자 권한 남용 위험이 있으므로 이 파일럿에서는 만들지 않는다([웹 앱 권한 안내](https://developers.google.com/apps-script/guides/web)). 호출량·실패 재시도·[Apps Script 할당량](https://developers.google.com/apps-script/guides/services/quotas)을 기록한다.

[비전 모델](https://developers.openai.com/api/docs/guides/images-vision?api-mode=responses)은 작은 글씨, 회전된 이미지, 대상 개수 판독에서 틀릴 수 있다. 특히 가챠 라인업 이미지의 캐릭터와 실제 판매 단위는 다르므로 캐릭터 수나 구성품 수를 재고로 옮기지 않는다. 썸네일 URL이 만료되거나 비공개 S3 객체라면 기존 읽기 가능 URL 또는 관리자용 이미지 접근 계약이 먼저 필요하다.

## 실제 DB 자동 반영 전 필요한 것

기존 수동 분류 API 밖의 `name_ja` 등 별도 필드 저장이나 검수 승인 후 자동 DB 반영에는 관리자 인증·권한·감사 이력이 있는 쓰기 계약이 필요하다. 이 계약 전에는 시트 후보를 DB로 자동 동기화하지 않는다. 점주용 B2B 화면에 외부 AI 키를 넣거나 섬네일 판독을 브라우저에서 직접 호출하지 않는다.
