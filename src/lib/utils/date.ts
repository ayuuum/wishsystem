/**
 * 日付フォーマット・計算ユーティリティ
 */

import { format, formatDistance, differenceInDays, isBefore, isAfter, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 日付を日本語形式でフォーマット
 */
export function formatDate(date: Date | string, formatStr: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: ja });
}

/**
 * 日時を日本語形式でフォーマット
 */
export function formatDateTime(date: Date | string, formatStr: string = 'yyyy-MM-dd HH:mm'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: ja });
}

/**
 * 相対時間を表示（例: "3日前"）
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true, locale: ja });
}

/**
 * 日数の差を計算
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  return differenceInDays(endDate, startDate);
}

/**
 * 納期が近いかどうかを判定（デフォルト: 7日以内）
 */
export function isDueDateNear(dueDate: Date | string, days: number = 7): boolean {
  const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(d);
  targetDate.setHours(0, 0, 0, 0);
  
  return isBefore(targetDate, addDays(today, days)) && !isBefore(targetDate, today);
}

/**
 * 納期が過ぎているかどうかを判定
 */
export function isDueDatePassed(dueDate: Date | string): boolean {
  const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(d);
  targetDate.setHours(0, 0, 0, 0);
  
  return isBefore(targetDate, today);
}

/**
 * 時間の差分を計算（時間単位）
 */
export function hoursBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
}

