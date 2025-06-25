/**
 * @file desktop-menu.tsx
 * @description 데스크탑 네비게이션 메뉴 컴포넌트
 *
 * 이 파일은 데스크탑 화면에서 표시되는 우측 네비게이션 메뉴를 정의합니다.
 * 사용자 인증 상태에 따라 사용자 정보와 드롭다운 메뉴를 표시합니다.
 *
 * 주요 기능:
 * 1. 네비게이션 링크 표시
 * 2. 사용자 인증 상태에 따른 정보 표시
 * 3. 사용자 프로필 드롭다운 메뉴 통합
 * 4. 미디어 쿼리를 통한 반응형 표시
 *
 * 구현 로직:
 * - md 이상 화면 크기에서만 표시되도록 설계
 * - 사용자 인증 상태에 따른 조건부 렌더링
 * - 사용자 이메일에서 ID 부분 추출하여 표시
 * - UserNav 컴포넌트를 통한 사용자 드롭다운 메뉴 통합
 * - useAuth 훅을 통한 인증 상태 접근
 *
 * @dependencies
 * - ./user-nav (사용자 네비게이션 컴포넌트)
 * - ./nav-links (네비게이션 링크 정의)
 * - @/components/auth/auth-provider (인증 컨텍스트)
 */

"use client";

import Link from "next/link";
import UserNav from "./user-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { navLinks } from "./nav-links";

export default function DesktopMenu() {
  const { user } = useAuth();

  return (
    <div className="hidden md:flex items-center gap-6">
      {/* 네비게이션 링크 */}
      <nav className="flex items-center gap-6">
        {navLinks.map((link) => {
          // 인증이 필요한 링크이면서 사용자가 로그인하지 않은 경우 표시하지 않음
          if (link.requireAuth && !user) return null;

          return (
            <Link
              key={link.href}
              href={link.href as any}
              className="text-sm font-medium hover:text-[#1B59FA] transition-colors"
            >
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* 사용자 정보 및 컨트롤 */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="text-sm">
              <span className="font-medium">{user.email?.split("@")[0]}</span>님
            </div>
            <UserNav />
          </>
        ) : (
          <>
            <Link href="/login">
              <Button className="text-sm font-medium bg-[#1B59FA] hover:bg-blue-700 text-white">
                로그인/가입
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
