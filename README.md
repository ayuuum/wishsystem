# 三功工業所 製造管理システム

特別受注製品向け製造管理システム（Next.js + Prisma + PostgreSQL）

## 📚 ドキュメント

詳細なドキュメントは [`docs/`](./docs/) フォルダにまとめられています：

- **プロジェクト関連**: [`docs/project/`](./docs/project/)
  - [実装計画・進捗管理](./docs/project/IMPLEMENTATION_PLAN.md) - PRD・実装状況
  - [プロジェクト概要](./docs/project/README.md) - セットアップ手順

- **データベース関連**: [`docs/database/`](./docs/database/)
  - [スキーマ定義（SQL）](./docs/database/schema.sql)

## 🚀 クイックスタート

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# DATABASE_URLを設定してください

# データベースのマイグレーション
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

## 📖 詳細情報

詳細なセットアップ手順やプロジェクト情報は [`docs/project/README.md`](./docs/project/README.md) を参照してください。
