import { PrismaClient } from '@prisma/client'

// Prismaクライアントのシングルトン実装
// 開発環境でのHMRによる接続数増加を防ぐ
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// ビルド時の複数ワーカー間でのPrisma Client共有を防ぐため、常にグローバルに保存
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma

