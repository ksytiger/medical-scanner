-- =======================================================================
-- seed_initial_data.sql
--  - 1) CSV → staging 테이블 로드 (주석 처리 - 별도 처리)
--  - 2) lookup 테이블(시설 유형·진료과) 기본값 입력
--  - 3) facilities / facility_specialties 정규화 삽입 (CSV 로드 후 실행)
-- =======================================================================

begin;

-- 0. 임시 staging 테이블 (없으면 생성)
create table if not exists stg_facility_raw (
  license_no          text,
  open_service_name   text,
  business_type_name  text,
  facility_name       text,
  address_road        text,
  address_jibun       text,
  tel                 text,
  open_date_raw       text,
  status_name_raw     text,
  lat                 double precision,
  lng                 double precision,
  medical_subjects    text
);

-- CSV 로드는 주석 처리 (권한 문제로 별도 처리 필요)
-- truncate stg_facility_raw;

-- 1. CSV 적재 ------------------------------------------------------------
-- ▼ (서버-사이드 COPY) Supabase 원격 DB가 읽을 수 있는 경로 필요
-- copy stg_facility_raw
-- from '/app/data/merged_hospital_pharmacy_clinic_20250616.csv'  -- ① 절대경로 수정
-- with (format csv, header true, encoding 'utf8');

-- 1-1. 로컬 psql 사용 시 (클라이언트-사이드) 주석 해제하고 실행
-- \copy stg_facility_raw from '/local/path/merged_hospital_pharmacy_clinic_20250616.csv' with (format csv, header true, encoding 'utf8');

-- 2. lookup 값 입력 ------------------------------------------------------
insert into facility_types (slug, name_ko) values
  ('pharmacy','약국'),
  ('clinic','의원'),
  ('hospital','병원'),
  ('general_hospital','종합병원'),
  ('public_health_center','보건기관'),
  ('nursing_hospital','요양병원'),
  ('oriental_hospital','한방병원'),
  ('dental_hospital','치과병원'),
  ('mental_hospital','정신병원')
on conflict (slug) do nothing;

insert into specialties (slug, name_ko, synonyms) values
  ('dermatology','피부과',            array['피부']),
  ('plastic_surgery','성형외과',     array['성형']),
  ('ophthalmology','안과',           array['눈','시력']),
  ('dentistry','치과의원',           array['치과']),
  ('oriental_medicine','한의원',     array['한의','한방']),
  ('orthopedics','정형외과',         array['정형']),
  ('neurosurgery','신경외과',        array['뇌','척수']),
  ('neurology','신경과',             array['신경과']),
  ('internal_medicine','내과',       array['내과']),
  ('ent','이비인후과',              array['이비','코','목']),
  ('psychiatry','정신건강의학과',     array['정신','정신과']),
  ('obstetrics','산부인과',          array['산부','산모']),
  ('pediatrics','소아청소년과',      array['소아','어린이']),
  ('family_medicine','가정의학과',   array['가정의']),
  ('urology','비뇨기과',             array['비뇨']),
  ('rehabilitation','재활의학과',    array['재활']),
  ('pain_medicine','마취통증의학과',  array['통증','마취']),
  ('others_clinic','기타의원',       array['무과목','기타'])
on conflict (slug) do nothing;

-- 3. 본체 facilities 적재 (CSV 로드 후 실행) -------------------------------------------------
-- 실제 데이터가 stg_facility_raw에 로드된 후 실행해야 함

-- 4. specialty 매핑 함수 정의 -------------------------------------------
create or replace function fn_map_specialty(
  _subjects text,
  _business_type_name text
) returns uuid[] language plpgsql as $$
declare
  slugs text[];
  spec_ids uuid[] := '{}';
  rec record;
begin
  -- "의원" + 17개 과목 미포함 → 기타의원
  if _business_type_name = '의원' then
    slugs := array_remove(regexp_split_to_array(_subjects, '\s*,\s*'), '');
    if not exists (
      select 1
      from unnest(slugs) s
      where s ilike any (array[
        '%피부%','%성형%','%안과%','%치과%','%한의%',
        '%정형%','%신경외과%','%신경과%','%내과%',
        '%이비%','%정신%','%산부%','%소아%','%가정%',
        '%비뇨%','%재활%','%마취%'
      ])
    ) then
      spec_ids := array[(select id from specialties where slug = 'others_clinic')];
      return spec_ids;
    end if;
  end if;

  -- 일반 과목 매핑
  for rec in
    select s.id, s.slug
    from specialties s
    where s.name_ko = any (regexp_split_to_array(_subjects, '\s*,\s*'))
       or exists (
         select 1
         from unnest(s.synonyms) syn
         where _subjects ilike '%'||syn||'%'
       )
  loop
    spec_ids := array_append(spec_ids, rec.id);
  end loop;

  return spec_ids;
end $$;

-- 5. 연결 테이블 삽입 (CSV 로드 후 실행) -----------------------------------------------------
-- 실제 데이터가 stg_facility_raw에 로드된 후 실행해야 함

commit;
