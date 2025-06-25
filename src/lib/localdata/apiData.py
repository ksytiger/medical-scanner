import requests
import json
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import time
from urllib.parse import urlencode

class MedicalDataAPI:
    """한국 지역 공공데이터 포털 의료기관 데이터 API 클라이언트"""
    
    def __init__(self):
        self.base_url = "http://www.localdata.go.kr/platform/rest/TO0/openDataApi"
        self.auth_key = "cPf6Cnhiz8tSZsow6jIGOnyndwJnDO2gNz9qLUIYQ90="
        
        # 의료기관 타입별 서비스 ID
        self.service_ids = {
            "약국": "01_01_06_P",
            "의원": "01_01_02_P",
            "병원": "01_01_01_P"
        }
        
        # 의료기관 타입별 이모지
        self.emojis = {
            "약국": "💊",
            "의원": "🏥",
            "병원": "🏩"
        }
        
        # 추출할 필드 목록
        self.required_fields = [
            "mgtNo",       # 관리번호
            "opnSvcNm",    # 개방서비스명
            "bplcNm",      # 사업장명
            "rdnWhlAddr",  # 도로명주소
            "apvPermYmd",  # 인허가일자
            "uptaeNm",     # 업태구분명
            "siteTel"      # 전화번호
        ]
    
    def fetch_data_by_date(self, target_date: str, facility_type: str) -> List[Dict]:
        """
        특정 날짜의 인허가일 기준으로 의료기관 데이터를 가져옵니다.
        
        Args:
            target_date: YYYYMMDD 형식의 타겟 날짜
            facility_type: '병원', '의원', '약국' 중 하나
            
        Returns:
            해당 날짜의 의료기관 데이터 리스트
        """
        if facility_type not in self.service_ids:
            raise ValueError(f"Invalid facility type: {facility_type}. Must be one of {list(self.service_ids.keys())}")
        
        # 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
        if "-" in target_date:
            target_date = target_date.replace("-", "")
        
        all_results = []
        
        # 두 가지 방식으로 데이터를 가져와서 누락 방지
        # 1. 인허가일자 기준 검색
        print(f"\n[디버깅] 인허가일자 기준 검색 시작: {target_date}")
        results_by_permit = self._fetch_by_permit_date(target_date, facility_type)
        all_results.extend(results_by_permit)
        print(f"[디버깅] 인허가일자 기준 검색 결과: {len(results_by_permit)}개")
        
        # 2. 데이터갱신일자 기준 검색 (최근 30일간의 갱신 데이터 중 해당 인허가일 필터링)
        print(f"\n[디버깅] 데이터갱신일자 기준 검색 시작")
        results_by_update = self._fetch_by_update_date(target_date, facility_type)
        all_results.extend(results_by_update)
        print(f"[디버깅] 데이터갱신일자 기준 검색 결과: {len(results_by_update)}개")
        
        # 중복 제거 (관리번호 기준)
        unique_results = self._remove_duplicates(all_results)
        print(f"[디버깅] 중복 제거 후 최종 결과: {len(unique_results)}개")
        
        return unique_results
    
    def _fetch_by_permit_date(self, target_date: str, facility_type: str) -> List[Dict]:
        """인허가일자 기준으로 데이터 검색"""
        # 더 넓은 날짜 범위로 검색 (타겟 날짜 전후 7일)
        target_dt = datetime.strptime(target_date, "%Y%m%d")
        today = datetime.now()
        
        # API가 미래 날짜를 거부하는 경우를 대비
        start_dt = target_dt - timedelta(days=7)
        end_dt = target_dt + timedelta(days=7)
        
        # 종료일이 오늘보다 미래인 경우 오늘로 조정
        if end_dt > today:
            end_dt = today
            print(f"[디버깅] 종료일을 오늘({today.strftime('%Y%m%d')})로 조정")
        
        params = {
            "authKey": self.auth_key,
            "opnSvcId": self.service_ids[facility_type],
            "bgnYmd": start_dt.strftime("%Y%m%d"),
            "endYmd": end_dt.strftime("%Y%m%d"),
            "pageSize": "1000"
        }
        
        print(f"[디버깅] 넓은 범위 검색: {start_dt.strftime('%Y%m%d')} ~ {end_dt.strftime('%Y%m%d')}")
        print(f"[디버깅] 현재 시스템 날짜: {today.strftime('%Y-%m-%d')}")
        
        return self._fetch_paginated_data(params, target_date)
    
    def _fetch_by_update_date(self, target_date: str, facility_type: str) -> List[Dict]:
        """데이터갱신일자 기준으로 데이터 검색"""
        # 더 넓은 범위로 검색하여 최신 인허가 데이터 누락 방지
        target_dt = datetime.strptime(target_date, "%Y%m%d")
        today = datetime.now()
        
        # 타겟 날짜부터 3일 후까지 검색 (최신 인허가 데이터는 보통 며칠 후에 갱신됨)
        start_dt = target_dt
        end_dt = min(target_dt + timedelta(days=3), today)
        
        # 시작일이 종료일보다 늦으면 검색하지 않음
        if start_dt > end_dt:
            print(f"[디버깅] 데이터갱신일자 검색 불가: 시작일({start_dt.strftime('%Y%m%d')}) > 종료일({end_dt.strftime('%Y%m%d')})")
            return []
        
        params = {
            "authKey": self.auth_key,
            "opnSvcId": self.service_ids[facility_type],
            "lastModTsBgn": start_dt.strftime("%Y%m%d"),
            "lastModTsEnd": end_dt.strftime("%Y%m%d"),
            "pageSize": "1000"
        }
        
        print(f"[디버깅] 데이터갱신일자 범위: {start_dt.strftime('%Y%m%d')} ~ {end_dt.strftime('%Y%m%d')}")
        
        return self._fetch_paginated_data(params, target_date)
    
    def _fetch_paginated_data(self, params: Dict, target_date: str) -> List[Dict]:
        """페이지네이션을 처리하며 데이터를 가져옵니다."""
        all_data = []
        page_index = 1
        
        while True:
            params["pageIndex"] = str(page_index)
            
            try:
                # API 호출
                print(f"\n[디버깅] API 호출 - 페이지 {page_index}")
                print(f"[디버깅] URL: {self.base_url}")
                print(f"[디버깅] 파라미터: {params}")
                
                response = requests.get(self.base_url, params=params, timeout=30)
                response.raise_for_status()
                
                # 응답 형식 확인
                content_type = response.headers.get('Content-Type', '').lower()
                print(f"[디버깅] Content-Type: {content_type}")
                
                # XML 또는 JSON 응답 처리
                data = None
                rows = []
                total_count = 0
                
                if 'xml' in content_type:
                    # XML 파싱
                    print(f"[디버깅] XML 응답 파싱 중...")
                    try:
                        root = ET.fromstring(response.text)
                        
                        # XML에서 rows 추출
                        xml_rows = root.findall('.//row')
                        print(f"[디버깅] XML에서 {len(xml_rows)}개 row 발견")
                        
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
                        print(f"[디버깅] XML 파싱 에러: {pe}")
                        break
                else:
                    # JSON 파싱 (기존 로직)
                    try:
                        data = response.json()
                        
                        # 전체 응답 구조 확인 (첫 페이지만)
                        if page_index == 1:
                            print(f"\n[디버깅] API 응답 구조:")
                            print(json.dumps(data, ensure_ascii=False, indent=2)[:2000] + "...")
                        
                        # 에러 체크
                        if "result" in data and "header" in data["result"]:
                            header = data["result"]["header"]
                            if "process" in header and "code" in header["process"]:
                                # code가 "00" 또는 "000"이 아닌 경우만 에러로 처리
                                if header["process"]["code"] not in ["00", "000"]:
                                    print(f"[디버깅] API 에러: {header['process'].get('message', 'Unknown error')}")
                                    break
                    except json.JSONDecodeError as je:
                        print(f"[디버깅] JSON 파싱 에러: {je}")
                        break
                
                # JSON 응답에서 rows 추출 (data가 있을 때만)
                if data is not None:
                    # 케이스 1: result.body 구조
                    if "result" in data and "body" in data["result"]:
                        body = data["result"]["body"]
                        
                        # body가 단일 객체인 경우 처리
                        if isinstance(body, dict):
                            # body 안에 rows 키가 있는지 확인
                            if "rows" in body:
                                rows_data = body["rows"]
                                # rows가 리스트이고 첫 번째 요소가 @class: list인 경우 처리
                                if isinstance(rows_data, list) and len(rows_data) > 0:
                                    # 첫 번째 요소가 객체이고 row 키를 가진 경우
                                    if isinstance(rows_data[0], dict) and "row" in rows_data[0]:
                                        # row 안의 실제 데이터 추출
                                        rows = rows_data[0]["row"]
                                    elif isinstance(rows_data[0], dict) and rows_data[0].get("@class") == "list":
                                        # 실제 데이터는 두 번째 요소부터
                                        rows = rows_data[1:] if len(rows_data) > 1 else []
                                    else:
                                        rows = rows_data
                                else:
                                    rows = rows_data if isinstance(rows_data, list) else [rows_data]
                            else:
                                # body 자체가 데이터인 경우
                                rows = [body]
                        elif isinstance(body, list):
                            rows = body
                    # 케이스 2: body 직접 접근
                    elif "body" in data:
                        rows = data["body"]
                    # 케이스 3: row 직접 접근
                    elif "row" in data:
                        rows = data["row"]
                    # 케이스 4: localdata 구조
                    elif "localdata" in data:
                        rows = data["localdata"]
                    
                    # 리스트가 아닌 경우 리스트로 변환
                    if not isinstance(rows, list):
                        rows = [rows] if rows else []
                        
                    # 페이징 정보 확인 (JSON에서)
                    if "result" in data and "header" in data["result"] and "paging" in data["result"]["header"]:
                        paging = data["result"]["header"]["paging"]
                        total_count = int(paging.get("totalCount", 0))
                    else:
                        total_count = len(rows)
                
                print(f"[디버깅] 페이지 {page_index}에서 {len(rows)}개 행 발견")
                
                # 타겟 날짜와 일치하는 데이터만 필터링하고 필요한 필드만 추출
                page_data_count = 0
                for row in rows:
                    # row가 딕셔너리인지 확인
                    if not isinstance(row, dict):
                        continue
                        
                    # 인허가일자 확인 (다양한 날짜 형식 처리)
                    apv_date = str(row.get("apvPermYmd", ""))
                    if "-" in apv_date:
                        apv_date = apv_date.replace("-", "")
                    
                    # 첫 몇 개 데이터의 apvPermYmd 값 출력 (디버깅용)
                    if page_index == 1 and len(all_data) < 3:
                        print(f"[디버깅] 데이터 샘플 - apvPermYmd: {apv_date}, bplcNm: {row.get('bplcNm', 'N/A')}")
                    
                    if apv_date == target_date:
                        filtered_row = {field: row.get(field, "") for field in self.required_fields}
                        all_data.append(filtered_row)
                        page_data_count += 1
                        
                        # 첫 번째 매칭 데이터 출력
                        if page_data_count == 1:
                            print(f"\n[디버깅] 첫 번째 매칭 데이터:")
                            print(json.dumps(filtered_row, ensure_ascii=False, indent=2))
                
                print(f"[디버깅] 페이지 {page_index}에서 타겟 날짜와 일치하는 데이터: {page_data_count}개")
                print(f"[디버깅] 전체 데이터 수: {total_count}")
                
                # 더 이상 데이터가 없으면 종료
                if len(rows) < int(params["pageSize"]) or (total_count > 0 and page_index * int(params["pageSize"]) >= total_count):
                    break
                
                page_index += 1
                
                # 너무 많은 페이지 방지
                if page_index > 10:
                    print(f"[디버깅] 최대 페이지 수(10) 도달. 검색 중단.")
                    break
                
                # API 호출 간격 조절 (rate limiting 방지)
                time.sleep(0.5)
                
            except requests.exceptions.RequestException as e:
                print(f"[디버깅] API 호출 에러 (페이지 {page_index}): {e}")
                break
            except json.JSONDecodeError as e:
                print(f"[디버깅] JSON 파싱 에러 (페이지 {page_index}): {e}")
                print(f"[디버깅] 응답 내용: {response.text[:500]}...")
                break
            except Exception as e:
                print(f"[디버깅] 예기치 않은 에러 (페이지 {page_index}): {e}")
                import traceback
                traceback.print_exc()
                break
        
        return all_data
    
    def _remove_duplicates(self, data_list: List[Dict]) -> List[Dict]:
        """관리번호(mgtNo) 기준으로 중복 제거"""
        seen = set()
        unique_data = []
        
        for item in data_list:
            mgt_no = item.get("mgtNo")
            if mgt_no and mgt_no not in seen:
                seen.add(mgt_no)
                unique_data.append(item)
        
        return unique_data
    
    def fetch_all_facilities_by_date(self, target_date: str) -> Dict[str, List[Dict]]:
        """
        특정 날짜의 모든 의료기관 타입 데이터를 가져옵니다.
        
        Args:
            target_date: YYYYMMDD 또는 YYYY-MM-DD 형식의 타겟 날짜
            
        Returns:
            {'병원': [...], '의원': [...], '약국': [...]} 형태의 딕셔너리
        """
        results = {}
        
        for facility_type in self.service_ids.keys():
            print(f"\n{'='*60}")
            print(f"{self.emojis[facility_type]} {facility_type} 데이터 가져오는 중...")
            print(f"{'='*60}")
            facility_data = self.fetch_data_by_date(target_date, facility_type)
            results[facility_type] = facility_data
            print(f"\n[결과] {self.emojis[facility_type]} {facility_type}: {len(facility_data)}개 데이터 수집 완료")
        
        return results
    
    def print_summary_report(self, all_data: Dict[str, List[Dict]], target_date: str):
        """수집된 데이터의 요약 보고서를 출력합니다."""
        print(f"\n{'='*80}")
        print(f"📊 의료기관 데이터 수집 완료 보고서")
        print(f"🗓️  대상 날짜: {target_date}")
        print(f"{'='*80}")
        
        total_count = 0
        for facility_type, data in all_data.items():
            count = len(data)
            total_count += count
            print(f"\n{self.emojis[facility_type]} {facility_type}: {count}개")
            
            if data and count > 0:
                # 지역별 통계 (상위 3개 지역)
                regions = {}
                for item in data:
                    addr = item.get('rdnWhlAddr', '')
                    if addr:
                        region = addr.split()[0] if addr else "기타"
                        regions[region] = regions.get(region, 0) + 1
                
                if regions:
                    print(f"   📍 주요 지역:")
                    sorted_regions = sorted(regions.items(), key=lambda x: x[1], reverse=True)[:3]
                    for region, cnt in sorted_regions:
                        print(f"      - {region}: {cnt}개")
        
        print(f"\n{'='*80}")
        print(f"📊 총 {total_count}개 의료기관 데이터 수집 완료")
        print(f"{'='*80}\n")
    
    def save_to_json_with_summary(self, all_data: Dict[str, List[Dict]], target_date: str):
        """데이터를 JSON 파일로 저장하고 요약 정보를 포함합니다."""
        # 요약 정보 생성
        summary = {
            "collection_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "target_date": target_date,
            "statistics": {}
        }
        
        for facility_type, data in all_data.items():
            summary["statistics"][facility_type] = {
                "emoji": self.emojis[facility_type],
                "count": len(data),
                "data": data
            }
        
        # 파일 저장
        output_filename = f"medical_data_{target_date.replace('-', '')}.json"
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"💾 데이터가 {output_filename} 파일로 저장되었습니다.")
        return output_filename


