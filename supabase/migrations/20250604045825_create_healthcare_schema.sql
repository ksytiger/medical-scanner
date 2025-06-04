-- 주소 테이블
CREATE TABLE address (
    id BIGSERIAL PRIMARY KEY,
    road_address TEXT NOT NULL,
    road_postcode TEXT
);

-- 진료과목 테이블
CREATE TABLE medical_subject (
    id BIGSERIAL PRIMARY KEY,
    subject_name TEXT NOT NULL,
    subject_category TEXT
);

-- 의료기관 테이블
CREATE TABLE medical_facility (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    license_date DATE NOT NULL,
    phone VARCHAR(20),
    healthcare_type TEXT NOT NULL,
    num_doctors INTEGER,
    num_rooms INTEGER,
    num_beds INTEGER,
    total_area NUMERIC,
    address_id BIGINT NOT NULL REFERENCES address(id)
);

-- 다대다 관계 매핑 테이블
CREATE TABLE facility_medical_subject (
    facility_id BIGINT NOT NULL REFERENCES medical_facility(id),
    subject_id BIGINT NOT NULL REFERENCES medical_subject(id),
    PRIMARY KEY (facility_id, subject_id)
);

-- 인덱스
CREATE INDEX idx_medical_facility_address_id ON medical_facility(address_id);
CREATE INDEX idx_facility_medical_subject_facility_id ON facility_medical_subject(facility_id);
CREATE INDEX idx_facility_medical_subject_subject_id ON facility_medical_subject(subject_id);