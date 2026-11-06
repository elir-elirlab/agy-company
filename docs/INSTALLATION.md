# agy-company 導入・セットアップガイド 📘

このドキュメントでは、仮想組織管理プラグイン **`agy-company`** を Antigravity CLI (AGY) に導入し、運用を開始するまでの手順を初心者エンジニア向けに分かりやすく解説します。

---

## 1. 事前準備（必要な環境）

本ツールを使用するには、以下の環境が必要です：

- **Antigravity CLI (AGY)**: Google DeepMind のエージェント実行環境
- **Docker & Docker Compose**: Webダッシュボードを起動する場合に必要
- **Obsidian**: 成果物やデイリーノートを閲覧・編集するマークダウンエディタ

---

## 2. ワークスペースへの導入手順

`agy-company` は、Antigravity CLI (AGY) の公式プラグイン管理機能に対応しています。
AGY の仕様上、GitHub の URL を直接指定したインストールはサポートされていないため、手元にリポジトリをクローンし、そのディレクトリパス（相対パスまたは絶対パス）を指定してインストールします。

### プラグインのインストール

ターミナル（CLI）からインストールする場合：
```bash
# 1. リポジトリをクローン
git clone https://github.com/elir-elirlab/agy-company.git

# 2. クローンしたディレクトリパスを指定してインストール
# 相対パス指定の場合:
agy plugin install ./agy-company

# または絶対パス指定の場合:
agy plugin install /path/to/agy-company
```

または、Antigravity CLI を起動してチャットモード内からインストールする場合：
```text
# 相対パス指定:
/plugin install ./agy-company

# または絶対パス指定:
/plugin install /path/to/agy-company
```

### 既存プロジェクトへの導入と設定フォルダの配置

既存の開発リポジトリに `agy-company` を導入する場合、プロジェクト既存のフォルダと競合しないよう柔軟に設計されています：

1. **設定フォルダ（config）の柔軟な配置**:
   - 通常はプロジェクト直下の `./config` が参照されます。
   - すでにプロジェクト内で `./config` を使用している場合は、隠しフォルダ **`.company/.config`** に設定ファイル群を配置することで、既存の設定と一切衝突せずに利用できます。
2. **Vault フォルダの自動準備**:
   - 成果物やデイリーノートを蓄積する `vault/` フォルダは、初回起動時や `/agy-company dashboard` 実行時に現在のユーザー権限で自動的に準備されます（手動で作成する必要はありません）。
   - Obsidian をお使いの場合は、Obsidian アプリ側でこの `vault/` フォルダ（またはその専用サブフォルダ）を「保管庫（Vault）」として開いておくだけで、リアルタイム同期が有効になります。

---

## 3. 初回起動とオンボーディング（セットアップ）

### Step 1: 秘書を呼び出す

Antigravity CLI を起動し、チャットで以下のように入力します：

```text
/agy-company
```
（または「秘書さん、よろしく」と話しかけても起動します）

### Step 2: 4つの質問に答える

専任秘書が着任し、組織を立ち上げるためのヒアリングが行われます：

1. **事業や活動内容 (Business / Activity)**:
   - 例: 個人開発、受託Web制作、チームでのSaaS開発、学習・研究など
2. **目標や日々の困りごと (Goals & Challenges)**:
   - 例: タスク管理が散らかる、技術調査の時間が足りないなど
3. **定期リマインダーの利用有無 (Schedule)**:
   - 朝会やタスク確認の通知を設定するか（※迷ったら「後で設定する（OFF）」でOK）
4. **秘書の言語と口調設定 (Persona & Language)**:
   - 言語: 日本語 / English / バイリンガル
   - 口調プリセット:
     - 🌟 **丁寧・フレンドリー** （標準・明るいパートナー）
     - 🎩 **執事・プロフェッショナル** （礼儀正しい英国風執事）
     - 🤝 **カジュアル・相棒** （開発仲間・フランク）
     - 🎯 **ストイックコーチ** （目標達成コミット・厳格）
     - 🎨 **カスタム** （自由なキャラ設定）

### Step 3: 自動生成されるフォルダ構造（2層アーキテクチャ）

回答が完了すると、以下のフォルダ群が自動生成されます：

```text
project-root/
├── .company/                          # 【Git管理】AI組織の記憶・設定・作業領域
│   ├── AGENTS.md                      # 組織全体のルール（入力内容が反映）
│   └── secretary/
│       ├── AGENTS.md                  # 秘書の口調・ペルソナ設定
│       └── notes/                     # 壁打ち・意思決定ログ
└── vault/                             # 【Obsidian】クリーンな完成物のみ
    ├── 01_Inbox/                      # サブエージェントの納品物・アイデアメモ
    └── 02_Daily/                      # 双方向リンク付きデイリータスク
        └── YYYY-MM-DD.md
```

これで仮想組織の運用が開始されます！🎉

---

## 4. 日常の運用テクニック

