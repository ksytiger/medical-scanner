/**
 * @file DatePicker.stories.tsx
 * @description DatePicker 컴포넌트의 Storybook 스토리
 */

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker, type DateRange } from "@/components/ui/date-picker";

const meta: Meta<typeof DatePicker> = {
  title: "Components/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    mode: {
      control: { type: "select" },
      options: ["single", "range"],
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 단일 날짜 선택 스토리
export const SingleDate: Story = {
  args: {
    mode: "single",
    placeholder: "날짜를 선택하세요",
  },
  render: function SingleDateRender(args) {
    const [value, setValue] = useState<Date | undefined>(new Date());

    return (
      <div className="w-80">
        <DatePicker
          {...args}
          value={value}
          onChange={(newValue) => setValue(newValue as Date)}
        />
        <div className="mt-4 text-sm text-gray-600">
          선택된 날짜: {value ? value.toLocaleDateString("ko-KR") : "없음"}
        </div>
      </div>
    );
  },
};

// 기간 선택 스토리
export const DateRange: Story = {
  args: {
    mode: "range",
    placeholder: "기간을 선택하세요",
  },
  render: function DateRangeRender(args) {
    const [value, setValue] = useState<DateRange>({
      from: new Date(),
      to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
    });

    return (
      <div className="w-80">
        <DatePicker
          {...args}
          value={value}
          onChange={(newValue) => setValue(newValue as DateRange)}
        />
        <div className="mt-4 text-sm text-gray-600">
          선택된 기간:
          {value?.from && value?.to
            ? `${value.from.toLocaleDateString("ko-KR")} ~ ${value.to.toLocaleDateString("ko-KR")}`
            : "없음"}
        </div>
      </div>
    );
  },
};

// 비활성화된 상태
export const Disabled: Story = {
  args: {
    mode: "single",
    disabled: true,
    placeholder: "비활성화된 상태",
  },
  render: (args) => {
    return (
      <div className="w-80">
        <DatePicker {...args} />
      </div>
    );
  },
};

// 기본값이 없는 상태
export const EmptyValue: Story = {
  args: {
    mode: "range",
    placeholder: "날짜 범위를 선택하세요",
  },
  render: function EmptyValueRender(args) {
    const [value, setValue] = useState<DateRange | undefined>(undefined);

    return (
      <div className="w-80">
        <DatePicker
          {...args}
          value={value}
          onChange={(newValue) => setValue(newValue as DateRange)}
        />
        <div className="mt-4 text-sm text-gray-600">
          선택된 기간: {value?.from || value?.to ? "부분 선택됨" : "없음"}
        </div>
      </div>
    );
  },
};
