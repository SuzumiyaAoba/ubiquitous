# AI統合機能の実装

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document must be maintained in accordance with `.agent/PLANS.md` at the repository root.

## Purpose / Big Picture

ユビキタス言語システムにAI機能を統合し、用語定義の品質向上と整合性チェックを自動化します。この変更により、ユーザーは以下が可能になります:

1. **定義の明確さ分析**: 用語定義の曖昧さや複雑さをAIが自動評価し、改善提案を提供
2. **整合性チェック**: 新規用語が既存の用語体系と矛盾しないかAIが検証
3. **類似用語検出**: 重複や類似する用語を自動検出し、統合を提案
4. **AI Q&A**: ユビキタス言語に基づいた質問応答機能

実装完了後、用語作成・編集時にAI分析を実行し、`/api/ai/analyze-clarity`や`/api/ai/check-consistency`などのエンドポイントから結果を取得できるようになります。

## Progress

- [ ] OpenAI APIクライアントの設定とテスト
- [ ] AIServiceの基盤実装
- [ ] 定義の明確さ分析機能の実装
- [ ] 整合性チェック機能の実装
- [ ] AI Q&A機能の実装
- [ ] AIAnalysisエンティティとリポジトリの実装
- [ ] 分析結果の保存・取得機能の実装
- [ ] AI統合APIエンドポイントの作成
- [ ] エラーハンドリングとレート制限の実装
- [ ] ユニットテストの作成
- [ ] 統合テストの作成
- [ ] ドキュメント作成

## Surprises & Discoveries

(実装中に発見した予期しない動作や最適化をここに記録)

## Decision Log

- Decision: OpenAI Node.js SDKを使用
  Rationale: 公式SDKを使用することで、型安全性とメンテナンス性が向上。API変更への追従も容易。
  Date/Author: 2025-11-22 / Claude

- Decision: 分析結果をデータベースに保存
  Rationale: 同じ用語の再分析を避けるためキャッシュとして機能。また、分析履歴の追跡が可能になる。
  Date/Author: 2025-11-22 / Claude

- Decision: GPT-4を使用（より高度な分析のため）
  Rationale: 用語定義の曖昧さや整合性の評価には高度な言語理解が必要。コスト vs 品質のトレードオフを考慮してGPT-4を選択。
  Date/Author: 2025-11-22 / Claude

## Outcomes & Retrospective

(完了時に記録予定)

## Context and Orientation

このプロジェクトは、ドメイン駆動設計のためのユビキタス言語管理システムです。現在、以下の構造になっています:

```
apps/
  api/
    src/
      services/       # ビジネスロジック層
      repositories/   # データアクセス層
      routes/        # APIエンドポイント
      db/            # データベース接続・マイグレーション
      search/        # MeiliSearch統合
```

既存の実装:
- `apps/api/src/services/term.service.ts`: 用語管理サービス
- `apps/api/src/repositories/`: 各種リポジトリ（Term, TermHistory等）
- `apps/api/src/db/schema.sql`: データベーススキーマ（AIAnalysisテーブル既存）
- `packages/types/src/`: 共有型定義

新規作成が必要なファイル:
- `apps/api/src/services/ai.service.ts`: AI統合サービス
- `apps/api/src/routes/ai.routes.ts`: AI APIエンドポイント
- `apps/api/src/repositories/ai-analysis.repository.ts`: AIAnalysisリポジトリ（必要に応じて）

依存関係:
- OpenAI Node.js SDK (`openai` パッケージ)
- 既存の TermService, TermRepository
- 環境変数: `OPENAI_API_KEY`

## Plan of Work

### マイルストーン 1: OpenAI統合の基盤構築

OpenAI APIクライアントを設定し、基本的な接続テストを実施します。この段階で、API呼び出しが成功することを確認します。

1. **依存関係の追加**
   - `apps/api/package.json`に`openai`パッケージを追加
   - npm installを実行してインストール

2. **環境変数の設定**
   - `apps/api/.env.example`に`OPENAI_API_KEY`を追加
   - 開発環境用の`.env`ファイルに実際のAPIキーを設定（gitignoreされていることを確認）

