"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, handlePrismaError } from "@/lib/utils/errors";
import type { ActionResult } from "@/types/actions";
import { OrderStatus, WorkOrderStatus } from "@prisma/client";
import { isDueDateNear, isDueDatePassed } from "@/lib/utils/date";

const orderRepo = RepositoryFactory.getOrderRepository();
const workOrderRepo = RepositoryFactory.getWorkOrderRepository();
const inventoryRepo = RepositoryFactory.getInventoryRepository();

/**
 * ダッシュボードの統計データを取得
 */
export async function getDashboardStats(): Promise<ActionResult<any>> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // 進行中の案件数
    const inProgressOrders = await orderRepo.findMany({
      status: OrderStatus.IN_PRODUCTION,
    });

    // 納期間近の案件（1週間以内）
    const allOrders = await orderRepo.findMany();
    const nearDueDateOrders = allOrders.filter(order => {
      return isDueDateNear(order.dueDate, 7) && !isDueDatePassed(order.dueDate);
    });

    // 今月の完了案件
    const completedOrders = await orderRepo.findMany({
      status: OrderStatus.COMPLETED,
    });
    const thisMonthCompleted = completedOrders.filter(order => {
      const completedDate = new Date(order.updatedAt);
      return completedDate >= oneMonthAgo;
    });

    // 本日の稼働工程
    // すべての作業指示を取得するために、まずすべての案件を取得
    const allOrdersForWorkOrders = await orderRepo.findMany({});
    const allWorkOrders: Array<{ id: string; orderId: string; processName: string; status: WorkOrderStatus; plannedStartDate: Date | null; plannedEndDate: Date | null }> = [];
    for (const order of allOrdersForWorkOrders) {
      const workOrders = await workOrderRepo.findByOrderId(order.id);
      allWorkOrders.push(...workOrders.map(wo => ({
        id: wo.id,
        orderId: wo.orderId,
        processName: wo.processName,
        status: wo.status,
        plannedStartDate: wo.plannedStartDate,
        plannedEndDate: wo.plannedEndDate,
      })));
    }
    const todayWorkOrders = allWorkOrders.filter((wo) => {
      return wo.status === WorkOrderStatus.IN_PROGRESS;
    });

    // 在庫統計
    const inventoryStats = await inventoryRepo.getStats();

    // アラート通知
    const alerts: any[] = [];

    // 在庫不足アラート
    const lowStockItems = await inventoryRepo.findMany({ lowStock: true });
    lowStockItems.forEach(item => {
      alerts.push({
        type: "inventory",
        severity: "warning",
        title: `在庫不足: ${item.itemName}`,
        message: `有効在庫が安全在庫を下回っています (${item.itemCode})`,
      });
    });

    // 工程遅延アラート
    allWorkOrders.forEach((wo) => {
      if (wo.plannedStartDate && new Date(wo.plannedStartDate) < today && wo.status === WorkOrderStatus.PLANNED) {
        const order = allOrders.find((o) => o.id === wo.orderId);
        alerts.push({
          type: "delay",
          severity: "error",
          title: `工程遅延: ${wo.processName}`,
          message: `予定開始日から ${Math.floor((today.getTime() - new Date(wo.plannedStartDate).getTime()) / (1000 * 60 * 60 * 24))} 日経過しています`,
          orderId: wo.orderId,
          orderNo: order?.orderNo,
        });
      }
    });

    // BOM未作成アラート
    const bomReviewOrders = await orderRepo.findMany({
      status: OrderStatus.BOM_REVIEW,
    });
    bomReviewOrders.forEach(order => {
      alerts.push({
        type: "bom",
        severity: "info",
        title: `BOM未作成: ${order.productName}`,
        message: "設計部門による部品表の登録が必要です",
        orderId: order.id,
        orderNo: order.orderNo,
      });
    });

    // 直近の製造予定（今後1週間）
    const upcomingWorkOrders = allWorkOrders
      .filter((wo) => {
        if (!wo.plannedStartDate) return false;
        const startDate = new Date(wo.plannedStartDate);
        return startDate >= today && startDate <= oneWeekLater;
      })
      .slice(0, 10)
      .map((wo) => {
        const order = allOrders.find((o) => o.id === wo.orderId);
        return {
          id: wo.id,
          processName: wo.processName,
          orderNo: order?.orderNo || '',
          productName: order?.productName || '',
          plannedStartDate: wo.plannedStartDate,
          plannedEndDate: wo.plannedEndDate,
          status: wo.status,
        };
      });

    return createSuccessResult({
      inProgressCount: inProgressOrders.length,
      nearDueDateCount: nearDueDateOrders.length,
      thisMonthCompletedCount: thisMonthCompleted.length,
      todayWorkOrdersCount: todayWorkOrders.length,
      inventoryStats: {
        totalItems: inventoryStats.totalItems,
        lowStockCount: inventoryStats.lowStockCount,
        totalAllocated: inventoryStats.totalAllocated,
      },
      alerts: alerts.slice(0, 10), // 最大10件
      upcomingWorkOrders,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}
