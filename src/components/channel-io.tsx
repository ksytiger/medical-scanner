/**
 * @file channel-io.tsx
 * @description 채널톡 초기화 및 관리 컴포넌트
 *
 * 이 컴포넌트는 사용자 인증 상태에 따라 채널톡을 동적으로 초기화합니다.
 * 인증된 사용자에게는 개인화된 고객 지원을, 익명 사용자에게는 기본 채팅 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 채널톡 JavaScript SDK 동적 로드
 * 2. 사용자 인증 상태에 따른 조건부 초기화
 * 3. 멤버 유저 모드: 사용자 정보 포함 초기화
 * 4. 익명 유저 모드: 기본 초기화
 * 5. 인증 상태 변경 시 채널톡 재초기화
 *
 * 구현 로직:
 * - useAuth 훅을 통한 사용자 인증 상태 구독
 * - useEffect를 통한 인증 상태 변경 감지 및 채널톡 재초기화
 * - 채널톡 SDK 중복 로드 방지 로직
 * - 사용자 정보 기반 멤버 프로필 생성
 * - 로딩 상태 고려한 초기화 타이밍 조절
 *
 * 멤버 유저 모드 장점:
 * - 개인화된 고객 지원 (이름, 이메일 기반)
 * - 채팅 히스토리 연속성 (익명 → 로그인 연결)
 * - 사용자별 문의 패턴 분석 가능
 * - 워크플로우 자동화 및 맞춤형 응답
 *
 * @dependencies
 * - react
 * - @/components/auth/auth-provider
 * - 채널톡 JavaScript SDK (동적 로드)
 */

"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";

// 채널톡 플러그인 키
const CHANNEL_PLUGIN_KEY = "ba1f21d9-834c-4b01-821c-8b6f2e988309";

// 전역 타입 선언
declare global {
  interface Window {
    ChannelIO?: any;
    ChannelIOInitialized?: boolean;
  }
}

export default function ChannelIO() {
  const { user, isLoading } = useAuth();
  const hasInitialized = useRef(false);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    // 로딩 중이면 대기
    if (isLoading) return;

    // 사용자 상태가 변경된 경우에만 재초기화
    const userId = user?.id || null;
    if (currentUserId.current === userId && hasInitialized.current) {
      return;
    }

    console.group("[ChannelIO] 초기화 프로세스");
    console.log("사용자 상태:", {
      isAuthenticated: !!user,
      userId: user?.id,
      email: user?.email,
    });

    // 채널톡 SDK 로드
    loadChannelIOScript()
      .then(() => {
        // 이전 인스턴스가 있다면 정리
        if (window.ChannelIO && hasInitialized.current) {
          console.log("[ChannelIO] 기존 인스턴스 정리 중...");
          try {
            window.ChannelIO("shutdown");
          } catch (error) {
            console.warn("[ChannelIO] 기존 인스턴스 정리 중 오류:", error);
          }
        }

        // 사용자 상태에 따라 다르게 초기화
        if (user) {
          initializeChannelIOForMember(user);
        } else {
          initializeChannelIOForAnonymous();
        }

        hasInitialized.current = true;
        currentUserId.current = userId;
        console.log("[ChannelIO] 초기화 완료");
        console.groupEnd();
      })
      .catch((error) => {
        console.error("[ChannelIO] 초기화 실패:", error);
        console.groupEnd();
      });
  }, [user, isLoading]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}

/**
 * 채널톡 JavaScript SDK를 동적으로 로드합니다.
 */
function loadChannelIOScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 이미 로드되었다면 바로 완료
    if (window.ChannelIO && window.ChannelIOInitialized) {
      resolve();
      return;
    }

    // 중복 로드 방지
    if (window.ChannelIO) {
      console.warn("ChannelIO script included twice.");
      resolve();
      return;
    }

    console.log("[ChannelIO] SDK 로드 중...");

    // 채널톡 초기화 함수 생성
    const ch = function (this: any, ...args: any[]) {
      ch.c(args);
    };
    ch.q = [];
    ch.c = function (args: any) {
      ch.q.push(args);
    };
    window.ChannelIO = ch;

    // 스크립트 로드 함수
    function loadScript() {
      if (window.ChannelIOInitialized) {
        resolve();
        return;
      }

      window.ChannelIOInitialized = true;
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";

      script.onload = () => {
        console.log("[ChannelIO] SDK 로드 완료");
        resolve();
      };

      script.onerror = () => {
        console.error("[ChannelIO] SDK 로드 실패");
        window.ChannelIOInitialized = false;
        reject(new Error("Failed to load ChannelIO script"));
      };

      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      }
    }

    // DOM 준비 상태에 따라 로드
    if (document.readyState === "complete") {
      loadScript();
    } else {
      window.addEventListener("DOMContentLoaded", loadScript);
      window.addEventListener("load", loadScript);
    }
  });
}

/**
 * 멤버 유저 모드로 채널톡을 초기화합니다.
 * 사용자 정보를 포함하여 개인화된 고객 지원을 제공합니다.
 */
function initializeChannelIOForMember(user: any) {
  console.log("[ChannelIO] 멤버 유저 모드로 초기화");

  // 사용자 이름 추출 (이메일에서 @ 앞부분 사용)
  const userName = user.email ? user.email.split("@")[0] : "사용자";

  const bootConfig = {
    pluginKey: CHANNEL_PLUGIN_KEY,
    memberId: user.id, // Supabase 사용자 ID를 멤버 ID로 사용
    profile: {
      name: userName,
      email: user.email,
      // 추가 커스텀 필드가 필요한 경우 여기에 추가
      signUpDate: user.created_at,
      lastLoginDate: user.updated_at,
    },
  };

  console.log("[ChannelIO] 멤버 설정:", {
    memberId: bootConfig.memberId,
    name: bootConfig.profile.name,
    email: bootConfig.profile.email,
  });

  window.ChannelIO("boot", bootConfig);
}

/**
 * 익명 유저 모드로 채널톡을 초기화합니다.
 * 기본 채팅 기능을 제공합니다.
 */
function initializeChannelIOForAnonymous() {
  console.log("[ChannelIO] 익명 유저 모드로 초기화");

  const bootConfig = {
    pluginKey: CHANNEL_PLUGIN_KEY,
  };

  window.ChannelIO("boot", bootConfig);
}