3. **AIServiceの基盤実装**
   - `apps/api/src/services/ai.service.ts`を作成
   - OpenAI クライアントの初期化
   - エラーハンドリングとレート制限の基本実装
   - ヘルパーメソッド: `buildPrompt`, `callOpenAI`

4. **接続テスト**
   - 簡単なプロンプトでOpenAI APIを呼び出すテスト関数を作成
   - 正常に応答が返ることを確認

検証: `npm run dev`でAPIサーバーを起動し、ログでOpenAI接続が成功することを確認。

### マイルストーン 2: 定義の明確さ分析機能

用語定義の明確さを分析する機能を実装します。曖昧な表現、複雑すぎる文章、欠落しているコンテキストを検出します。

1. **分析ロジックの実装**
   - `AIService.analyzeClarity(term: Term)`メソッドを実装
   - プロンプト設計: 用語名と定義を入力として、明確さスコア、問題点、改善提案を出力
   - レスポンスパース: JSONフォーマットで結果を取得

2. **型定義の追加**
   - `packages/types/src/ai.types.ts`を作成
   - `ClarityAnalysis`, `ClarityIssue`, `ClarityScore`等の型を定義

3. **エラーハンドリング**
   - OpenAI APIエラー（レート制限、認証エラー等）の適切な処理
   - タイムアウト設定

検証: 実際の用語データで`analyzeClarity`を呼び出し、期待される構造の分析結果が返ることを確認。

### マイルストーン 3: 整合性チェック機能

新規用語が既存の用語体系と矛盾しないかチェックする機能を実装します。

1. **コンテキスト構築**
   - 既存用語の取得: TermServiceを使用して関連する用語を取得
   - コンテキストの構築: 関連用語の名前と定義をプロンプトに含める

2. **整合性チェックロジック**
   - `AIService.checkConsistency(term: Term, contextId?: string)`メソッドを実装
   - プロンプト設計: 新規用語と既存用語のコンテキストを入力として、整合性評価と競合を出力

3. **類似用語検出**
   - `AIService.findSimilar(term: Term)`メソッドを実装
   - 既存用語との類似度を評価し、重複の可能性を検出

4. **型定義の追加**
   - `ConsistencyCheck`, `SimilarTerm`等の型を定義

検証: 意図的に矛盾する用語を作成し、AIが矛盾を検出することを確認。

### マイルストーン 4: AI Q&A機能

ユビキタス言語に基づいた質問応答機能を実装します。

1. **Q&Aロジックの実装**
   - `AIService.ask(question: string, contextId?: string)`メソッドを実装
   - コンテキスト特化: 指定されたコンテキストの用語を優先的に使用
   - プロンプト設計: 質問と用語コンテキストを入力として、回答を生成

2. **会話履歴の管理（オプション）**
   - 必要に応じて、会話の文脈を保持する機能を実装

検証: 登録済み用語に関する質問をして、適切な回答が返ることを確認。

### マイルストーン 5: 分析結果の永続化

AI分析結果をデータベースに保存し、履歴として管理します。

1. **AIAnalysisリポジトリの実装（必要に応じて）**
   - 既存のスキーマを確認: `ai_analysis`テーブルが存在するか確認
   - `apps/api/src/repositories/ai-analysis.repository.ts`を作成（必要な場合）
   - CRUD操作の実装

2. **AIServiceへの統合**
   - 分析実行後、結果をデータベースに保存
   - 既存の分析結果の取得機能を実装
   - キャッシュロジック: 最近の分析結果があれば再利用

3. **型の更新**
   - `AIAnalysis`型の定義（`packages/types`）

検証: 分析を実行し、データベースに結果が保存されることを確認。同じ用語の再分析時にキャッシュが機能することを確認。

### マイルストーン 6: APIエンドポイントの作成

AI機能をHTTP APIとして公開します。

1. **ルートファイルの作成**
   - `apps/api/src/routes/ai.routes.ts`を作成
   - Honoルーターの設定

2. **エンドポイント実装**
   - `POST /api/ai/analyze-clarity`: 明確さ分析
   - `POST /api/ai/check-consistency`: 整合性チェック
   - `POST /api/ai/find-similar`: 類似用語検索
   - `POST /api/ai/ask`: 質問応答
   - `GET /api/ai/analysis/:termId`: 分析履歴取得

