"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, createErrorResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult, GetInventoryParams } from "@/types/actions";

import { Prisma } from "@prisma/client";

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
 * 在庫を同期（既存システムとの同期モック実装）
 * 実際の実装では、既存システムのAPIを呼び出すか、CSVファイルを読み込む
 */
export async function syncInventory(): Promise<ActionResult> {
  try {
    // 全在庫アイテムを取得
    const items = await inventoryRepo.findMany();

    let updatedCount = 0;

    // 同期処理のシミュレーション（各アイテムの在庫数をランダムに変動させる）
    for (const item of items) {
      // 実際にはここで外部システムから取得した値と比較する
      // このモックでは、20%の確率で在庫数が変動すると仮定
      if (Math.random() > 0.8) {
        const currentStock = Number(item.stockQuantity);
        const change = Math.floor(Math.random() * 21) - 10; // -10 から +10 の変動
        const newStockQuantityValue = Math.max(0, currentStock + change);

        // 有効在庫数 = 現在庫数 - 引当数
        const newAvailableQuantityValue = Math.max(0, newStockQuantityValue - Number(item.allocatedQuantity));

        await inventoryRepo.update(item.id, {
          stockQuantity: new Prisma.Decimal(newStockQuantityValue),
          availableQuantity: new Prisma.Decimal(newAvailableQuantityValue),
        });

        updatedCount++;
      }
    }

    return createSuccessResult({
      message: `${updatedCount} 件の品目の在庫を更新しました`,
      updatedCount,
      syncedAt: new Date(),
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 案件の部品構成に基づき在庫を引き当てる
 */
export async function allocateInventoryForOrder(orderId: string): Promise<ActionResult> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    const bomRepo = RepositoryFactory.getBomRepository();
    const inventoryRepo = RepositoryFactory.getInventoryRepository();

    // 案件のBOMを取得
    const bomItems = await bomRepo.findByOrderId(orderId);

    // 各BOM項目について引き当て処理
    for (const bomItem of bomItems) {
      // 部品（level > 0）のみ引き当て対象とする
      if (bomItem.level > 0) {
        const inventory = await inventoryRepo.findByItemCode(bomItem.itemCode);

        if (inventory) {
          const requiredQty = bomItem.quantity;
          const newAllocated = new Prisma.Decimal(inventory.allocatedQuantity).plus(requiredQty);
          const newAvailable = new Prisma.Decimal(inventory.stockQuantity).minus(newAllocated);

          await inventoryRepo.update(inventory.id, {
            allocatedQuantity: newAllocated,
            availableQuantity: newAvailable,
          });
        }
      }
    }

    return createSuccessResult(null);
  } catch (error) {
    return handlePrismaError(error);
  }
}
/**
 * 案件の完了に伴い、引き当てていた在庫を実際に消費（減算）する
 */
export async function consumeInventoryForOrder(orderId: string): Promise<ActionResult> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    const bomRepo = RepositoryFactory.getBomRepository();
    const inventoryRepo = RepositoryFactory.getInventoryRepository();

    // 案件のBOMを取得
    const bomItems = await bomRepo.findByOrderId(orderId);

    // 各BOM項目について消費処理
    for (const bomItem of bomItems) {
      if (bomItem.level > 0) {
        const inventory = await inventoryRepo.findByItemCode(bomItem.itemCode);

        if (inventory) {
          const requiredQty = bomItem.quantity;
          // 在庫数と引当数の両方を減らす。有効在庫（available）は変わらない
          const newStock = new Prisma.Decimal(inventory.stockQuantity).minus(requiredQty);
          const newAllocated = new Prisma.Decimal(inventory.allocatedQuantity).minus(requiredQty);

          await inventoryRepo.update(inventory.id, {
            stockQuantity: newStock,
            allocatedQuantity: new Prisma.Decimal(Math.max(0, Number(newAllocated))),
          });
        }
      }
    }

    return createSuccessResult(null);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 在庫の引き当てをキャンセル（元に戻す）
 */
export async function revertInventoryAllocation(orderId: string): Promise<ActionResult> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    const bomRepo = RepositoryFactory.getBomRepository();
    const inventoryRepo = RepositoryFactory.getInventoryRepository();

    const bomItems = await bomRepo.findByOrderId(orderId);

    for (const bomItem of bomItems) {
      if (bomItem.level > 0) {
        const inventory = await inventoryRepo.findByItemCode(bomItem.itemCode);

        if (inventory) {
          const requiredQty = bomItem.quantity;
          const newAllocated = new Prisma.Decimal(inventory.allocatedQuantity).minus(requiredQty);
          const newAvailable = new Prisma.Decimal(inventory.stockQuantity).minus(newAllocated);

          await inventoryRepo.update(inventory.id, {
            allocatedQuantity: new Prisma.Decimal(Math.max(0, Number(newAllocated))),
            availableQuantity: newAvailable,
          });
        }
      }
    }

    return createSuccessResult(null);
  } catch (error) {
    return handlePrismaError(error);
  }
}
