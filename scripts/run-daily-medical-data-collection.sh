#!/bin/bash

# 매일 의료기관 데이터 수집 실행 스크립트
# crontab에 등록하여 사용: 0 7 * * * /path/to/run-daily-medical-data-collection.sh

# 스크립트 디렉토리로 이동
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/.."

# 로그 파일 설정
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/daily_medical_data_$(date +%Y%m%d).log"

echo "========================================" >> "$LOG_FILE"
echo "의료기관 데이터 수집 시작: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Python 가상환경 활성화 (있는 경우)
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 환경 변수 로드
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Python 스크립트 실행
python3 src/lib/localdata/dailyMedicalDataCollector.py >> "$LOG_FILE" 2>&1

# 실행 결과 확인
if [ $? -eq 0 ]; then
    echo "✅ 데이터 수집 성공: $(date)" >> "$LOG_FILE"
else
    echo "❌ 데이터 수집 실패: $(date)" >> "$LOG_FILE"
    # 실패 시 알림 (선택사항 - 이메일 또는 Slack 등)
    # echo "의료기관 데이터 수집 실패" | mail -s "Daily Medical Data Collection Failed" admin@example.com
fi

echo "========================================" >> "$LOG_FILE"
echo "의료기관 데이터 수집 종료: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE" 