3. **バリデーション**
   - リクエストボディのバリデーション（Zodスキーマ使用）
   - エラーレスポンスの統一

4. **メインルーターへの統合**
   - `apps/api/src/index.ts`でAIルートを登録

検証: cURLやPostmanで各エンドポイントをテストし、期待されるレスポンスが返ることを確認。

### マイルストーン 7: テストとドキュメント

ユニットテストと統合テストを作成し、機能の品質を保証します。

1. **ユニットテストの作成**
   - AIServiceの各メソッドのテスト
   - OpenAI APIのモック化
   - エッジケースのテスト

2. **統合テストの作成**
   - APIエンドポイントのE2Eテスト
   - エラーハンドリングのテスト

3. **ドキュメント作成**
   - APIエンドポイントの使用例
   - 環境変数の設定手順
   - プロンプトエンジニアリングのベストプラクティス

検証: すべてのテストが通ることを確認。`npm run test`が成功する。

## Concrete Steps

### マイルストーン 1の実行手順

作業ディレクトリ: `/home/user/ubiquitous`

```bash
# 1. OpenAI パッケージのインストール
cd apps/api
npm install openai

# 2. 環境変数ファイルの更新
# .env.exampleにOPENAI_API_KEYを追加
echo "OPENAI_API_KEY=sk-..." >> .env.example
# 実際の.envにもAPIキーを追加（開発用）
echo "OPENAI_API_KEY=<your-actual-api-key>" >> .env

# 3. AIServiceファイルの作成
touch src/services/ai.service.ts
```

`apps/api/src/services/ai.service.ts`の初期実装:

```typescript
import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // テスト用メソッド
  async testConnection(): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello, this is a test.' }],
    });
    return response.choices[0].message.content || 'No response';
  }
}
```

期待される出力: APIサーバー起動時にエラーが出ず、testConnection()が正常にレスポンスを返す。

### 後続マイルストーンの手順

各マイルストーンの具体的な実装手順は、前のマイルストーンが完了した後に詳細化します。基本的な流れは:

1. 型定義の作成/更新
2. サービスメソッドの実装
3. テストの作成
4. 動作確認

## Validation and Acceptance

各マイルストーンの完了基準:

**マイルストーン 1**:
- OpenAI APIに正常に接続できる
- 簡単なプロンプトでレスポンスが返る
- エラーが発生しない

**マイルストーン 2**:
- `analyzeClarity`メソッドが期待される形式の分析結果を返す
- 明確さスコア、問題点、改善提案が含まれる
- エラーハンドリングが適切に機能する

**マイルストーン 3**:
- `checkConsistency`が既存用語との矛盾を検出できる
- `findSimilar`が類似用語を見つけられる
- 適切なコンテキストが構築される

**マイルストーン 4**:
- 質問に対して適切な回答が生成される
- コンテキスト特化の回答が機能する

**マイルストーン 5**:
- 分析結果がデータベースに保存される
- 履歴の取得が正常に動作する
- キャッシュ機能が動作する

**マイルストーン 6**:
- すべてのAPIエンドポイントが正常に動作する
- エラーレスポンスが適切に返される
- バリデーションが機能する

**マイルストーン 7**:
- すべてのテストが通る（`npm run test`が成功）
- カバレッジが適切（主要機能は80%以上）
- ドキュメントが完備されている

最終的な受け入れテスト:
```bash
# APIサーバーを起動
npm run dev

# エンドポイントのテスト（別ターミナルで）
curl -X POST http://localhost:3000/api/ai/analyze-clarity \
  -H "Content-Type: application/json" \
  -d '{"termId": "some-term-id"}'

# 期待される出力:
# {
#   "clarityScore": 0.85,
#   "issues": [...],
#   "suggestions": [...]
# }
```

## Idempotence and Recovery

この実装は以下の点で冪等性とリカバリを考慮しています:

1. **データベース操作**: すべての挿入操作は重複チェック付き。同じ分析を複数回実行してもデータの整合性は保たれる。

2. **API呼び出し**: OpenAI APIの失敗時は適切なエラーメッセージを返し、部分的な状態を残さない。

3. **キャッシュ**: 分析結果のキャッシュにより、同じ用語の再分析を避ける。

