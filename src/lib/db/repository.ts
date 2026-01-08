/**
 * データベース抽象化レイヤー
 * 後でDBを変更する場合、このインターフェースを実装する新しいリポジトリを作成するだけで対応可能
 */

import { prisma } from "@/lib/prisma";
import type {
  Order,
  OrderBom,
  WorkOrder,
  WorkResult,
  Inventory,
  Item,
  OrderStatus
} from "@prisma/client";
import { WorkOrderStatus, Prisma } from "@prisma/client";

// ==================== 型定義 ====================

export interface OrderWithRelations extends Order {
  bomItems?: OrderBom[];
  workOrders?: WorkOrder[];
}

export interface BomItemWithRelations extends OrderBom {
  item?: Item;
  childBoms?: BomItemWithRelations[];
}

export interface WorkOrderWithResults extends WorkOrder {
  results?: WorkResult[];
}

export interface InventoryWithItem extends Inventory {
  item?: Item;
}

// ==================== リポジトリインターフェース ====================

export interface IOrderRepository {
  findMany(params?: { search?: string; status?: OrderStatus; priority?: number; skip?: number; take?: number }): Promise<Order[]>;
  findById(id: string): Promise<OrderWithRelations | null>;
  create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order>;
  delete(id: string): Promise<void>;
  count(params?: { search?: string; status?: OrderStatus }): Promise<number>;
  findSimilarOrders(productName?: string, customerName?: string, excludeOrderId?: string): Promise<Order[]>;
}

export interface IBomRepository {
  findByOrderId(orderId: string): Promise<BomItemWithRelations[]>;
  create(data: Omit<OrderBom, 'id' | 'createdAt' | 'updatedAt'>): Promise<OrderBom>;
  update(id: string, data: Partial<OrderBom>): Promise<OrderBom>;
  delete(id: string): Promise<void>;
  getTotalCost(orderId: string): Promise<number>;
}

export interface IWorkOrderRepository {
  findById(id: string): Promise<WorkOrderWithResults | null>;
  findByOrderId(orderId: string): Promise<WorkOrderWithResults[]>;
  create(data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkOrder>;
  update(id: string, data: Partial<WorkOrder>): Promise<WorkOrder>;
  delete(id: string): Promise<void>;
  updateSchedule(id: string, startDate: Date, endDate: Date): Promise<WorkOrder>;
}

export interface IWorkResultRepository {
  create(data: Omit<WorkResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkResult>;
  findByOrderId(orderId: string): Promise<WorkResult[]>;
  findByWorkOrderId(workOrderId: string): Promise<WorkResult[]>;
  findToday(): Promise<WorkResult[]>;
  findByProcessName(processName: string): Promise<Array<WorkResult & { workOrder: { processName: string; plannedQuantity: any } }>>;
}

export interface IInventoryRepository {
  findMany(params?: { search?: string; lowStock?: boolean }): Promise<InventoryWithItem[]>;
  findById(id: string): Promise<InventoryWithItem | null>;
  findByItemCode(itemCode: string): Promise<InventoryWithItem | null>;
  update(id: string, data: Partial<Inventory>): Promise<Inventory>;
  getStats(): Promise<{ totalItems: number; lowStockCount: number; totalAllocated: number }>;
}

// ==================== Prisma実装 ====================

export class PrismaOrderRepository implements IOrderRepository {
  async findMany(params?: { search?: string; status?: OrderStatus; priority?: number; skip?: number; take?: number }) {
    const where: any = {
      isDeleted: false,
    };

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.priority) {
      where.priority = params.priority;
    }

