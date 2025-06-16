/**
 * @file filter-bar.tsx
 * @description 의료기관 스캐너 필터바 컴포넌트
 * 
 * 날짜 범위, 진료과목(단일 선택), 지역, 연락처 유무, 키워드 등의 필터 기능을 제공
 * 진료과목은 깔끔한 드롭다운 형태로 한번에 하나만 선택 가능
 * 모바일에서는 접힌 상태로 시작하며, 토글로 열고 닫을 수 있음
 */

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Filter, ChevronDown, ChevronUp, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { FilterState } from "@/lib/medical/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// 요청된 카테고리 목록 (논리적 순서로 정렬)
const categories = [
  // 기본 분류
  "의원",
  "약국", 
  "병원",
  
  // 전문 진료과
  "피부과",
  "성형외과", 
  "안과",
  "치과의원",
  "한의원",
  "정형외과",
  "신경외과",
  "신경과",
  "내과",
  "이비인후과",
  "정신건강의학과",
  "산부인과",
  "소아청소년과",
  "가정의학과",
  "비뇨기과",
  "재활의학과",
  "마취통증의학과",
  
  // 기타 분류
  "기타의원",
  "보건기관",
  "종합병원",
  "요양병원",
  "한방병원",
  "치과병원",
  "정신병원"
]

