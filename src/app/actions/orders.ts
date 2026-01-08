"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, createErrorResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult, CreateOrderInput, UpdateOrderInput, GetOrdersParams, GetOrdersResult } from "@/types/actions";
import { OrderStatus, Prisma } from "@prisma/client";

const orderRepo = RepositoryFactory.getOrderRepository();

/**
 * 案件オブジェクトをシリアライズ（DecimalをNumberに変換）
 */
function serializeOrder(order: any) {
  if (!order) return null;

  return {
    ...order,
    estimatedPrice: Number(order.estimatedPrice),
    bomItems: order.bomItems ? order.bomItems.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      unitCost: Number(item.unitCost),
      totalCost: Number(item.totalCost),
      item: item.item ? {
        ...item.item,
        standardCost: Number(item.item.standardCost)
      } : null
    })) : undefined,
    workOrders: order.workOrders ? order.workOrders.map((wo: any) => ({
      ...wo,
      plannedQuantity: Number(wo.plannedQuantity),
      actualQuantity: wo.actualQuantity ? Number(wo.actualQuantity) : null,
      results: wo.results ? wo.results.map((res: any) => ({
        ...res,
        quantity: Number(res.quantity),
        defectQuantity: Number(res.defectQuantity)
      })) : undefined
    })) : undefined
  };
}

/**
 * 案件一覧を取得
 */
export async function getOrders(params: GetOrdersParams = {}): Promise<ActionResult<GetOrdersResult>> {
  try {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      orderRepo.findMany({
        search: params.search,
        status: params.status,
        priority: params.priority,
        skip,
        take: pageSize,
      }),
      orderRepo.count({
        search: params.search,
        status: params.status,
      }),
    ]);

    return createSuccessResult({
      orders: orders.map((o: any) => ({
        ...o,
        estimatedPrice: Number(o.estimatedPrice)
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 案件詳細を取得
 */
export async function getOrderById(id: string): Promise<ActionResult<any>> {
  try {
    if (!id) {
      return createValidationError("id", "案件IDが必要です");
    }

    const order = await orderRepo.findById(id);

    if (!order) {
      return createErrorResult("案件が見つかりませんでした", "NOT_FOUND");
    }

    return createSuccessResult(serializeOrder(order));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 新規案件を作成
 */
export async function createOrder(input: CreateOrderInput): Promise<ActionResult<any>> {
  try {
    // バリデーション
    if (!input.orderNo) {
      return createValidationError("orderNo", "案件番号が必要です");
    }
    if (!input.customerCode) {
      return createValidationError("customerCode", "顧客コードが必要です");
    }
    if (!input.customerName) {
      return createValidationError("customerName", "顧客名が必要です");
    }
    if (!input.productName) {
      return createValidationError("productName", "製品名が必要です");
    }
    if (!input.orderedDate) {
      return createValidationError("orderedDate", "受注日が必要です");
    }
    if (!input.dueDate) {
      return createValidationError("dueDate", "納期が必要です");
    }
    if (input.estimatedPrice === undefined) {
      return createValidationError("estimatedPrice", "見積単価が必要です");
    }

    const order = await orderRepo.create({
      orderNo: input.orderNo,
      customerCode: input.customerCode,
      customerName: input.customerName,
      productName: input.productName,
      productSpec: input.productSpec || null,
      orderedDate: input.orderedDate,
      dueDate: input.dueDate,
      estimatedPrice: new Prisma.Decimal(input.estimatedPrice),
      status: input.status || OrderStatus.DRAFT,
      priority: input.priority || 3,
      salesRepId: input.salesRepId || null,
      designerId: input.designerId || null,
      productionManagerId: input.productionManagerId || null,
      isDeleted: false,
    });

    return createSuccessResult(serializeOrder(order));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 案件を更新
 */
export async function updateOrder(id: string, input: UpdateOrderInput): Promise<ActionResult<any>> {
  try {
    if (!id) {
      return createValidationError("id", "案件IDが必要です");
    }

    // 案件が存在するか確認
    const existing = await orderRepo.findById(id);
    if (!existing) {
      return createErrorResult("案件が見つかりませんでした", "NOT_FOUND");
    }

    const updateData: any = {};
    if (input.customerCode !== undefined) updateData.customerCode = input.customerCode;
    if (input.customerName !== undefined) updateData.customerName = input.customerName;
    if (input.productName !== undefined) updateData.productName = input.productName;
    if (input.productSpec !== undefined) updateData.productSpec = input.productSpec;
    if (input.orderedDate !== undefined) updateData.orderedDate = input.orderedDate;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
    if (input.estimatedPrice !== undefined) updateData.estimatedPrice = input.estimatedPrice;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.salesRepId !== undefined) updateData.salesRepId = input.salesRepId;
    if (input.designerId !== undefined) updateData.designerId = input.designerId;
    if (input.productionManagerId !== undefined) updateData.productionManagerId = input.productionManagerId;

    const order = await orderRepo.update(id, updateData);

    // ステータスが PLANNING に変更された場合、在庫を引き当てる
    if (input.status === OrderStatus.PLANNING && existing.status !== OrderStatus.PLANNING) {
      const { allocateInventoryForOrder } = await import("./inventory");
      await allocateInventoryForOrder(id);
    }

    // ステータスが PLANNING または IN_PRODUCTION から前の状態に戻された場合、引き当てをキャンセル
    const plannedStatuses = [OrderStatus.PLANNING, OrderStatus.IN_PRODUCTION] as string[];
    if (input.status && !plannedStatuses.includes(input.status as string) && plannedStatuses.includes(existing.status as string)) {
      const { revertInventoryAllocation } = await import("./inventory");
      await revertInventoryAllocation(id);
    }

    return createSuccessResult(serializeOrder(order));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 案件を削除（論理削除）
 */
export async function deleteOrder(id: string): Promise<ActionResult<null>> {
  try {
    if (!id) {
      return createValidationError("id", "案件IDが必要です");
    }

    // 削除前に引き当てがあれば解除
    const existing = await orderRepo.findById(id);
    if (existing && ([OrderStatus.PLANNING, OrderStatus.IN_PRODUCTION] as string[]).includes(existing.status as string)) {
      const { revertInventoryAllocation } = await import("./inventory");
      await revertInventoryAllocation(id);
    }

    await orderRepo.delete(id);
    return createSuccessResult(null);
  } catch (error) {
    return handlePrismaError(error);
  }
}
