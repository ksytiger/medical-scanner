/**
 * @file filter-bar.tsx
 * @description 의료기관 스캐너 필터바 컴포넌트
 * 
 * 날짜 범위, 진료과목, 지역, 연락처 유무, 키워드 등의 필터 기능을 제공
 * Supabase에서 진료과목 데이터를 동적으로 가져와 필터에 사용
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
import { Check, CalendarIcon, Filter, ChevronDown, ChevronUp, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { FilterState } from "@/lib/medical/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMedicalSubjects } from "@/lib/medical/api"

const categories = ["의원", "병원", "약국"]

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
  const [specialtyPopoverOpen, setSpecialtyPopoverOpen] = useState(false)
  const [availableGugun, setAvailableGugun] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("specialty")
  const [specialties, setSpecialties] = useState<string[]>([])
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(true)
  
  // 모바일 필터바 접힘/펼침 상태
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  // 진료과목 데이터 로드
  useEffect(() => {
    const loadMedicalSubjects = async () => {
      console.group("🩺 Loading medical subjects for filter")
      
      try {
        setIsLoadingSpecialties(true)
        const subjects = await getMedicalSubjects()
        console.log(`✅ Loaded ${subjects.length} medical subjects`)
        
        // 원하는 순서로 재정렬
        const desiredOrder = [
          "성형외과", "안과", "피부과", "치과", "한의원", "일반외과", "정형외과", 
          "정신건강의학과", "이비인후과", "가정의학과", "소아청소년과", "산부인과",
          "신경과", "신경외과", "비뇨기과", "영상의학과", "내과", "마취통증의학과",
          "재활의학과", "기타의원", "보건기관"
        ]
        
        const orderedSubjects = desiredOrder.filter(item => subjects.includes(item))
        // 만약 desiredOrder에 없는 항목이 있다면 마지막에 추가
        const remainingSubjects = subjects.filter(item => !desiredOrder.includes(item))
        const finalOrderedSubjects = [...orderedSubjects, ...remainingSubjects]
        
        console.log("📋 Reordered subjects:", finalOrderedSubjects)
        setSpecialties(finalOrderedSubjects)
      } catch (error) {
        console.error("❌ Failed to load medical subjects:", error)
        // 실패 시 기본값 사용 (요청된 순서로 정렬)
        setSpecialties([
          "성형외과", "안과", "피부과", "치과", "한의원", "일반외과", "정형외과", 
          "정신건강의학과", "이비인후과", "가정의학과", "소아청소년과", "산부인과",
          "신경과", "신경외과", "비뇨기과", "영상의학과", "내과", "마취통증의학과",
          "재활의학과", "기타의원", "보건기관"
        ])
      } finally {
        setIsLoadingSpecialties(false)
        console.groupEnd()
      }
    }

    loadMedicalSubjects()
  }, [])

  useEffect(() => {
    if (localFilters.region.sido && regions[localFilters.region.sido as keyof typeof regions]) {
      setAvailableGugun(regions[localFilters.region.sido as keyof typeof regions])
    } else {
      setAvailableGugun([])
    }
  }, [localFilters.region.sido])

  const toggleSpecialty = (specialty: string) => {
    if (localFilters.specialties.includes(specialty)) {
      setLocalFilters({
        ...localFilters,
        specialties: localFilters.specialties.filter((s) => s !== specialty),
      })
    } else {
      setLocalFilters({
        ...localFilters,
        specialties: [...localFilters.specialties, specialty],
      })
    }
  }

  const toggleCategory = (category: string) => {
    if (localFilters.categories?.includes(category)) {
      setLocalFilters({
        ...localFilters,
        categories: localFilters.categories.filter((c) => c !== category),
      })
    } else {
      setLocalFilters({
        ...localFilters,
        categories: [...(localFilters.categories || []), category],
      })
    }
  }

  const handleSidoChange = (value: string) => {
    setLocalFilters({
      ...localFilters,
      region: { sido: value, gugun: "" },
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
    if (e.key === 'Enter') {
      handleKeywordSearch()
    }
  }

  const applyFilters = () => {
    onFilterChange(localFilters)
  }

  const resetFilters = () => {
    const resetState: FilterState = {
      dateRange: { from: new Date("2023-01-01"), to: new Date() },
      specialties: [],
      categories: [],
      region: { sido: "", gugun: "" },
      hasContact: false,
      keyword: "",
    }
    setLocalFilters(resetState)
    onFilterChange(resetState)
  }

  // 현재 적용된 필터 개수 계산 (모바일 상세 필터 개수)
  const getActiveFilterCount = () => {
    let count = 0
    
    // 날짜 범위 필터 체크
    const defaultFromDate = new Date("2023-01-01")
    const currentDate = new Date()
    if (
      localFilters.dateRange.from?.getTime() !== defaultFromDate.getTime() ||
      localFilters.dateRange.to?.getTime() !== currentDate.getTime()
    ) {
      count++
    }
    
    // 진료과목 필터 체크
    if (localFilters.specialties.length > 0) count++
    
    // 분류 필터 체크
    if (localFilters.categories && localFilters.categories.length > 0) count++
    
    // 지역 필터 체크
    if (localFilters.region.sido && localFilters.region.sido !== "전체") count++
    
    // 연락처 필터 체크
    if (localFilters.hasContact) count++
    
    // 모바일에서는 키워드가 상단에 따로 있으므로 상세 필터 개수에서 제외
    
    return count
  }

  // 적용된 필터 요약 텍스트 생성
  const getFilterSummary = () => {
    const summaryParts = []
    
    if (localFilters.specialties.length > 0) {
      summaryParts.push(`진료과목 ${localFilters.specialties.length}개`)
    }
    
    if (localFilters.categories && localFilters.categories.length > 0) {
      summaryParts.push(`분류 ${localFilters.categories.length}개`)
    }
    
    if (localFilters.region.sido && localFilters.region.sido !== "전체") {
      summaryParts.push(localFilters.region.sido)
    }
    
    if (localFilters.hasContact) {
      summaryParts.push("연락처 있음")
    }
    
    // 키워드는 항상 보이므로 요약에서 제외 (필요하다면 추가 가능)
    
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 text-sm",
                    !localFilters.dateRange.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {localFilters.dateRange.from ? (
                      localFilters.dateRange.to ? (
                        <>
                          {format(localFilters.dateRange.from, "yy-MM-dd")} ~{" "}
                          {format(localFilters.dateRange.to, "yy-MM-dd")}
                        </>
                      ) : (
                        format(localFilters.dateRange.from, "yy-MM-dd")
                      )
                    ) : (
                      "날짜 선택"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={localFilters.dateRange.from}
                  selected={{
                    from: localFilters.dateRange.from,
                    to: localFilters.dateRange.to,
                  }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setLocalFilters({
                        ...localFilters,
                        dateRange: {
                          from: range.from,
                          to: range.to || range.from,
                        },
                      })
                    }
                  }}
                  disabled={{ before: new Date("2023-01-01") }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 진료과목 필터 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">진료과목</Label>
            <Popover open={specialtyPopoverOpen} onOpenChange={setSpecialtyPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-11 text-sm">
                  <span className="truncate">
                    {localFilters.specialties.length > 0 ||
                    (localFilters.categories && localFilters.categories.length > 0)
                      ? `${(localFilters.specialties?.length || 0) + (localFilters.categories?.length || 0)}개 선택됨`
                      : "진료과목 선택"}
                  </span>
                  <span className="ml-2 flex-shrink-0">▼</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4">
                  <Tabs defaultValue="specialty" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="category">분류</TabsTrigger>
                      <TabsTrigger value="specialty">진료과목</TabsTrigger>
                    </TabsList>
                    <TabsContent value="category" className="max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div
                            key={category}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                              localFilters.categories?.includes(category) ? "bg-blue-50" : "hover:bg-gray-50",
                            )}
                            onClick={() => toggleCategory(category)}
                          >
                            <div
                              className={cn(
                                "w-5 h-5 rounded-sm border flex items-center justify-center",
                                localFilters.categories?.includes(category)
                                  ? "bg-[#1B59FA] border-[#1B59FA]"
                                  : "border-gray-300",
                              )}
                            >
                              {localFilters.categories?.includes(category) && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="specialty" className="max-h-60 overflow-y-auto">
                      {isLoadingSpecialties ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-sm text-gray-500">진료과목 로딩 중...</div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {specialties.map((specialty) => (
                            <div
                              key={specialty}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                localFilters.specialties.includes(specialty) ? "bg-blue-50" : "hover:bg-gray-50",
                              )}
                              onClick={() => toggleSpecialty(specialty)}
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-sm border flex items-center justify-center",
                                  localFilters.specialties.includes(specialty)
                                    ? "bg-[#1B59FA] border-[#1B59FA]"
                                    : "border-gray-300",
                                )}
                              >
                                {localFilters.specialties.includes(specialty) && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <span className="text-sm font-medium">{specialty}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="flex items-center justify-between p-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setLocalFilters({
                        ...localFilters,
                        specialties: [],
                        categories: [],
                      })
                    }}
                  >
                    초기화
                  </Button>
                  <Button size="sm" onClick={() => setSpecialtyPopoverOpen(false)}>
                    확인
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            {(localFilters.specialties.length > 0 || (localFilters.categories && localFilters.categories.length > 0)) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {localFilters.categories?.map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs flex items-center gap-1">
                    {category}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors" 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCategory(category)
                      }} 
                    />
                  </Badge>
                ))}
                {localFilters.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="text-xs flex items-center gap-1">
                    {specialty}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors" 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSpecialty(specialty)
                      }} 
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 지역 필터 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">지역</Label>
            <div className="flex gap-2">
              <Select value={localFilters.region.sido || "전체"} onValueChange={handleSidoChange}>
                <SelectTrigger className="flex-1 h-11">
                  <SelectValue placeholder="시/도" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  {Object.keys(regions).map((sido) => (
                    <SelectItem key={sido} value={sido}>
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
                <SelectTrigger className="flex-1 h-11">
                  <SelectValue placeholder="구/군" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  {availableGugun.map((gugun) => (
                    <SelectItem key={gugun} value={gugun}>
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