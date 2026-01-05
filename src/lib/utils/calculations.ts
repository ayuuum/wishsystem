/**
 * 計算ロジックユーティリティ
 */

import type { WorkOrder, WorkResult } from "@prisma/client";

/**
 * 進捗率を計算（完了した工程数 / 全工程数）
 */
export function calculateProgress(workOrders: WorkOrder[]): number {
  if (workOrders.length === 0) return 0;
  
  const completedCount = workOrders.filter(
    wo => wo.status === 'COMPLETED'
  ).length;
  
  return Math.round((completedCount / workOrders.length) * 100);
}

/**
 * 工程の進捗率を計算（実績数量 / 予定数量）
 */
export function calculateWorkOrderProgress(workOrder: WorkOrder & { results?: WorkResult[] }): number {
  if (!workOrder.results || workOrder.results.length === 0) {
    return 0;
  }
  
  const totalQuantity = workOrder.results.reduce(
    (sum, result) => sum + Number(result.quantity),
    0
  );
  
  const plannedQuantity = Number(workOrder.plannedQuantity);
  
  if (plannedQuantity === 0) return 0;
  
  return Math.min(Math.round((totalQuantity / plannedQuantity) * 100), 100);
}

/**
 * 在庫不足を判定
 */
export function isLowStock(
  availableQuantity: number,
  safetyStock: number
): boolean {
  return availableQuantity < safetyStock;
}

/**
 * 原価を計算（BOMアイテムの合計）
 */
export function calculateTotalCost(bomItems: Array<{ totalCost: number | string }>): number {
  return bomItems.reduce((sum, item) => {
    return sum + Number(item.totalCost || 0);
  }, 0);
}

/**
 * 材料費と外注費を分類して計算
 */
export function calculateCostBreakdown(bomItems: Array<{ 
  itemType: string;
  totalCost: number | string;
}>): { materialCost: number; outsourcingCost: number } {
  let materialCost = 0;
  let outsourcingCost = 0;
  
  bomItems.forEach(item => {
    const cost = Number(item.totalCost || 0);
    if (item.itemType === 'MATERIAL' || item.itemType === 'PART') {
      materialCost += cost;
    } else {
      outsourcingCost += cost;
    }
  });
  
  return { materialCost, outsourcingCost };
}

/**
 * 作業時間を計算（実績の合計）
 */
export function calculateTotalWorkHours(results: WorkResult[]): number {
  return results.reduce((total, result) => {
    const start = new Date(result.startTime);
    const end = new Date(result.endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);
}

/**
 * 不良率を計算
 */
export function calculateDefectRate(
  totalQuantity: number,
  defectQuantity: number
): number {
  if (totalQuantity === 0) return 0;
  return Math.round((defectQuantity / totalQuantity) * 100 * 100) / 100;
}

