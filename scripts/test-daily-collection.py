#!/usr/bin/env python3
"""
일일 의료기관 데이터 수집 테스트 스크립트
실제 실행 전 테스트용
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.lib.localdata.dailyMedicalDataCollector import DailyMedicalDataCollector
from datetime import datetime

def test_collector():
    """수집기 테스트"""
    print("🧪 일일 의료기관 데이터 수집기 테스트")
    print("=" * 80)
    
    # 수집기 초기화
    collector = DailyMedicalDataCollector()
    
    # 진료과목 추론 테스트
    print("\n📋 진료과목 추론 테스트:")
    test_cases = [
        ("미소치과의원", "의원"),
        ("김민한의원", "의원"),
        ("서울내과의원", "의원"),
        ("행복정형외과의원", "의원"),
        ("서울대학교병원", "병원"),
        ("온누리약국", "약국"),
    ]
    
    for name, type_ in test_cases:
        subject = collector.extract_medical_subjects(name, type_)
        print(f"   - {name} ({type_}) → {subject or '없음'}")
    
    # 실제 데이터 수집 테스트 (작은 범위)
    print("\n🔍 실제 API 호출 테스트 (제한된 범위):")
    print("   ⚠️ 실제 API를 호출합니다. 계속하시겠습니까? (y/n): ", end="")
    
    response = input().strip().lower()
    if response == 'y':
        # 테스트를 위해 어제 데이터만 수집
        collector.date_range_end = collector.today  # 오늘까지만
        
        print("\n📥 데이터 수집 중...")
        facilities = collector.fetch_medical_data_for_date_range()
        
        print("\n📊 수집 결과:")
        for facility_type, data in facilities.items():
            print(f"   - {facility_type}: {len(data)}개")
            if data:
                print(f"     샘플: {data[0].get('사업장명', 'N/A')}")
    else:
        print("   테스트를 취소했습니다.")
    
    print("\n✅ 테스트 완료!")

if __name__ == "__main__":
    test_collector() 