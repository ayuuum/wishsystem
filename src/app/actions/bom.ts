"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, createErrorResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult, CreateBomItemInput, UpdateBomItemInput } from "@/types/actions";

const bomRepo = RepositoryFactory.getBomRepository();

/**
 * 案件のBOMを取得
 */
export async function getBomByOrderId(orderId: string): Promise<ActionResult> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    const bomItems = await bomRepo.findByOrderId(orderId);
    return createSuccessResult(bomItems);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * BOMアイテムを作成
 */
export async function createBomItem(input: CreateBomItemInput): Promise<ActionResult> {
  try {
    // バリデーション
    if (!input.orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }
    if (!input.itemId) {
      return createValidationError("itemId", "部品IDが必要です");
    }
    if (!input.itemCode) {
      return createValidationError("itemCode", "部品コードが必要です");
    }
    if (!input.itemName) {
      return createValidationError("itemName", "部品名が必要です");
    }
    if (input.quantity <= 0) {
      return createValidationError("quantity", "数量は0より大きい必要があります");
    }

    const bomItem = await bomRepo.create({
      orderId: input.orderId,
      parentBomId: input.parentBomId,
      itemId: input.itemId,
      itemCode: input.itemCode,
      itemName: input.itemName,
      quantity: input.quantity,
      unit: input.unit,
      level: input.level,
      sortOrder: input.sortOrder || 0,
      unitCost: input.unitCost,
      totalCost: input.totalCost,
      leadTimeDays: input.leadTimeDays || 0,
      supplierId: input.supplierId,
      remarks: input.remarks,
    });

    return createSuccessResult(bomItem);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * BOMアイテムを更新
 */
export async function updateBomItem(id: string, input: UpdateBomItemInput): Promise<ActionResult> {
  try {
    if (!id) {
      return createValidationError("id", "BOMアイテムIDが必要です");
    }

    const updateData: any = {};
    if (input.itemId !== undefined) updateData.itemId = input.itemId;
    if (input.itemCode !== undefined) updateData.itemCode = input.itemCode;
    if (input.itemName !== undefined) updateData.itemName = input.itemName;
    if (input.quantity !== undefined) {
      if (input.quantity <= 0) {
        return createValidationError("quantity", "数量は0より大きい必要があります");
      }
      updateData.quantity = input.quantity;
    }
    if (input.unit !== undefined) updateData.unit = input.unit;
    if (input.level !== undefined) updateData.level = input.level;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.unitCost !== undefined) updateData.unitCost = input.unitCost;
    if (input.totalCost !== undefined) updateData.totalCost = input.totalCost;
    if (input.leadTimeDays !== undefined) updateData.leadTimeDays = input.leadTimeDays;
    if (input.supplierId !== undefined) updateData.supplierId = input.supplierId;
    if (input.remarks !== undefined) updateData.remarks = input.remarks;

    const bomItem = await bomRepo.update(id, updateData);
    return createSuccessResult(bomItem);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * BOMアイテムを削除
 */
export async function deleteBomItem(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return createValidationError("id", "BOMアイテムIDが必要です");
    }

    await bomRepo.delete(id);
    return createSuccessResult(null);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * BOMの原価合計を取得
 */
export async function getBomTotalCost(orderId: string): Promise<ActionResult<number>> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    const totalCost = await bomRepo.getTotalCost(orderId);
    return createSuccessResult(totalCost);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * BOMを承認（案件のステータスを更新）
 */
export async function approveBom(orderId: string): Promise<ActionResult> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    // 案件のステータスを更新するために、ordersアクションを使用
    const { updateOrder } = await import("./orders");
    return await updateOrder(orderId, { status: "PLANNING" });
  } catch (error) {
    return handlePrismaError(error);
  }
}

