# agy-company

[English](./README.md) | [日本語](./README_JP.md)

[![Antigravity CLI](https://img.shields.io/badge/Antigravity_CLI-Skill_&_Plugin-indigo)](https://github.com/)
[![Obsidian Integration](https://img.shields.io/badge/Obsidian-Vault_Sync-purple)](https://obsidian.md/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-Dashboard-blue)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**agy-company** は、Claude Code 向け仮想組織プラグイン `cc-company` に着想を得て、Google DeepMind の **Antigravity CLI (AGY)** 向けに **移植・再設計および機能拡張を行ったポート版（Port & Extension）** です。
ユーザー（オーナー）専任の **エグゼクティブ秘書 (Executive Secretary)** が窓口となり、日常のタスク管理、壁打ち、メモの整理から、専門サブエージェント（`invoke_subagent`）への業務委譲までを一手に引き受けます。

成果物はすべて **Obsidian Vault**（ローカルMarkdown）に蓄積され、専用の **ローカルWebダッシュボード** で快適に可視化・管理できます。

---

## 🌟 3つのコア設計思想

### 1. 秘書による窓口一本化 ＆ 部署の自己拡張
```text
あなた (Owner) ────対話────▶ 専任秘書 (Executive Secretary)
                               │
                               ├─ [日常タスク・メモ] ──▶ Obsidian / Daily & Inbox に即時記録
                               │
                               ├─ [相談・壁打ち] ──────▶ 思考を深め、決定事項を議事録化
                               │
                               └─ [専門・重厚タスク] ──▶ 専門サブエージェント (Subagents) を起動
                                                        ├─ リサーチ部門 (市場調査・競合分析)
                                                        ├─ 開発部門 (技術設計・プロトタイプ作成)
                                                        └─ PM部門 (マイルストーン・タスク分解)
```
- **スモールスタート**: 初期状態は秘書室のみ。初めから複雑な組織設計は不要です。
- **自然な部署設立**: 同じドメインの相談が2回以上発生すると、秘書が「専用部門を設立しましょうか？」と自発的に提案します。
- **秘書の口調・ペルソナ変更**: 「親しみやすいパートナー」「英国風の執事」「カジュアルな開発相棒」「ストイックなコーチ」など、好みの口調や言語（日本語 / 英語 / バイリンガル）にいつでも変更できます。

### 2. 2層アーキテクチャ (Git管理 ⇄ Obsidian Vault)
作業中の生データでObsidianが散らかるのを防ぐため、明確な境界を設けています。

```text
【作業中・生データ・下書き】                【完成したクリーンな成果物のみ】
Git管理リポジトリ (.company/)              Obsidian Vault (vault/)
├── AGENTS.md (組織全体ガイドライン)          ├── 01_Inbox/ (整理済み成果物)
├── secretary/ (秘書室管理データ)            │   ├── research/ (調査レポート)
│   ├── AGENTS.md (秘書の口調・設定)         │   ├── engineering/ (技術設計書)
│   └── ...                                 │   └── ...
└── [department]/work/                      ├── 02_Daily/ (デイリーノート)
    └── (下書き・スクラッチ・生ログ)         └── AGENTS.md
```

### 3. APIキー不要・完全ローカルのWebダッシュボード
FastAPI ＋ React ＋ Tailwind CSS による経営コックピット。
LLMのAPIキー消費はゼロ（0円）で、Obsidian内のファイルを直接双方向同期します。4Kモニターや高解像度画面に最適化され、日本語／英語の切り替えや文字サイズの無段階調整に対応しています。

---

## 📂 ディレクトリ構成

```text
agy-company/
├── README.md                           # 英語ドキュメント
├── README_JP.md                        # 日本語ドキュメント（本ファイル）
├── config/                             # 組織・部署・共通設定 (JSON)
│   ├── config.json                     # システム共通設定 (Vaultパス・デフォルト言語)
│   ├── departments-ja.json             # 日本語の組織（役職・部署名・役割）定義
│   └── departments-en.json             # 英語の組織（役職・部署名・役割）定義
├── docker-compose.yml                  # ダッシュボード用 Docker Compose 設定
├── Dockerfile                          # マルチステージビルド（フロントエンド + バックエンド）
├── plugins/
│   └── company/                        # Antigravity CLI プラグイン本体
│       ├── plugin.json                 # プラグインマニフェスト
│       └── skills/
│           └── company/
│               ├── SKILL.md            # 秘書ワークフロー定義・運営ガイド
│               └── references/
│                   ├── agents-md-template.md  # AGENTS.md 生成テンプレート
│                   └── departments.md         # 部署別テンプレート定義
├── dashboard/                          # Webダッシュボードソースコード
│   ├── backend/                        # FastAPI バックエンド
│   └── frontend/                       # React + Vite + Tailwind フロントエンド
├── .company/                           # 稼働中の組織設定・作業領域 (Git管理)
└── vault/                              # Obsidian Vault マウント先 (成果物)
```

---

## 🚀 インストール & 有効化

> **初心者向けの詳しい導入手順は [docs/INSTALLATION.md](./docs/INSTALLATION.md) をご覧ください。**

Antigravity CLI は、カレントディレクトリの `.agents/` または `~/.gemini/config/` からプラグイン・スキルを自動検出します。

### 1. ワークスペースへの配置
本リポジトリのルートで、`.agents/plugins/company` へのシンボリックリンクを作成します（初期設定済み）：

```bash
mkdir -p .agents/plugins
ln -s "$(pwd)/plugins/company" .agents/plugins/company
```

### 2. Obsidian Vault のマウント（推奨）
Obsidian と連携させたい場合は、会社専用の Obsidian Vault を `./vault` にバインドマウントします。
あるいはObsidian Vault のうち、会社専用フォルダを `./vault` にバインドマウントします：

```bash
# 例: Google Drive 上の Obsidian/MyVault/company をマウントする場合
sudo mount --bind "/path/to/Obsidian/MyVault/company" ./vault
```
> [!IMPORTANT]
> 既存の個人用Vault全体ではなく、必ずVault内の `company` などの**専用サブフォルダ**をマウントしてください。これにより、既存の個人ノートが誤って変更されるのを防ぎます。
> Obsidian がインストールされていなくても、vault/ は単なる「普通の Markdown（.md）メモ帳フォルダ」として機能します（その場合は./vault内は空でOK）。

---

## 🤖 スキルの詳細な使い方

### 1. 初回オンボーディング（3分セットアップ）
Antigravity CLI のチャットで以下のように入力します：

```text
> /company
```
または
```text
> 秘書さん、組織のセットアップをお願いします
```

秘書が以下の4つの質問を順番に行います：
1. **事業や活動内容 (Business / Activity)**: 何を作っているか、どのような活動をしているか
2. **目標や現在の課題 (Goals & Challenges)**: 達成したいこと、時間が足りない作業
3. **定期リマインダーの確認 (Schedule)**: 朝会やタスク確認の自動通知を希望するか（デフォルト: OFF）
4. **秘書の言語と口調設定 (Persona & Language)**: お好みの話し方と言語

回答が完了すると、自動的に必要なファイル群が生成され、専任秘書が着任します。

---

### 2. 秘書の言語・口調カスタマイズ機能 🎭

業務中いつでも、秘書の話し方や使用言語を変更できます。

#### 変更コマンド・呼びかけ例:
```text
> /company tone
> 秘書の口調を執事風に変えて
> カジュアルな相棒として話してほしい
> Please speak in English
> 日英バイリンガルで対応して
```

#### 選択できるプリセット:
| プリセット | 特徴 | 主な口調・語尾の例 |
|---|---|---|
| 🌟 **丁寧・フレンドリー** *(標準)* | 明るく前向きで共感力の高いパートナー | 「〜ですね！」「お任せください！」「承知いたしました！」 |
| 🎩 **執事・プロフェッショナル** | 格式高く落ち着いた英国風エグゼクティブ執事 | 「かしこまりました」「〜でございます」「直ちに手配いたします」 |
| 🤝 **カジュアル・相棒** | スタートアップ共同創業者・開発仲間の距離感 | 「了解！」「任せて！」「〜やっておくね！」「これどう？」 |
| 🎯 **ストイックコーチ** | 目標達成にコミットする厳格なメンター | 「目標から逆算しましょう」「本日の最優先タスクはこれです」 |
| 🎨 **カスタム** | ユーザー独自の指定 | 「関西弁で」「語尾を〜にして」など自由設定 |

設定内容は `.company/secretary/AGENTS.md` に保存され、次回以降のセッションでも永続化されます。

---

### 3. 日常業務とサブエージェント連携

#### デイリータスクの管理
```text
> 今日のTODOを確認したい
> 「新機能のワイヤーフレーム作成」を今日のタスクに追加して
```
- `vault/02_Daily/YYYY-MM-DD.md` に前日・翌日の双方向ナビゲーション付きで自動記録されます。

#### アイデア・メモのキャプチャ
```text
> ちょっとメモ。「ローカルLLMを使ったコードレビュー自動化ツール」
```
- `vault/01_Inbox/` にタイムスタンプ付きのMarkdownとして即座に保存されます。

#### 専門サブエージェントへの業務委譲 (`invoke_subagent`)
```text
> リサーチ部門に、最新のオープンソースベクトルDBの性能比較レポートを作らせて
```
1. 秘書が裏で `invoke_subagent` を呼び出し、調査用サブエージェントをバックグラウンド起動します。
2. サブエージェントは中間調査を `.company/research/work/` で行い、完成したレポートを `vault/01_Inbox/research/YYYY-MM-DD-HHmmss-VectorDB-Comparison.md` に納品します。
3. 納品物には標準YAMLフロントマター（ID、タグ、関連ノートリンク）が自動付与されます。
4. 秘書が「レポートの作成が完了いたしました！」と要約を報告します。
5. **安全ガードレール**: サブエージェントによるリポジトリ全体の破壊的リセット（`git reset --hard` や `git clean -fd`）は全体ルールとして禁止されており、変更取り消しは必ず対象ファイル単位（`git restore <path>`）で行われます。

---

## 🖥️ Webダッシュボードの詳細な使い方

Obsidian Vault の内容をグラフィカルに管理できるダッシュボードが付属しています。

```bash
# バックグラウンドで起動
docker compose up -d
```

起動後、ブラウザで **`http://localhost:18000`** にアクセスします。
（※ ローカルホスト専用 `127.0.0.1:18000:3000` にバインドされているため、LAN内に漏洩しません）

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ 🏢 agy-company   Obsidian Cockpit       [進捗 2/3 (67%)]  [⚙️ 設定] [● リアルタイム同期] │
├─────────────────────┬───────────────────────────┬─────────────────────────────┤
│ 1. 組織図パネル      │ 2. デイリータスク          │ 3. 成果物一覧 (01_Inbox)     │
│                     │                           │                             │
│ 👑 オーナー (Owner)  │ 📅 2026-09-09             │ 📂 全て | リサーチ | 開発 | PM │
│         ↓           │ [x] 朝会アジェンダの確認   │ 📄 2026-09-08 競合調査      │
│ 🛎️ 秘書室 (Secretary)│ [ ] API設計のレビュー     │    [Obsidianで開く]          │
│         ↓           │ [ ] クライアント返信      │ 📄 2026-09-08 認証基盤設計  │
│ 👥 専門部署一覧     │                           │                             │
│  - リサーチ部門 (3) │ [+ クイックキャプチャ]    │                             │
│  - 開発部門 (2)     │                           │                             │
│ 📁 Vaultフォルダツリー│                           │                             │
└─────────────────────┴───────────────────────────┴─────────────────────────────┘
```

### パネル構成と主な機能

#### ① 組織図パネル（左カラム・常設）
- **階層ビュー**: オーナー ➔ 秘書室 ➔ 設立済み専門部署をグラフィカルに表示。
- **ワンクリックフィルタ**: 部署カードをクリックすると、右側の成果物一覧がその部署の成果物だけに絞り込まれます。
- **Vault フォルダツリー**: `01_Inbox/` と `02_Daily/` の最新ファイル構造をリアルタイム表示。

#### ② デイリータスク（中央カラム）
- **今日のタスク一覧**: `02_Daily/YYYY-MM-DD.md` 内のチェックボックスをリアルタイム反映。
- **双方向チェック連動**: ダッシュボード上のチェックボックスをクリックすると、**Vault内のMarkdownファイル側も即座に `- [ ]` ⇄ `- [x]` が書き換わります**。

#### ③ 成果物一覧（右カラム）
- **最新成果物の閲覧**: 各部署のサブエージェントが納品したレポートをカード形式で一覧表示。
- **Obsidian 連携**: 「Obsidian」ボタンをクリックすると、Obsidian URI（`obsidian://open?...`）経由でデスクトップのObsidianアプリで直接開きます。
- **ドキュメントビューア**: カードをクリックするとモーダルが開き、Markdown本文とFrontmatterメタデータをその場でプレビューできます。

#### ④ クイックキャプチャ（上部ボタン）
- ヘッダーの「⚡ クイックメモ」ボタンから、タイトル・部署・本文を入力して「Vaultに保存」を押すと、数秒でタイムスタンプ付きのノートが `01_Inbox/` に直接作成されます。

#### ⑤ ⚙️ 設定モーダル（ヘッダー右）
- **言語切り替え**: 日本語（JA）／ 英語（EN）をワンクリックで切り替え可能。
- **4K・フォントサイズ調整**:
  - ルートの基準フォントサイズ（`rem`）を無段階スライダー（14px〜26px）で自由に変更。
  - ワンタッチプリセット: `標準 (16px)`, `4K 推奨 (18.5px)`, `4K 大 (21px)`, `4K 特大 (24px)`
  - リセットボタン: いつでも初期値（18.5px）に復帰。
  - 設定値はブラウザの `localStorage` に保存され、次回訪問時も維持されます。

#### ⑥ リアルタイム自動同期 (WebSocket)
- Antigravity CLI や Obsidian 側でファイルが追加・編集されると、WebSocket経由でダッシュボードが自動リロードされます。ブラウザを手動更新する必要はありません。

---

## ⚙️ 組織・部署の設定カスタマイズ (`config/` ディレクトリ)

ダッシュボードに表示される組織図、役職名、専門部署の名前や役割は、`config/` ディレクトリ内のJSONファイルを編集することで自由にカスタマイズできます。

### 1. 各設定ファイルの役割

| ファイル | 役割 | 主な設定内容 |
|---|---|---|
| [`config/config.json`](./config/config.json) | システム共通設定 | Vault のパス (`vault_dir`)、デフォルト言語 (`default_language`) |
| [`config/departments-ja.json`](./config/departments-ja.json) | 日本語設定 | 日本語モード時のオーナー・秘書室の役職・役割、各部署名と役割 |
| [`config/departments-en.json`](./config/departments-en.json) | 英語設定 | 英語モード時のオーナー・秘書室の役職・役割、各部署名と役割 |

### 2. 設定例と書き方

#### ① 部署の追加・変更 (`departments-ja.json` / `departments-en.json`)
キー名（英小文字スラッグ）は `vault/01_Inbox/` 直下のフォルダ名と一致させます：

```json
{
  "departments": {
    "research": {
      "name": "リサーチ部門",
      "role": "市場調査・競合分析・技術サーベイ"
    },
    "legal": {
      "name": "法務部門",
      "role": "契約書レビュー・法令遵守・知財管理"
    }
  }
}
```

> [!TIP]
> **親切なフォールバック（自動補完）設計**:
> `departments-ja.json` に新しい部署を追加し、`departments-en.json` に書き忘れた場合でも、プログラムが日本語側の設定やフォルダ名から自動補完するため、エラーで落ちることはありません。

#### ② オーナー・秘書室の名称変更
「CEO」「代表取締役」「専属AIアシスタント」など、お好みの呼称に変更できます：

```json
{
  "owner": {
    "title": "代表取締役 (CEO)",
    "role": "事業推進・意思決定・統括"
  },
  "secretary": {
    "title": "専属AI秘書",
    "role": "タスク管理・壁打ち・部署への業務委譲",
    "permanent_badge": "常設窓口"
  }
}
```

---

### 3. 🐳 Docker Compose 起動時の挙動

`docker-compose.yml` では、ホスト側の `./config` ディレクトリがコンテナ内の `/app/config` に自動バインドマウントされています：

```yaml
    environment:
      - CONFIG_DIR=/app/config
    volumes:
      - ${CONFIG_PATH:-./config}:/app/config
```

#### 特徴とメリット:
- **即時反映（ホットリロード）**:
  Docker コンテナ起動中にホスト側で `config/departments-ja.json` などを編集・保存すると、**コンテナを再起動（`down` / `up`）や再ビルド（`build`）することなく、ブラウザ画面をリロードするだけで最新の設定が即座に反映**されます。
- **外部フォルダの指定**:
  別の場所にある設定ファイル群を使いたい場合は、環境変数 `CONFIG_PATH` を指定して起動できます：
  ```bash
  CONFIG_PATH=/path/to/my-config docker compose up -d
  ```

---

## 🛠️ トラブルシューティング & Tips

### Q. Docker コンテナを更新・再ビルドしたい
```bash
docker compose up -d --build
```

### Q. ポート 18000 を別のポートに変えたい
`docker-compose.yml` の `ports` 設定を編集します：
```yaml
ports:
  - "127.0.0.1:YOUR_PORT:3000"
```

### Q. Google Drive / WSL2 でファイルの変更検知が遅い
`docker-compose.yml` でポーリング検知が有効化されています：
```yaml
environment:
  - WATCH_POLLING=true
```
Google Drive や Windowsのファイルシステム（drvfs）でも確実にファイル変更が検知されます。

### Q. Vault フォルダの場所を別のディレクトリに指定したい
親ディレクトリや任意の場所にある Vault を指定する場合、環境変数 `OBSIDIAN_VAULT_PATH` を指定して起動できます（デフォルト: `./vault`）：
```bash
# 例: 親ディレクトリ (../vault) をマウントして起動する場合
OBSIDIAN_VAULT_PATH=../vault docker compose up -d
```
または `.env` ファイルに `OBSIDIAN_VAULT_PATH=../vault` を記述しても適用されます。

### Q. 設定フォルダ（config/）の場所を別のディレクトリに指定したい
Vault と同様に、環境変数 `CONFIG_PATH` を指定して起動できます（デフォルト: `./config`）：
```bash
# 例: 任意の場所の設定フォルダを指定して起動する場合
CONFIG_PATH=/path/to/my-config docker compose up -d
```


---

## 🙏 謝辞 / クレジット (Acknowledgments & Credits)

本プロジェクトは、Claude Code 向け仮想組織プラグイン [**cc-company**](https://github.com/Shin-sibainu/cc-company) (作成者: [@Shin-sibainu](https://github.com/Shin-sibainu) 様 / MIT License) の優れた設計思想（スモールスタート、秘書による窓口一本化、部署の自然な自己拡張）に着想を得て、Google Antigravity CLI (AGY) 向けに**移植・再設計および機能拡張を行ったポート版（Port & Extension）**です。

元の優れた組織運営モデルをベースに、Antigravity のネイティブサブエージェント連携（`invoke_subagent`）、Obsidian Vault 連携、およびローカル Web ダッシュボードなどの独自機能を追加・再構築しています。素晴らしい先行実装に深く感謝いたします。

---

## 📄 ライセンス & サードパーティ通知

本プロジェクトは **MIT License** のもとで公開されています。
詳細は [LICENSE](./LICENSE) をご覧ください。また、AI支援に関する免責事項および使用しているサードパーティ製ライブラリのライセンス一覧については [NOTICES.md](./NOTICES.md) をご確認ください。
