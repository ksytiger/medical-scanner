/**
 * @file info-callout.tsx
 * @description 의료기관 스캐너 정보 안내 컴포넌트
 * 
 * 데이터 출처, 특성, 업데이트 주기 등의 정보를 표시하는 섹션
 * 모바일 우선 반응형 디자인으로 최적화
 */

"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"

export default function InfoCallout() {
  const [rotation, setRotation] = useState(0)
  const today = new Date()

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 10) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-50 border-l-4 border-[#1B59FA] rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mb-6">
            <div className="flex items-center bg-gray-800 text-white text-sm px-4 sm:px-5 py-3 rounded-md w-fit">
              <div className="relative w-4 h-4 mr-3">
                <div
                  className="absolute inset-0 border-2 border-transparent border-r-white rounded-full"
                  style={{ transform: `rotate(${rotation}deg)` }}
                ></div>
              </div>
              <span>포털 DB 수집중</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {format(today, "MM월 dd일")} UPDATE
              </h2>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">데이터 출처</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                행정안전부·국세청 등 공공 인허가 데이터 기반 병의원 개원 정보를 정리합니다.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">데이터 특성</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                인허가 → 개원 사이 시차가 존재하므로, 최근 인허가는 오픈 예정 의료기관일 가능성이 높습니다.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">업데이트 주기</h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                자체 크롤러로 발급 후 2일 이내 최신 정보를 수집하여 게시합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 