/**
 * @file page.tsx
 * @description 의료기관 스캐너 메인 페이지
 * 
 * 신규 개원 의료기관 정보를 검색하고 필터링할 수 있는 플랫폼
 * 
 * 주요 기능:
 * - Hero Section: 서비스 소개
 * - Info Callout: 데이터 출처 및 특성 안내
 * - Database Section: 검색, 필터링, 데이터 테이블
 * 
 * 추후 개선사항:
 * - Supabase 실제 데이터베이스 연동
 * - 사용자 인증 연동
 * - 고급 필터 기능 추가
 */

import { Navbar } from "@/components/nav/navbar"
import HeroSection from "@/components/medical/hero-section"
import InfoCallout from "@/components/medical/info-callout"
import DatabaseSection from "@/components/medical/database-section"

export default function MedicalScannerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      
      <main className="flex-1">
        <HeroSection />
        <InfoCallout />
        <DatabaseSection />
      </main>
    </div>
  )
} 