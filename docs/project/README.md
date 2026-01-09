# 三功工業所 製造管理システム - プロジェクト概要

特別受注製品向け製造管理システムのプロジェクトドキュメントです。

## 📋 プロジェクト概要

**プロジェクト名**: 三功工業所 特別受注製品向け製造管理システム  
**完成度**: 約97%  
**最終更新**: 2026-01-08

### 主な機能

- **案件管理**: 受注案件の登録・編集・進捗管理
- **BOM管理**: 部品構成表（BOM）の作成・編集・階層管理
- **スケジュール管理**: ガントチャートによる工程スケジュール管理
- **在庫管理**: 部品在庫の管理・引当・同期
- **製造実績**: 作業実績の入力・履歴管理
- **ダッシュボード**: 案件進捗・在庫状況の一覧表示
- **PDF出力**: 生産指示書のPDF生成

## 🛠 技術スタック

### フロントエンド
- **Next.js 16.1.1** (App Router / Turbopack)
- **React 19.2.3**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Radix UI** - UIコンポーネントライブラリ
- **Frappe Gantt** - ガントチャート表示
- **jsPDF** - PDF生成

### バックエンド
- **Next.js Server Actions** - サーバーサイドロジック
- **Prisma 5.22.0** - ORM
- **PostgreSQL** - データベース

### 開発ツール
- **Playwright** - E2Eテスト
- **ESLint** - リンター
- **TypeScript** - 型チェック

## 🚀 セットアップ手順

### 1. 前提条件

- Node.js 20.x 以上
- PostgreSQL データベース
- npm または yarn

### 2. リポジトリのクローン

```bash
git clone <repository-url>
cd wishsystem
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 環境変数の設定

`.env` ファイルを作成し、以下の環境変数を設定してください：

```env
# データベース接続
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# その他の環境変数（必要に応じて）
```

### 5. データベースのセットアップ

```bash
# Prismaマイグレーションの実行
npx prisma migrate dev

# シードデータの投入（オプション）
npx prisma db seed
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 📁 プロジェクト構造

```
wishsystem/
├── docs/                    # ドキュメント
│   ├── project/            # プロジェクト関連
│   └── database/           # データベース関連
├── prisma/                 # Prisma設定
│   ├── schema.prisma       # スキーマ定義
│   └── seed.ts            # シードデータ
├── public/                 # 静的ファイル
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── actions/        # Server Actions
│   │   ├── bom/           # BOM管理ページ
│   │   ├── inventory/     # 在庫管理ページ
│   │   ├── orders/        # 案件管理ページ
│   │   ├── results/       # 製造実績ページ
│   │   ├── schedule/      # スケジュールページ
│   │   └── settings/      # 設定ページ
│   ├── components/         # Reactコンポーネント
│   ├── lib/               # ユーティリティ・ライブラリ
│   └── types/             # TypeScript型定義
└── tests/                 # テストファイル
```

## 📝 主要なスクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# リンター実行
npm run lint

# テスト実行
npx playwright test
```

## 🔧 ビルド・デプロイ

### Vercelへのデプロイ

このプロジェクトはVercelに最適化されています：

- `postinstall`スクリプトでPrisma Clientが自動生成されます
- `build`スクリプトでビルド前にPrisma Clientが生成されます

```bash
# Vercel CLIでデプロイ
vercel deploy
```

## 📚 関連ドキュメント

- [実装計画・進捗管理](./IMPLEMENTATION_PLAN.md) - 詳細な実装状況と進捗
- [データベーススキーマ](../database/schema.sql) - SQL形式のスキーマ定義
- [Prismaスキーマ](../../prisma/schema.prisma) - Prisma形式のスキーマ定義

## 🐛 トラブルシューティング

### Prisma Clientのエラー

```bash
# Prisma Clientを手動で生成
npx prisma generate
```

### データベース接続エラー

`.env`ファイルの`DATABASE_URL`が正しく設定されているか確認してください。

### ビルドエラー

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

## 📞 サポート

問題が発生した場合は、プロジェクトのIssueトラッカーで報告してください。
