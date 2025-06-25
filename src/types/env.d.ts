/**
 * @file env.d.ts
 * @description 환경 변수 타입 정의
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      NEXT_PUBLIC_STORAGE_BUCKET?: string;
      NEXT_PUBLIC_SITE_URL?: string;
      SUPABASE_SERVICE_ROLE?: string;
      SUPABASE_DB_PASSWORD?: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}

export {};
