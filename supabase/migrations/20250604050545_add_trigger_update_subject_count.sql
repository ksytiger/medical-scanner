-- medical_facility 테이블에 subject_count 컬럼 추가
ALTER TABLE medical_facility
ADD COLUMN subject_count INTEGER DEFAULT 0;

-- 트리거용 함수 생성
CREATE OR REPLACE FUNCTION update_subject_count()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT 시: subject_count +1
  IF TG_OP = 'INSERT' THEN
    UPDATE medical_facility
    SET subject_count = subject_count + 1
    WHERE id = NEW.facility_id;
  END IF;

  -- DELETE 시: subject_count -1
  IF TG_OP = 'DELETE' THEN
    UPDATE medical_facility
    SET subject_count = subject_count - 1
    WHERE id = OLD.facility_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성: 진료과목 매핑 변경 시 subject_count 자동 갱신
CREATE TRIGGER trg_update_subject_count
AFTER INSERT OR DELETE ON facility_medical_subject
FOR EACH ROW
EXECUTE FUNCTION update_subject_count();