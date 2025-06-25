/**
 * @file buttons.tsx
 * @description 인증 관련 버튼 컴포넌트 모음
 *
 * 이 파일은 로그인, 회원가입, 로그아웃 등 인증 과정에서 사용되는 다양한 버튼 컴포넌트를 정의합니다.
 * 각 버튼은 Supabase 인증 상태 및 폼 상태와 연동됩니다.
 *
 * 주요 컴포넌트:
 * 1. LoginButton: 로그인 폼 제출 버튼 (로딩 상태 포함)
 * 2. SignupButton: 회원가입 폼 제출 버튼 (로딩 상태 및 비밀번호 유효성 검사 연동)
 * 3. LogoutButton: 로그아웃 버튼
 * 4. KakaoButton: 카카오 소셜 로그인 버튼
 *
 * 구현 로직:
 * - `useFormStatus` 훅을 사용하여 폼 제출 상태 관리 (LoginButton, SignupButton)
 * - `createBrowserSupabaseClient`를 사용하여 클라이언트 측 Supabase 인증 로직 수행 (LogoutButton, KakaoButton)
 * - `signInWithOAuth` 메서드를 사용하여 소셜 로그인 처리 (KakaoButton)
 * - 라우팅 처리를 위해 `next/navigation`의 `useRouter` 사용
 * - 인증 상태는 AuthProvider의 onAuthStateChange 이벤트에 의해 관리됨
 *
 * @dependencies
 * - react
 * - next/navigation
 * - react-dom (useFormStatus)
 * - @/components/ui/button (ShadcnUI Button)
 * - @/utils/supabase/client
 * - @supabase/supabase-js (signInWithOAuth)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/*
실제 로그인 흐름
1. 사용자가 로그인 버튼 클릭
2. 서버 액션 시작 → pending = true
3. 서버 액션 완료 → pending = false
4. 로그인 성공 시 → setIsLoading(true) 설정
5. refreshUser() 호출 및 완료
6. 리다이렉트 시작
7. (리다이렉트 후) → isLoading = false(새 페이지에서 리셋)
*/

export function LoginButton({ isLoading }: { isLoading?: boolean }) {
  const { pending } = useFormStatus();
  const loading = isLoading || pending;

  return (
    <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          로그인 중...
        </>
      ) : (
        "로그인"
      )}
    </Button>
  );
}

// 회원가입 버튼 컴포넌트
export function SignupButton({
  isPasswordValid,
  isSignupSuccessful,
}: {
  isPasswordValid: boolean;
  isSignupSuccessful?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full h-12 text-lg"
      disabled={!isPasswordValid || isSignupSuccessful || pending}
    >
      {pending
        ? "처리 중..."
        : isSignupSuccessful
          ? "회원가입 완료! 이메일을 확인해주세요."
          : "회원가입"}
    </Button>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();

      // onAuthStateChange 이벤트가 SIGNED_OUT 이벤트를 발생시키므로
      // AuthProvider에서 자동으로 사용자 상태를 업데이트함
      // 로그인 페이지로 직접 이동
      router.push("/login");
    } catch (error) {
      console.error("로그아웃 중 오류가 발생했습니다:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      {loading ? "로그아웃 중..." : "로그아웃"}
    </Button>
  );
}

export function KakaoButton() {
  const [loading, setLoading] = useState(false);

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("카카오 로그인 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleKakaoLogin}
      disabled={loading}
      className="
        w-full
        h-12
        rounded-md
        bg-[#FEE500]
        hover:bg-[#F2D900]
        text-[#191919]
        font-medium
        flex
        items-center
        justify-center
        transition-colors
        duration-200
        border-0
        relative
        px-0
        py-0
      "
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>로그인 중...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <svg width="18" height="18" viewBox="0 0 18 18" className="mr-2">
            <g fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9 0.5C4.30375 0.5 0.5 3.4375 0.5 7.0625C0.5 9.3 2.05687 11.2688 4.32937 12.25C4.17625 12.7781 3.68937 14.3938 3.6025 14.8187C3.49812 15.3781 3.78062 15.3719 4.00187 15.2219C4.18 15.1 5.94937 13.85 6.59312 13.3781C7.35375 13.5062 8.15875 13.625 9 13.625C13.6962 13.625 17.5 10.6875 17.5 7.0625C17.5 3.4375 13.6962 0.5 9 0.5Z"
                fill="#191919"
              />
            </g>
          </svg>
          <span className="text-[15px] leading-[1.4]">카카오 로그인</span>
        </div>
      )}
    </Button>
  );
}

export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("구글 로그인 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="
        w-full
        h-12
        rounded-md
        bg-white
        hover:bg-gray-50
        text-gray-900
        font-medium
        flex
        items-center
        justify-center
        transition-colors
        duration-200
        border
        border-gray-300
        hover:border-gray-400
        relative
        px-0
        py-0
      "
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>로그인 중...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <svg width="18" height="18" viewBox="0 0 24 24" className="mr-2">
            <g>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </g>
          </svg>
          <span className="text-[15px] leading-[1.4]">구글로 로그인</span>
        </div>
      )}
    </Button>
  );
}
