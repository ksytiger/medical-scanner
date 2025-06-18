/**
 * @file nav-links.tsx
 * @description 네비게이션 메뉴에서 사용하는 공통 링크 정의
 *
 * 이 파일은 데스크톱과 모바일 메뉴 모두에서 사용되는 공통 링크를 관리합니다.
 */

import { Route } from "next";

type NavLink = {
  name: string;
  href: Route | string;
  requireAuth?: boolean;
};

export const navLinks: NavLink[] = [
  { name: "의료기관 찾기", href: "#database" as Route },
  { name: "프로필", href: "/profile" as Route, requireAuth: true },
];