4. **エラーリカバリ**:
   - OpenAI APIのレート制限エラー時は適切なリトライロジックを実装
   - ネットワークエラー時はタイムアウトと適切なエラーメッセージ
   - データベースエラー時はトランザクションのロールバック

安全な再試行:
- OpenAI APIエラー時は、エクスポネンシャルバックオフでリトライ
- データベースエラー時は、トランザクションを使用して部分的な更新を防ぐ

クリーンアップ:
- テスト実行後、テストデータは自動削除
- 開発環境での実験的なAI分析結果は定期的にクリーンアップ可能

## Artifacts and Notes

### 主要なプロンプトテンプレート例

**定義の明確さ分析用プロンプト**:
```
あなたはドメイン駆動設計の専門家です。以下の用語定義を分析し、明確さを評価してください。

用語名: {termName}
定義: {definition}

以下の観点で評価してください:
1. 曖昧な表現の有無
2. 文章の複雑さ
3. 必要なコンテキストの欠落

JSON形式で回答してください:
{
  "clarityScore": 0-1の数値,
  "issues": [問題点の配列],
  "suggestions": [改善提案の配列]
}
```

**整合性チェック用プロンプト**:
```
以下の新規用語が、既存の用語体系と整合性があるか評価してください。

新規用語:
名前: {newTermName}
定義: {newTermDefinition}

既存用語:
{existingTermsContext}

矛盾や重複がある場合は指摘してください。JSON形式で回答:
{
  "isConsistent": true/false,
  "conflicts": [矛盾の配列],
  "recommendations": [推奨事項の配列]
}
```

### 型定義例

```typescript
// packages/types/src/ai.types.ts
export interface ClarityAnalysis {
  clarityScore: number;
  issues: ClarityIssue[];
  suggestions: string[];
  analyzedAt: Date;
}

export interface ClarityIssue {
  type: 'ambiguity' | 'complexity' | 'missing_context';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  conflicts: Conflict[];
  recommendations: string[];
  similarTerms: SimilarTerm[];
}

export interface SimilarTerm {
  termId: string;
  termName: string;
  similarityScore: number;
  reason: string;
}
```

## Interfaces and Dependencies

### 主要インターフェース

**AIService**:
```typescript
// apps/api/src/services/ai.service.ts
export class AIService {
  // 定義の明確さ分析
  async analyzeClarity(term: Term): Promise<ClarityAnalysis>;

  // 整合性チェック
  async checkConsistency(
    term: Term,
    contextId?: string
  ): Promise<ConsistencyCheck>;

  // 類似用語検索
  async findSimilar(term: Term): Promise<SimilarTerm[]>;

  // 改善提案
  async suggestImprovements(term: Term): Promise<string[]>;

  // Q&A
  async ask(
    question: string,
    contextId?: string
  ): Promise<string>;

  // 内部ヘルパー
  private buildTermContext(contextId?: string): Promise<string>;
  private callOpenAI(prompt: string): Promise<string>;
}
```

**AIAnalysisRepository** (必要に応じて):
```typescript
// apps/api/src/repositories/ai-analysis.repository.ts
export class AIAnalysisRepository {
  async save(analysis: AIAnalysis): Promise<void>;
  async findByTermId(termId: string): Promise<AIAnalysis[]>;
  async findLatest(termId: string): Promise<AIAnalysis | null>;
}
```

### 依存関係

- `openai`: OpenAI公式Node.js SDK (^4.0.0)
- `@ubiquitous/types`: 共有型定義
- 環境変数:
  - `OPENAI_API_KEY`: OpenAI APIキー (必須)
  - `OPENAI_MODEL`: 使用モデル (デフォルト: gpt-4)
  - `OPENAI_MAX_TOKENS`: 最大トークン数 (デフォルト: 1000)
  - `OPENAI_TEMPERATURE`: 温度パラメータ (デフォルト: 0.7)

### データベーススキーマ (既存)

`ai_analysis`テーブル:
```sql
CREATE TABLE ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  UNIQUE(term_id, analysis_type, created_at)
);
```

---

**Note**: このExecPlanは、実装の進行に伴って更新されます。各セクション（Progress、Surprises & Discoveries、Decision Log、Outcomes & Retrospective）は実装中に継続的に更新する必要があります。
