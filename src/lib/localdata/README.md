# 의료기관 데이터 추출기 (Integrated Medical Data Extractor)

이 도구는 지방행정 라이센싱 정보 API를 통해 의료기관(병원, 의원, 약국) 개원 데이터를 수집하고, 선택적으로 Supabase 데이터베이스에 업로드하는 Python 스크립트입니다.

## 🚀 기능

- 📊 **통합 데이터 수집**: 병원, 의원, 약국 데이터를 한 번에 수집
- 📅 **유연한 날짜 범위**: 하드코딩, 주간, 사용자 지정 날짜 범위 지원
- 🔍 **다중 소스 검색**: `bgnYmd/endYmd`와 `lastModTsBgn/lastModTsEnd` 두 방식으로 데이터 수집
- 📈 **상세한 리포트**: 구글 스프레드시트 호환 형식으로 출력
- 🗄️ **Supabase 업로드**: 수집된 데이터를 Supabase 데이터베이스에 자동 업로드

## 📋 사전 요구사항

### Python 라이브러리 설치

```bash
# 기본 기능만 사용하는 경우
pip install requests tabulate

# Supabase 업로드 기능을 사용하는 경우
pip install -r requirements-medical-data.txt
```

### 환경변수 설정 (Supabase 업로드 시)

Supabase 업로드 기능을 사용하려면 다음 환경변수를 설정해야 합니다:

```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
export NEXT_SUPABASE_SERVICE_ROLE="your-service-role-key"
```

## 📖 사용법

### 1. 하드코딩 모드 (기본)

파일 상단의 날짜를 수정하고 실행:

```python
# integratedMedicalData.py 파일 상단에서 수정
HARDCODED_START_DATE = "20250601"  # 시작 날짜
HARDCODED_END_DATE = "20250630"    # 종료 날짜
```

```bash
python integratedMedicalData.py
```

### 2. 주간 데이터 수집

```bash
# 2025-06-15가 포함된 주의 데이터 (월요일부터 5일간)
python integratedMedicalData.py --week 2025-06-15

# 현재 주의 데이터
python integratedMedicalData.py --current-week
```

### 3. 사용자 지정 날짜 범위

```bash
# 2025-06-08부터 5일간
python integratedMedicalData.py --start-date 2025-06-08 --days 5

# 2025-06-08부터 10일간
python integratedMedicalData.py --start-date 2025-06-08 --days 10
```

### 4. 파일 저장

```bash
# 결과를 JSON 파일로 저장
python integratedMedicalData.py --week 2025-06-15 --save medical_data_2025_06_15.json
```

### 5. Supabase 업로드

```bash
# 하드코딩 모드로 데이터 수집 후 Supabase 업로드
python integratedMedicalData.py --upload-to-supabase

# 특정 주 데이터를 Supabase에 업로드
python integratedMedicalData.py --week 2025-06-15 --upload-to-supabase
```

## 📊 출력 형식

스크립트는 다음과 같은 형식으로 결과를 출력합니다:

1. **구글 스프레드시트 호환 CSV 형식**: 직접 복사하여 붙여넣기 가능
2. **유형별 상세 리스트**: 각 의료기관의 상세 정보
3. **통계 정보**: 날짜별, 지역별 분포

### 출력 예시

```
🏥 통합 의료기관 개원 리포트
📅 기간: 2025-06-01 ~ 2025-06-30
🎯 총 150개 의료기관 개원
   - 병원: 45개
   - 의원: 78개
   - 약국: 27개
```

## 🗄️ 데이터베이스 스키마

Supabase에 업로드되는 데이터는 다음 테이블에 저장됩니다:

- `facilities`: 의료기관 기본 정보
- `facility_types`: 시설 유형 (병원, 의원, 약국)
- `specialties`: 전문분야 정보 (향후 확장)

## ⚠️ 주의사항

1. **API 제한**: 지방행정 라이센싱 정보 API의 사용 제한을 준수하세요
2. **환경변수**: Supabase 업로드 시 서비스 롤 키가 필요합니다
3. **중복 데이터**: 관리번호 기준으로 중복 제거가 수행됩니다
4. **날짜 형식**: 입력 날짜는 YYYY-MM-DD 형식을 사용하세요

## 🔧 문제 해결

### supabase-py 라이브러리 설치 오류

```bash
pip install --upgrade pip
pip install supabase
```

### 환경변수 설정 확인

```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_SUPABASE_SERVICE_ROLE
```

### API 응답 오류

- 네트워크 연결 확인
- API 키 유효성 확인
- 날짜 범위가 너무 크지 않은지 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. Python 버전: 3.7 이상 권장
2. 필수 라이브러리 설치 확인
3. 환경변수 설정 확인
4. 네트워크 연결 상태 확인
