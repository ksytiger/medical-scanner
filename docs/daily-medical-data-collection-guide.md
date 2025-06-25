# 매일 의료기관 데이터 수집 가이드

## 개요

이 시스템은 매일 오전 7시에 한국 지역 공공데이터 포털에서 의료기관 데이터를 수집하여 Supabase에 자동으로 업로드합니다.

### 수집 대상

- **인허가일 기준**: 어제, 오늘, 오늘 이후
- **시설 유형**: 병원, 의원, 약국
- **중복 처리**: 관리번호 기준으로 중복 제외

## 시스템 구성

### 1. 주요 파일

- `src/lib/localdata/dailyMedicalDataCollector.py` - 메인 수집 스크립트
- `scripts/run-daily-medical-data-collection.sh` - 실행 Shell 스크립트
- `scripts/github-action-daily-medical-data.yml` - GitHub Actions 워크플로우
- `scripts/test-daily-collection.py` - 테스트 스크립트

### 2. 진료과목 추론 로직

사업장명에서 자동으로 진료과목을 추론합니다:

- 예: "미소치과의원" → "치과"
- 예: "김민한의원" → "한의원"
- 예: "서울내과의원" → "내과"

## 설치 방법

### 1. 필수 패키지 설치

```bash
pip install requests supabase python-dotenv
```

### 2. 환경 변수 설정

`.env` 파일에 다음 변수를 설정하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_service_role_key
```

### 3. 테스트 실행

```bash
python scripts/test-daily-collection.py
```

## 자동화 설정

### 옵션 1: GitHub Actions (권장)

1. `.github/workflows/` 폴더를 생성합니다.

2. `scripts/github-action-daily-medical-data.yml` 파일을 `.github/workflows/daily-medical-data-collection.yml`로 복사합니다.

3. GitHub 저장소 Settings → Secrets에 다음 값을 추가합니다:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE`

4. 워크플로우가 매일 오전 7시(한국 시간)에 자동 실행됩니다.

### 옵션 2: Cron Job (서버에서 실행)

1. crontab 편집:

```bash
crontab -e
```

2. 다음 라인 추가:

```bash
0 7 * * * /path/to/your/project/scripts/run-daily-medical-data-collection.sh
```

## 수동 실행

### 전체 실행

```bash
python src/lib/localdata/dailyMedicalDataCollector.py
```

### Shell 스크립트로 실행

```bash
./scripts/run-daily-medical-data-collection.sh
```

## 로그 확인

### GitHub Actions

- Actions 탭에서 워크플로우 실행 이력 확인
- Artifacts에서 일일 리포트 JSON 파일 다운로드

### Cron Job

- 로그 위치: `logs/daily_medical_data_YYYYMMDD.log`

## 데이터 구조

### 수집 데이터 형식

```json
{
  "관리번호": "3220000-101-2024-00001",
  "시설유형": "의원",
  "사업장명": "미소내과의원",
  "업태구분": "의원",
  "주소": "서울특별시 강남구 테헤란로 123",
  "전화번호": "02-1234-5678",
  "개원일": "20250622",
  "진료과목": "내과"
}
```

### medical_facilities 테이블 매핑

- `management_number`: 관리번호
- `business_name`: 사업장명
- `license_date`: 인허가일 (개원일)
- `medical_subject_names`: 진료과목 (추론된 값)
- `location_phone`: 전화번호
- `road_full_address`: 도로명 주소

## 문제 해결

### 1. API 호출 실패

- API 키 확인: `AUTH_KEY` 값이 올바른지 확인
- 네트워크 연결 확인
- API 서버 상태 확인

### 2. Supabase 업로드 실패

- 환경 변수 확인
- Supabase 프로젝트 상태 확인
- 테이블 권한 확인

### 3. 진료과목 추론 문제

- `MEDICAL_SUBJECT_KEYWORDS` 딕셔너리에 키워드 추가
- 특수한 경우 수동으로 처리

## 향후 개선 사항

1. **진료과목 정확도 개선**: CSV 파일로 관리번호별 정확한 진료과목 매핑
2. **알림 기능**: 실패 시 Slack/이메일 알림
3. **통계 대시보드**: 수집된 데이터 시각화
4. **백업 기능**: 수집 데이터 자동 백업

## 지원

문제가 발생하면 다음을 확인하세요:

1. 로그 파일 확인
2. 환경 변수 설정 확인
3. Python 패키지 설치 상태 확인
