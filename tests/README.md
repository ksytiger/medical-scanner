# 테스트 문서

이 문서는 Next.js + Supabase 보일러플레이트의 테스트 구조와 실행 방법에 대해 설명합니다.

## 테스트 구조

테스트는 다음과 같은 구조로 구성되어 있습니다:

```
test/
  ├── __tests__/           # 단위 테스트
  │   ├── auth.test.ts     # 인증 액션 테스트
  │   └── storage.test.ts  # 스토리지 액션 테스트
  ├── setup.ts             # 테스트 설정
  └── README.md            # 테스트 문서
```

## 단위 테스트 (Vitest)

단위 테스트는 [Vitest](https://vitest.dev/)를 사용하여 구현되어 있습니다.
주로 서버 액션 함수들을 테스트하며, 모킹을 통해 Supabase API 호출을 테스트합니다.

### 테스트 실행

```bash
# 모든 단위 테스트 실행
pnpm test

# 감시 모드로 테스트 실행 (코드 변경 시 자동 재실행)
pnpm test:watch
```

### 테스트 파일 추가

새 테스트 파일은 `test/__tests__/` 디렉토리에 `*.test.ts` 또는 `*.test.tsx` 형식으로 추가합니다.

```typescript
import { describe, it, expect } from "vitest";

describe("기능 테스트", () => {
  it("예상대로 동작해야 함", () => {
    expect(true).toBe(true);
  });
});
```

## 모킹

### 모킹 예시

Supabase 클라이언트와 같은 외부 의존성을 모킹하는 방법:

```typescript
import { vi } from "vitest";

// Supabase 클라이언트 모킹
vi.mock("@/utils/supabase/server", () => {
  return {
    createServerActionClient: vi.fn(() => ({
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
      },
    })),
  };
});
```

## 환경 변수

테스트 환경에서는 다음과 같은 환경 변수가 설정됩니다:

```
NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co'
NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key'
NEXT_PUBLIC_STORAGE_BUCKET: 'test-bucket'
NEXT_PUBLIC_SITE_URL: 'http://localhost:3000'
```

이 환경 변수들은 `test/setup.ts` 파일에서 설정되며, 테스트 실행 시 적용됩니다.