    if (params?.search) {
      where.OR = [
        { orderNo: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
        { productName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.order.findMany({
      where,
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    try {
      return await prisma.order.findUnique({
        where: { id },
        include: {
          bomItems: {
            include: { item: true },
            orderBy: [
              { level: "asc" },
              { sortOrder: "asc" }
            ],
          },
          workOrders: {
            include: { results: true },
            orderBy: { processOrder: 'asc' },
          },
        },
      });
    } catch (error) {
      console.error(`Order findById error (id: ${id}):`, error);
      throw error;
    }
  }

  async create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      return await prisma.order.create({ data });
    } catch (error) {
      console.error('Order create error:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Order>) {
    try {
      return await prisma.order.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error(`Order update error (id: ${id}):`, error);
      throw error;
    }
  }

  async delete(id: string) {
    await prisma.order.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async count(params?: { search?: string; status?: OrderStatus }) {
    const where: any = {
      isDeleted: false,
    };

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.search) {
      where.OR = [
        { orderNo: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
        { productName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.order.count({ where });
  }

  async findSimilarOrders(productName?: string, customerName?: string, excludeOrderId?: string) {
    const where: any = {
      isDeleted: false,
    };

    if (excludeOrderId) {
      where.id = { not: excludeOrderId };
    }

    const orConditions: any[] = [];
    if (productName) {
      orConditions.push(
        { productName: { equals: productName, mode: 'insensitive' } },
        { productName: { contains: productName, mode: 'insensitive' } }
      );
    }
    if (customerName) {
      orConditions.push({ customerName: { equals: customerName, mode: 'insensitive' } });
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    } else {
      // 条件がない場合は空配列を返す
      return [];
    }

    return await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10, // 最大10件
    });
  }
}

export class PrismaBomRepository implements IBomRepository {
  async findByOrderId(orderId: string) {
    const items = await prisma.orderBom.findMany({
      where: { orderId },
      include: { item: true },
      orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
    });

    // 階層構造に変換
    const rootItems = items.filter(item => item.level === 0);
    const buildTree = (parentId: string | null): BomItemWithRelations[] => {
      return items
        .filter(item => item.parentBomId === parentId)
        .map(item => ({
          ...item,
          childBoms: buildTree(item.id),
        }));
    };

    return rootItems.map(item => ({
      ...item,
      childBoms: buildTree(item.id),
    }));
  }

  async create(data: Omit<OrderBom, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.orderBom.create({ data });
  }

  async update(id: string, data: Partial<OrderBom>) {
    return await prisma.orderBom.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await prisma.orderBom.delete({ where: { id } });
  }

  async getTotalCost(orderId: string) {
    const result = await prisma.orderBom.aggregate({
      where: { orderId },
      _sum: { totalCost: true },
    });
    return Number(result._sum.totalCost || 0);
  }
}

export class PrismaWorkOrderRepository implements IWorkOrderRepository {
  async findById(id: string) {
    return await prisma.workOrder.findUnique({
      where: { id },
      include: { results: true },
    });
  }

  async findByOrderId(orderId: string) {
    return await prisma.workOrder.findMany({
      where: { orderId },
      include: { results: true },
      orderBy: { processOrder: 'asc' },
    });
  }

  async findMany(params?: { orderId?: string }) {
    const where: any = {};
    if (params?.orderId) {
      where.orderId = params.orderId;
    }
    return await prisma.workOrder.findMany({
      where,
      include: { results: true },
      orderBy: { processOrder: 'asc' },
    });
  }

  async create(data: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.workOrder.create({ data });
  }

  async update(id: string, data: Partial<WorkOrder>) {
    return await prisma.workOrder.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await prisma.workOrder.delete({ where: { id } });
  }

  async updateSchedule(id: string, startDate: Date, endDate: Date) {
    return await prisma.workOrder.update({
      where: { id },
      data: { plannedStartDate: startDate, plannedEndDate: endDate },
    });
  }
}

export class PrismaWorkResultRepository implements IWorkResultRepository {
  async create(data: Omit<WorkResult, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.workResult.create({ data });
  }

  async findByOrderId(orderId: string) {
    const workOrders = await prisma.workOrder.findMany({
      where: { orderId },
      select: { id: true },
    });
    const workOrderIds = workOrders.map(wo => wo.id);

    return await prisma.workResult.findMany({
      where: { workOrderId: { in: workOrderIds } },
      orderBy: { workDate: 'desc' },
    });
  }

  async findByWorkOrderId(workOrderId: string) {
    return await prisma.workResult.findMany({
      where: { workOrderId },
      orderBy: { workDate: 'desc' },
    });
  }

  async findToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await prisma.workResult.findMany({
      where: {
        workDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findByProcessName(processName: string) {
    // 過去6ヶ月のデータのみを使用
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    return await prisma.workResult.findMany({
      where: {
        workDate: {
          gte: sixMonthsAgo,
        },
        workOrder: {
          processName: processName,
        },
      },
      include: {
        workOrder: {
          select: {
            processName: true,
            plannedQuantity: true,
          },
        },
      },
      orderBy: { workDate: 'desc' },
    });
  }
}

export class PrismaInventoryRepository implements IInventoryRepository {
  async findMany(params?: { search?: string; lowStock?: boolean }) {
    const where: any = {};

    if (params?.search) {
      where.OR = [
        { itemCode: { contains: params.search, mode: 'insensitive' } },
        { itemName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.lowStock) {
      // availableQuantity < safetyStock の条件を追加
      const items = await prisma.inventory.findMany({
        where: params.search ? {
          OR: [
            { itemCode: { contains: params.search, mode: 'insensitive' } },
            { itemName: { contains: params.search, mode: 'insensitive' } },
          ],
        } : undefined,
        include: { item: true },
      });
      return items.filter(item =>
        Number(item.availableQuantity) < Number(item.safetyStock)
      );
    }

    return await prisma.inventory.findMany({
      where: params?.search ? {
        OR: [
          { itemCode: { contains: params.search, mode: 'insensitive' } },
          { itemName: { contains: params.search, mode: 'insensitive' } },
        ],
      } : undefined,
      include: { item: true },
      orderBy: { itemCode: 'asc' },
    });
  }

  async findById(id: string) {
    return await prisma.inventory.findUnique({
      where: { id },
      include: { item: true },
    });
  }

  async findByItemCode(itemCode: string) {
    return await prisma.inventory.findUnique({
      where: { itemCode },
      include: { item: true },
    });
  }

  async update(id: string, data: Partial<Inventory>) {
    return await prisma.inventory.update({
      where: { id },
      data,
    });
  }

  async getStats() {
    try {
      const [totalItems, inventories, totalAllocated] = await Promise.all([
        prisma.inventory.count(),
        prisma.inventory.findMany({
          select: {
            availableQuantity: true,
            safetyStock: true,
          },
        }),
        prisma.inventory.aggregate({
          _sum: { allocatedQuantity: true },
        }),
      ]);

      // 在庫不足のアイテム数を計算（availableQuantity < safetyStock）
      const lowStockCount = inventories.filter(
        (item) => Number(item.availableQuantity) < Number(item.safetyStock)
      ).length;

      return {
        totalItems,
        lowStockCount,
        totalAllocated: Number(totalAllocated._sum.allocatedQuantity || 0),
      };
    } catch (error) {
      console.error('在庫統計の取得に失敗しました:', error);
      // エラー時はデフォルト値を返す
      return {
        totalItems: 0,
        lowStockCount: 0,
        totalAllocated: 0,
      };
    }
  }
}

// ==================== リポジトリファクトリー ====================

export class RepositoryFactory {
  private static orderRepo: IOrderRepository | null = null;
  private static bomRepo: IBomRepository | null = null;
  private static workOrderRepo: IWorkOrderRepository | null = null;
  private static workResultRepo: IWorkResultRepository | null = null;
  private static inventoryRepo: IInventoryRepository | null = null;

  static getOrderRepository(): IOrderRepository {
    if (!this.orderRepo) {
      this.orderRepo = new PrismaOrderRepository();
    }
    return this.orderRepo;
  }

  static getBomRepository(): IBomRepository {
    if (!this.bomRepo) {
      this.bomRepo = new PrismaBomRepository();
    }
    return this.bomRepo;
  }

  static getWorkOrderRepository(): IWorkOrderRepository {
    if (!this.workOrderRepo) {
      this.workOrderRepo = new PrismaWorkOrderRepository();
    }
    return this.workOrderRepo;
  }

  static getWorkResultRepository(): IWorkResultRepository {
    if (!this.workResultRepo) {
      this.workResultRepo = new PrismaWorkResultRepository();
    }
    return this.workResultRepo;
  }

  static getInventoryRepository(): IInventoryRepository {
    if (!this.inventoryRepo) {
      this.inventoryRepo = new PrismaInventoryRepository();
    }
    return this.inventoryRepo;
  }

  // テスト用：リポジトリを差し替え可能にする
  static setOrderRepository(repo: IOrderRepository) {
    this.orderRepo = repo;
  }

  static setBomRepository(repo: IBomRepository) {
    this.bomRepo = repo;
  }

  static setWorkOrderRepository(repo: IWorkOrderRepository) {
    this.workOrderRepo = repo;
  }

  static setWorkResultRepository(repo: IWorkResultRepository) {
    this.workResultRepo = repo;
  }

  static setInventoryRepository(repo: IInventoryRepository) {
    this.inventoryRepo = repo;
  }
}

