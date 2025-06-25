/**
 * @file data-table-skeleton.tsx
 * @description 데이터 테이블 스켈레톤 로딩 컴포넌트
 *
 * 데이터 로딩 중 표시되는 스켈레톤 UI로 사용자 경험 개선
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableSkeletonProps {
  rows?: number;
  isMobile?: boolean;
}

// 모바일 카드 스켈레톤
function MobileCardSkeleton() {
  return (
    <Card className="mb-2 border border-gray-200 bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="space-y-2.5">
          <div className="bg-gray-50 rounded-lg p-3 min-h-[60px]">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex items-center gap-3 py-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-3 py-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DataTableSkeleton({
  rows = 5,
  isMobile = false,
}: DataTableSkeletonProps) {
  if (isMobile) {
    return (
      <div className="block lg:hidden">
        {Array.from({ length: rows }).map((_, index) => (
          <MobileCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="hidden lg:block">
      <div className="rounded-md border overflow-hidden">
        <Table className="table-fixed w-full min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px] min-w-[90px] text-center">
                분류
              </TableHead>
              <TableHead className="w-[140px] min-w-[140px]">
                병의원명
              </TableHead>
              <TableHead className="w-[400px] min-w-[400px]">주소</TableHead>
              <TableHead className="w-[130px] min-w-[130px]">연락처</TableHead>
              <TableHead className="w-[110px] min-w-[110px] text-center">
                개원일
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, index) => (
              <TableRow key={index}>
                <TableCell className="text-center">
                  <Skeleton className="h-6 w-14 mx-auto rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full max-w-[350px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-20 mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