const regions = {
  서울: [
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
  ],
  부산: [
    "강서구",
    "금정구",
    "남구",
    "동구",
    "동래구",
    "부산진구",
    "북구",
    "사상구",
    "사하구",
    "서구",
    "수영구",
    "연제구",
    "영도구",
    "중구",
    "해운대구",
  ],
  인천: ["계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "중구"],
  대구: ["남구", "달서구", "동구", "북구", "서구", "수성구", "중구"],
  광주: ["광산구", "남구", "동구", "북구", "서구"],
  대전: ["대덕구", "동구", "서구", "유성구", "중구"],
  울산: ["남구", "동구", "북구", "중구", "울주군"],
  경기: [
    "고양시",
    "과천시",
    "광명시",
    "광주시",
    "구리시",
    "군포시",
    "김포시",
    "남양주시",
    "동두천시",
    "부천시",
    "성남시",
    "수원시",
    "시흥시",
    "안산시",
    "안성시",
    "안양시",
    "양주시",
    "여주시",
    "오산시",
    "용인시",
    "의왕시",
    "의정부시",
    "이천시",
    "파주시",
    "평택시",
    "포천시",
    "하남시",
    "화성시",
  ],
}

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)
  const [availableGugun, setAvailableGugun] = useState<string[]>([])
  
  // 모바일 필터바 접힘/펼침 상태
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  useEffect(() => {
    if (localFilters.region.sido && regions[localFilters.region.sido as keyof typeof regions]) {
      setAvailableGugun(regions[localFilters.region.sido as keyof typeof regions])
    } else {
      setAvailableGugun([])
    }
  }, [localFilters.region.sido])

  const handleCategoryChange = (category: string) => {
    setLocalFilters({
      ...localFilters,
      selectedCategory: category === "전체" ? null : category,
    })
  }

  const handleSidoChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      region: { sido: value, gugun: "전체" },
    })
  }

  const handleGugunChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      region: { ...localFilters.region, gugun: value },
    })
  }

  const handleContactToggle = (checked: boolean) => {
    setLocalFilters({
      ...localFilters,
      hasContact: checked,
    })
  }

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalFilters({
      ...localFilters,
      keyword: e.target.value,
    })
  }

  const handleKeywordSearch = () => {
    applyFilters()
  }

  const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyFilters()
    }
  }

  const applyFilters = () => {
    onFilterChange(localFilters)
  }

  const resetFilters = () => {
    const resetState: FilterState = {
      dateRange: { from: new Date("2023-01-01"), to: new Date() },
      selectedCategory: null,
      region: { sido: "전체", gugun: "전체" },
      hasContact: false,
      keyword: "",
    }
    setLocalFilters(resetState)
    onFilterChange(resetState)
  }

  const getActiveFilterCount = () => {
    let count = 0
    
    // 날짜 범위가 기본값이 아닌 경우
    const defaultFrom = new Date("2023-01-01")
    const defaultTo = new Date()
    if (localFilters.dateRange.from.getTime() !== defaultFrom.getTime() || 
        localFilters.dateRange.to.getTime() !== defaultTo.getTime()) {
      count++
    }
    
    // 카테고리 선택된 경우
    if (localFilters.selectedCategory) {
      count++
    }
    
    // 지역 선택된 경우
    if (localFilters.region.sido && localFilters.region.sido !== "전체") {
      count++
    }
    
    // 연락처 필터 활성화된 경우
    if (localFilters.hasContact) {
      count++
    }
    
    return count
  }

  const getFilterSummary = () => {
    const summaryParts: string[] = []
    
    if (localFilters.selectedCategory) {
      summaryParts.push(localFilters.selectedCategory)
    }
    
    if (localFilters.region.sido && localFilters.region.sido !== "전체") {
      summaryParts.push(localFilters.region.sido)
    }
    
    if (localFilters.hasContact) {
      summaryParts.push("연락처 있음")
    }
    
    return summaryParts.length > 0 ? summaryParts.join(", ") : "상세 필터를 설정해보세요"
  }

  return (
    <div className="space-y-4">
      {/* 키워드 검색 - 모바일에서만 보이는 영역 */}
      <div className="space-y-2 lg:hidden">
        <Label className="text-sm font-medium text-gray-700">병원명 검색</Label>
        <div className="flex gap-2">
          <Input 
            placeholder="병원명을 입력하세요" 
            value={localFilters.keyword} 
            onChange={handleKeywordChange}
            onKeyPress={handleKeywordKeyPress}
            className="h-11 text-sm flex-1"
          />
          <Button 
            onClick={handleKeywordSearch}
            className="h-11 px-4 bg-[#1B59FA] hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">검색</span>
          </Button>
        </div>
      </div>

      {/* 모바일 필터 토글 버튼 */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="w-full flex items-center justify-between h-12 px-4 border-2 border-gray-200 hover:border-[#1B59FA] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-[#1B59FA]" />
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">상세 필터</span>
                {getActiveFilterCount() > 0 && (
                  <Badge variant="secondary" className="bg-[#1B59FA] text-white text-xs px-2 py-0.5">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                {getFilterSummary()}
              </div>
            </div>
          </div>
          {isMobileFilterOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </Button>
      </div>

      {/* 필터 내용 - 모바일에서는 조건부 렌더링, 데스크톱에서는 항상 표시 */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          "lg:block lg:opacity-100 lg:max-h-none", // 데스크톱에서는 항상 표시
          isMobileFilterOpen
            ? "block opacity-100 max-h-[2000px]" // 모바일에서 열렸을 때
            : "lg:block max-h-0 opacity-0 lg:opacity-100 lg:max-h-none" // 모바일에서 닫혔을 때
        )}
      >
        {/* 모바일에서 열렸을 때 상단 여백 */}
        <div className="lg:hidden pt-4" />
        
        {/* 모바일에서는 세로 스택, 데스크톱에서는 그리드 */}
        <div className="flex flex-col space-y-4 lg:grid lg:grid-cols-5 lg:gap-4 lg:space-y-0">
          {/* 날짜 범위 필터 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">개원일 범위</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 text-sm",
                      !localFilters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange.from ? (
                      format(localFilters.dateRange.from, "yyyy-MM-dd")
                    ) : (
                      <span>시작일</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange.from}
                    onSelect={(date) => date && setLocalFilters({
                      ...localFilters,
                      dateRange: { ...localFilters.dateRange, from: date }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 text-sm",
                      !localFilters.dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange.to ? (
                      format(localFilters.dateRange.to, "yyyy-MM-dd")
                    ) : (
                      <span>종료일</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFilters.dateRange.to}
                    onSelect={(date) => date && setLocalFilters({
                      ...localFilters,
                      dateRange: { ...localFilters.dateRange, to: date }
                    })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 진료과목/분류 필터 (심플한 드롭다운) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">진료과목</Label>
            <Select value={localFilters.selectedCategory || "전체"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full h-11 text-sm flex items-center justify-between px-3 py-2 border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B59FA] focus:border-[#1B59FA] transition-colors">
                <SelectValue placeholder="진료과목 선택" className="text-left truncate" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] z-50">
                <SelectItem value="전체" className="text-sm py-2 px-3 cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
                  <span className="font-medium text-gray-700">전체</span>
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-sm py-2 px-3 cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
                    <span className={cn(
                      "font-medium",
                      localFilters.selectedCategory === category 
                        ? "text-[#1B59FA]" 
                        : "text-gray-700"
                    )}>
                      {category}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {/* 지역 필터 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">지역</Label>
            <div className="flex gap-2">
              <Select value={localFilters.region.sido || "전체"} onValueChange={handleSidoChange}>
                <SelectTrigger className="flex-1 h-11 text-sm flex items-center justify-between px-3 py-2 border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B59FA] focus:border-[#1B59FA] transition-colors">
                  <SelectValue placeholder="시/도" className="text-left truncate" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="전체" className="text-sm py-2 px-3 cursor-pointer hover:bg-gray-100 focus:bg-gray-100">전체</SelectItem>
                  {Object.keys(regions).map((sido) => (
                    <SelectItem key={sido} value={sido} className="text-sm py-2 px-3 cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
                      {sido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={localFilters.region.gugun || "전체"}
                onValueChange={handleGugunChange}
                disabled={!localFilters.region.sido}
              >
                <SelectTrigger className={cn(
                  "flex-1 h-11 text-sm flex items-center justify-between px-3 py-2 border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B59FA] focus:border-[#1B59FA] transition-colors",
                  !localFilters.region.sido && "opacity-50 cursor-not-allowed"
                )}>
                  <SelectValue placeholder="구/군" className="text-left truncate" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="전체" className="text-sm py-2 px-3 cursor-pointer hover:bg-gray-100 focus:bg-gray-100">전체</SelectItem>
                  {availableGugun.map((gugun) => (
                    <SelectItem key={gugun} value={gugun} className="text-sm py-2 px-3 cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
                      {gugun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 연락처 유무 필터 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">연락처 유무</Label>
            <div className="flex items-center space-x-3 h-11">
              <Switch checked={localFilters.hasContact} onCheckedChange={handleContactToggle} id="contact-filter" />
              <Label htmlFor="contact-filter" className="cursor-pointer text-sm">
                연락처 있음만 보기
              </Label>
            </div>
          </div>

          {/* 키워드 검색 - PC에서만 보이는 영역 */}
          <div className="space-y-2 hidden lg:block">
            <Label className="text-sm font-medium text-gray-700">병원명 검색</Label>
            <Input 
              placeholder="병원명 검색" 
              value={localFilters.keyword} 
              onChange={handleKeywordChange}
              onKeyPress={handleKeywordKeyPress}
              className="h-11 text-sm"
            />
          </div>
        </div>

        {/* 필터 적용 버튼 - 모바일에서는 풀 너비 */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={resetFilters}
            className="w-full sm:w-auto h-11 text-sm font-medium"
          >
            초기화
          </Button>
          <Button 
            className="w-full sm:w-auto h-11 text-sm font-medium bg-[#1B59FA] hover:bg-blue-700" 
            onClick={() => {
              applyFilters()
              // 모바일에서 필터 적용 후 자동으로 접기
              if (window.innerWidth < 1024) {
                setIsMobileFilterOpen(false)
              }
            }}
          >
            필터 적용
          </Button>
        </div>
      </div>
    </div>
  )
} 