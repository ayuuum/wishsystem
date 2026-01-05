"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, createErrorResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult, CreateOrderInput, UpdateOrderInput, GetOrdersParams, GetOrdersResult } from "@/types/actions";
import { OrderStatus } from "@prisma/client";

const orderRepo = RepositoryFactory.getOrderRepository();

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
      orders,
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
export async function getOrderById(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return createValidationError("id", "案件IDが必要です");
    }

    const order = await orderRepo.findById(id);
    
    if (!order) {
      return createErrorResult("案件が見つかりませんでした", "NOT_FOUND");
    }

    return createSuccessResult(order);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 新規案件を作成
 */
export async function createOrder(input: CreateOrderInput): Promise<ActionResult> {
  try {
    // バリデーション
    if (!input.orderNo) {
      return createValidationError("orderNo", "案件番号が必要です");
    }
    if (!input.customerName) {
      return createValidationError("customerName", "顧客名が必要です");
    }
    if (!input.productName) {
      return createValidationError("productName", "製品名が必要です");
    }
    if (!input.dueDate) {
      return createValidationError("dueDate", "納期が必要です");
    }

    const order = await orderRepo.create({
      orderNo: input.orderNo,
      customerCode: input.customerCode,
      customerName: input.customerName,
      productName: input.productName,
      productSpec: input.productSpec,
      orderedDate: input.orderedDate,
      dueDate: input.dueDate,
      estimatedPrice: input.estimatedPrice,
      status: input.status || OrderStatus.DRAFT,
      priority: input.priority || 3,
      salesRepId: input.salesRepId,
      designerId: input.designerId,
      productionManagerId: input.productionManagerId,
      isDeleted: false,
    });

    return createSuccessResult(order);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 案件を更新
 */
export async function updateOrder(id: string, input: UpdateOrderInput): Promise<ActionResult> {
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
    return createSuccessResult(order);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 案件を削除（論理削除）
 */
export async function deleteOrder(id: string): Promise<ActionResult> {
  try {
    if (!id) {
      return createValidationError("id", "案件IDが必要です");
    }

    await orderRepo.delete(id);
    return createSuccessResult(null);
  } catch (error) {
    return handlePrismaError(error);
  }
}

