"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, createErrorResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult, CreateWorkResultInput } from "@/types/actions";

const workResultRepo = RepositoryFactory.getWorkResultRepository();

/**
 * 製造実績を登録
 */
export async function createWorkResult(input: CreateWorkResultInput): Promise<ActionResult> {
  try {
    // バリデーション
    if (!input.workOrderId) {
      return createValidationError("workOrderId", "作業指示IDが必要です");
    }
    if (!input.workerId) {
      return createValidationError("workerId", "作業者IDが必要です");
    }
    if (!input.workDate) {
      return createValidationError("workDate", "作業日が必要です");
    }
    if (!input.startTime) {
      return createValidationError("startTime", "開始時刻が必要です");
    }
    if (!input.endTime) {
      return createValidationError("endTime", "終了時刻が必要です");
    }
    if (input.quantity <= 0) {
      return createValidationError("quantity", "数量は0より大きい必要があります");
    }

    // 開始時刻と終了時刻の整合性チェック
    const start = new Date(input.startTime);
    const end = new Date(input.endTime);
    if (start >= end) {
      return createValidationError("endTime", "終了時刻は開始時刻より後である必要があります");
    }

    const workResult = await workResultRepo.create({
      workOrderId: input.workOrderId,
      workerId: input.workerId,
      workDate: input.workDate,
      startTime: input.startTime,
      endTime: input.endTime,
      quantity: input.quantity,
      defectQuantity: input.defectQuantity || 0,
      remarks: input.remarks,
    });

    // 作業指示の実績数量を更新
    const workOrderRepo = RepositoryFactory.getWorkOrderRepository();
    const workOrder = await workOrderRepo.findById(input.workOrderId);
    if (workOrder) {
      const results = await workResultRepo.findByWorkOrderId(input.workOrderId);
      const totalQuantity = results.reduce((sum, r) => sum + Number(r.quantity), 0);
      
      await workOrderRepo.update(input.workOrderId, {
        actualQuantity: totalQuantity,
        actualStartDate: workOrder.actualStartDate || start,
        actualEndDate: end,
        status: workOrder.status === 'PLANNED' ? 'IN_PROGRESS' : workOrder.status,
      });
    }

    return createSuccessResult(workResult);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 案件の実績一覧を取得
 */
export async function getWorkResultsByOrderId(orderId: string): Promise<ActionResult> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    const results = await workResultRepo.findByOrderId(orderId);
    return createSuccessResult(results);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 作業指示の実績一覧を取得
 */
export async function getWorkResultsByWorkOrderId(workOrderId: string): Promise<ActionResult> {
  try {
    if (!workOrderId) {
      return createValidationError("workOrderId", "作業指示IDが必要です");
    }

    const results = await workResultRepo.findByWorkOrderId(workOrderId);
    return createSuccessResult(results);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 本日の実績を取得
 */
export async function getTodayResults(): Promise<ActionResult> {
  try {
    const results = await workResultRepo.findToday();
    return createSuccessResult(results);
  } catch (error) {
    return handlePrismaError(error);
  }
}

