import { describe, it, expect, vi } from "vitest";
import { login, signup } from "@/actions/auth";

// 비밀번호 유효성 검사 모킹
vi.mock("@/components/auth/password-requirements", () => ({
  isPasswordValid: vi.fn((password) => {
    // 테스트 케이스에 맞게 검증 결과 반환
    if (password === "123") return false; // 짧은 비밀번호
    return password.length >= 6; // 기본 길이 검사
  }),
}));

// FormData를 모킹합니다
class MockFormData {
  private data = new Map<string, string>();

  constructor(entries?: Array<[string, string]>) {
    if (entries) {
      entries.forEach(([key, value]) => this.data.set(key, value));
    }
  }

  get(key: string) {
    return this.data.get(key) || null;
  }
}

// Zod 스키마 모킹
vi.mock("@/types/schema", () => {
  return {
    loginSchema: {
      safeParse: vi.fn((data) => {
        const { email, password } = data;
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!isValidEmail || password === "123") {
          return {
            success: false,
            error: {
              errors: [
                {
                  path: [!isValidEmail ? "email" : "password"],
                  message: !isValidEmail
                    ? "유효한 이메일 주소를 입력해주세요."
                    : "비밀번호는 최소 6자 이상이어야 합니다.",
                },
              ],
            },
          };
        }

        return { success: true };
      }),
    },
    signupSchema: {
      safeParse: vi.fn((data) => {
        const { email, password } = data;
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!isValidEmail || password === "123") {
          return {
            success: false,
            error: {
              errors: [
                {
                  path: [!isValidEmail ? "email" : "password"],
                  message: !isValidEmail
                    ? "유효한 이메일 주소를 입력해주세요."
                    : "비밀번호는 최소 6자 이상이어야 합니다.",
                },
              ],
            },
          };
        }

        return { success: true };
      }),
    },
  };
});

// Supabase 클라이언트 모킹
vi.mock("@/utils/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(() => ({
      auth: {
        signInWithPassword: vi.fn(async ({ email, password }) => {
          if (email === "test@example.com" && password === "password123") {
            return {
              data: {
                session: { user: { email: "test@example.com" } },
              },
              error: null,
            };
          }
          return {
            data: { session: null },
            error: { message: "Invalid login credentials" },
          };
        }),
        signUp: vi.fn(async ({ email }) => {
          if (email === "existing@example.com") {
            return {
              data: { user: null },
              error: { message: "User already registered" },
            };
          }
          return { data: { user: { email, identities: [{}] } }, error: null };
        }),
      },
    })),
  };
});

// Next.js의 revalidatePath를 모킹합니다
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// 로그인 및 회원가입 테스트
describe("인증 액션 테스트", () => {
  // 로그인 테스트
  describe("login", () => {
    it("올바른 이메일과 비밀번호로 로그인 성공", async () => {
      // 로그인 폼 데이터 설정
      const formData = new MockFormData([
        ["email", "test@example.com"],
        ["password", "password123"],
      ]) as unknown as FormData;

      // 로그인 액션 호출
      const result = await login(null, formData);

      // 결과 검증
      expect(result.error).toBeNull();
      expect(result.success).toBe("로그인 성공!");
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe("/");
    });

    it("잘못된 이메일과 비밀번호로 로그인 실패", async () => {
      // 잘못된 자격 증명으로 폼 데이터 설정
      const formData = new MockFormData([
        ["email", "wrong@example.com"],
        ["password", "wrongpassword"],
      ]) as unknown as FormData;

      // 로그인 액션 호출
      const result = await login(null, formData);

      // 결과 검증
      expect(result.success).toBeNull();
      expect(result.error).toBe("이메일 또는 비밀번호가 올바르지 않습니다.");
      expect(result.shouldRedirect).toBeUndefined();
    });

    it("유효하지 않은 이메일 형식으로 로그인 시도", async () => {
      // 유효하지 않은 이메일 형식의 폼 데이터 설정
      const formData = new MockFormData([
        ["email", "invalid-email"],
        ["password", "password123"],
      ]) as unknown as FormData;

      // 로그인 액션 호출
      const result = await login(null, formData);

      // 결과 검증
      expect(result.success).toBeNull();
      expect(result.error).toBe("입력 필드를 확인해주세요.");
      expect(result.fieldErrors?.email).toBeTruthy(); // 이메일 필드 오류 존재 확인
    });

    it("비밀번호가 너무 짧은 경우 로그인 실패", async () => {
      // 비밀번호가 너무 짧은 폼 데이터 설정
      const formData = new MockFormData([
        ["email", "test@example.com"],
        ["password", "123"],
      ]) as unknown as FormData;

      // 로그인 액션 호출
      const result = await login(null, formData);

      // 결과 검증
      expect(result.success).toBeNull();
      expect(result.error).toBe("입력 필드를 확인해주세요.");
      expect(result.fieldErrors?.password).toBeTruthy(); // 비밀번호 필드 오류 존재 확인
    });
  });

  // 회원가입 테스트
  describe("signup", () => {
    it("새로운 이메일로 회원가입 성공", async () => {
      // 회원가입 폼 데이터 설정
      const formData = new MockFormData([
        ["email", "new@example.com"],
        ["password", "password123"],
      ]) as unknown as FormData;

      // 회원가입 액션 호출
      const result = await signup(null, formData);

      // 결과 검증
      expect(result.error).toBeNull();
      expect(result.success).toBe("이메일을 확인해주세요.");
    });

    it("이미 존재하는 이메일로 회원가입 시도", async () => {
      // 이미 존재하는 이메일로 폼 데이터 설정
      const formData = new MockFormData([
        ["email", "existing@example.com"],
        ["password", "password123"],
      ]) as unknown as FormData;

      // 회원가입 액션 호출
      const result = await signup(null, formData);

      // 결과 검증
      expect(result.success).toBeNull();
      expect(result.error).toBe(
        "이미 등록된 이메일 주소입니다. 로그인해 주세요.",
      );
    });

    it("유효하지 않은 이메일 형식으로 회원가입 시도", async () => {
      // 유효하지 않은 이메일 형식의 폼 데이터 설정
      const formData = new MockFormData([
        ["email", "invalid-email"],
        ["password", "password123"],
      ]) as unknown as FormData;

      // 회원가입 액션 호출
      const result = await signup(null, formData);

      // 결과 검증
      expect(result.success).toBeNull();
      expect(result.error).toBe("입력 필드를 확인해주세요.");
      expect(result.fieldErrors?.email).toBeTruthy(); // 이메일 필드 오류 존재 확인
    });

    it("비밀번호가 너무 짧은 경우 회원가입 실패", async () => {
      // 비밀번호가 너무 짧은 폼 데이터 설정
      const formData = new MockFormData([
        ["email", "test@example.com"],
        ["password", "123"],
      ]) as unknown as FormData;

      // 회원가입 액션 호출
      const result = await signup(null, formData);

      // 결과 검증
      expect(result.success).toBeNull();
      expect(result.error).toBe("입력 필드를 확인해주세요.");
      expect(result.fieldErrors?.password).toBeTruthy(); // 비밀번호 필드 오류 존재 확인
    });
  });
});
