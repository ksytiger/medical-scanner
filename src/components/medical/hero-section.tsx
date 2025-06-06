/**
 * @file hero-section.tsx
 * @description 의료기관 스캐너 Hero Section 컴포넌트
 * 
 * 개원스캐너의 메인 타이틀과 설명을 표시하는 섹션
 * 모바일 우선 반응형 디자인으로 최적화
 */

export default function HeroSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-600 to-blue-700">
      <div className="container mx-auto px-6 sm:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white leading-tight">
            개원스캐너, 가장 빠른<br className="sm:hidden" /> 신규 개원 정보
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto">
            신규 개원 의료기관 정보를 가장 빠르게 제공하는<br className="hidden sm:block" />
            데이터베이스 플랫폼
          </p>
        </div>
      </div>
    </section>
  )
} 