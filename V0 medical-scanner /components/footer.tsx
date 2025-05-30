export default function Footer() {
  return (
    <footer className="bg-gray-100 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-500 text-sm space-y-2">
          <div className="flex flex-wrap justify-center gap-4">
            <span>개인정보처리방침</span>
            <span>이용약관</span>
            <span>이메일</span>
            <span>제휴문의</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <span>(주)선데이씽커 대표 박재현</span>
            <span>서울시 강남구 논현로 85길 59</span>
            <span>개인정보관리 책임자 최창영</span>
            <span>official@pandarank.net</span>
            <span>전화번호 02-6381-0202</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <span>사업자 등록번호 114-88-01873</span>
            <span>통신판매업 신고 2020-서울강남-00554</span>
            <span>©2020-2025 sundaythinker. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
