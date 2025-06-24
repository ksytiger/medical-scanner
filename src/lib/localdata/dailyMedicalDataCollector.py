#!/usr/bin/env python3
"""
매일 의료기관 데이터 수집 및 Supabase 업로드 스크립트
매일 오전 7시에 실행되어 어제, 오늘, 오늘 이후 인허가일 데이터를 수집하고 업로드합니다.
"""

import os
import sys
import json
import requests
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import re
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# Supabase 설정
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE")

# API 설정
BASE_URL = "http://www.localdata.go.kr/platform/rest/TO0/openDataApi"
AUTH_KEY = "cPf6Cnhiz8tSZsow6jIGOnyndwJnDO2gNz9qLUIYQ90="

# 의료기관 타입별 서비스 ID
SERVICE_IDS = {
    "병원": "01_01_01_P",
    "의원": "01_01_02_P", 
    "약국": "01_01_06_P"
}

# 진료과목 추론을 위한 매핑
MEDICAL_SUBJECT_KEYWORDS = {
    # 의원 관련
    "내과": ["내과"],
    "소아청소년과": ["소아", "소아청소년", "소아과"],
    "정형외과": ["정형외과", "정형"],
    "피부과": ["피부과", "피부"],
    "이비인후과": ["이비인후과", "이비", "코", "귀"],
    "안과": ["안과", "눈"],
    "비뇨기과": ["비뇨기과", "비뇨"],
    "산부인과": ["산부인과", "산부", "여성의원", "여성"],
    "정신건강의학과": ["정신과", "정신건강", "정신"],
    "재활의학과": ["재활의학과", "재활"],
    "가정의학과": ["가정의학과", "가정"],
    "신경과": ["신경과"],
    "신경외과": ["신경외과"],
    "외과": ["외과"],
    "성형외과": ["성형외과", "성형"],
    "마취통증의학과": ["마취통증", "통증의학과", "통증", "페인"],
    
    # 치과 관련
    "치과": ["치과"],
    
    # 한의원 관련
    "한의원": ["한의원", "한방", "한의과"],
}

