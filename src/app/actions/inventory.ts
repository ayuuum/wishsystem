"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, createErrorResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult, GetInventoryParams } from "@/types/actions";

const inventoryRepo = RepositoryFactory.getInventoryRepository();

/**
 * 在庫一覧を取得
 */
export async function getInventoryItems(params: GetInventoryParams = {}): Promise<ActionResult> {
  try {
    const items = await inventoryRepo.findMany({
      search: params.search,
      lowStock: params.lowStock,
    });

    return createSuccessResult(items);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 在庫詳細を取得
 */
export async function getInventoryById(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return createValidationError("id", "在庫IDが必要です");
    }

    const inventory = await inventoryRepo.findById(id);
    
    if (!inventory) {
      return createErrorResult("在庫が見つかりませんでした", "NOT_FOUND");
    }

    return createSuccessResult(inventory);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 在庫統計を取得
 */
export async function getInventoryStats(): Promise<ActionResult> {
  try {
    const stats = await inventoryRepo.getStats();
    return createSuccessResult(stats);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 在庫を同期（既存システムとの同期）
 * 実際の実装では、既存システムのAPIを呼び出すか、CSVファイルを読み込む
 */
export async function syncInventory(): Promise<ActionResult> {
  try {
    // TODO: 既存システムとの同期処理を実装
    // 現在はプレースホルダー
    return createSuccessResult({ 
      message: "在庫同期が完了しました",
      syncedAt: new Date(),
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

