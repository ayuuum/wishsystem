import { PrismaClient, OrderStatus, ItemType, WorkOrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // 1. Items (Master Data)
    const item1 = await prisma.item.upsert({
        where: { itemCode: 'P-001' },
        update: {},
        create: {
            itemCode: 'P-001',
            itemName: '精密アルミハウジング',
            itemType: ItemType.PRODUCT,
            specification: 'AL6061-T6, 精度±0.01',
            unit: 'pcs',
            standardCost: 5000,
        },
    });

    const item2 = await prisma.item.upsert({
        where: { itemCode: 'M-010' },
        update: {},
        create: {
            itemCode: 'M-010',
            itemName: 'アルミ丸棒 φ50',
            itemType: ItemType.MATERIAL,
            unit: 'm',
            standardCost: 1200,
        },
    });

    // 2. Inventory
    await prisma.inventory.upsert({
        where: { itemCode: 'M-010' },
        update: {},
        create: {
            itemId: item2.id,
            itemCode: item2.itemCode,
            itemName: item2.itemName,
            stockQuantity: 15.5,
            availableQuantity: 12.0,
            safetyStock: 5.0,
        },
    });

    // 3. Process Templates
    const template = await prisma.processTemplate.create({
        data: {
            templateName: '標準切削加工フロー',
            description: '旋盤 -> マシニング -> 検査',
            items: {
                create: [
                    { processName: '旋盤加工', processOrder: 1, standardDays: 2 },
                    { processName: 'マシニング加工', processOrder: 2, standardDays: 3 },
                    { processName: '最終検査', processOrder: 3, standardDays: 1 },
                ],
            },
        },
    });

    // 4. Sample Order
    const order = await prisma.order.create({
        data: {
            orderNo: 'ORD-2026-001',
            customerCode: 'C-001',
            customerName: '株式会社テスト工業',
            productName: '精密アルミハウジング',
            productSpec: '試作 第1ロット',
            orderedDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days later
            estimatedPrice: 250000,
            status: OrderStatus.IN_PRODUCTION,
            priority: 2,
        },
    });

    // 5. BOM for the order
    await prisma.orderBom.create({
        data: {
            orderId: order.id,
            itemId: item2.id,
            itemCode: item2.itemCode,
            itemName: item2.itemName,
            quantity: 5,
            unit: 'm',
            level: 1,
            unitCost: 1200,
            totalCost: 6000,
        },
    });

    // 6. Work Orders
    await prisma.workOrder.createMany({
        data: [
            {
                orderId: order.id,
                processName: '旋盤加工',
                processOrder: 1,
                plannedStartDate: new Date(),
                plannedEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                plannedQuantity: 50,
                status: WorkOrderStatus.IN_PROGRESS,
                actualStartDate: new Date(),
            },
            {
                orderId: order.id,
                processName: 'マシニング加工',
                processOrder: 2,
                plannedStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                plannedEndDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
                plannedQuantity: 50,
                status: WorkOrderStatus.PLANNED,
            },
        ],
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
