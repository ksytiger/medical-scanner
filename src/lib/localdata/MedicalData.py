import requests
from datetime import datetime
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
        
        # 추출할 필드 목록
        self.required_fields = [
            "mgtNo",         # 관리번호
            "opnSvcNm",      # 개방서비스명
            "bplcNm",        # 사업장명
            "rdnWhlAddr",    # 도로명주소
            "apvPermYmd",    # 인허가일자
            "uptaeNm",       # 업태구분명
            "siteTel"        # 전화번호
        ]
    
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
                response = requests.get(self.base_url, params=params, timeout=30)
                response.raise_for_status()
                
                # XML 파싱
                parsed_data = self._parse_xml_response(response.text)
                
                if not parsed_data:
                    break
                
                # 필요한 필드만 추출
                filtered_data = []
                for item in parsed_data:
                    filtered_item = {}
                    for field in self.required_fields:
                        filtered_item[field] = item.get(field, "")
                    filtered_data.append(filtered_item)
                
                all_results.extend(filtered_data)
                
                # 더 이상 데이터가 없으면 종료
                if len(parsed_data) < page_size:
                    break
                    
                page_index += 1
                print(f"  페이지 {page_index - 1} 처리 완료: {len(parsed_data)}개")
                
            except requests.exceptions.RequestException as e:
                print(f"  API 호출 오류: {e}")
                break
            except ET.ParseError as e:
                print(f"  XML 파싱 오류: {e}")
                break
            except Exception as e:
                print(f"  예상치 못한 오류: {e}")
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
            # 디버깅: XML 응답의 첫 500자 출력
            # if len(xml_text) > 0:
            #     print(f"  응답 샘플: {xml_text[:500]}...")
            
            root = ET.fromstring(xml_text)
            
            # 헤더 정보 확인
            header = root.find('.//header')
            if header is not None:
                result_code = header.find('resultCode')
                result_msg = header.find('resultMsg')
                if result_code is not None and result_msg is not None:
                    # print(f"  API 응답: {result_code.text} - {result_msg.text}")
                    pass
            
            # 데이터 리스트 찾기 (일반적으로 'row' 또는 'item' 태그)
            items = root.findall('.//row')
            if not items:
                items = root.findall('.//item')
            
            results = []
            for item in items:
                data = {}
                # 모든 하위 요소를 딕셔너리로 변환
                for child in item:
                    data[child.tag] = child.text if child.text else ""
                results.append(data)
            
            return results
            
        except Exception as e:
            print(f"  XML 파싱 중 오류 발생: {e}")
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
                for i, item in enumerate(items, 1):
                    print(f"\n  {i}. {item.get('bplcNm', 'N/A')}")
                    print(f"     📍 주소: {item.get('rdnWhlAddr', 'N/A')}")
                    print(f"     📅 인허가일: {item.get('apvPermYmd', 'N/A')}")
                    print(f"     🏷️  업태: {item.get('uptaeNm', 'N/A')}")
                    print(f"     📞 전화: {item.get('siteTel', 'N/A')}")
                    print(f"     🆔 관리번호: {item.get('mgtNo', 'N/A')}")
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
    
    # 오늘 날짜의 데이터 가져오기
    print("🔍 오늘 날짜 데이터 조회 중...")
    print("="*60)
    medical_data = api.get_today_medical_data()
    
    # 결과 요약 출력
    api.print_summary(medical_data)
    
    # 오늘 데이터가 없다면 최근 7일 데이터 확인
    total_today = sum(len(items) for items in medical_data.values())
    if total_today == 0:
        print("\n⚠️  오늘 날짜에는 데이터가 없습니다.")
        print("🔄 최근 7일간의 데이터를 확인합니다...\n")
        
        recent_data = api.get_recent_data(days_back=7)
        
        if recent_data:
            print("\n📅 최근 7일 중 데이터가 있는 날짜:")
            for date in sorted(recent_data.keys(), reverse=True):
                total = sum(len(items) for items in recent_data[date].values())
                print(f"  • {date}: {total}개")
            
            # 가장 최근 데이터가 있는 날짜의 데이터 출력
            latest_date = sorted(recent_data.keys(), reverse=True)[0]
            latest_data = recent_data[latest_date]
            
            print(f"\n🌟 가장 최근({latest_date}) 데이터를 표시합니다:")
            api.print_summary(latest_data)
            
            # 파일 저장 여부 확인
            # saved_file = api.save_to_file(latest_data, f"medical_data_{latest_date}.json")
            # print(f"\n💾 데이터가 '{saved_file}' 파일로 저장되었습니다.")
        else:
            print("\n❌ 최근 7일간 데이터가 없습니다.")
    
    # 특정 날짜의 데이터를 가져오고 싶다면:
    # specific_data = api.get_specific_date_data("20250621")
    # api.print_summary(specific_data)
