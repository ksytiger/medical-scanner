/**
 * @file date-picker.tsx
 * @description 단일 날짜 및 기간 선택을 지원하는 DatePicker 컴포넌트
 *
 * 주요 기능:
 * - 단일 날짜 선택 모드
 * - 기간 선택 모드 (시작일 ~ 종료일)
 * - 모바일 최적화된 반응형 레이아웃
 * - 참고 이미지 스펙에 맞춘 디자인
 * - 키보드 접근성 지원
 *
 * 디자인 스펙:
 * - 인풋 높이: 48px, 테두리: 1px #D9DCE0
 * - 선택 색상: #1B59FA (파란색)
 * - 호버 색상: #EEF3F8
 * - 범위 중간 색상: #E8F1FF
 *
 * 모바일 최적화:
 * - 768px 이하에서 달력 세로 배치
 * - 달력 너비 모바일에 맞게 조정
 * - 터치 친화적 버튼 크기
 */

"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  isWithinInterval,
  setYear,
  getYear,
} from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useIsMobile } from "@/hooks/use-mobile";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DatePickerProps {
  mode?: "single" | "range";
  value?: Date | DateRange;
  onChange?: (value: Date | DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface CalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  mode: "single" | "range";
  selectedDate?: Date;
  selectedRange?: DateRange;
  onDateSelect: (date: Date) => void;
  onDateRangeSelect?: (range: DateRange) => void;
  isMobile?: boolean;
}

// 요일 헤더
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 내부 달력 컴포넌트
function CalendarView({
  currentMonth,
  onMonthChange,
  mode,
  selectedDate,
  selectedRange,
  onDateSelect,
  isMobile = false,
}: CalendarProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const handleYearChange = (year: string) => {
    const newDate = setYear(currentMonth, parseInt(year));
    onMonthChange(newDate);
  };

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(month) - 1);
    onMonthChange(newDate);
  };

  // 연도 범위 생성 (현재 연도 기준 ±50년)
  const currentYear = getYear(currentMonth);
  const yearRange = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i);

  // 월 배열 생성
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const isDateSelected = (date: Date) => {
    if (mode === "single" && selectedDate) {
      return isSameDay(date, selectedDate);
    }
    if (mode === "range" && selectedRange) {
      if (selectedRange.from && selectedRange.to) {
        return (
          isSameDay(date, selectedRange.from) ||
          isSameDay(date, selectedRange.to)
        );
      }
      if (selectedRange.from) {
        return isSameDay(date, selectedRange.from);
      }
    }
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (mode === "range" && selectedRange?.from && selectedRange?.to) {
      return isWithinInterval(date, {
        start: selectedRange.from,
        end: selectedRange.to,
      });
    }
    return false;
  };

  const isDateRangeStart = (date: Date) => {
    return (
      mode === "range" &&
      selectedRange?.from &&
      isSameDay(date, selectedRange.from)
    );
  };

  const isDateRangeEnd = (date: Date) => {
    return (
      mode === "range" && selectedRange?.to && isSameDay(date, selectedRange.to)
    );
  };

  const isDateRangeMiddle = (date: Date) => {
    if (mode === "range" && selectedRange?.from && selectedRange?.to) {
      return (
        isWithinInterval(date, {
          start: selectedRange.from,
          end: selectedRange.to,
        }) &&
        !isSameDay(date, selectedRange.from) &&
        !isSameDay(date, selectedRange.to)
      );
    }
    return false;
  };

  return (
    <div
      className={cn(
        "p-4",
        isMobile ? "w-full max-w-[320px] mx-auto" : "w-[280px]",
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className={cn(
            "hover:bg-[#EEF3F8]",
            isMobile ? "h-10 w-10" : "h-8 w-8",
          )}
        >
          <ChevronLeft className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
        </Button>

        <div className="flex items-center gap-2">
          {/* 연도 선택 드롭다운 */}
          <div className="relative">
            <select
              value={currentYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className={cn(
                "px-2 text-sm font-medium text-[#2B2D33] bg-transparent border-0 rounded hover:bg-[#EEF3F8] focus:bg-[#EEF3F8] focus:outline-none appearance-none cursor-pointer",
                isMobile ? "h-10" : "h-8",
              )}
            >
              {yearRange.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-70" />
          </div>

          {/* 월 선택 드롭다운 */}
          <div className="relative">
            <select
              value={currentMonth.getMonth() + 1}
              onChange={(e) => handleMonthChange(e.target.value)}
              className={cn(
                "px-2 text-sm font-medium text-[#2B2D33] bg-transparent border-0 rounded hover:bg-[#EEF3F8] focus:bg-[#EEF3F8] focus:outline-none appearance-none cursor-pointer",
                isMobile ? "h-10" : "h-8",
              )}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month.toString().padStart(2, "0")}월
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-70" />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className={cn(
            "hover:bg-[#EEF3F8]",
            isMobile ? "h-10 w-10" : "h-8 w-8",
          )}
        >
          <ChevronRight className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className={cn(
              "flex items-center justify-center",
              isMobile ? "h-10" : "h-8",
            )}
          >
            <span className="text-xs font-medium text-[#71757B]">{day}</span>
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isTodayDate = isToday(date);
          const isSelected = isDateSelected(date);
          const inRange = isDateInRange(date);
          const isRangeStart = isDateRangeStart(date);
          const isRangeEnd = isDateRangeEnd(date);
          const isRangeMiddle = isDateRangeMiddle(date);

          if (!isCurrentMonth) {
            return (
              <div
                key={date.toISOString()}
                className={cn(isMobile ? "h-10" : "h-8")}
              />
            );
          }

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={cn(
                "text-xs font-normal rounded-md relative transition-colors",
                "hover:bg-[#EEF3F8] hover:text-[#2B2D33]",
                // 모바일에서 더 큰 터치 영역
                isMobile ? "h-10 w-10" : "h-8 w-8",
                // 기본 상태
                !isSelected && !inRange && "text-[#2B2D33]",
                // 선택된 날짜 (단일 또는 범위의 시작/끝)
                (isSelected || isRangeStart || isRangeEnd) &&
                  "bg-[#1B59FA] text-white hover:bg-[#1B59FA] hover:text-white",
                // 범위 중간
                isRangeMiddle &&
                  "bg-[#E8F1FF] text-[#1B59FA] hover:bg-[#E8F1FF] hover:text-[#1B59FA]",
                // 오늘 날짜
                isTodayDate &&
                  !isSelected &&
                  !inRange &&
                  "bg-[#F7F8FA] border border-[#E0E3E8]",
              )}
            >
              {format(date, "d")}
              {/* 오늘 날짜 점 표시 */}
              {isTodayDate && !isSelected && !inRange && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#71757B] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DatePicker({
  mode = "single",
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [secondMonth, setSecondMonth] = useState(addMonths(new Date(), 1));
  const [tempValue, setTempValue] = useState<Date | DateRange | undefined>(
    value,
  );
  const isMobile = useIsMobile();

  // 값이 변경되면 임시 값도 업데이트
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const formatDisplayValue = () => {
    if (mode === "single") {
      const singleValue = value as Date | undefined;
      return singleValue
        ? format(singleValue, "yyyy.MM.dd", { locale: ko })
        : "";
    } else {
      const rangeValue = value as DateRange | undefined;
      if (rangeValue?.from && rangeValue?.to) {
        return `${format(rangeValue.from, "yyyy.MM.dd", { locale: ko })} – ${format(rangeValue.to, "yyyy.MM.dd", { locale: ko })}`;
      } else if (rangeValue?.from) {
        return format(rangeValue.from, "yyyy.MM.dd", { locale: ko });
      }
      return "";
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return mode === "single" ? "YYYY.MM.DD" : "YYYY.MM.DD – YYYY.MM.DD";
  };

  const handleDateSelect = (date: Date) => {
    if (mode === "single") {
      setTempValue(date);
    } else {
      const currentRange = (tempValue as DateRange | undefined) || {
        from: undefined,
        to: undefined,
      };

      if (!currentRange.from || (currentRange.from && currentRange.to)) {
        // 첫 번째 날짜 선택 또는 범위가 완성된 상태에서 새로 시작
        setTempValue({ from: date, to: undefined });
      } else if (currentRange.from && !currentRange.to) {
        // 두 번째 날짜 선택
        if (date < currentRange.from) {
          setTempValue({ from: date, to: currentRange.from });
        } else {
          setTempValue({ from: currentRange.from, to: date });
        }
      }
    }
  };

  const handleToday = () => {
    const today = new Date();
    if (mode === "single") {
      setTempValue(today);
      onChange?.(today);
      setOpen(false);
    } else {
      setTempValue({ from: today, to: today });
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setOpen(false);
  };

  const handleApply = () => {
    onChange?.(tempValue);
    setOpen(false);
  };

  const handleFirstMonthChange = (date: Date) => {
    setCurrentMonth(date);
    if (mode === "range") {
      setSecondMonth(addMonths(date, 1));
    }
  };

  const handleSecondMonthChange = (date: Date) => {
    setSecondMonth(date);
    setCurrentMonth(subMonths(date, 1));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-md border border-[#D9DCE0] bg-white px-3 py-2 text-sm",
            "hover:border-[#1B59FA] focus:border-[#1B59FA] focus:outline-none focus:ring-2 focus:ring-[#1B59FA]/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !formatDisplayValue() && "text-[#71757B]",
            className,
          )}
        >
          <span className="truncate">
            {formatDisplayValue() || getPlaceholder()}
          </span>
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 text-[#71757B]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "p-0 shadow-lg border-[#D9DCE0]",
          // 모바일에서는 화면 너비에 맞게 조정
          isMobile && mode === "range"
            ? "w-[calc(100vw-2rem)] max-w-[360px]"
            : "w-auto",
        )}
        align={isMobile ? "center" : "start"}
        sideOffset={4}
        // 모바일에서는 화면 중앙에 배치
        side={isMobile ? "bottom" : "bottom"}
      >
        <div className="bg-white rounded-lg">
          {/* 달력 영역 */}
          <div
            className={cn(
              "flex",
              // 모바일에서 range 모드일 때는 세로 배치, PC에서는 가로 배치
              mode === "range" && isMobile
                ? "flex-col"
                : mode === "range"
                  ? "gap-6"
                  : "",
            )}
          >
            <CalendarView
              currentMonth={currentMonth}
              onMonthChange={handleFirstMonthChange}
              mode={mode}
              selectedDate={mode === "single" ? (tempValue as Date) : undefined}
              selectedRange={
                mode === "range" ? (tempValue as DateRange) : undefined
              }
              onDateSelect={(date) => handleDateSelect(date)}
              isMobile={isMobile}
            />
            {mode === "range" && (
              <>
                {/* 모바일에서는 구분선 추가 */}
                {isMobile && <div className="mx-4 border-t border-[#F0F1F3]" />}
                <CalendarView
                  currentMonth={secondMonth}
                  onMonthChange={handleSecondMonthChange}
                  mode={mode}
                  selectedDate={undefined}
                  selectedRange={tempValue as DateRange}
                  onDateSelect={(date) => handleDateSelect(date)}
                  isMobile={isMobile}
                />
              </>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-[#F0F1F3]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className={cn(
                "text-[#71757B] hover:text-[#2B2D33] hover:bg-[#F7F8FA]",
                // 모바일에서 터치 친화적 크기
                isMobile && "h-10 px-4",
              )}
            >
              오늘
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className={cn(
                  "border-[#D9DCE0] text-[#71757B] hover:bg-[#F7F8FA]",
                  isMobile ? "h-10 px-4" : "w-[68px]",
                )}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={
                  mode === "single"
                    ? () => {
                        onChange?.(tempValue);
                        setOpen(false);
                      }
                    : handleApply
                }
                className={cn(
                  "bg-[#1B59FA] hover:bg-[#0F47D1] text-white",
                  isMobile ? "h-10 px-4" : "w-[68px]",
                )}
              >
                선택
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
