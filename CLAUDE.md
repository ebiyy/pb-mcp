# pb-mcp — Productboard MCP Server (v2 rewrite)

## What This Is

Productboard REST API を MCP プロトコル経由で操作する薄いアダプター。
旧リポジトリ (`productboard-mcp`) の 25,000行を TDD でゼロから書き直している。

## Commands

```bash
npm test              # vitest run
npm run test:watch    # vitest (watch)
npm run test:coverage # vitest --coverage
npm run check         # biome check
npm run fix           # biome check --write
npm run typecheck     # tsc --noEmit
npm run quality       # typecheck + check + test
npm run build         # tsc
```

## Architecture

```
src/
├── index.ts       ← エントリ (stdio transport)
├── server.ts      ← MCP Server + 汎用ハンドラー
├── client.ts      ← native fetch API クライアント
├── tools.ts       ← 全ツール定義 (宣言的データ)
└── types.ts       ← 型定義
```

**Runtime deps**: `@modelcontextprotocol/sdk` のみ。axios 不使用。

## Design Principles

### 1. ツールはデータであってコードではない
各ツールは `ToolDef` オブジェクト。ハンドラー関数を個別に書かない。

```typescript
{ name: 'get_features', method: 'GET', path: '/features', ... }
```

### 2. ルーティングは Map の 1:1 マッピング
`name.includes()` による曖昧マッチ禁止。ツール名→定義の完全一致のみ。

### 3. エラーは McpError 直接
カスタムエラー階層を作らない。HTTP ステータス → McpError に直接変換。

### 4. any 禁止
biome で `noExplicitAny: error` 設定済み。

### 5. レスポンス形式は1つだけ
```typescript
{ content: [{ type: 'text', text: JSON.stringify(data) }] }
```

### 6. HTTP は native fetch
Node 22+ の標準 fetch を使用。ライブラリ不要。

## API 認証

```
Authorization: Bearer {PRODUCTBOARD_API_TOKEN}
Content-Type: application/json
X-Version: 1
Base URL: https://api.productboard.com (固定、変更不可)
```

## Body Wrapping

Productboard API は POST/PATCH で `{ data: { ...body } }` 形式を要求する。
ToolDef の `wrap: 'data'` で制御。

## Current Status

TDD フェーズ。テスト先行で実装中。
- `client.test.ts` — 14 tests (API クライアント I/O)
- `tools.test.ts` — 32 tests (ツール定義構造)
- `server.test.ts` — 13 tests (MCP 統合)

## Reference

旧リポジトリ: `/Users/ebiyy/ghq/github.com/ebiyy/productboard-mcp/`
- API エンドポイント情報: `src/tools/*.ts`
- 詳細なナレッジ: `knowledge/` ディレクトリ
