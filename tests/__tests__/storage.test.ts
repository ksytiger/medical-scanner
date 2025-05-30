import { describe, it, expect, vi } from "vitest";
import { uploadFile, getUploadUrl } from "@/actions/storage";

// Supabase 클라이언트 모킹
vi.mock("@/utils/supabase/server", () => {
  return {
    createServerSupabaseClient: vi.fn(() => ({
      storage: {
        from: vi.fn((bucketName) => ({
          upload: vi.fn(async (path, fileBody) => {
            // 파일 크기 검사 (테스트용 가짜 파일 객체를 가정)
            if ((fileBody as File).name.includes("large")) {
              return {
                error: { message: "파일 크기는 10MB 이하여야 합니다." },
              };
            }

            // 파일 타입 검사
            if ((fileBody as File).name.endsWith(".exe")) {
              return { error: { message: "지원되지 않는 파일 형식입니다." } };
            }

            return {
              data: { path: `${bucketName}/${path}` },
              error: null,
            };
          }),
          createSignedUploadUrl: vi.fn(async (path) => {
            // 파일 타입 검사
            if (path.endsWith(".exe")) {
              return { error: { message: "지원되지 않는 파일 형식입니다." } };
            }

            return {
              data: {
                signedUrl: "https://example.com/upload-url",
                token: "test-token",
                path: path,
              },
              error: null,
            };
          }),
        })),
      },
    })),
  };
});

// 파일 업로드 테스트
describe("스토리지 액션 테스트", () => {
  describe("uploadFile", () => {
    it("유효한 이미지 파일 업로드 성공", async () => {
      // File 객체 생성
      const file = new File(["test content"], "test-image.png", {
        type: "image/png",
      });

      // FormData 객체 생성 및 파일 추가
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucketName", "test-bucket");

      // 업로드 액션 호출
      const result = await uploadFile(formData);

      // 결과 검증
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();
    });

    it("파일 크기가 너무 큰 경우 업로드 실패", async () => {
      // 큰 파일 생성 (파일 이름으로 구분)
      const file = new File(["large content"], "large-file.png", {
        type: "image/png",
      });

      // FormData 객체 생성 및 파일 추가
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucketName", "test-bucket");

      // 업로드 액션 호출
      const result = await uploadFile(formData);

      // 결과 검증
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
    });

    it("허용되지 않는 파일 형식 업로드 실패", async () => {
      // 허용되지 않는 파일 형식의 파일 생성
      const file = new File(["test content"], "test.exe", {
        type: "application/octet-stream",
      });

      // FormData 객체 생성 및 파일 추가
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucketName", "test-bucket");

      // 업로드 액션 호출
      const result = await uploadFile(formData);

      // 결과 검증
      expect(result.success).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe("getUploadUrl", () => {
    it("유효한 파일 이름과 타입으로 URL 생성 성공", async () => {
      // 업로드 URL 생성 액션 호출
      const result = await getUploadUrl(
        "test-file.png",
        "image/png",
        "test-bucket",
      );

      // 결과 검증
      expect(result.error).toBeUndefined();
      expect(result.url).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.path).toBeDefined();
    });

    it("지원되지 않는 파일 타입으로 URL 생성 시도 실패", async () => {
      // 지원되지 않는 파일 타입으로 업로드 URL 생성 시도
      const result = await getUploadUrl(
        "test-file.exe",
        "application/octet-stream",
        "test-bucket",
      );

      // 결과 검증
      expect(result.url).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });
});