class DailyMedicalDataCollector:
    """매일 의료기관 데이터를 수집하고 Supabase에 업로드하는 클래스"""
    
    def __init__(self):
        self.supabase = self._create_supabase_client()
        self.today = datetime.now().date()
        self.yesterday = self.today - timedelta(days=1)
        
        # 매일 최신 데이터 수집 - 최근 7일간 + 향후 3일간 (API 미래 날짜 제한 고려)
        self.date_range_start = self.today - timedelta(days=7)   # 일주일 전부터
        self.date_range_end = self.today + timedelta(days=3)     # 오늘부터 3일 후까지
        
        print(f"🔧 일일 의료기관 데이터 수집기 초기화")
        print(f"📅 수집 대상: {self.date_range_start} ~ {self.date_range_end}")
        print(f"🎯 타겟: 인허가일이 최근 7일간({self.date_range_start} ~ {self.today}) 및 향후 3일간 데이터")
    
    def _create_supabase_client(self) -> Optional[Client]:
        """Supabase 클라이언트 생성"""
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            print("❌ Supabase 환경변수가 설정되어 있지 않습니다.")
            return None
        
        try:
            return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        except Exception as e:
            print(f"❌ Supabase 클라이언트 생성 실패: {e}")
            return None
    
    def extract_medical_subjects(self, business_name: str, business_type: str) -> str:
        """사업장명에서 진료과목을 추론"""
        if not business_name:
            return ""
        
        # 약국은 진료과목이 없음
        if business_type == "약국":
            return ""
        
        # 병원은 종합병원이 많으므로 기본적으로 빈 문자열 반환
        if business_type == "병원":
            # 특수병원 체크 (예: XX정형외과병원)
            for subject, keywords in MEDICAL_SUBJECT_KEYWORDS.items():
                for keyword in keywords:
                    if keyword in business_name:
                        return subject
            return ""
        
        # 의원의 경우
        found_subjects = []
        
        # 각 진료과목 키워드 확인
        for subject, keywords in MEDICAL_SUBJECT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in business_name:
                    if subject not in found_subjects:
                        found_subjects.append(subject)
                    break
        
        # 찾은 진료과목을 쉼표로 구분하여 반환
        if found_subjects:
            return ", ".join(found_subjects)
        
        # 의원인데 진료과목을 찾을 수 없는 경우
        if business_type == "의원" and "의원" in business_name:
            return "일반의원"
        
        return ""
    
    def fetch_medical_data_for_date_range(self) -> Dict[str, List[Dict]]:
        """날짜 범위에 해당하는 모든 의료기관 데이터 수집"""
        all_facilities = {
            "병원": [],
            "의원": [],
            "약국": []
        }
        
        for facility_type, service_id in SERVICE_IDS.items():
            print(f"\n🏥 {facility_type} 데이터 수집 중...")
            
            # API 날짜 형식으로 변환
            start_str = self.date_range_start.strftime("%Y%m%d")
            end_str = self.date_range_end.strftime("%Y%m%d")
            
            # 두 가지 방식으로 데이터 수집
            # 1. 인허가일 기준
            facilities_by_permit = self._fetch_by_date_params(
                start_str, end_str, service_id, facility_type, use_bgn_end=True
            )
            
            # 2. 데이터갱신일 기준
            facilities_by_update = self._fetch_by_date_params(
                start_str, end_str, service_id, facility_type, use_bgn_end=False
            )
            
            # 중복 제거 및 통합
            combined_facilities = self._merge_and_deduplicate(
                facilities_by_permit, facilities_by_update
            )
            
            # 날짜 필터링 (어제, 오늘, 오늘 이후)
            filtered_facilities = self._filter_by_target_dates(combined_facilities)
            
            all_facilities[facility_type] = filtered_facilities
            
            print(f"✅ {facility_type}: {len(filtered_facilities)}개 수집 완료")
        
        return all_facilities
    
    def _fetch_by_date_params(self, start_date: str, end_date: str, 
                             service_id: str, facility_type: str, 
                             use_bgn_end: bool = True) -> List[Dict]:
        """API를 통해 데이터 수집"""
        all_data = []
        page_index = 1
        
        print(f"   🔍 {'인허가일' if use_bgn_end else '데이터갱신일'} 기준 검색: {start_date} ~ {end_date}")
        
        while True:
            params = {
                "authKey": AUTH_KEY,
                "opnSvcId": service_id,
                "pageSize": "1000",
                "pageIndex": str(page_index)
            }
            
            if use_bgn_end:
                params["bgnYmd"] = start_date
                params["endYmd"] = end_date
            else:
                # 데이터갱신일 기준 검색 - 동적으로 최근 5일간 범위 설정
                # 오늘 기준으로 이전 5일부터 오늘까지
                today = datetime.now().date()
                search_start_date = today - timedelta(days=5)
                search_end_date = today
                
                search_start = search_start_date.strftime("%Y%m%d")
                search_end = search_end_date.strftime("%Y%m%d")
                
                params["lastModTsBgn"] = search_start
                params["lastModTsEnd"] = search_end
            
            try:
                # 첫 페이지에서만 파라미터 출력
                if page_index == 1:
                    print(f"   📋 API 파라미터: {params}")
                
                response = requests.get(BASE_URL, params=params, timeout=30)
                response.raise_for_status()
                
                # 응답 형식 확인
                content_type = response.headers.get('Content-Type', '').lower()
                
                # XML 또는 JSON 응답 처리
                data = None
                rows = []
                total_count = 0
                
                if 'xml' in content_type:
                    # XML 파싱
                    try:
                        root = ET.fromstring(response.text)
                        
                        # XML에서 rows 추출
                        xml_rows = root.findall('.//row')
                        
                        # XML row를 딕셔너리로 변환
                        for xml_row in xml_rows:
                            row_dict = {}
                            for child in xml_row:
                                row_dict[child.tag] = child.text if child.text else ""
                            rows.append(row_dict)
                        
                        # 전체 개수 추출 (첫 페이지만)
                        if page_index == 1:
                            total_count_elem = root.find('.//totalCount')
                            if total_count_elem is not None:
                                total_count = int(total_count_elem.text or 0)
                            else:
                                total_count = len(rows)  # fallback
                        
                    except ET.ParseError as pe:
                        print(f"   ❌ XML 파싱 에러: {pe}")
                        break
                else:
                    # JSON 파싱 (기존 로직)
                    try:
                        data = response.json()
                        
                        # 첫 페이지에서만 응답 구조 확인
                        if page_index == 1:
                            if "result" in data and "header" in data["result"] and "paging" in data["result"]["header"]:
                                total_count = data["result"]["header"]["paging"].get("totalCount", 0)
                        
                        # 데이터 추출
                        rows = self._extract_rows_from_response(data)
                        
                    except json.JSONDecodeError as je:
                        print(f"   ❌ JSON 파싱 에러: {je}")
                        break
                
                # 첫 페이지에서만 전체 개수 출력
                if page_index == 1:
                    print(f"   📊 API 전체 데이터 수: {total_count}")
                    print(f"   📋 응답 형식: {'XML' if 'xml' in content_type else 'JSON'}")
                
                print(f"   📄 페이지 {page_index}: {len(rows)}개 행 발견")
                
                if not rows:
                    break
                
                # 데이터 변환 및 로그
                page_converted = 0
                for row in rows:
                    if isinstance(row, dict):
                        facility_data = self._extract_facility_info(row, facility_type)
                        if facility_data:
                            all_data.append(facility_data)
                            page_converted += 1
                
                print(f"   ✏️ 페이지 {page_index}: {page_converted}개 변환 완료")
                
                # 더 이상 데이터가 없으면 종료
                if len(rows) < 1000:
                    break
                
                page_index += 1
                if page_index > 10:  # 최대 10페이지까지만
                    break
                
                time.sleep(0.5)  # API 제한 방지
                
            except Exception as e:
                print(f"   ❌ API 호출 에러 (페이지 {page_index}): {e}")
                break
        
        print(f"   🎯 총 {len(all_data)}개 데이터 수집 완료")
        return all_data
    
    def _extract_rows_from_response(self, data: Dict) -> List:
        """API 응답에서 데이터 행 추출"""
        rows = []
        
        # 다양한 응답 구조 처리
        if "result" in data and "body" in data["result"]:
            body = data["result"]["body"]
            
            if isinstance(body, dict):
                if "rows" in body:
                    rows_data = body["rows"]
                    if isinstance(rows_data, list) and len(rows_data) > 0:
                        if isinstance(rows_data[0], dict) and "row" in rows_data[0]:
                            rows = rows_data[0]["row"]
                        else:
                            rows = rows_data
                else:
                    rows = [body]
            elif isinstance(body, list):
                rows = body
        elif "body" in data:
            rows = data["body"]
        elif "row" in data:
            rows = data["row"]
        
        # 리스트가 아닌 경우 리스트로 변환
        if not isinstance(rows, list):
            rows = [rows] if rows else []
        
        return rows
    
    def _extract_facility_info(self, row: Dict, facility_type: str) -> Optional[Dict]:
        """API 응답에서 시설 정보 추출"""
        if not isinstance(row, dict):
            return None
        
        # 필수 필드 확인
        if not row.get("mgtNo") or not row.get("apvPermYmd"):
            return None
        
        # 사업장명 추출
        business_name = row.get("bplcNm", "")
        
        # 진료과목 추론
        medical_subjects = self.extract_medical_subjects(
            business_name, 
            facility_type
        )
        
        return {
            "관리번호": row.get("mgtNo", ""),
            "시설유형": facility_type,
            "사업장명": business_name,
            "업태구분": row.get("uptaeNm", ""),
            "주소": row.get("rdnWhlAddr", ""),
            "전화번호": row.get("siteTel", ""),
            "개원일": row.get("apvPermYmd", ""),
            "진료과목": medical_subjects,
            "개방서비스명": row.get("opnSvcNm", "")
        }
    
    def _merge_and_deduplicate(self, list1: List[Dict], list2: List[Dict]) -> List[Dict]:
        """두 리스트를 병합하고 중복 제거"""
        all_facilities = {}
        
        # 첫 번째 리스트 추가
        for facility in list1:
            mgt_no = facility.get("관리번호")
            if mgt_no:
                all_facilities[mgt_no] = facility
        
        # 두 번째 리스트 추가 (중복 제거)
        for facility in list2:
            mgt_no = facility.get("관리번호")
            if mgt_no and mgt_no not in all_facilities:
                all_facilities[mgt_no] = facility
        
        return list(all_facilities.values())
    
    def _filter_by_target_dates(self, facilities: List[Dict]) -> List[Dict]:
        """최근 7일간 및 향후 30일간 날짜만 필터링"""
        filtered = []
        
        # 동적 날짜 범위 계산
        start_str = self.date_range_start.strftime("%Y%m%d")
        end_str = self.date_range_end.strftime("%Y%m%d")
        
        print(f"   🗓️ 날짜 필터링: {start_str} ~ {end_str} 범위 데이터만 포함")
        print(f"   📋 필터링 전 데이터: {len(facilities)}개")
        
        for facility in facilities:
            open_date = facility.get("개원일", "")
            if not open_date:
                continue
            
            # 날짜 형식 정규화
            if "-" in open_date:
                open_date = open_date.replace("-", "")
            
            # 최근 7일간 및 향후 30일간 데이터만 포함
            if start_str <= open_date <= end_str:
                filtered.append(facility)
                print(f"     ✅ 포함: {facility.get('사업장명', 'N/A')} (인허가일: {open_date})")
            else:
                print(f"     ❌ 제외: {facility.get('사업장명', 'N/A')} (인허가일: {open_date}) - 범위 밖")
        
        print(f"   📋 필터링 후 데이터: {len(filtered)}개")
        return filtered
    
    def prepare_for_medical_facilities_table(self, facility: Dict, facility_type: str) -> Dict:
        """medical_facilities 테이블 형식으로 데이터 변환"""
        # 개원일 처리
        license_date = None
        if facility.get('개원일'):
            date_str = facility['개원일'].replace('-', '')
            try:
                parsed_date = datetime.strptime(date_str, '%Y%m%d')
                license_date = parsed_date.date().isoformat()
            except ValueError:
                print(f"⚠️ 잘못된 날짜 형식: {facility['개원일']}")
        
        # 시설 유형별 service_name과 service_id 매핑
        service_mapping = {
            '병원': {'service_name': '병원', 'service_id': '01_01_01_P'},
            '의원': {'service_name': '의원', 'service_id': '01_01_02_P'},
            '약국': {'service_name': '약국', 'service_id': '01_02_01_P'}
        }
        
        service_info = service_mapping.get(facility_type, {
            'service_name': facility_type, 
            'service_id': 'unknown'
        })
        
        return {
            'service_name': service_info['service_name'],
            'service_id': service_info['service_id'],
            'management_number': facility.get('관리번호', ''),
            'business_name': facility.get('사업장명', ''),
            'business_type': facility.get('업태구분', ''),
            'license_date': license_date,
            'road_full_address': facility.get('주소', ''),
            'location_phone': facility.get('전화번호', ''),
            'medical_subject_names': facility.get('진료과목', ''),
            'business_status': '영업/정상',
            'business_status_code': '1',
            'detailed_business_status': '영업중',
            'detailed_business_status_code': '13',
            'data_update_type': 'I',
            'data_update_date': datetime.now().isoformat(),
            'last_modified_time': datetime.now().isoformat()
        }
    
    def upload_to_supabase(self, facilities_by_type: Dict[str, List[Dict]]) -> bool:
        """Supabase medical_facilities 테이블에 데이터 업로드"""
        if not self.supabase:
            print("❌ Supabase 클라이언트가 없습니다.")
            return False
        
        print("\n🚀 Supabase medical_facilities 테이블에 데이터 업로드 시작...")
        
        total_uploaded = 0
        total_errors = 0
        total_duplicates = 0
        
        for facility_type, facilities in facilities_by_type.items():
            if not facilities:
                continue
            
            print(f"\n📤 {facility_type} 데이터 업로드 중... ({len(facilities)}개)")
            
            # 배치 데이터 준비
            batch_data = []
            for facility in facilities:
                if not facility.get('관리번호'):
                    print(f"⚠️ 관리번호가 없는 시설 건너뜀: {facility.get('사업장명', 'Unknown')}")
                    total_errors += 1
                    continue
                
                facility_data = self.prepare_for_medical_facilities_table(facility, facility_type)
                batch_data.append(facility_data)
            
            if not batch_data:
                print(f"⚠️ {facility_type}: 업로드할 유효한 데이터가 없습니다.")
                continue
            
            # 배치 업로드 실행 (중복 데이터는 관리번호 기준으로 업데이트)
            try:
                # 먼저 기존 데이터 확인
                existing_mgt_numbers = [d['management_number'] for d in batch_data]
                existing_check = self.supabase.table('medical_facilities').select('management_number').in_('management_number', existing_mgt_numbers).execute()
                
                existing_set = {row['management_number'] for row in existing_check.data}
                
                # 새로운 데이터와 업데이트할 데이터 분리
                new_data = []
                update_data = []
                
                for data in batch_data:
                    if data['management_number'] in existing_set:
                        update_data.append(data)
                        total_duplicates += 1
                    else:
                        new_data.append(data)
                
                # 새 데이터 삽입
                if new_data:
                    insert_result = self.supabase.table('medical_facilities').insert(new_data).execute()
                    total_uploaded += len(insert_result.data) if insert_result.data else 0
                
                # 기존 데이터 업데이트 (선택사항 - 필요시 주석 해제)
                # for data in update_data:
                #     self.supabase.table('medical_facilities').update(data).eq('management_number', data['management_number']).execute()
                
                print(f"✅ {facility_type}: 신규 {len(new_data)}개, 중복 {len(update_data)}개")
                
            except Exception as e:
                print(f"❌ {facility_type} 업로드 실패: {e}")
                total_errors += len(batch_data)
        
        # 결과 요약
        print(f"\n📊 업로드 결과 요약:")
        print(f"   ✅ 신규 등록: {total_uploaded}개")
        print(f"   🔄 중복 제외: {total_duplicates}개")  
        print(f"   ❌ 실패: {total_errors}개")
        print(f"   📈 총 처리: {total_uploaded + total_duplicates + total_errors}개")
        
        return total_uploaded > 0
    
    def save_daily_report(self, facilities_by_type: Dict[str, List[Dict]]):
        """일일 수집 결과를 JSON 파일로 저장"""
        report_data = {
            "collection_date": datetime.now().isoformat(),
            "target_dates": {
                "yesterday": self.yesterday.isoformat(),
                "today": self.today.isoformat(),
                "future": f"{self.today} 이후"
            },
            "statistics": {
                facility_type: len(facilities)
                for facility_type, facilities in facilities_by_type.items()
            },
            "total_count": sum(len(facilities) for facilities in facilities_by_type.values()),
            "facilities_by_type": facilities_by_type
        }
        
        # 파일명에 오늘 날짜 포함
        filename = f"daily_medical_data_{self.today.strftime('%Y%m%d')}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, ensure_ascii=False, indent=2)
            print(f"\n💾 일일 리포트가 {filename}에 저장되었습니다.")
        except Exception as e:
            print(f"❌ 파일 저장 실패: {e}")
    
    def run(self):
        """메인 실행 함수"""
        print("\n🏥 일일 의료기관 데이터 수집 시작")
        print(f"📅 실행 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # 1. 데이터 수집
        facilities_by_type = self.fetch_medical_data_for_date_range()
        
        # 2. 수집 결과 요약
        total_count = sum(len(facilities) for facilities in facilities_by_type.values())
        print(f"\n📊 수집 완료: 총 {total_count}개 의료기관")
        for facility_type, facilities in facilities_by_type.items():
            print(f"   - {facility_type}: {len(facilities)}개")
        
        # 3. Supabase 업로드
        if total_count > 0:
            upload_success = self.upload_to_supabase(facilities_by_type)
            
            # 4. 일일 리포트 저장
            self.save_daily_report(facilities_by_type)
            
            if upload_success:
                print("\n✅ 모든 작업이 성공적으로 완료되었습니다!")
                return 0
            else:
                print("\n⚠️ 데이터 수집은 완료되었으나 업로드 중 일부 오류가 발생했습니다.")
                return 1
        else:
            print("\n📭 수집된 데이터가 없습니다.")
            return 0


def main():
    """메인 실행 함수"""
    collector = DailyMedicalDataCollector()
    return collector.run()


if __name__ == "__main__":
    sys.exit(main()) 