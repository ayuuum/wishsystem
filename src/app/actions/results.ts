"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, createErrorResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult, CreateWorkResultInput } from "@/types/actions";
import { Prisma, OrderStatus } from "@prisma/client";

const workResultRepo = RepositoryFactory.getWorkResultRepository();

/**
 * 製造実績を登録
 */
export async function createWorkResult(input: CreateWorkResultInput): Promise<ActionResult<any>> {
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
      quantity: new Prisma.Decimal(input.quantity),
      defectQuantity: new Prisma.Decimal(input.defectQuantity || 0),
      remarks: input.remarks || null,
      approvedBy: null,
      approvedAt: null,
    });

    // 作業指示の実績数量を更新
    const workOrderRepo = RepositoryFactory.getWorkOrderRepository();
    const orderRepo = RepositoryFactory.getOrderRepository();
    const workOrder = await workOrderRepo.findById(input.workOrderId);

    if (workOrder) {
      const results = await workResultRepo.findByWorkOrderId(input.workOrderId);
      const totalQuantity = results.reduce((sum, r) => sum + Number(r.quantity), 0);

      // 作業指示のステータス決定
      let newWorkOrderStatus = workOrder.status;
      if (totalQuantity >= Number(workOrder.plannedQuantity)) {
        newWorkOrderStatus = 'COMPLETED';
      } else if (totalQuantity > 0) {
        newWorkOrderStatus = 'IN_PROGRESS';
      }

      await workOrderRepo.update(input.workOrderId, {
        actualQuantity: new Prisma.Decimal(totalQuantity),
        actualStartDate: workOrder.actualStartDate || start,
        actualEndDate: end,
        status: newWorkOrderStatus as any,
      });

      // 案件全体のステータス連携
      const orderId = workOrder.orderId;
      const allWorkOrders = await workOrderRepo.findByOrderId(orderId);
      const allCompleted = allWorkOrders.every(wo => wo.status === 'COMPLETED');
      const anyStarted = allWorkOrders.some(wo => wo.status === 'IN_PROGRESS' || wo.status === 'COMPLETED');

      const currentOrder = await orderRepo.findById(orderId);
      if (currentOrder) {
        let newOrderStatus = currentOrder.status;
        if (allCompleted) {
          newOrderStatus = OrderStatus.COMPLETED;
        } else if (anyStarted && (currentOrder.status === OrderStatus.PLANNING || currentOrder.status === OrderStatus.BOM_REVIEW)) {
          newOrderStatus = OrderStatus.IN_PRODUCTION;
        }

        if (newOrderStatus !== currentOrder.status) {
          await orderRepo.update(orderId, { status: newOrderStatus as any });

          // 案件が完了した場合、在庫を実際に消費する
          if (newOrderStatus === OrderStatus.COMPLETED) {
            const { consumeInventoryForOrder } = await import("./inventory");
            await consumeInventoryForOrder(orderId);
          }
        }
      }
    }

    const serializedResult = {
      ...workResult,
      quantity: Number(workResult.quantity),
      defectQuantity: Number(workResult.defectQuantity)
    };

    return createSuccessResult(serializedResult);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 案件の実績一覧を取得
 */
export async function getWorkResultsByOrderId(orderId: string): Promise<ActionResult<any[]>> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    const results = await workResultRepo.findByOrderId(orderId);
    const serializedResults = results.map((r: any) => ({
      ...r,
      quantity: Number(r.quantity),
      defectQuantity: Number(r.defectQuantity)
    }));
    return createSuccessResult(serializedResults);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 作業指示の実績一覧を取得
 */
export async function getWorkResultsByWorkOrderId(workOrderId: string): Promise<ActionResult<any[]>> {
  try {
    if (!workOrderId) {
      return createValidationError("workOrderId", "作業指示IDが必要です");
    }

    const results = await workResultRepo.findByWorkOrderId(workOrderId);
    const serializedResults = results.map((r: any) => ({
      ...r,
      quantity: Number(r.quantity),
      defectQuantity: Number(r.defectQuantity)
    }));
    return createSuccessResult(serializedResults);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 本日の実績を取得
 */
export async function getTodayResults(): Promise<ActionResult<any[]>> {
  try {
    const results = await workResultRepo.findToday();
    const serializedResults = results.map((r: any) => ({
      ...r,
      quantity: Number(r.quantity),
      defectQuantity: Number(r.defectQuantity)
    }));
    return createSuccessResult(serializedResults);
  } catch (error) {
    return handlePrismaError(error);
  }
}

