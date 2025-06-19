/**
 * @file hero-section.tsx
 * @description 의료기관 스캐너 Hero Section 컴포넌트
 *
 * 개원스캐너의 메인 타이틀과 설명을 표시하는 섹션
 * 모바일 우선 반응형 디자인으로 최적화
 * 모던한 애니메이션과 인터랙션 포함
 */

"use client";

import { motion, Variants } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function HeroSection() {
  // 애니메이션 variants 정의
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 0.61, 0.36, 1], // 부드러운 easing
      },
    },
  };

  const badgeVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      filter: "blur(10px)",
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94], // easeOut cubic-bezier
      },
    },
  };

  return (
    <section className="relative overflow-hidden">
      {/* 배경 그라디언트 애니메이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern id=%22grid%22 width=%2260%22 height=%2260%22 patternUnits=%22userSpaceOnUse%22%3E%3Cpath d=%22M 60 0 L 0 0 0 60%22 fill=%22none%22 stroke=%22white%22 stroke-width=%220.5%22 opacity=%220.1%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23grid)%22/%3E%3C/svg%3E')]" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
      </div>

      {/* 메인 콘텐츠 */}
      <motion.div
        className="relative z-10 py-12 sm:py-16 lg:py-20"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* 배지 */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium"
              variants={badgeVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4" />
              <span>실시간 데이터 업데이트</span>
            </motion.div>

            {/* 메인 타이틀 */}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white"
              variants={itemVariants}
            >
              <span className="block mb-2 sm:mb-3">
                <span className="inline-block bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  개원스캐너
                </span>
              </span>
              <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                가장 빠른
                <br className="sm:hidden" />
                <span className="relative inline-block ml-2 sm:ml-3">
                  <span className="relative z-10">신규 개원</span>
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-3 sm:h-4 bg-yellow-400/30 -rotate-1 rounded"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                  />
                </span>
                정보
              </span>
            </motion.h1>

            {/* 서브 텍스트 */}
            <motion.p
              className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              <span className="block sm:inline">신규 개원 의료기관 정보를</span>
              <span className="block sm:inline sm:ml-1">
                가장 빠르게 제공하는
              </span>
              <span className="block mt-1 sm:mt-0 font-semibold text-white">
                데이터베이스 플랫폼
              </span>
            </motion.p>

            {/* CTA 버튼 */}
            <motion.div
              className="flex justify-center items-center pt-4"
              variants={itemVariants}
            >
              <motion.button
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-700 font-semibold rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  document.getElementById("database")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                의료기관 찾기
              </motion.button>
            </motion.div>

            {/* 통계 정보 */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 pt-8 sm:pt-12"
              variants={itemVariants}
            >
              {[
                { value: "10K+", label: "등록된 기관" },
                { value: "24h", label: "실시간 업데이트" },
                { value: "99.9%", label: "정확도" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base text-white/70">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* 하단 웨이브 효과 */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 sm:h-20 lg:h-24"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
