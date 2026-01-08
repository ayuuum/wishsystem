"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, createErrorResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult, CreateWorkOrderInput, UpdateWorkOrderInput, UpdateScheduleInput } from "@/types/actions";
import { WorkOrderStatus, Prisma } from "@prisma/client";

const workOrderRepo = RepositoryFactory.getWorkOrderRepository();

/**
 * 案件の作業指示一覧を取得
 */
export async function getWorkOrdersByOrderId(orderId: string): Promise<ActionResult<any[]>> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }

    const workOrders = await workOrderRepo.findByOrderId(orderId);
    const serializedWorkOrders = workOrders.map((wo: any) => ({
      ...wo,
      plannedQuantity: Number(wo.plannedQuantity),
      actualQuantity: wo.actualQuantity ? Number(wo.actualQuantity) : null,
      results: wo.results ? wo.results.map((r: any) => ({
        ...r,
        quantity: Number(r.quantity),
        defectQuantity: Number(r.defectQuantity)
      })) : undefined
    }));
    return createSuccessResult(serializedWorkOrders);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 作業指示を作成
 */
export async function createWorkOrder(input: CreateWorkOrderInput): Promise<ActionResult<any>> {
  try {
    // バリデーション
    if (!input.orderId) {
      return createValidationError("orderId", "案件IDが必要です");
    }
    if (!input.processName) {
      return createValidationError("processName", "工程名が必要です");
    }
    if (!input.plannedStartDate) {
      return createValidationError("plannedStartDate", "予定開始日が必要です");
    }
    if (!input.plannedEndDate) {
      return createValidationError("plannedEndDate", "予定終了日が必要です");
    }
    if (input.plannedQuantity <= 0) {
      return createValidationError("plannedQuantity", "予定数量は0より大きい必要があります");
    }

    // 開始日と終了日の整合性チェック
    const startDate = new Date(input.plannedStartDate);
    const endDate = new Date(input.plannedEndDate);
    if (startDate >= endDate) {
      return createValidationError("plannedEndDate", "予定終了日は予定開始日より後である必要があります");
    }

    const workOrder = await workOrderRepo.create({
      orderId: input.orderId,
      processName: input.processName,
      processOrder: input.processOrder,
      plannedStartDate: input.plannedStartDate,
      plannedEndDate: input.plannedEndDate,
      plannedQuantity: new Prisma.Decimal(input.plannedQuantity),
      status: WorkOrderStatus.PLANNED,
      predecessorId: input.predecessorId || null,
      remarks: input.remarks || null,
      actualStartDate: null,
      actualEndDate: null,
      actualQuantity: null,
    });

    const serializedWorkOrder = {
      ...workOrder,
      plannedQuantity: Number((workOrder as any).plannedQuantity),
      actualQuantity: (workOrder as any).actualQuantity ? Number((workOrder as any).actualQuantity) : null,
      results: (workOrder as any).results ? (workOrder as any).results.map((r: any) => ({
        ...r,
        quantity: Number(r.quantity),
        defectQuantity: Number(r.defectQuantity)
      })) : undefined
    };

    return createSuccessResult(serializedWorkOrder);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 作業指示を更新
 */
export async function updateWorkOrder(id: string, input: UpdateWorkOrderInput): Promise<ActionResult<any>> {
  try {
    if (!id) {
      return createValidationError("id", "作業指示IDが必要です");
    }

    const updateData: any = {};
    if (input.processName !== undefined) updateData.processName = input.processName;
    if (input.processOrder !== undefined) updateData.processOrder = input.processOrder;
    if (input.plannedStartDate !== undefined) updateData.plannedStartDate = input.plannedStartDate;
    if (input.plannedEndDate !== undefined) updateData.plannedEndDate = input.plannedEndDate;
    if (input.plannedQuantity !== undefined) {
      if (input.plannedQuantity <= 0) {
        return createValidationError("plannedQuantity", "予定数量は0より大きい必要があります");
      }
      updateData.plannedQuantity = input.plannedQuantity;
    }
    if (input.actualStartDate !== undefined) updateData.actualStartDate = input.actualStartDate;
    if (input.actualEndDate !== undefined) updateData.actualEndDate = input.actualEndDate;
    if (input.actualQuantity !== undefined) updateData.actualQuantity = input.actualQuantity;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.predecessorId !== undefined) updateData.predecessorId = input.predecessorId;
    if (input.remarks !== undefined) updateData.remarks = input.remarks;

    const workOrder = await workOrderRepo.update(id, updateData);

    const serializedWorkOrder = {
      ...workOrder,
      plannedQuantity: Number((workOrder as any).plannedQuantity),
      actualQuantity: (workOrder as any).actualQuantity ? Number((workOrder as any).actualQuantity) : null,
      results: (workOrder as any).results ? (workOrder as any).results.map((r: any) => ({
        ...r,
        quantity: Number(r.quantity),
        defectQuantity: Number(r.defectQuantity)
      })) : undefined
    };

    return createSuccessResult(serializedWorkOrder);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * スケジュールを更新（ガントチャート用）
 */
export async function updateWorkOrderSchedule(input: UpdateScheduleInput): Promise<ActionResult<any>> {
  try {
    if (!input.id) {
      return createValidationError("id", "作業指示IDが必要です");
    }
    if (!input.startDate) {
      return createValidationError("startDate", "開始日が必要です");
    }
    if (!input.endDate) {
      return createValidationError("endDate", "終了日が必要です");
    }

    // 開始日と終了日の整合性チェック
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (start >= end) {
      return createValidationError("endDate", "終了日は開始日より後である必要があります");
    }

    const workOrder = await workOrderRepo.updateSchedule(
      input.id,
      input.startDate,
      input.endDate
    );

    const serializedWorkOrder = {
      ...workOrder,
      plannedQuantity: Number((workOrder as any).plannedQuantity),
      actualQuantity: (workOrder as any).actualQuantity ? Number((workOrder as any).actualQuantity) : null,
      results: (workOrder as any).results ? (workOrder as any).results.map((r: any) => ({
        ...r,
        quantity: Number(r.quantity),
        defectQuantity: Number(r.defectQuantity)
      })) : undefined
    };

    return createSuccessResult(serializedWorkOrder);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 作業指示を削除
 */
export async function deleteWorkOrder(id: string): Promise<ActionResult<null>> {
  try {
    if (!id) {
      return createValidationError("id", "作業指示IDが必要です");
    }

    await workOrderRepo.delete(id);
    return createSuccessResult(null);
  } catch (error) {
    return handlePrismaError(error);
  }
}
