"use server";

import { RepositoryFactory } from "@/lib/db/repository";
import { createSuccessResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult } from "@/types/actions";
import { calculateAverageProcessTime, predictProcessTime, calculateSimilarityScore } from "@/lib/utils/ai";

const workResultRepo = RepositoryFactory.getWorkResultRepository();
const orderRepo = RepositoryFactory.getOrderRepository();
const bomRepo = RepositoryFactory.getBomRepository();

/**
 * 工程の予測作業時間を取得
 * @param processName 工程名
 * @param plannedQuantity 予定数量（オプション）
 * @returns 予測作業時間（時間単位）
 */
export async function predictProcessTimeAction(
  processName: string,
  plannedQuantity?: number
): Promise<ActionResult<{ predictedHours: number | null; averageHours: number | null; dataCount: number }>> {
  try {
    if (!processName) {
      return createValidationError("processName", "工程名が必要です") as ActionResult<{ predictedHours: number | null; averageHours: number | null; dataCount: number }>;
    }

    // 過去の実績データを取得
    const results = await workResultRepo.findByProcessName(processName);

    if (results.length === 0) {
      return createSuccessResult({
        predictedHours: null,
        averageHours: null,
        dataCount: 0,
      });
    }

    // 平均作業時間を計算
    const averageHours = calculateAverageProcessTime(processName, results);

    if (averageHours === null) {
      return createSuccessResult({
        predictedHours: null,
        averageHours: null,
        dataCount: results.length,
      });
    }

    // 数量を考慮した予測時間を計算
    let predictedHours: number | null = null;
    if (plannedQuantity !== undefined && plannedQuantity > 0) {
      // 平均実績数量を計算
      const averageQuantity = results.reduce((sum, r) => sum + Number(r.quantity), 0) / results.length;
      const averageTimePerUnit = averageHours / averageQuantity;
      predictedHours = predictProcessTime(processName, plannedQuantity, averageTimePerUnit);
    } else {
      predictedHours = averageHours;
    }

    return createSuccessResult({
      predictedHours,
      averageHours,
      dataCount: results.length,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * 類似案件からBOMを提案
 * @param orderId 現在の案件ID
 * @returns 類似案件とそのBOMのリスト
 */
export async function suggestBomFromSimilarOrders(
  orderId: string
): Promise<ActionResult<Array<{
  order: {
    id: string;
    orderNo: string;
    productName: string;
    customerName: string;
    orderedDate: Date;
  };
  bomItems: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    level: number;
  }>;
  similarityScore: number;
}>>> {
  try {
    if (!orderId) {
      return createValidationError("orderId", "案件IDが必要です") as any;
    }

    // 現在の案件を取得
    const currentOrder = await orderRepo.findById(orderId);
    if (!currentOrder) {
      return createValidationError("orderId", "案件が見つかりません") as any;
    }

    // 類似案件を検索
    const similarOrders = await orderRepo.findSimilarOrders(
      currentOrder.productName,
      currentOrder.customerName,
      orderId
    );

    if (similarOrders.length === 0) {
      return createSuccessResult([]);
    }

    // 各類似案件のBOMを取得し、類似度スコアを計算
    const suggestions = await Promise.all(
      similarOrders.map(async (order) => {
        const bomItems = await bomRepo.findByOrderId(order.id);

        // 階層構造をフラット化
        const flattenBom = (items: any[]): any[] => {
          const result: any[] = [];
          items.forEach((item) => {
            result.push({
              id: item.id,
              itemCode: item.itemCode,
              itemName: item.itemName,
              quantity: Number(item.quantity),
              unit: item.unit,
              unitCost: Number(item.unitCost),
              totalCost: Number(item.totalCost),
              level: item.level,
            });
            if (item.childBoms && item.childBoms.length > 0) {
              result.push(...flattenBom(item.childBoms));
            }
          });
          return result;
        };

        const flatBomItems = flattenBom(bomItems);

        const similarityScore = calculateSimilarityScore(
          {
            productName: currentOrder.productName,
            customerName: currentOrder.customerName,
          },
          {
            productName: order.productName,
            customerName: order.customerName,
          }
        );

        return {
          order: {
            id: order.id,
            orderNo: order.orderNo,
            productName: order.productName,
            customerName: order.customerName,
            orderedDate: order.orderedDate,
          },
          bomItems: flatBomItems,
          similarityScore,
        };
      })
    );

    // 類似度スコアでソート（降順）
    suggestions.sort((a, b) => b.similarityScore - a.similarityScore);

    return createSuccessResult(suggestions);
  } catch (error) {
    return handlePrismaError(error);
  }
}

