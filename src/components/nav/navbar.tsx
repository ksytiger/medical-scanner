/**
 * @file navbar.tsx
 * @description 메인 네비게이션 바 컴포넌트
 *
 * 이 컴포넌트는 반응형 디자인에 맞게 데스크탑과 모바일 뷰를 통합합니다.
 * - 모바일: 햄버거 메뉴와 로고만 표시
 * - 데스크탑: 전체 네비게이션 메뉴와 사용자 정보 표시
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { MobileMenu } from "./mobile-menu";
import DesktopMenu from "./desktop-menu";

export function Navbar() {
  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
      <div className="container mx-auto flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <MobileMenu />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xl font-extrabold text-[#4072EB]"
          >
            <Image
              src="/lightning-icon.svg"
              alt="개원스캐너 로고"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span>개원스캐너</span>
          </Link>
        </div>

        {/* 데스크탑 메뉴 */}
        <DesktopMenu />
      </div>
    </header>
  );
}
