/**
 * AI機能のユーティリティ関数
 * 工程時間予測や類似度計算など
 */

import type { WorkResult } from "@prisma/client";

/**
 * 工程名ごとの平均作業時間を計算
 * @param processName 工程名
 * @param results 実績データ（WorkOrderとのjoin済み）
 * @returns 平均作業時間（時間単位）
 */
export function calculateAverageProcessTime(
  processName: string,
  results: Array<WorkResult & { workOrder: { processName: string; plannedQuantity: any } }>
): number | null {
  if (results.length === 0) {
    return null;
  }

  // 各実績の作業時間を計算
  const workTimes = results.map((result) => {
    const start = new Date(result.startTime);
    const end = new Date(result.endTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours;
  });

  // 平均作業時間を計算
  const totalHours = workTimes.reduce((sum, hours) => sum + hours, 0);
  const averageHours = totalHours / workTimes.length;

  return averageHours;
}

/**
 * 数量を考慮した予測時間を計算
 * @param processName 工程名
 * @param quantity 予定数量
 * @param averageTimePerUnit 単位数量あたりの平均作業時間
 * @returns 予測時間（時間単位）
 */
export function predictProcessTime(
  processName: string,
  quantity: number,
  averageTimePerUnit: number
): number {
  return averageTimePerUnit * quantity;
}

/**
 * 類似案件の類似度スコアを計算
 * @param currentOrder 現在の案件
 * @param similarOrder 類似案件
 * @returns 類似度スコア（0-130）
 */
export function calculateSimilarityScore(
  currentOrder: { productName: string; customerName: string },
  similarOrder: { productName: string; customerName: string }
): number {
  let score = 0;

  // 製品名完全一致: +100点
  if (currentOrder.productName === similarOrder.productName) {
    score += 100;
  }
  // 製品名部分一致: +50点
  else if (
    currentOrder.productName &&
    similarOrder.productName &&
    similarOrder.productName.includes(currentOrder.productName)
  ) {
    score += 50;
  }
  // 顧客名一致: +30点
  if (currentOrder.customerName === similarOrder.customerName) {
    score += 30;
  }

  return score;
}

