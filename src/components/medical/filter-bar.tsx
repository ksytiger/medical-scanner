/**
 * @file filter-bar.tsx
 * @description 의료기관 스캐너 필터바 컴포넌트
 * 
 * 날짜 범위, 진료과목, 지역, 연락처 유무, 키워드 등의 필터 기능을 제공
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
import { Check, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { FilterState } from "@/lib/medical/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const specialties = [
  "내과",
  "외과",
  "소아과",
  "산부인과",
  "정형외과",
  "신경외과",
  "피부과",
  "이비인후과",
  "안과",
  "치과",
  "한의원",
  "약국",
  "정신건강의학과",
  "재활의학과",
]

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 날짜 범위 필터 */}
        <div className="space-y-2">
          <Label>개원일 범위</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-xs md:text-sm",
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
          <Label>진료과목</Label>
          <Popover open={specialtyPopoverOpen} onOpenChange={setSpecialtyPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between text-xs md:text-sm">
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
                            "flex items-center gap-2 p-2 rounded cursor-pointer",
                            localFilters.categories?.includes(category) ? "bg-blue-50" : "hover:bg-gray-50",
                          )}
                          onClick={() => toggleCategory(category)}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-sm border flex items-center justify-center",
                              localFilters.categories?.includes(category)
                                ? "bg-[#1B59FA] border-[#1B59FA]"
                                : "border-gray-300",
                            )}
                          >
                            {localFilters.categories?.includes(category) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm">{category}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="specialty" className="max-h-60 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {specialties.map((specialty) => (
                        <div
                          key={specialty}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded cursor-pointer",
                            localFilters.specialties.includes(specialty) ? "bg-blue-50" : "hover:bg-gray-50",
                          )}
                          onClick={() => toggleSpecialty(specialty)}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-sm border flex items-center justify-center",
                              localFilters.specialties.includes(specialty)
                                ? "bg-[#1B59FA] border-[#1B59FA]"
                                : "border-gray-300",
                            )}
                          >
                            {localFilters.specialties.includes(specialty) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="text-sm">{specialty}</span>
                        </div>
                      ))}
                    </div>
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
            <div className="flex flex-wrap gap-1 mt-2">
              {localFilters.categories?.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
              {localFilters.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 지역 필터 */}
        <div className="space-y-2">
          <Label>지역</Label>
          <div className="flex gap-2">
            <Select value={localFilters.region.sido || "전체"} onValueChange={handleSidoChange}>
              <SelectTrigger className="flex-1">
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
              <SelectTrigger className="flex-1">
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
          <Label>연락처 유무</Label>
          <div className="flex items-center space-x-2">
            <Switch checked={localFilters.hasContact} onCheckedChange={handleContactToggle} id="contact-filter" />
            <Label htmlFor="contact-filter" className="cursor-pointer">
              연락처 있음만 보기
            </Label>
          </div>
        </div>

        {/* 키워드 검색 */}
        <div className="space-y-2">
          <Label>키워드</Label>
          <Input placeholder="병원명 검색" value={localFilters.keyword} onChange={handleKeywordChange} />
        </div>
      </div>

      {/* 필터 적용 버튼 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={resetFilters}>
          초기화
        </Button>
        <Button className="bg-[#1B59FA] hover:bg-blue-700" onClick={applyFilters}>
          필터 적용
        </Button>
      </div>
    </div>
  )
} 