### 1. 定型サブコマンド（Fast-Path）の活用
日常業務は以下のサブコマンドを使うことで、事前確認待ちなしに即座に実行されます：
```text
> /agy-company daily          # 今日のデイリーノート作成＆前日からの未完了タスク引き継ぎ
> /agy-company note           # 直前の議論・調査結果を整理して Vault (01_Inbox/) にノート保存
> /agy-company search         # 過去ノートの高速メタデータ検索（-t で知見・提案・議論絞り込み対応）
> /agy-company dashboard      # ローカル Web ダッシュボードの起動・管理（--port 指定対応）
> /agy-company sync-updates   # プラグインの最新ルール・テンプレートを既存環境へ反映
```
もちろん自然言語での指示（「今日のTODOを教えて」「アイデアをメモして」「ダッシュボードを開いて」等）でも同様に動作します。

### 2. サブエージェントへの業務委譲 (`invoke_subagent`)
```text
> リサーチ部門に、競合サービスの価格調査レポートを作らせて
```
- 秘書がバックグラウンドで専門サブエージェントを起動します。
- 下書きは `.company/research/work/` で行われ、完成レポートのみが `vault/01_Inbox/research/` に綺麗な状態で納品されます。

### 3. 秘書の口調・言語の変更
運用中いつでも秘書のキャラクターを変更できます：
```text
> /agy-company tone
> 秘書の口調を執事風に変えて
> カジュアルな相棒として話して
> Please speak in English
```

---

## 5. Webダッシュボードの起動 (Docker Compose)

Vault 内のタスクや成果物を視覚的に確認・操作できる Web ダッシュボードが付属しています。

### 方法 1: チャットからのワンタッチ起動（推奨）

Antigravity CLI のチャットから直接 1 コマンドで起動・管理できます：

```text
> /agy-company dashboard
```

- ホスト側の `vault/` や `config/`（または `.company/.config/`）が現在の実行ユーザー権限で自動的に準備・マウントされるため、Docker の権限トラブルが起きません。
- 停止したい場合もチャットから行えます：
  ```text
  > /agy-company dashboard stop
  ```

### 方法 2: Docker Compose による起動

リポジトリ直下から Docker Compose で直接起動することも可能です：

```bash
# コンテナをバックグラウンドで起動
docker compose up -d
```

起動後、ブラウザで **`http://localhost:18000`** （または設定したポート）を開きます。  
（※ ローカルホスト専用 `127.0.0.1:18000:3000` に安全にバインドされています）

### ポート番号を変更したい場合

ポート 18000 が他のサービスと重複している場合、以下のいずれかの方法で変更できます：

1. **チャットから一時的にポートを指定** :
   ```text
   > /agy-company dashboard --port 18080
   ```
2. **設定ファイル（`config/config.json` または `.company/.config/config.json`）で恒久設定** :
   ```json
   {
     "dashboard_port": 18080
   }
   ```
3. **Docker Compose 起動時に環境変数を指定** :
   ```bash
   DASHBOARD_PORT=18080 docker compose up -d
   ```

### 主な機能
- **組織図パネル（常設）**: 組織階層と専門部署カード、Vaultフォルダツリー
- **デイリータスク**: チェックボックスをクリックすると、VaultのMarkdownファイル（`- [ ]` ⇄ `- [x]`）が即時同期
- **成果物一覧**: 部署別フィルタ、「Obsidianで開く」ボタン、メタデータプレビュー
- **⚙️ 設定モーダル**: 日本語／英語のUI言語切り替え、4Kモニター向けの文字サイズ無段階スケーリング

### Vault のパスを変更したい場合（`OBSIDIAN_VAULT_PATH`）
親ディレクトリや任意の場所にある Vault を指定したい場合は、環境変数を指定して起動できます：

```bash
# 例: 親ディレクトリの vault を指定する場合
OBSIDIAN_VAULT_PATH=../vault docker compose up -d
```

---

## 6. トラブルシューティング

### Q1. `/agy-company` と打っても反応しない
* **プラグインの確認** : Antigravity CLI でプラグイン一覧を確認してください。
  ```bash
  agy plugin list
  ```
  またはチャット内で `/plugin list` を実行します。
* プラグインが一覧にない場合は、再度インストールを実行してください（クローンしたディレクトリパスを指定します）：
  ```bash
  # 相対パス指定の場合:
  agy plugin install ./agy-company

  # または絶対パス指定の場合:
  agy plugin install /path/to/agy-company
  ```

### Q2. 途中で組織をやり直したい・初期化したい
* `.company/` ディレクトリを削除すれば、次回 `/agy-company` 実行時に再び初期オンボーディングからやり直せます：
  ```bash
  rm -rf .company/
  ```

### Q3. ポート 18000 を別のポートに変更したい
* チャットから `/agy-company dashboard --port 18080` を実行するか、`config/config.json`（または `.company/.config/config.json`）の `"dashboard_port"` を設定してください。
* 直接 Docker Compose を利用している場合は、`DASHBOARD_PORT=18080 docker compose up -d` を指定できます。

---

## 7. アンインストール（削除方法）

プラグインを一時的に無効化したい場合は、以下のコマンドを実行します：

```bash
agy plugin disable agy-company
```

プラグインを完全に削除したい場合は、以下のコマンドを実行します：

```bash
agy plugin uninstall agy-company
```
または Antigravity CLI のチャット内で以下を実行します：
```text
/plugin uninstall agy-company
```
（※ 生成された `.company/` や `vault/` のデータは削除されずにそのまま保持されます）
