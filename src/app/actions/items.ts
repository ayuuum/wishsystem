"use server";

import { prisma } from "@/lib/prisma";
import { createSuccessResult, handlePrismaError } from "@/lib/utils/errors";
import type { ActionResult } from "@/types/actions";

/**
 * 部品マスタ一覧を取得
 */
export async function getItems(params?: { search?: string; itemType?: string }): Promise<ActionResult> {
    try {
        const where: any = {};

        if (params?.search) {
            where.OR = [
                { itemCode: { contains: params.search, mode: 'insensitive' } },
                { itemName: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        if (params?.itemType) {
            where.itemType = params.itemType;
        }

        const items = await prisma.item.findMany({
            where,
            orderBy: { itemCode: 'asc' },
        });

        return createSuccessResult(items);
    } catch (error) {
        return handlePrismaError(error);
    }
}

/**
 * 部品マスタをIDで取得
 */
export async function getItemById(id: string): Promise<ActionResult> {
    try {
        if (!id) {
            return { success: false, error: { message: "部品IDが必要です" } };
        }

        const item = await prisma.item.findUnique({
            where: { id },
        });

        if (!item) {
            return { success: false, error: { message: "部品が見つかりませんでした" } };
        }

        return createSuccessResult(item);
    } catch (error) {
        return handlePrismaError(error);
    }
}