# 사용 예시
if __name__ == "__main__":
    # API 클라이언트 생성
    api = MedicalDataAPI()
    
    # 테스트할 날짜
    target_date = "2025-06-20"
    
    print(f"\n🏥 한국 지역 공공데이터 의료기관 정보 수집기 🏥")
    print(f"{'='*80}")
    print(f"타겟 날짜: {target_date}")
    print(f"현재 시스템 날짜: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}")
    
    # 모든 의료기관 타입 데이터 가져오기
    all_data = api.fetch_all_facilities_by_date(target_date)
    
    # 요약 보고서 출력
    api.print_summary_report(all_data, target_date)
    
    # 각 타입별 샘플 데이터 출력
    print("\n📋 수집된 데이터 샘플:")
    print("="*80)
    
    for facility_type, data in all_data.items():
        if data:
            print(f"\n{api.emojis[facility_type]} {facility_type} 샘플 (최대 3개):")
            for i, item in enumerate(data[:3], 1):
                print(f"\n   [{i}] {item.get('bplcNm', 'N/A')}")
                print(f"       📍 주소: {item.get('rdnWhlAddr', 'N/A')}")
                print(f"       📅 인허가일: {item.get('apvPermYmd', 'N/A')}")
                print(f"       📞 전화: {item.get('siteTel', '없음')}")
    
    # JSON 파일로 저장
    print("\n" + "="*80)
    filename = api.save_to_json_with_summary(all_data, target_date)
    
    print(f"\n✅ 모든 작업이 완료되었습니다!")
    print(f"💡 저장된 파일을 확인하시려면: cat {filename}") 