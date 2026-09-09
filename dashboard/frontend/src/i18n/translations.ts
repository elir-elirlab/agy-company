// Translation dictionary for Japanese and English i18n support

export type Language = 'ja' | 'en';

export const translations = {
  ja: {
    header: {
      title: 'agy-company',
      cockpitSubtitle: 'Obsidian コックピット',
      dailyStandup: '朝会・デイリー',
      dailyProgress: '本日の進捗',
      deliverables: '成果物',
      quickCapture: 'クイックメモ',
      live: 'リアルタイム同期',
      offline: 'オフライン',
      langToggle: 'English',
      settings: '設定'
    },
    settings: {
      title: 'ダッシュボード設定',
      subtitle: '表示言語や全体のフォントサイズ（4K対応）をカスタマイズします',
      languageSection: '表示言語 (Language)',
      fontSizeSection: '文字サイズ (Font Size)',
      fontSizeDesc: 'ルート基準フォントサイズを変更し、4K・高解像度モニターに合わせた最適な文字の大きさに調整します。',
      fontSizePresets: {
        normal: '標準 (16px)',
        medium: '4K 推奨 (18.5px)',
        large: '4K 大 (21px)',
        xlarge: '4K 特大 (24px)'
      },
      currentSize: '現在のサイズ',
      resetBtn: '初期値 (18.5px) にリセット',
      samplePreview: 'リアルタイム表示プレビュー',
      sampleText: 'デイリータスクの消化や各部署の成果物の閲覧がここで行われます。',
      closeBtn: '閉じる'
    },
    org: {
      title: '組織図 (Org Chart)',
      departmentsCount: '専門部署',
      ownerTitle: '👑 オーナー (Owner)',
      ownerRole: '事業推進・意思決定・統括',
      secretaryTitle: '🛎️ 秘書室 (Executive Secretary)',
      secretaryRole: '窓口対応・タスク管理・壁打ち・部署への作業委譲',
      permanentBadge: '常設・専属窓口',
      activeDeptsHeader: '設立済み専門部署 (クリックでフィルタ)',
      noDeptsMessage: '現在、常設の秘書室のみ稼働中。業務の発生に合わせて自動設立されます。',
      deliverablesCount: '成果物',
      viewList: '一覧を見る →',
      vaultTreeTitle: 'Vault フォルダツリー',
      inboxFolder: '01_Inbox/ (成果物)',
      dailyFolder: '02_Daily/ (デイリーノート)',
      empty: '空'
    },
    todos: {
      title: 'デイリータスク',
      openInObsidian: 'Obsidian で開く',
      noTasks: '本日のタスクはありません',
      noTasksHint: 'Antigravity CLI (/company) で秘書に指示すると追加されます',
      markComplete: '完了にする',
      markIncomplete: '未完了に戻す'
    },
    deliverables: {
      title: 'Vault 成果物 (01_Inbox)',
      filesCount: '件',
      all: 'すべて',
      noDeliverables: '成果物はまだありません',
      noDeliverablesHint: 'サブエージェントがここに調査レポートや設計書を納品します',
      obsidianBtn: 'Obsidian',
      linksCount: '件のリンク'
    },
    quickNote: {
      modalTitle: '01_Inbox へのクイックキャプチャ',
      titleLabel: 'タイトル',
      titlePlaceholder: '例: 新機能のアイデア、会議メモ',
      deptLabel: '保存先部署',
      generalInbox: '01_Inbox/ (未分類 / 全体)',
      contentLabel: 'メモ本文 / スクラッチパッド',
      contentPlaceholder: '思考、URL、箇条書きなどを入力...',
      cancelBtn: 'キャンセル',
      saveBtn: 'Vault に保存',
      savingBtn: '保存中...'
    },
    fileViewer: {
      openInObsidian: 'Obsidian で開く',
      metadataTitle: 'Frontmatter メタデータ',
      loading: 'ドキュメントを読み込み中...',
      error: 'コンテンツの読み込みに失敗しました。'
    }
  },
  en: {
    header: {
      title: 'agy-company',
      cockpitSubtitle: 'Obsidian Cockpit',
      dailyStandup: 'Daily Standup',
      dailyProgress: 'Daily Progress',
      deliverables: 'Deliverables',
      quickCapture: 'Quick Capture',
      live: 'Live Sync',
      offline: 'Offline',
      langToggle: '日本語',
      settings: 'Settings'
    },
    settings: {
      title: 'Dashboard Settings',
      subtitle: 'Customize display language and typography scaling for 4K displays',
      languageSection: 'Display Language',
      fontSizeSection: 'Font Size',
      fontSizeDesc: 'Adjust the root rem font size to match 4K and high-resolution monitors.',
      fontSizePresets: {
        normal: 'Normal (16px)',
        medium: '4K Recommended (18.5px)',
        large: '4K Large (21px)',
        xlarge: '4K Extra Large (24px)'
      },
      currentSize: 'Current size',
      resetBtn: 'Reset to default (18.5px)',
      samplePreview: 'Live Preview',
      sampleText: 'Daily tasks and department deliverables are synchronized here in real time.',
      closeBtn: 'Close'
    },
    org: {
      title: 'Organization Chart',
      departmentsCount: 'Departments',
      ownerTitle: '👑 Owner',
      ownerRole: 'Business Strategy, Decisions & Oversight',
      secretaryTitle: '🛎️ Secretary Office',
      secretaryRole: 'Concierge, Task Management, Brainstorming & Delegation',
      permanentBadge: 'Permanent Interface',
      activeDeptsHeader: 'Active Departments (Click to filter)',
      noDeptsMessage: 'Only the Secretary Office is currently active. Specialized departments spawn dynamically.',
      deliverablesCount: 'Deliverables',
      viewList: 'View all →',
      vaultTreeTitle: 'Vault Directory Tree',
      inboxFolder: '01_Inbox/ (Deliverables)',
      dailyFolder: '02_Daily/ (Daily Notes)',
      empty: 'Empty'
    },
    todos: {
      title: 'Daily Tasks',
      openInObsidian: 'Open in Obsidian',
      noTasks: 'No tasks found for today',
      noTasksHint: 'Ask your secretary in Antigravity CLI (/company) to add items',
      markComplete: 'Mark as complete',
      markIncomplete: 'Mark as incomplete'
    },
    deliverables: {
      title: 'Vault Deliverables (01_Inbox)',
      filesCount: 'files',
      all: 'All',
      noDeliverables: 'No deliverables recorded yet',
      noDeliverablesHint: 'Subagents will publish structured reports and specs here',
      obsidianBtn: 'Obsidian',
      linksCount: 'links'
    },
    quickNote: {
      modalTitle: 'Quick Capture to 01_Inbox',
      titleLabel: 'Title',
      titlePlaceholder: 'e.g. Next Feature Idea, Meeting Notes',
      deptLabel: 'Target Department',
      generalInbox: '01_Inbox/ (General / Unsorted)',
      contentLabel: 'Content / Scratchpad',
      contentPlaceholder: 'Write thoughts, links, or bullet points here...',
      cancelBtn: 'Cancel',
      saveBtn: 'Save to Vault',
      savingBtn: 'Saving...'
    },
    fileViewer: {
      openInObsidian: 'Open in Obsidian',
      metadataTitle: 'Frontmatter Metadata',
      loading: 'Loading document...',
      error: 'Failed to load content.'
    }
  }
};
