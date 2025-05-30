/**
 * @file hero-section.tsx
 * @description 의료기관 스캐너 Hero Section 컴포넌트
 * 
 * 개원스캐너의 메인 타이틀과 설명을 표시하는 섹션
 */

export default function HeroSection() {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-blue-600 to-blue-700">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            개원스캐너, 가장 빠른 신규 개원 정보
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-10">
            신규 개원 의료기관 정보를 가장 빠르게 제공하는 데이터베이스 플랫폼
          </p>
        </div>
      </div>
    </section>
  )
} 