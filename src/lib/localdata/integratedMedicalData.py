#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
통합 의료기관 데이터 추출기
Integrated Medical Facility Data Extractor

사용법:
  python integratedMedicalData.py                            # 하드코딩 모드 (파일 상단에서 날짜 설정)
  python integratedMedicalData.py --week 2025-06-15          # 해당 주 월요일부터 5일간
  python integratedMedicalData.py --current-week             # 현재 주
  python integratedMedicalData.py --start-date 2025-06-08 --days 5  # 직접 날짜 지정
  python integratedMedicalData.py --help                     # 도움말

작성자: AI Assistant
최종 수정: 2025-01-27
"""

import requests
import xml.etree.ElementTree as ET
import argparse
import json
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from tabulate import tabulate

# ============================================================
# 설정 및 상수
# ============================================================

# ===== 하드코딩 설정 (명령행 인자 없이 실행할 때 사용) =====
HARDCODED_START_DATE = "20250601"  # 시작 날짜 (YYYYMMDD) - 여기서 수정하세요!
HARDCODED_END_DATE = "20250619"    # 종료 날짜 (YYYYMMDD) - 여기서 수정하세요!
ENABLE_HARDCODED_MODE = True       # True: 하드코딩 모드 활성화, False: 명령행 인자 필수

# API 설정
API_URL = "http://www.localdata.go.kr/platform/rest/TO0/openDataApi"
AUTH_KEYS = [
    "k8ClVr9qMtXeZqrlBAgXAraxYweS6wAY4aabuXLwMtA=",  # 기본 키
    "89dp30YYjiDahshFV4xPe11tJPooygtb9/z3XtSB2EU="   # 백업 키
]

# 의료기관 서비스 ID 맵핑
SERVICE_IDS = {
    "병원": "01_01_01_P",
    "의원": "01_01_02_P",
    "약국": "01_01_06_P"
}

# 기본 설정
DEFAULT_DAYS = 5  # 기본 기간 (5일)
MAX_PAGES_PER_RANGE = 20  # 각 날짜 범위당 최대 페이지 수
PAGE_SIZE_BGN_END = 500
PAGE_SIZE_LASTMOD = 300

# ============================================================
# 날짜 처리 함수들
# ============================================================

def get_week_start_date(date_str: str) -> datetime:
    """주어진 날짜가 포함된 주의 월요일을 반환"""
    date = datetime.strptime(date_str, "%Y-%m-%d")
    # 월요일을 주의 시작으로 설정 (weekday() 0=월요일)
    days_since_monday = date.weekday()
    monday = date - timedelta(days=days_since_monday)
    return monday

def get_current_week_start() -> datetime:
    """현재 주의 월요일을 반환"""
    today = datetime.now()
    days_since_monday = today.weekday()
    monday = today - timedelta(days=days_since_monday)
    return monday

def format_date_for_api(date: datetime) -> str:
    """datetime을 API용 날짜 형식(YYYYMMDD)으로 변환"""
    return date.strftime("%Y%m%d")

def format_date_for_display(date: datetime) -> str:
    """datetime을 표시용 날짜 형식(YYYY-MM-DD)으로 변환"""
    return date.strftime("%Y-%m-%d")

def calculate_date_range(start_date: datetime, days: int) -> Tuple[str, str, str, str]:
    """시작일과 기간으로부터 API용 및 표시용 날짜 범위 계산"""
    end_date = start_date + timedelta(days=days)
    
    api_start = format_date_for_api(start_date)
    api_end = format_date_for_api(end_date)
    display_start = format_date_for_display(start_date)
    display_end = format_date_for_display(end_date)
    
    return api_start, api_end, display_start, display_end

# ============================================================
# 데이터 수집 함수들
# ============================================================

def fetch_medical_data_comprehensive(api_start: str, api_end: str, service_id: str, 
                                   facility_type: str, use_bgn_end: bool = True) -> List:
    """포괄적 의료기관 데이터 수집"""
    all_data = []
    page_index = 1
    
    method_name = "bgnYmd/endYmd" if use_bgn_end else "lastModTsBgn/lastModTsEnd"
    print(f"\n🚀 [{facility_type}] {method_name} 방식으로 데이터 수집 중...")
    
    # lastModTsBgn/lastModTsEnd의 경우 여러 범위를 시도
    date_ranges = []
    if not use_bgn_end:
        # 목표 날짜 주변의 여러 범위에서 데이터 수집
        start_date = datetime.strptime(api_start, "%Y%m%d")
        
        # 기본 범위
        date_ranges.append((api_start, api_end, "기본 범위"))
        
        # 이전 범위 (1주 전)
        prev_week_start = start_date - timedelta(days=7)
        prev_week_end = start_date - timedelta(days=1)
        date_ranges.append((
            format_date_for_api(prev_week_start),
            format_date_for_api(prev_week_end),
            "이전 주 범위"
        ))
        
        # 이후 범위 (1주 후)
        next_week_start = start_date + timedelta(days=7)
        next_week_end = start_date + timedelta(days=14)
        date_ranges.append((
            format_date_for_api(next_week_start),
            format_date_for_api(next_week_end),
            "이후 주 범위"
        ))
    
    range_index = 0
    
    while True:
        if use_bgn_end:
            # bgnYmd/endYmd 방식
            params = {
                "authKey": AUTH_KEYS[0],
                "opnSvcId": service_id,
                "bgnYmd": api_start,
                "endYmd": api_end,
                "pageSize": PAGE_SIZE_BGN_END,
                "pageIndex": page_index
            }
        else:
            # lastModTsBgn/lastModTsEnd 방식 - 여러 범위 시도
            if range_index >= len(date_ranges):
                break
                
            start_date, end_date, range_name = date_ranges[range_index]
            print(f"   🔍 {range_name} 시도: {start_date}~{end_date}")
            
            params = {
                "authKey": AUTH_KEYS[0],
                "opnSvcId": service_id,
                "lastModTsBgn": start_date,
                "lastModTsEnd": end_date,
                "pageSize": PAGE_SIZE_LASTMOD,
                "pageIndex": page_index
            }
        
        print(f"📄 페이지 {page_index} 요청...")
        
        response = requests.get(API_URL, params=params)
        
        if response.status_code != 200:
            print(f"❌ API 요청 실패: {response.status_code}")
            if not use_bgn_end:
                range_index += 1
                page_index = 1
                continue
            else:
                break
            
        try:
            root = ET.fromstring(response.text)
        except ET.ParseError as e:
            print(f"❌ XML 파싱 실패: {e}")
            if not use_bgn_end:
                range_index += 1
                page_index = 1
                continue
            else:
                break
            
        rows = root.findall('.//row')
        print(f"   → {len(rows)}개 데이터 수집")
        
        if len(rows) == 0:
            if not use_bgn_end:
                # 현재 범위에서 데이터가 없으면 다음 범위로
                range_index += 1
                page_index = 1
                continue
            else:
                break
            
        all_data.extend(rows)
        page_index += 1
        
        if len(rows) < (PAGE_SIZE_BGN_END if use_bgn_end else PAGE_SIZE_LASTMOD):
            if not use_bgn_end:
                # 현재 범위 완료, 다음 범위로
                range_index += 1
                page_index = 1
                continue
            else:
                break
            
        if page_index > MAX_PAGES_PER_RANGE:
            if not use_bgn_end:
                print(f"   ⚠️ {range_name}: {page_index-1}페이지까지 수집")
                range_index += 1
                page_index = 1
                continue
            else:
                print(f"⚠️ 안전장치: {page_index-1}페이지까지 수집 완료")
                break
    
    print(f"✅ [{facility_type}] {method_name}: 총 {len(all_data)}개 데이터 수집 완료")
    return all_data

def filter_by_opening_date(data: List, start_date: str, end_date: str, facility_type: str) -> List[Dict]:
    """개원일 기준으로 데이터 필터링"""
    filtered_facilities = []
    
    for row in data:
        apv_perm_ymd = row.find('apvPermYmd')
        if apv_perm_ymd is not None and apv_perm_ymd.text:
            opening_date = apv_perm_ymd.text.strip()
            
            # 날짜 형식 통일 (하이픈 제거)
            normalized_opening_date = opening_date.replace('-', '')
            
            if start_date <= normalized_opening_date <= end_date:
                facility = extract_facility_info(row)
                facility['시설유형'] = facility_type
                facility['데이터소스'] = ''  # 나중에 설정됨
                filtered_facilities.append(facility)
    
    return filtered_facilities

def extract_facility_info(row) -> Dict:
    """XML 행에서 의료기관 정보 추출"""
    def get_text(element_name):
        element = row.find(element_name)
        return element.text.strip() if element is not None and element.text else None
    
    return {
        "사업장명": get_text('bplcNm'),
        "개원일": get_text('apvPermYmd'),
        "주소": get_text('rdnWhlAddr'),
        "업태구분": get_text('uptaeNm'),
        "전화번호": get_text('siteTel'),
        "관리번호": get_text('mgtNo')
    }

# ============================================================
# 통합 데이터 수집 함수
# ============================================================

def collect_all_facilities(api_start: str, api_end: str) -> Dict[str, List[Dict]]:
    """모든 유형의 의료기관 데이터 수집"""
    all_facilities_by_type = {}
    
    for facility_type, service_id in SERVICE_IDS.items():
        print(f"\n{'='*60}")
        print(f"🏥 {facility_type} 데이터 수집 시작")
        print(f"{'='*60}")
        
        # 1단계: bgnYmd/endYmd 소스에서 데이터 수집
        bgn_end_data = fetch_medical_data_comprehensive(
            api_start, api_end, service_id, facility_type, use_bgn_end=True
        )
        bgn_end_facilities = filter_by_opening_date(bgn_end_data, api_start, api_end, facility_type)
        
        print(f"\n🔍 [{facility_type}] bgnYmd/endYmd에서 {len(bgn_end_facilities)}개 발견")
        
        # 2단계: lastModTsBgn/lastModTsEnd 소스에서 데이터 수집
        lastmod_data = fetch_medical_data_comprehensive(
            api_start, api_end, service_id, facility_type, use_bgn_end=False
        )
        lastmod_facilities = filter_by_opening_date(lastmod_data, api_start, api_end, facility_type)
        
        print(f"🔍 [{facility_type}] lastModTsBgn/lastModTsEnd에서 {len(lastmod_facilities)}개 발견")
        
        # 3단계: 중복 제거 및 데이터 통합
        all_facilities = {}
        
        # bgnYmd/endYmd 데이터 추가
        for facility in bgn_end_facilities:
            mgt_no = facility['관리번호']
            if mgt_no:
                facility['데이터소스'] = 'bgnYmd/endYmd'
                all_facilities[mgt_no] = facility
        
        # lastModTsBgn/lastModTsEnd 데이터 추가 (중복 제거)
        duplicates = 0
        for facility in lastmod_facilities:
            mgt_no = facility['관리번호']
            if mgt_no:
                if mgt_no not in all_facilities:
                    facility['데이터소스'] = 'lastModTsBgn/lastModTsEnd'
                    all_facilities[mgt_no] = facility
                else:
                    duplicates += 1
        
        final_facilities = list(all_facilities.values())
        
        print(f"🔄 [{facility_type}] 중복 제거된 항목: {duplicates}개")
        print(f"✅ [{facility_type}] 최종 결과: {len(final_facilities)}개")
        
        all_facilities_by_type[facility_type] = final_facilities
    
    return all_facilities_by_type

# ============================================================
# 출력 및 저장 함수들
# ============================================================

def print_integrated_report(facilities_by_type: Dict[str, List[Dict]], 
                          display_start: str, display_end: str, 
                          save_file: Optional[str] = None):
    """통합 리포트 출력"""
    
    # 전체 통합 데이터 생성
    all_facilities = []
    for facility_type, facilities in facilities_by_type.items():
        all_facilities.extend(facilities)
    
    # 개원일 기준으로 정렬
    all_facilities.sort(key=lambda x: x['개원일'] or '')
    
    # 헤더 출력
    print("\n" + "="*100)
    print(f"🏥 통합 의료기관 개원 리포트")
    print(f"📅 기간: {display_start} ~ {display_end}")
    print(f"🎯 총 {len(all_facilities)}개 의료기관 개원")
    for facility_type, facilities in facilities_by_type.items():
        print(f"   - {facility_type}: {len(facilities)}개")
    print("="*100)
    
    if not all_facilities:
        print("📭 해당 기간에 개원한 의료기관이 없습니다.")
        return
    
    # 테이블 데이터 준비
    table_data = []
    for facility in all_facilities:
        # 날짜 형식 통일 (YYYY-MM-DD)
        opening_date = facility['개원일']
        if opening_date and '-' not in opening_date:
            opening_date = f"{opening_date[:4]}-{opening_date[4:6]}-{opening_date[6:8]}"
        
        # 주소 전체 표시
        address = facility['주소'] or '-'
        
        # 전화번호 처리
        phone = facility['전화번호'] or '-'
        
        table_data.append([
            facility['시설유형'],                 # 시설유형
            facility['업태구분'] or '-',          # 구분
            facility['사업장명'] or '-',          # 사업자명
            address,                             # 주소
            phone,                              # 전화번호
            opening_date or '-'                 # 인허가일
        ])
    
    # 테이블 헤더
    headers = ["시설유형", "구분", "사업자명", "주소", "전화번호", "인허가일"]
    
    # 구글 스프레드시트용 CSV 형식
    print("\n📊 구글 스프레드시트용 복사 형식")
    print("-" * 120)
    print("▼ 아래 테이블을 드래그하여 구글 스프레드시트에 복사 붙여넣기 하세요")
    print()
    
    # CSV 헤더 출력
    csv_headers = [f'"{header}"' for header in headers]
    print(",".join(csv_headers))
    
    # CSV 데이터 출력
    for row in table_data:
        cleaned_row = [str(cell).replace('\n', ' ').replace('\r', ' ').replace('"', '""').strip() for cell in row]
        csv_row = [f'"{cell}"' for cell in cleaned_row]
        print(",".join(csv_row))
    
    print()
    print("▲ 위 표를 드래그하여 복사하세요 (구글 스프레드시트용)")
    
    # 유형별 상세 리스트
    print("\n\n📋 유형별 상세 리스트")
    print("="*100)
    
    for facility_type, facilities in facilities_by_type.items():
        if facilities:
            print(f"\n🏥 {facility_type} ({len(facilities)}개)")
            print("-" * 80)
            
            # 날짜순으로 정렬
            sorted_facilities = sorted(facilities, key=lambda x: x['개원일'] or '')
            
            for i, facility in enumerate(sorted_facilities, 1):
                opening_date = facility['개원일']
                if opening_date and '-' not in opening_date:
                    opening_date = f"{opening_date[:4]}-{opening_date[4:6]}-{opening_date[6:8]}"
                
                print(f"{i}. {facility['사업장명']}")
                print(f"   📋 {facility['업태구분'] or '분류없음'}")
                print(f"   📅 {opening_date}")
                print(f"   📍 {facility['주소'] or '주소없음'}")
                print(f"   📞 {facility['전화번호'] or '전화번호없음'}")
                print()
    
    # 통계 정보
    print("\n📊 통합 통계 정보")
    print("="*100)
    
    # 날짜별 분포
    by_date = {}
    for facility in all_facilities:
        date = facility['개원일']
        if date:
            if '-' in date:
                formatted_date = date
            else:
                formatted_date = f"{date[:4]}-{date[4:6]}-{date[6:8]}"
            
            if formatted_date not in by_date:
                by_date[formatted_date] = {'총계': 0}
            by_date[formatted_date]['총계'] += 1
            
            # 유형별 카운트
            facility_type = facility['시설유형']
            if facility_type not in by_date[formatted_date]:
                by_date[formatted_date][facility_type] = 0
            by_date[formatted_date][facility_type] += 1
    
    print(f"\n📅 날짜별 분포:")
    date_headers = ["날짜", "총계"] + list(SERVICE_IDS.keys())
    date_table = []
    for date in sorted(by_date.keys()):
        row = [date, f"{by_date[date]['총계']}개"]
        for facility_type in SERVICE_IDS.keys():
            count = by_date[date].get(facility_type, 0)
            row.append(f"{count}개" if count > 0 else "-")
        date_table.append(row)
    
    print(tabulate(date_table, headers=date_headers, tablefmt="simple"))
    
    # 지역별 분포
    regions = {}
    for facility in all_facilities:
        if facility['주소']:
            region = facility['주소'].split()[0]
            if region not in regions:
                regions[region] = {'총계': 0}
            regions[region]['총계'] += 1
            
            # 유형별 카운트
            facility_type = facility['시설유형']
            if facility_type not in regions[region]:
                regions[region][facility_type] = 0
            regions[region][facility_type] += 1
    
    if regions:
        print(f"\n🗺️ 지역별 분포:")
        region_headers = ["지역", "총계"] + list(SERVICE_IDS.keys())
        region_table = []
        for region in sorted(regions.keys()):
            row = [region, f"{regions[region]['총계']}개"]
            for facility_type in SERVICE_IDS.keys():
                count = regions[region].get(facility_type, 0)
                row.append(f"{count}개" if count > 0 else "-")
            region_table.append(row)
        
        print(tabulate(region_table, headers=region_headers, tablefmt="simple"))
    
    # 파일 저장
    if save_file:
        save_integrated_data(facilities_by_type, save_file, display_start, display_end)

def save_integrated_data(facilities_by_type: Dict[str, List[Dict]], 
                        filename: str, start_date: str, end_date: str):
    """통합 데이터를 파일로 저장"""
    # 전체 데이터 통합
    all_facilities = []
    for facilities in facilities_by_type.values():
        all_facilities.extend(facilities)
    
    report_data = {
        "report_info": {
            "title": "통합 의료기관 개원 리포트",
            "period": f"{start_date} ~ {end_date}",
            "total_count": len(all_facilities),
            "count_by_type": {
                facility_type: len(facilities) 
                for facility_type, facilities in facilities_by_type.items()
            },
            "generated_at": datetime.now().isoformat()
        },
        "facilities_by_type": facilities_by_type,
        "all_facilities": all_facilities
    }
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        print(f"\n💾 데이터가 {filename}에 저장되었습니다.")
    except Exception as e:
        print(f"❌ 파일 저장 실패: {e}")

# ============================================================
# 메인 함수
# ============================================================

def main():
    """메인 실행 함수"""
    parser = argparse.ArgumentParser(
        description="통합 의료기관 데이터 추출기",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  %(prog)s                                # 하드코딩 모드 (파일 상단 HARDCODED_START_DATE/END_DATE 사용)
  %(prog)s --week 2025-06-15              # 2025-06-15가 포함된 주의 데이터
  %(prog)s --current-week                 # 현재 주의 데이터
  %(prog)s --start-date 2025-06-08 --days 5  # 2025-06-08부터 5일간
  %(prog)s --week 2025-06-15 --save integrated_report.json  # 결과를 파일로 저장
  
하드코딩 모드 사용법:
  1. 파일 상단의 HARDCODED_START_DATE, HARDCODED_END_DATE 수정
  2. python %(prog)s 실행 (인자 없이)
        """
    )
    
    # 날짜 옵션 그룹
    date_group = parser.add_mutually_exclusive_group(required=not ENABLE_HARDCODED_MODE)
    date_group.add_argument('--week', type=str, metavar='YYYY-MM-DD',
                           help='해당 날짜가 포함된 주의 월요일부터 데이터 추출')
    date_group.add_argument('--current-week', action='store_true',
                           help='현재 주의 데이터 추출')
    date_group.add_argument('--start-date', type=str, metavar='YYYY-MM-DD',
                           help='시작 날짜 직접 지정')
    
    # 기타 옵션
    parser.add_argument('--days', type=int, default=DEFAULT_DAYS,
                       help=f'추출 기간 (일수, 기본값: {DEFAULT_DAYS})')
    parser.add_argument('--save', type=str, metavar='FILENAME',
                       help='결과를 JSON 파일로 저장')
    
    args = parser.parse_args()
    
    # 날짜 범위 계산
    try:
        # 하드코딩 모드 확인
        if ENABLE_HARDCODED_MODE and not any([args.current_week, args.week, args.start_date]):
            # 하드코딩 값 사용
            print(f"🔧 하드코딩 모드: {HARDCODED_START_DATE} ~ {HARDCODED_END_DATE}")
            api_start = HARDCODED_START_DATE
            api_end = HARDCODED_END_DATE
            
            # 표시용 날짜 형식 변환
            start_dt = datetime.strptime(api_start, "%Y%m%d")
            end_dt = datetime.strptime(api_end, "%Y%m%d")
            display_start = format_date_for_display(start_dt)
            display_end = format_date_for_display(end_dt)
            
        elif args.current_week:
            start_date = get_current_week_start()
            api_start, api_end, display_start, display_end = calculate_date_range(start_date, args.days)
        elif args.week:
            start_date = get_week_start_date(args.week)
            api_start, api_end, display_start, display_end = calculate_date_range(start_date, args.days)
        else:  # args.start_date
            start_date = datetime.strptime(args.start_date, "%Y-%m-%d")
            api_start, api_end, display_start, display_end = calculate_date_range(start_date, args.days)
        
    except ValueError as e:
        print(f"❌ 날짜 형식 오류: {e}")
        print("올바른 형식: YYYY-MM-DD (예: 2025-06-15)")
        return
    
    print(f"🎯 목표: 개원일 {api_start}~{api_end}인 모든 의료기관 추출")
    print(f"📊 병원, 의원, 약국 데이터를 통합하여 수집합니다.")
    
    # 모든 의료기관 데이터 수집
    facilities_by_type = collect_all_facilities(api_start, api_end)
    
    # 통합 리포트 출력
    print_integrated_report(facilities_by_type, display_start, display_end, args.save)

if __name__ == "__main__":
    main() 