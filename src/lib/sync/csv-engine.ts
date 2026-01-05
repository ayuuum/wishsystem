import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

export interface LegacyOrderCsv {
    orderNo: string;
    customerCode: string;
    customerName: string;
    productName: string;
    dueDate: string;
    estimatedPrice: string;
}

export async function importOrdersFromCsv(csvContent: string) {
    const records: LegacyOrderCsv[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
    });

    const results = [];

    for (const record of records) {
        const order = await prisma.order.upsert({
            where: { orderNo: record.orderNo },
            update: {
                customerCode: record.customerCode,
                customerName: record.customerName,
                productName: record.productName,
                dueDate: new Date(record.dueDate),
                estimatedPrice: parseFloat(record.estimatedPrice),
            },
            create: {
                orderNo: record.orderNo,
                customerCode: record.customerCode,
                customerName: record.customerName,
                productName: record.productName,
                orderedDate: new Date(),
                dueDate: new Date(record.dueDate),
                estimatedPrice: parseFloat(record.estimatedPrice),
                status: 'DRAFT',
            },
        });
        results.push(order);
    }

    return results;
}

export async function exportResultsToCsv(orderId: string) {
    const workOrders = await prisma.workOrder.findMany({
        where: { orderId },
        include: { results: true },
    });

    const header = "受注番号,工程名,予定数量,実績数量,開始日,終了日\n";
    const rows = workOrders.map(wo => {
        const actualQty = wo.results.reduce((sum, r) => sum + Number(r.quantity), 0);
        return `${wo.orderId},${wo.processName},${wo.plannedQuantity},${actualQty},${wo.plannedStartDate.toISOString()},${wo.plannedEndDate.toISOString()}`;
    }).join("\n");

    return header + rows;
}
