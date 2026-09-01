# 2026-gachi-gacha-b2b

## 백엔드 가챠 수집 스케줄

Bandai, IP4, A-MUZU 상품을 순서대로 수집하고 `gacha` 테이블에 저장한다. 동일 사이트의 상품은
`source`, `product_code` 조합으로 중복 저장을 막고, 사이트 간 중복은 자동으로 정제하지 않는다.
IP4는 실행 월을 포함한 최근 12개월의 월별 목록을 수집한다.

스케줄은 기본적으로 꺼져 있다. `backend/.env.sample`을 참고해 DB 연결 정보를 설정하고 아래 값을
활성화하면 기본값 기준 매일 오전 4시(Asia/Seoul)에 실행된다.

```dotenv
COLLECTION_SCHEDULING_ENABLED=true
COLLECTION_SCHEDULING_CRON=0 0 4 * * *
COLLECTION_SCHEDULING_ZONE=Asia/Seoul
```

공유 DB에 필요한 변경은 B2B 백엔드의
`backend/src/main/resources/db/migration/V5__extend_gacha_for_b2b_collection.sql`에 포함되어 있다.
B2B 애플리케이션을 실행하면 Flyway가 아래 스키마를 적용하거나 이미 적용된 버전을 검증한다.

```sql
ALTER TABLE gacha
    ADD COLUMN source VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN product_code VARCHAR(255),
    ADD COLUMN category VARCHAR(255);

UPDATE gacha
SET source = 'INSTAGRAM'
WHERE instagram_media_id IS NOT NULL;

ALTER TABLE gacha
    ADD CONSTRAINT uk_gacha_source_product_code UNIQUE (source, product_code);
```

`source`를 지정하지 않고 생성하는 가챠는 DB와 애플리케이션 기본값에 의해 `MANUAL`로 저장된다.

### 로컬에서 소량 수집하기

아래 명령은 웹 서버와 스케줄러를 실행하지 않고 지정한 사이트를 한 번 수집한 뒤 종료한다. 수집된
데이터는 `.env`에 연결된 DB에 실제로 저장된다.

Bandai 첫 페이지:

```shell
cd backend
./gradlew bootRun --args='--spring.devtools.restart.enabled=false --spring.main.web-application-type=none --collection.scheduling.enabled=false --collection.manual.enabled=true --collection.manual.source=BANDAI --collection.sources.bandai.max-pages=1'
```

IP4 현재 월 한 페이지만:

```shell
cd backend
./gradlew bootRun --args='--spring.devtools.restart.enabled=false --spring.main.web-application-type=none --collection.scheduling.enabled=false --collection.manual.enabled=true --collection.manual.source=IP4 --collection.sources.ip4.collection-months=1 --collection.sources.ip4.max-pages=1'
```

A-MUZU 첫 페이지:

```shell
cd backend
./gradlew bootRun --args='--spring.devtools.restart.enabled=false --spring.main.web-application-type=none --collection.scheduling.enabled=false --collection.manual.enabled=true --collection.manual.source=A_MUZU --collection.sources.amuzu.max-pages=1'
```

실행 로그의 `discovered`, `inserted`, `skipped`, `failed` 값으로 결과를 확인할 수 있다. 같은 명령을
다시 실행하면 `source`, `product_code`가 같은 상품은 `skipped`로 집계된다.

이미 수집한 페이지와 다른 데이터로 확인하려면 Bandai는 시작 페이지를 2로, IP4는 시작 월 간격을
1로 지정한다.

```shell
./gradlew bootRun --args='--spring.devtools.restart.enabled=false --spring.main.web-application-type=none --collection.scheduling.enabled=false --collection.manual.enabled=true --collection.manual.source=BANDAI --collection.sources.bandai.start-page=2 --collection.sources.bandai.max-pages=1'

./gradlew bootRun --args='--spring.devtools.restart.enabled=false --spring.main.web-application-type=none --collection.scheduling.enabled=false --collection.manual.enabled=true --collection.manual.source=IP4 --collection.sources.ip4.start-month-offset=1 --collection.sources.ip4.collection-months=1 --collection.sources.ip4.max-pages=1'
```
