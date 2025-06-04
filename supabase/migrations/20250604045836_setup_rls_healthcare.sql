-- 의료기관 테이블에 RLS 설정
ALTER TABLE medical_facility ENABLE ROW LEVEL SECURITY;

-- 의료기관 작성자만 볼 수 있도록 허용 (예: 추후 user_id 컬럼 도입 시 확장 가능)
CREATE POLICY "Allow read access to all"
  ON medical_facility
  FOR SELECT
  USING (true);