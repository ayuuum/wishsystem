/**
 * エラーハンドリングユーティリティ
 */

import type { ActionError, ActionResult } from "@/types/actions";

/**
 * エラーメッセージの定義
 */
export const ErrorMessages = {
  NOT_FOUND: "データが見つかりませんでした",
  VALIDATION_ERROR: "入力内容に誤りがあります",
  DATABASE_ERROR: "データベースエラーが発生しました",
  UNAUTHORIZED: "認証が必要です",
  FORBIDDEN: "権限がありません",
  INTERNAL_ERROR: "サーバーエラーが発生しました",
  DUPLICATE_ORDER_NO: "同じ案件番号が既に存在します",
  INVALID_DATE: "日付が無効です",
  INVALID_QUANTITY: "数量が無効です",
} as const;

/**
 * エラーコードの定義
 */
export const ErrorCodes = {
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DUPLICATE_ORDER_NO: "DUPLICATE_ORDER_NO",
  INVALID_DATE: "INVALID_DATE",
  INVALID_QUANTITY: "INVALID_QUANTITY",
} as const;

/**
 * 成功レスポンスを作成
 */
export function createSuccessResult<T>(data: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * エラーレスポンスを作成
 */
export function createErrorResult(
  message: string,
  code?: string,
  field?: string
): ActionResult {
  return {
    success: false,
    error: {
      message,
      code,
      field,
    },
  };
}

/**
 * Prismaエラーを処理
 */
export function handlePrismaError(error: any): ActionResult {
  if (error.code === 'P2002') {
    // ユニーク制約違反
    return createErrorResult(
      ErrorMessages.DUPLICATE_ORDER_NO,
      ErrorCodes.DUPLICATE_ORDER_NO
    );
  }
  
  if (error.code === 'P2025') {
    // レコードが見つからない
    return createErrorResult(
      ErrorMessages.NOT_FOUND,
      ErrorCodes.NOT_FOUND
    );
  }
  
  console.error("Prisma error:", error);
  return createErrorResult(
    ErrorMessages.DATABASE_ERROR,
    ErrorCodes.DATABASE_ERROR
  );
}

/**
 * バリデーションエラーを作成
 */
export function createValidationError(
  field: string,
  message: string
): ActionResult {
  return createErrorResult(
    message,
    ErrorCodes.VALIDATION_ERROR,
    field
  );
}

/**
 * エラーログを出力
 */
export function logError(error: Error | unknown, context?: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error(`[${context || 'Error'}]`, {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });
}

