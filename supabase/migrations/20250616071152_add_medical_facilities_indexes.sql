-- medical_facilities 테이블 성능 최적화를 위한 인덱스 추가
-- 이 인덱스들은 필터링과 정렬 성능을 크게 향상시킵니다

-- 1. license_date 인덱스 (날짜 필터링 및 정렬용)
CREATE INDEX IF NOT EXISTS idx_medical_facilities_license_date 
ON medical_facilities(license_date DESC);

-- 2. business_type 인덱스 (카테고리 필터링용)
CREATE INDEX IF NOT EXISTS idx_medical_facilities_business_type 
ON medical_facilities(business_type);

-- 3. road_full_address 인덱스 (지역 필터링용) - GIN 인덱스로 LIKE 검색 최적화
CREATE INDEX IF NOT EXISTS idx_medical_facilities_road_address_gin 
ON medical_facilities USING gin(road_full_address gin_trgm_ops);

-- 4. business_name 인덱스 (키워드 검색용) - GIN 인덱스로 LIKE 검색 최적화
CREATE INDEX IF NOT EXISTS idx_medical_facilities_business_name_gin 
ON medical_facilities USING gin(business_name gin_trgm_ops);

-- 5. location_phone 인덱스 (연락처 필터링용)
CREATE INDEX IF NOT EXISTS idx_medical_facilities_location_phone 
ON medical_facilities(location_phone) 
WHERE location_phone IS NOT NULL;

-- 6. 복합 인덱스 (자주 사용되는 필터 조합)
CREATE INDEX IF NOT EXISTS idx_medical_facilities_composite 
ON medical_facilities(license_date DESC, business_type, road_full_address);

-- 7. medical_subject_names 인덱스 (진료과목 검색용)
CREATE INDEX IF NOT EXISTS idx_medical_facilities_subjects_gin 
ON medical_facilities USING gin(medical_subject_names gin_trgm_ops);

-- 통계 업데이트로 쿼리 플래너 최적화
ANALYZE medical_facilities; 