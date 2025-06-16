#!/usr/bin/env python3
"""
간단한 의료기관 데이터 추출 스크립트 (하드코딩 버전)
사용법: 코드 내에서 START_DATE, END_DATE를 직접 수정하여 사용
"""

import requests
import xml.etree.ElementTree as ET
from typing import List, Dict
import json

# ===== 설정 (여기서 날짜를 직접 수정하세요) =====
START_DATE = "20250608"  # 시작 날짜 (YYYYMMDD)
END_DATE = "20250613"    # 종료 날짜 (YYYYMMDD)

# API 설정
API_URL = "http://www.localdata.go.kr/platform/rest/TO0/openDataApi"
AUTH_KEYS = [
    "k8ClVr9qMtXeZqrlBAgXAraxYweS6wAY4aabuXLwMtA=",  # 기본 키
    "89dp30YYjiDahshFV4xPe11tJPooygtb9/z3XtSB2EU="   # 백업 키
]
SERVICE_ID = "01_01_02_P"  # 의료기관 서비스 ID
PAGE_SIZE = 500

def fetch_data_bgn_end(start_date: str, end_date: str) -> List:
    """bgnYmd/endYmd 방식으로 데이터 수집"""
    print(f"🚀 bgnYmd/endYmd 방식으로 데이터 수집 중... ({start_date}~{end_date})")
    
    all_data = []
    page = 1
    
    while True:
        params = {
            'authKey': AUTH_KEYS[0],
            'opnSvcId': SERVICE_ID,
            'bgnYmd': start_date,
            'endYmd': end_date,
            'pageIndex': page,
            'pageSize': PAGE_SIZE
        }
        
        try:
            response = requests.get(API_URL, params=params, timeout=30)
            response.raise_for_status()
            
            root = ET.fromstring(response.content)
            rows = root.findall('.//row')
            
            if not rows:
                break
                
            all_data.extend(rows)
            print(f"   📄 페이지 {page}: {len(rows)}개 데이터 수집")
            
            if len(rows) < PAGE_SIZE:
                break
                
            page += 1
            
        except Exception as e:
            print(f"   ❌ 오류 발생: {e}")
            break
    
    print(f"✅ bgnYmd/endYmd: 총 {len(all_data)}개 데이터 수집 완료")
    return all_data

def fetch_data_last_mod(start_date: str, end_date: str) -> List:
    """lastModTsBgn/lastModTsEnd 방식으로 데이터 수집"""
    print(f"🚀 lastModTsBgn/lastModTsEnd 방식으로 데이터 수집 중... ({start_date}~{end_date})")
    
    all_data = []
    
    # 기본 범위 시도
    data = fetch_single_range_last_mod(start_date, end_date)
    all_data.extend(data)
    
    # 이전 주 범위 시도 (더 많은 데이터를 위해)
    prev_start = str(int(start_date) - 7).zfill(8)
    prev_end = str(int(start_date) - 1).zfill(8)
    print(f"   🔍 이전 주 범위 시도: {prev_start}~{prev_end}")
    data = fetch_single_range_last_mod(prev_start, prev_end)
    all_data.extend(data)
    
    # 이후 주 범위 시도
    next_start = str(int(end_date) + 1).zfill(8)
    next_end = str(int(end_date) + 7).zfill(8)
    print(f"   🔍 이후 주 범위 시도: {next_start}~{next_end}")
    data = fetch_single_range_last_mod(next_start, next_end)
    all_data.extend(data)
    
    print(f"✅ lastModTsBgn/lastModTsEnd: 총 {len(all_data)}개 데이터 수집 완료")
    return all_data

def fetch_single_range_last_mod(start_date: str, end_date: str) -> List:
    """단일 범위에서 lastModTsBgn/lastModTsEnd 데이터 수집"""
    all_data = []
    page = 1
    
    while True:
        params = {
            'authKey': AUTH_KEYS[0],
            'opnSvcId': SERVICE_ID,
            'lastModTsBgn': start_date,
            'lastModTsEnd': end_date,
            'pageIndex': page,
            'pageSize': PAGE_SIZE
        }
        
        try:
            response = requests.get(API_URL, params=params, timeout=30)
            response.raise_for_status()
            
            root = ET.fromstring(response.content)
            rows = root.findall('.//row')
            
            if not rows:
                break
                
            all_data.extend(rows)
            print(f"   📄 페이지 {page}: {len(rows)}개 데이터 수집")
            
            if len(rows) < PAGE_SIZE:
                break
                
            page += 1
            
        except Exception as e:
            print(f"   ❌ 오류 발생: {e}")
            break
    
    return all_data

