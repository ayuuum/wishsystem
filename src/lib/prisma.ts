import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Prismaクライアントの初期化（エラーハンドリング付き）
let prismaInstance: PrismaClient;

try {
  prismaInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
} catch (error) {
  console.error('Prismaクライアントの初期化に失敗しました:', error);
  // 開発環境では空のクライアントを返す（型エラーを防ぐため）
  if (process.env.NODE_ENV === 'development') {
    throw new Error(
      'Prismaクライアントの初期化に失敗しました。DATABASE_URL環境変数を確認してください。'
    );
  }
  throw error;
}

export const prisma = prismaInstance;
