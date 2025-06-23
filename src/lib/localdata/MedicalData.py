import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import xml.etree.ElementTree as ET


class MedicalDataAPI:
    """지역 공공데이터 API를 사용하여 의료기관 정보를 가져오는 클래스"""
    
    def __init__(self):
        self.base_url = "http://www.localdata.go.kr/platform/rest/TO0/openDataApi"
        self.auth_key = "cPf6Cnhiz8tSZsow6jIGOnyndwJnDO2gNz9qLUIYQ90="
        
        # 의료기관 타입별 서비스 ID
        self.service_ids = {
            "pharmacy": "01_01_06_P",  # 약국
            "clinic": "01_01_02_P",     # 의원
            "hospital": "01_01_01_P"    # 병원
        }
        
        # 추출할 필드 목록 - 전체 필드로 확장
        self.required_fields = [
            "mgtNo",         # 관리번호
            "opnSvcNm",      # 개방서비스명
            "bplcNm",        # 사업장명
            "rdnWhlAddr",    # 도로명주소
            "apvPermYmd",    # 인허가일자
            "uptaeNm",       # 업태구분명
            "siteTel",       # 전화번호
            "trdStateGbn",   # 영업상태구분
            "trdStateNm",    # 영업상태명
            "dcbYmd",        # 폐업일자
            "clgStdt",       # 휴업시작일자
            "clgEnddt",      # 휴업종료일자
            "ropnYmd",       # 재개업일자
            "lastModTs",     # 최종수정타임스탬프
            "updateGbn",     # 데이터갱신구분
            "updateDt"       # 데이터갱신일자
        ]
    
    def get_medical_data_by_approval_date(self, target_date: str) -> Dict[str, List[Dict]]:
        """
        인허가일(apvPermYmd) 기준으로 특정 날짜의 의료기관 데이터를 가져옵니다.
        다양한 방법으로 데이터를 수집하여 최대한 많은 데이터를 확보합니다.
        
        Args:
            target_date: 찾고자 하는 인허가일 (YYYYMMDD 형식)
            
        Returns:
            Dict[str, List[Dict]]: 의료기관 타입별 데이터 딕셔너리
        """
        all_data = {
            "pharmacy": [],
            "clinic": [],
            "hospital": []
        }
        
        print(f"\n📅 인허가일 {target_date[:4]}년 {target_date[4:6]}월 {target_date[6:]}일 의료기관 데이터 조회\n")
        
        emojis = {
            "pharmacy": "💊",
            "clinic": "🏥", 
            "hospital": "🏨"
        }
        
        for facility_type, service_id in self.service_ids.items():
            emoji = emojis[facility_type]
            print(f"{emoji} {facility_type} 데이터 조회 중...")
            
            combined_data = []
            
            # 1. bgnYmd/endYmd로 정확한 날짜 조회
            print(f"  - bgnYmd/endYmd 파라미터로 조회 (정확한 날짜)...", end='', flush=True)
            data1 = self._fetch_data(service_id, target_date)
            print(f" {len(data1)}개")
            combined_data.extend(data1)
            
            # 2. 더 넓은 범위로 조회 (전후 30일)
            print(f"  - 넓은 날짜 범위로 조회 중...")
            date_obj = datetime.strptime(target_date, "%Y%m%d")
            start_date = (date_obj - timedelta(days=30)).strftime("%Y%m%d")
            end_date = (date_obj + timedelta(days=30)).strftime("%Y%m%d")
            
            print(f"    범위: {start_date} ~ {end_date}", end='', flush=True)
            data2 = self._fetch_data_range(service_id, start_date, end_date)
            print(f" {len(data2)}개")
            combined_data.extend(data2)
            
            # 3. lastModTsBgn/lastModTsEnd로 최근 수정된 데이터 조회
            print(f"  - lastModTsBgn/lastModTsEnd 파라미터로 조회...", end='', flush=True)
            # 최근 30일간 수정된 데이터 조회
            for days_ago in range(0, 30):
                check_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y%m%d")
                data_lastmod = self._fetch_data_with_lastmod(service_id, check_date)
                if data_lastmod:
                    combined_data.extend(data_lastmod)
            print(f" {len([d for d in combined_data if 'lastMod' in str(d)])}개")
            
            # 4. 중복 제거
            unique_data = self._deduplicate_by_mgtno(combined_data)
            
            # 5. apvPermYmd가 target_date인 것만 필터링
            filtered_data = []
            for item in unique_data:
                apv_date = item.get('apvPermYmd', '')
                
                # 다양한 날짜 형식 처리
                if apv_date:
                    # 하이픈, 슬래시, 공백 등 제거
                    apv_date_clean = apv_date.replace('-', '').replace('/', '').replace(' ', '').strip()
                    
                    # YYYYMMDD 형식으로 8자리만 추출
                    if len(apv_date_clean) >= 8:
                        apv_date_clean = apv_date_clean[:8]
                    
                    # 날짜 비교
                    if apv_date_clean == target_date:
                        filtered_data.append(item)
                        # 디버깅: 매칭된 항목 출력
                        if len(filtered_data) <= 3:  # 처음 3개만 출력
                            print(f"\n  ✓ 매칭: {item.get('bplcNm', 'N/A')} - {apv_date}")
            
            all_data[facility_type] = filtered_data
            print(f"  ✅ 총 {len(filtered_data)}개 (인허가일 {target_date})")
            
            # 디버깅: 필터링되기 전 데이터에서 apvPermYmd 확인
            if len(filtered_data) == 0 and len(unique_data) > 0:
                print(f"  ⚠️  디버깅: 전체 {len(unique_data)}개 중 인허가일 매칭 실패")
                print(f"  샘플 apvPermYmd 값들:")
                for i, item in enumerate(unique_data[:5]):
                    apv = item.get('apvPermYmd', 'N/A')
                    print(f"    - {apv} | {item.get('bplcNm', 'N/A')}")
                    if apv and apv != 'N/A':
                        clean = apv.replace('-', '').replace('/', '').replace(' ', '').strip()[:8]
                        print(f"      정제 후: {clean} vs 목표: {target_date}")
        
        return all_data
    
    def _fetch_data_range(self, opn_svc_id: str, start_date: str, end_date: str,
                         page_size: int = 100) -> List[Dict]:
        """
        날짜 범위로 데이터를 가져옵니다.
        
        Args:
            opn_svc_id: 개방서비스ID
            start_date: 시작 날짜 (YYYYMMDD 형식)
            end_date: 종료 날짜 (YYYYMMDD 형식)
            page_size: 페이지당 데이터 개수
            
        Returns:
            List[Dict]: 해당 조건의 데이터 리스트
        """
        all_results = []
        page_index = 1
        
        while True:
            params = {
                "authKey": self.auth_key,
                "opnSvcId": opn_svc_id,
                "bgnYmd": start_date,
                "endYmd": end_date,
                "pageIndex": str(page_index),
                "pageSize": str(page_size),
                "resultType": "xml"
            }
            
            try:
                response = requests.get(self.base_url, params=params, timeout=30)
                response.raise_for_status()
                
                # XML 파싱
                parsed_data = self._parse_xml_response(response.text)
                
                if not parsed_data:
                    break
                
                # 모든 필드를 그대로 유지
                all_results.extend(parsed_data)
                
                # 더 이상 데이터가 없으면 종료
                if len(parsed_data) < page_size:
                    break
                    
                page_index += 1
                
            except Exception as e:
                print(f"\n  범위 조회 오류: {e}")
                break
        
        return all_results
    
    def _deduplicate_by_mgtno(self, data_list: List[Dict]) -> List[Dict]:
        """
        mgtNo를 기준으로 중복을 제거합니다.
        
        Args:
            data_list: 중복 제거할 데이터 리스트
            
        Returns:
            List[Dict]: 중복이 제거된 데이터 리스트
        """
        unique_data = {}
        for item in data_list:
            mgt_no = item.get('mgtNo', '')
            if mgt_no and mgt_no not in unique_data:
                unique_data[mgt_no] = item
        return list(unique_data.values())
    
    def _fetch_data_with_lastmod(self, opn_svc_id: str, date: str, 
                                page_size: int = 100) -> List[Dict]:
        """
        lastModTsBgn/lastModTsEnd 파라미터를 사용하여 데이터를 가져옵니다.
        
        Args:
            opn_svc_id: 개방서비스ID
            date: 검색할 날짜 (YYYYMMDD 형식)
            page_size: 페이지당 데이터 개수
            
        Returns:
            List[Dict]: 해당 조건의 데이터 리스트
        """
        all_results = []
        page_index = 1
        
        # 타임스탬프 형식으로 변환 (시작과 끝)
        timestamp_begin = f"{date}000000"  # YYYYMMDDHHMMSS
        timestamp_end = f"{date}235959"
        
        while True:
            params = {
                "authKey": self.auth_key,
                "opnSvcId": opn_svc_id,
                "lastModTsBgn": timestamp_begin,
                "lastModTsEnd": timestamp_end,
                "pageIndex": str(page_index),
                "pageSize": str(page_size),
                "resultType": "xml"
            }
            
            try:
                response = requests.get(self.base_url, params=params, timeout=30)
                response.raise_for_status()
                
                # 디버깅: 첫 페이지에서만 응답 확인
                if page_index == 1:
                    print(f"\n    lastMod 응답 상태: {response.status_code}")
                
                # XML 파싱
                parsed_data = self._parse_xml_response(response.text)
                
                if not parsed_data:
                    break
                
                # 모든 필드를 그대로 유지
                all_results.extend(parsed_data)
                
                # 더 이상 데이터가 없으면 종료
                if len(parsed_data) < page_size:
                    break
                    
                page_index += 1
                
            except requests.exceptions.RequestException as e:
                if page_index == 1:
                    print(f"\n  lastMod API 호출 오류: {e}")
                break
            except ET.ParseError as e:
                if page_index == 1:
                    print(f"\n  lastMod XML 파싱 오류: {e}")
                break
            except Exception as e:
                if page_index == 1:
                    print(f"\n  lastMod 예상치 못한 오류: {e}")
                break
        
        return all_results
    
    def get_today_medical_data(self) -> Dict[str, List[Dict]]:
        """
        오늘 날짜에 인허가된 모든 의료기관 데이터를 가져옵니다.
        
        Returns:
            Dict[str, List[Dict]]: 의료기관 타입별 데이터 딕셔너리
        """
        today = datetime.now().strftime("%Y%m%d")
        
        all_data = {
            "pharmacy": [],
            "clinic": [],
            "hospital": []
        }
        
        print(f"\n📅 {today[:4]}년 {today[4:6]}월 {today[6:]}일 의료기관 데이터 조회\n")
        
        emojis = {
            "pharmacy": "💊",
            "clinic": "🏥", 
            "hospital": "🏨"
        }
        
        for facility_type, service_id in self.service_ids.items():
            emoji = emojis[facility_type]
            print(f"{emoji} {facility_type} 데이터 조회 중...", end='', flush=True)
            data = self._fetch_data(service_id, today)
            all_data[facility_type] = data
            print(f" ✅ {len(data)}개")
        
        return all_data
    
    def _fetch_data(self, opn_svc_id: str, date: str, 
                   page_size: int = 100) -> List[Dict]:
        """
        특정 서비스 ID와 날짜에 해당하는 데이터를 가져옵니다.
        
        Args:
            opn_svc_id: 개방서비스ID
            date: 검색할 날짜 (YYYYMMDD 형식)
            page_size: 페이지당 데이터 개수
            
        Returns:
            List[Dict]: 해당 조건의 데이터 리스트
        """
        all_results = []
        page_index = 1
        
        while True:
            params = {
                "authKey": self.auth_key,
                "opnSvcId": opn_svc_id,
                "bgnYmd": date,
                "endYmd": date,
                "pageIndex": str(page_index),
                "pageSize": str(page_size),
                # XML로 받아서 파싱
                "resultType": "xml"
            }
            
            try:
                # 디버깅: 첫 페이지에서만 URL 출력
                if page_index == 1:
                    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
                    print(f"\n    API URL: {self.base_url}?{query_string[:100]}...")
                
                response = requests.get(self.base_url, params=params, timeout=30)
                response.raise_for_status()
                
                # XML 파싱
                parsed_data = self._parse_xml_response(response.text)
                
                if not parsed_data:
                    break
                
                # 모든 필드를 그대로 유지
                all_results.extend(parsed_data)
                
                # 더 이상 데이터가 없으면 종료
                if len(parsed_data) < page_size:
                    break
                    
                page_index += 1
                
            except requests.exceptions.RequestException as e:
                print(f"\n  API 호출 오류: {e}")
                break
            except ET.ParseError as e:
                print(f"\n  XML 파싱 오류: {e}")
                break
            except Exception as e:
                print(f"\n  예상치 못한 오류: {e}")
                break
        
        return all_results
    
    def _parse_xml_response(self, xml_text: str) -> List[Dict]:
        """
        XML 응답을 파싱하여 딕셔너리 리스트로 변환합니다.
        
        Args:
            xml_text: XML 형식의 응답 텍스트
            
        Returns:
            List[Dict]: 파싱된 데이터 리스트
        """
        try:
            # 디버깅: XML 응답의 첫 1000자 출력
            if len(xml_text) > 0 and "<?xml" in xml_text:
                print(f"\n  XML 응답 샘플: {xml_text[:500]}...")
            
            root = ET.fromstring(xml_text)
            
            # 헤더 정보 확인
            header = root.find('.//header')
            if header is not None:
                result_code = header.find('resultCode')
                result_msg = header.find('resultMsg')
                if result_code is not None and result_msg is not None:
                    print(f"\n  API 응답: {result_code.text} - {result_msg.text}")
            
            # 데이터 리스트 찾기 - 다양한 태그명 시도
            items = []
            for tag_name in ['row', 'item', 'result', 'data']:
                items = root.findall(f'.//{tag_name}')
                if items:
                    print(f"\n  데이터 태그 '{tag_name}'에서 {len(items)}개 항목 발견")
                    break
            
            # body 안의 rows 찾기
            if not items:
                body = root.find('.//body')
                if body is not None:
                    rows = body.find('rows')
                    if rows is not None:
                        items = rows.findall('row')
                        print(f"\n  body/rows/row에서 {len(items)}개 항목 발견")
            
            results = []
            for i, item in enumerate(items):
                data = {}
                # 모든 하위 요소를 딕셔너리로 변환
                for child in item:
                    # 텍스트가 있는 경우만 저장
                    if child.text is not None:
                        data[child.tag] = child.text.strip()
                    else:
                        data[child.tag] = ""
                
                # 디버깅: 첫 번째 항목의 모든 필드 출력
                if i == 0 and data:
                    print(f"\n  첫 번째 데이터 항목의 필드들:")
                    for key, value in list(data.items())[:10]:  # 처음 10개 필드만
                        print(f"    {key}: {value}")
                    if 'apvPermYmd' in data:
                        print(f"    apvPermYmd: {data['apvPermYmd']}")
                
                results.append(data)
            
            return results
            
        except ET.ParseError as e:
            print(f"\n  XML 파싱 오류: {e}")
            print(f"  응답 시작 부분: {xml_text[:200] if xml_text else 'Empty response'}")
            return []
        except Exception as e:
            print(f"\n  XML 파싱 중 예상치 못한 오류: {e}")
            return []
    
    def save_to_file(self, data: Dict[str, List[Dict]], 
                    filename: Optional[str] = None) -> str:
        """
        수집한 데이터를 JSON 파일로 저장합니다.
        
        Args:
            data: 저장할 데이터
            filename: 저장할 파일명 (기본값: medical_data_YYYYMMDD.json)
            
        Returns:
            str: 저장된 파일 경로
        """
        if filename is None:
            today = datetime.now().strftime("%Y%m%d")
            filename = f"medical_data_{today}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return filename
    
    def print_summary(self, data: Dict[str, List[Dict]]) -> None:
        """
        수집한 데이터의 요약 정보를 출력합니다.
        
        Args:
            data: 출력할 데이터
        """
        # 이모지 설정
        emojis = {
            "pharmacy": "💊",
            "clinic": "🏥",
            "hospital": "🏨"
        }
        
        facility_names = {
            "pharmacy": "약국",
            "clinic": "의원",
            "hospital": "병원"
        }
        
        print("\n" + "="*60)
        print("🏥 의료기관 데이터 수집 결과 🏥")
        print("="*60)
        
        total_count = 0
        
        for facility_type, items in data.items():
            count = len(items)
            total_count += count
            emoji = emojis[facility_type]
            name = facility_names[facility_type]
            
            print(f"\n{emoji} {name} ({count}개)")
            print("-" * 50)
            
            if count > 0:
                # 최대 5개만 출력
                display_count = min(count, 5)
                for i, item in enumerate(items[:display_count], 1):
                    print(f"\n  {i}. {item.get('bplcNm', 'N/A')}")
                    print(f"     📍 주소: {item.get('rdnWhlAddr', 'N/A')}")
                    print(f"     📅 인허가일: {item.get('apvPermYmd', 'N/A')}")
                    if item.get('trdStateNm'):
                        print(f"     🏷️  영업상태: {item.get('trdStateNm', 'N/A')}")
                    print(f"     📞 전화: {item.get('siteTel', 'N/A')}")
                
                if count > display_count:
                    print(f"\n  ... 외 {count - display_count}개 더 있음")
            else:
                print(f"  {emoji} 데이터가 없습니다.")
        
        print("\n" + "="*60)
        print(f"📊 총 {total_count}개의 의료기관 데이터를 수집했습니다.")
        print("="*60 + "\n")
    
    def get_specific_date_data(self, date: str) -> Dict[str, List[Dict]]:
        """
        특정 날짜의 의료기관 데이터를 가져옵니다.
        
        Args:
            date: 검색할 날짜 (YYYYMMDD 형식)
            
        Returns:
            Dict[str, List[Dict]]: 의료기관 타입별 데이터 딕셔너리
        """
        all_data = {
            "pharmacy": [],
            "clinic": [],
            "hospital": []
        }
        
        print(f"{date[:4]}년 {date[4:6]}월 {date[6:]}일 데이터 조회")
        
        emojis = {
            "pharmacy": "💊",
            "clinic": "🏥",
            "hospital": "🏨"
        }
        
        for facility_type, service_id in self.service_ids.items():
            emoji = emojis[facility_type]
            print(f"  {emoji} {facility_type} 조회 중...", end='', flush=True)
            data = self._fetch_data(service_id, date)
            all_data[facility_type] = data
            print(f" {len(data)}개")
        
        return all_data
    
    def get_recent_data(self, days_back: int = 7) -> Dict[str, Dict[str, List[Dict]]]:
        """
        최근 N일간의 의료기관 데이터를 가져옵니다.
        
        Args:
            days_back: 확인할 과거 일수 (기본값: 7일)
            
        Returns:
            Dict[str, Dict[str, List[Dict]]]: 날짜별, 의료기관 타입별 데이터
        """
        from datetime import timedelta
        
        all_date_data = {}
        base_date = datetime.now()
        
        print(f"최근 {days_back}일간의 의료기관 데이터를 조회합니다...")
        
        for i in range(days_back):
            check_date = base_date - timedelta(days=i)
            date_str = check_date.strftime("%Y%m%d")
            
            print(f"\n=== {date_str} 데이터 조회 ===")
            data = self.get_specific_date_data(date_str)
            
            # 데이터가 있는 날짜만 저장
            total_count = sum(len(items) for items in data.values())
            if total_count > 0:
                all_date_data[date_str] = data
                print(f"{date_str}: 총 {total_count}개 발견")
        
        return all_date_data


