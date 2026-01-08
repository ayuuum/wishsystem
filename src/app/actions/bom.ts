"use server";

import { prisma } from "@/lib/prisma";
import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, createErrorResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult, CreateBomItemInput, UpdateBomItemInput } from "@/types/actions";
import { Prisma } from "@prisma/client";

const bomRepo = RepositoryFactory.getBomRepository();

/**
 * 案件のBOMを取得
 */
export async function getBomByOrderId(orderId: string): Promise<ActionResult<any[]>> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    const bomItems = await bomRepo.findByOrderId(orderId);
    const serializedBom = bomItems.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      item: item.item ? {
        ...item.item,
        standardCost: Number(item.item.standardCost)
      } : null
    }));
    return createSuccessResult(serializedBom);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * BOMアイテムを作成
 */
export async function createBomItem(input: CreateBomItemInput): Promise<ActionResult<any>> {
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

    let finalItemId = input.itemId;

    // もしitemIdが一時的なもの（temp-）で、且つitemCodeがある場合は、部品マスタを検索して正しいIDを取得する
    if (finalItemId.startsWith('temp-') && input.itemCode) {
      const item = await prisma.item.findUnique({
        where: { itemCode: input.itemCode }
      });
      if (item) {
        finalItemId = item.id;
      } else {
        return createErrorResult("指定された部品コードが部品マスタに存在しません。正しいコードを入力するか、マスタに登録してください。");
      }
    }

    const bomItem = await bomRepo.create({
      orderId: input.orderId,
      parentBomId: input.parentBomId || null,
      itemId: finalItemId,
      itemCode: input.itemCode,
      itemName: input.itemName,
      quantity: new Prisma.Decimal(input.quantity),
      unit: input.unit,
      level: input.level,
      sortOrder: input.sortOrder || 0,
      unitCost: new Prisma.Decimal(input.unitCost || 0),
      totalCost: new Prisma.Decimal(input.totalCost || 0),
      leadTimeDays: input.leadTimeDays || 0,
      supplierId: input.supplierId || null,
      remarks: input.remarks || null,
    });

    const serializedBom = {
      ...bomItem,
      quantity: Number(bomItem.quantity),
      unitCost: Number(bomItem.unitCost),
      totalCost: Number(bomItem.totalCost)
    };

    return createSuccessResult(serializedBom);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * BOMアイテムを更新
 */
export async function updateBomItem(id: string, input: UpdateBomItemInput): Promise<ActionResult<any>> {
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

    const serializedBom = {
      ...bomItem,
      quantity: Number(bomItem.quantity),
      unitCost: Number(bomItem.unitCost),
      totalCost: Number(bomItem.totalCost)
    };

    return createSuccessResult(serializedBom);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * BOMアイテムを削除
 */
export async function deleteBomItem(id: string): Promise<ActionResult<null>> {
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
    return createSuccessResult(Number(totalCost));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * BOMを承認（案件のステータスを更新）
 */
export async function approveBom(orderId: string): Promise<ActionResult<any>> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    // 案件のステータスを更新するために、ordersアクションを使用
    const { updateOrder } = await import("./orders");
    const result = await updateOrder(orderId, { status: "PLANNING" });
    return result;
  } catch (error) {
    return handlePrismaError(error);
  }
}
