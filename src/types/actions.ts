/**
 * Server Actions用の型定義
 */

import type { OrderStatus, WorkOrderStatus } from "@prisma/client";

// ==================== 案件管理 ====================

export interface CreateOrderInput {
  orderNo: string;
  customerCode: string;
  customerName: string;
  productName: string;
  productSpec?: string;
  orderedDate: Date;
  dueDate: Date;
  estimatedPrice: number;
  status?: OrderStatus;
  priority?: number;
  salesRepId?: string;
  designerId?: string;
  productionManagerId?: string;
}

export interface UpdateOrderInput {
  customerCode?: string;
  customerName?: string;
  productName?: string;
  productSpec?: string;
  orderedDate?: Date;
  dueDate?: Date;
  estimatedPrice?: number;
  status?: OrderStatus;
  priority?: number;
  salesRepId?: string;
  designerId?: string;
  productionManagerId?: string;
}

export interface GetOrdersParams {
  search?: string;
  status?: OrderStatus;
  priority?: number;
  page?: number;
  pageSize?: number;
}

import type { Order } from "@prisma/client";

export interface GetOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== BOM管理 ====================

export interface CreateBomItemInput {
  orderId: string;
  parentBomId?: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  level: number;
  sortOrder?: number;
  unitCost: number;
  totalCost: number;
  leadTimeDays?: number;
  supplierId?: string;
  remarks?: string;
}

export interface UpdateBomItemInput {
  itemId?: string;
  itemCode?: string;
  itemName?: string;
  quantity?: number;
  unit?: string;
  level?: number;
  sortOrder?: number;
  unitCost?: number;
  totalCost?: number;
  leadTimeDays?: number;
  supplierId?: string;
  remarks?: string;
}

// ==================== 製造実績 ====================

export interface CreateWorkResultInput {
  workOrderId: string;
  workerId: string;
  workDate: Date;
  startTime: Date;
  endTime: Date;
  quantity: number;
  defectQuantity?: number;
  remarks?: string;
}

// ==================== スケジュール管理 ====================

export interface CreateWorkOrderInput {
  orderId: string;
  processName: string;
  processOrder: number;
  plannedStartDate: Date;
  plannedEndDate: Date;
  plannedQuantity: number;
  predecessorId?: string;
  remarks?: string;
}

export interface UpdateWorkOrderInput {
  processName?: string;
  processOrder?: number;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  plannedQuantity?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  actualQuantity?: number;
  status?: WorkOrderStatus;
  predecessorId?: string;
  remarks?: string;
}

export interface UpdateScheduleInput {
  id: string;
  startDate: Date;
  endDate: Date;
}

// ==================== 在庫管理 ====================

export interface GetInventoryParams {
  search?: string;
  lowStock?: boolean;
}

// ==================== エラーレスポンス ====================

export interface ActionError {
  message: string;
  code?: string;
  field?: string;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: ActionError;
}