def extract_facility_info(row) -> Dict:
    """XML 행에서 의료기관 정보 추출"""
    def get_text(element_name: str) -> str:
        element = row.find(element_name)
        return element.text.strip() if element is not None and element.text else ""
    
    return {
        '사업장명': get_text('bplcNm'),
        '개원일': get_text('apvPermYmd'),
        '주소': get_text('rdnWhlAddr'),
        '업태구분명': get_text('uptaeNm'),
        '전화번호': get_text('siteWhlAddr')
    }

def filter_by_opening_date(data: List, start_date: str, end_date: str) -> List[Dict]:
    """개원일 기준으로 데이터 필터링"""
    filtered_facilities = []
    
    for row in data:
        apv_perm_ymd = row.find('apvPermYmd')
        if apv_perm_ymd is not None and apv_perm_ymd.text:
            opening_date = apv_perm_ymd.text.strip()
            normalized_opening_date = opening_date.replace('-', '')
            
            if start_date <= normalized_opening_date <= end_date:
                facility = extract_facility_info(row)
                filtered_facilities.append(facility)
    
    return filtered_facilities

def remove_duplicates(facilities: List[Dict]) -> List[Dict]:
    """중복 제거"""
    seen = set()
    unique_facilities = []
    
    for facility in facilities:
        key = (facility['사업장명'], facility['주소'])
        if key not in seen:
            seen.add(key)
            unique_facilities.append(facility)
    
    return unique_facilities

def print_results(facilities: List[Dict], start_date: str, end_date: str):
    """결과 출력"""
    print(f"\n" + "="*80)
    print(f"🏥 의료기관 개원 리포트")
    print(f"📅 기간: {start_date[:4]}-{start_date[4:6]}-{start_date[6:]} ~ {end_date[:4]}-{end_date[4:6]}-{end_date[6:]}")
    print(f"🎯 총 {len(facilities)}개 의료기관 개원")
    print("="*80)
    
    if not facilities:
        print("📭 해당 기간에 개원한 의료기관이 없습니다.")
        return
    
    # 날짜별로 그룹화
    by_date = {}
    for facility in facilities:
        date = facility['개원일']
        if date not in by_date:
            by_date[date] = []
        by_date[date].append(facility)
    
    # 날짜순 정렬하여 출력
    for date in sorted(by_date.keys()):
        facilities_on_date = by_date[date]
        formatted_date = f"{date[:4]}-{date[4:6]}-{date[6:]}" if '-' not in date else date
        print(f"\n📅 {formatted_date} ({len(facilities_on_date)}개)")
        print("-" * 50)
        
        for i, facility in enumerate(facilities_on_date, 1):
            print(f"{i}. {facility['사업장명']}")
            print(f"   📍 {facility['주소']}")
            print(f"   🏥 {facility['업태구분명']}")
            if facility['전화번호']:
                print(f"   📞 {facility['전화번호']}")
            print()

def main():
    print(f"🎯 목표: 개원일 {START_DATE}~{END_DATE}인 모든 의료기관 추출")
    print("📊 두 DB 소스에서 전체 데이터 수집 후 개원일 기준 필터링\n")
    
    # 1단계: bgnYmd/endYmd 소스에서 데이터 수집
    print("=" * 60)
    print("📊 1단계: bgnYmd/endYmd 소스에서 데이터 수집")
    print("=" * 60)
    bgn_end_data = fetch_data_bgn_end(START_DATE, END_DATE)
    bgn_end_facilities = filter_by_opening_date(bgn_end_data, START_DATE, END_DATE)
    print(f"✅ bgnYmd/endYmd에서 {len(bgn_end_facilities)}개 의료기관 발견\n")
    
    # 2단계: lastModTsBgn/lastModTsEnd 소스에서 데이터 수집
    print("=" * 60)
    print("📊 2단계: lastModTsBgn/lastModTsEnd 소스에서 데이터 수집")
    print("=" * 60)
    last_mod_data = fetch_data_last_mod(START_DATE, END_DATE)
    last_mod_facilities = filter_by_opening_date(last_mod_data, START_DATE, END_DATE)
    print(f"✅ lastModTsBgn/lastModTsEnd에서 {len(last_mod_facilities)}개 의료기관 발견\n")
    
    # 3단계: 중복 제거 및 통합
    print("=" * 60)
    print("🔄 3단계: 중복 제거 및 데이터 통합")
    print("=" * 60)
    all_facilities = bgn_end_facilities + last_mod_facilities
    unique_facilities = remove_duplicates(all_facilities)
    
    print(f"📈 bgnYmd/endYmd 소스: {len(bgn_end_facilities)}개")
    print(f"📈 lastModTsBgn/lastModTsEnd 소스: {len(last_mod_facilities)}개")
    print(f"🔄 중복 제거된 항목: {len(all_facilities) - len(unique_facilities)}개")
    print(f"🎯 최종 통합 결과: {len(unique_facilities)}개")
    
    # 결과 출력
    print_results(unique_facilities, START_DATE, END_DATE)

if __name__ == "__main__":
    main() 