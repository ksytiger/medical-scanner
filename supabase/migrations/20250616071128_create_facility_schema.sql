-- 1) 필수 확장
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";          -- fast ILIKE 검색
create extension if not exists "postgis";          -- 위·경도용

-- 2) ENUM / LOOKUP
create type facility_status as enum (
  'operating',   -- 정상 영업
  'closed',      -- 폐업
  'suspended',   -- 영업정지
  'cancelled'    -- 인허가취소 등
);

-- 3) 마스터 테이블
create table facility_types (
  id         uuid primary key default uuid_generate_v4(),
  slug       text not null unique,
  name_ko    text not null
);

create table specialties (
  id         uuid primary key default uuid_generate_v4(),
  slug       text not null unique,
  name_ko    text not null,
  synonyms   text[] default '{}',            -- 검색어 확장
  created_at timestamptz default now()
);

-- 4) 본체
create table facilities (
  id              uuid primary key default uuid_generate_v4(),
  license_no      text not null unique,      -- 관리번호
  type_id         uuid not null references facility_types(id),
  name            text not null,
  address_road    text,
  address_jibun   text,
  tel             text,
  open_date       date,
  status          facility_status default 'operating',
  district_code   text,                      -- 행정구역 코드(추가 ETL)
  bed_count       int,
  lat             double precision,
  lng             double precision,
  geom            geography(point,4326),     -- lat/lng → PostGIS
  updated_at      timestamptz default now()
);

-- 5) 연결 (다대다)
create table facility_specialties (
  facility_id   uuid not null references facilities(id) on delete cascade,
  specialty_id  uuid not null references specialties(id),
  primary key (facility_id, specialty_id)
);

-- 6) 권장 인덱스
-- slug-기반 빠른 필터
create unique index on facility_types (slug);
create unique index on specialties (slug);

-- synonym GIN → '피부', 'derma' 등 포함 검색
create index specialties_synonyms_gin on specialties using gin (synonyms);

-- 본체 이름·주소 trigram→ 부분 검색 최적화
create index facilities_name_trgm on facilities using gin (name gin_trgm_ops);
create index facilities_addr_trgm on facilities using gin (address_road gin_trgm_ops);

-- 지오스페이셜 인덱스 (위치 반경 검색)
create index facilities_geom_gist on facilities using gist (geom);

-- 연결테이블 필터용
create index fks_facility_specialties_specialty on facility_specialties (specialty_id);