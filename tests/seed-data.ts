import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding test data...');

    // Create test item
    const item = await prisma.item.upsert({
        where: { itemCode: 'COMP-E2E' },
        update: {},
        create: {
            itemCode: 'COMP-E2E',
            itemName: 'E2E Component',
            itemType: 'PART',
            unit: '個',
            standardCost: 500,
        },
    });

    console.log('Created/Updated Item:', item.itemCode);

    // If we need inventory for it
    const inventory = await prisma.inventory.upsert({
        where: { itemCode: 'COMP-E2E' },
        update: {},
        create: {
            itemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            stockQuantity: 100,
            allocatedQuantity: 0,
            availableQuantity: 100,
            safetyStock: 10,
        },
    });

    console.log('Created/Updated Inventory for:', inventory.itemCode);

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
