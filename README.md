# 競馬予想AI フロントエンドアプリケーション

## 概要

競馬予想AIシステムのユーザー向けフロントエンドアプリケーションです。OpenAI GPT-4とFunction Callingを使用して、データ処理バックエンドから競馬指数データを取得し、自然な日本語でユーザーに予想を提供します。

## 主要機能

- **ユーザー認証**: NextAuth.jsによるメール・パスワード認証
- **サブスクリプション**: Stripeによる月額課金システム
- **無料トライアル**: 新規登録時に1週間の無料トライアル
- **AIチャット**: OpenAI GPT-4による競馬予想チャット
- **Function Calling**: データバックエンドとの動的連携
- **レスポンシブデザイン**: PC・スマホ対応

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: NextAuth.js
- **決済**: Stripe
- **AI**: OpenAI GPT-4
- **状態管理**: Zustand
- **データフェッチング**: React Query

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example`を`.env.local`にコピーして、必要な値を設定してください。

```bash
cp .env.local.example .env.local
```

### 3. データベースのセットアップ

```bash
# Prismaクライアント生成
npm run db:generate

# データベーススキーマの適用
npm run db:push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## システム連携

### データ処理バックエンド (http://localhost:8000)

OpenAI Function Callingを通じて以下のAPIを呼び出します：

- `POST /api/llm/race-predictions` - レース予想指数取得
- `POST /api/llm/today-races` - 本日開催レース一覧
- `GET /api/horses/:horseId` - 馬の詳細分析

### 管理画面 (http://localhost:3001)

管理画面がこのアプリケーションのデータベースに直接アクセスして、ユーザー管理・サブスクリプション管理・チャット履歴確認を行います。

## 主要ページ

- `/` - ランディングページ
- `/auth/signin` - ログイン
- `/auth/signup` - 新規登録
- `/chat` - メインチャット画面
- `/settings` - アカウント設定

## API エンドポイント

- `/api/auth/[...nextauth]` - NextAuth.js認証
- `/api/auth/signup` - ユーザー登録
- `/api/chat` - チャット処理
- `/api/subscription/info` - サブスクリプション情報取得
- `/api/stripe/create-checkout` - Stripe決済セッション作成
- `/api/stripe/webhook` - Stripe Webhook処理

## デプロイ

### Vercel (推奨)

```bash
npm run build
```

### 環境変数

本番環境では以下の環境変数を設定してください：

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `STRIPE_PUBLIC_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `OPENAI_API_KEY`
- `DATA_BACKEND_URL`

## ライセンス

このプロジェクトはプライベートプロジェクトです。