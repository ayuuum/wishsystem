"use server";

import { prisma } from "@/lib/prisma";
import { createSuccessResult, handlePrismaError, createValidationError } from "@/lib/utils/errors";
import type { ActionResult } from "@/types/actions";
import { Prisma } from "@prisma/client";

/**
 * 部品マスタ一覧を取得
 */
export async function getItems(params?: { search?: string; itemType?: string }): Promise<ActionResult<any[]>> {
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

        const serializedItems = items.map(item => ({
            ...item,
            standardCost: Number(item.standardCost)
        }));

        return createSuccessResult(serializedItems);
    } catch (error) {
        return handlePrismaError(error);
    }
}

/**
 * 部品マスタをIDで取得
 */
export async function getItemById(id: string): Promise<ActionResult<any>> {
    try {
        if (!id) {
            return createValidationError("id", "部品IDが必要です");
        }

        const item = await prisma.item.findUnique({
            where: { id },
        });

        if (!item) {
            return { success: false, error: { message: "部品が見つかりませんでした" } };
        }

        const serializedItem = {
            ...item,
            standardCost: Number(item.standardCost)
        };

        return createSuccessResult(serializedItem);
    } catch (error) {
        return handlePrismaError(error);
    }
}

/**
 * 部品マスタを作成
 */
export async function createItem(input: {
    itemCode: string;
    itemName: string;
    itemType?: any;
    specification?: string;
    drawingNo?: string;
    unit: string;
    standardCost: number;
    externalItemId?: string;
}): Promise<ActionResult<any>> {
    try {
        if (!input.itemCode) return createValidationError("itemCode", "部品コードが必要です");
        if (!input.itemName) return createValidationError("itemName", "部品名が必要です");
        if (!input.unit) return createValidationError("unit", "単位が必要です");

        const item = await prisma.item.create({
            data: {
                ...input,
                itemType: input.itemType || "PART",
                standardCost: new Prisma.Decimal(input.standardCost || 0),
            }
        });

        const serializedItem = {
            ...item,
            standardCost: Number(item.standardCost)
        };

        return createSuccessResult(serializedItem);
    } catch (error) {
        return handlePrismaError(error);
    }
}
