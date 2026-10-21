# XF

ログインして、つぶやきを投稿できるだけのシンプルなサイトです。

- 画面：Vite ＋ 素の JavaScript
- バックエンド：Supabase（認証＝メールとパスワード、データ＝`profiles`・`posts` テーブル）
- 公開：GitHub Pages（`main` に push すると GitHub Actions がビルドして公開）

## できること

- 新規登録（ユーザー名・メールアドレス・パスワード）とログイン・ログアウト
- つぶやきの投稿（280文字まで）と削除（自分の投稿だけ）
- 全員のつぶやきを新しい順に表示

## 環境変数

Supabase の値はコードに書かず、環境変数で渡します。`.env` は `.gitignore` に入っているので GitHub には上がりません。

| 変数名 | 中身 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase のプロジェクト URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase の publishable キー（`sb_publishable_...`） |

- 手元で動かすとき：プロジェクト直下に `.env` を作り、上の2つを `変数名=値` の形で書く
- GitHub Pages：リポジトリの Settings → Secrets and variables → Actions に同じ名前で登録する

publishable キーはブラウザに配られる前提のキーです。データの読み書きは Supabase の RLS（行単位の権限）で守っています。`service_role` キーや `sb_secret_...` キーは絶対にこのリポジトリや画面側に入れないでください。

## 手元で動かす

```bash
npm install
npm run dev
```

## データベース

`supabase/schema.sql` に、テーブル・RLS・新規登録時にプロフィールを作るトリガーをまとめています。
