# Ubiquitous Language System API

Hono と Drizzle ORM を使用した RESTful API

## セットアップ

### 環境変数

`.env` ファイルを作成し、以下の環境変数を設定してください：

```bash
cp .env.example .env
```

必要な環境変数：
- `PORT`: API サーバーのポート（デフォルト: 3001）
- `DATABASE_URL`: PostgreSQL データベース接続 URL

### 依存関係のインストール

```bash
npm install
```

## Drizzle ORM の使用

### データベーススキーマ

スキーマは `src/db/schema.ts` で定義されています：

- **terms**: 用語テーブル
- **contexts**: コンテキストテーブル
- **term_contexts**: 用語とコンテキストの関連テーブル
- **term_relationships**: 用語間の関係テーブル

### データベース操作

#### マイグレーション生成

スキーマを変更した後、マイグレーションを生成：

```bash
npm run db:generate
```

#### マイグレーション実行

データベースにマイグレーションを適用：

```bash
npm run db:migrate
```

#### スキーマの直接プッシュ（開発用）

開発環境でスキーマを直接データベースにプッシュ：

```bash
npm run db:push
```

#### Drizzle Studio

Drizzle Studio を起動してデータベースを GUI で管理：

```bash
npm run db:studio
```

ブラウザで `https://local.drizzle.studio` を開いてアクセスできます。

## 開発

### 開発サーバー起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### 本番環境実行

```bash
npm start
```

## API エンドポイント

- `GET /health` - ヘルスチェック
- `GET /api` - API 情報
- `GET /api/terms` - すべての用語を取得

## Drizzle ORM の使用例

### データの挿入

```typescript
import { db, terms } from './db';

await db.insert(terms).values({
  name: 'Domain',
  description: 'A sphere of knowledge or activity',
  status: 'active',
});
```

### データの取得

```typescript
import { db, terms } from './db';

const allTerms = await db.select().from(terms);
```

### データの更新

```typescript
import { db, terms } from './db';
import { eq } from 'drizzle-orm';

await db.update(terms)
  .set({ status: 'deprecated' })
  .where(eq(terms.id, termId));
```

### データの削除

```typescript
import { db, terms } from './db';
import { eq } from 'drizzle-orm';

await db.delete(terms).where(eq(terms.id, termId));
```

### リレーションを含むクエリ

```typescript
import { db } from './db';

const termsWithContexts = await db.query.terms.findMany({
  with: {
    termContexts: {
      with: {
        context: true,
      },
    },
  },
});
```