# 실행 예제
if __name__ == "__main__":
    # API 인스턴스 생성
    api = MedicalDataAPI()
    
    # 인허가일 기준 6월 17일 데이터 찾기
    print("🔍 인허가일 기준 2025년 6월 17일 의료기관 데이터 조회")
    print("="*60)
    
    # 2025년 6월 17일로 조회 (날짜 형식에 맞게 수정해주세요)
    target_date = "20250617"  # YYYYMMDD 형식
    medical_data = api.get_medical_data_by_approval_date(target_date)
    
    # 결과 요약 출력
    api.print_summary(medical_data)
    
    # 데이터가 있으면 파일로 저장
    total_count = sum(len(items) for items in medical_data.values())
    if total_count > 0:
        saved_file = api.save_to_file(medical_data, f"medical_data_apv_{target_date}.json")
        print(f"\n💾 데이터가 '{saved_file}' 파일로 저장되었습니다.")
    else:
        print(f"\n⚠️  인허가일 {target_date}에 해당하는 데이터가 없습니다.")
        
        # 다른 날짜로 추가 검색 시도
        print("\n🔄 최근 며칠간의 인허가일 데이터를 확인합니다...")
        for days_ago in range(1, 8):
            check_date = datetime.strptime(target_date, "%Y%m%d") - timedelta(days=days_ago)
            check_date_str = check_date.strftime("%Y%m%d")
            
            print(f"\n📅 인허가일 {check_date_str} 확인 중...")
            data = api.get_medical_data_by_approval_date(check_date_str)
            count = sum(len(items) for items in data.values())
            
            if count > 0:
                print(f"✅ {count}개의 데이터 발견!")
                api.print_summary(data)
                break
