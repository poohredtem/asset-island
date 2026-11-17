# Asset Island

資産形成を「続けるための遊び」にする、単一HTMLのゲーム。作者は note で資産形成を発信する「ぼね」。

**公開版（GitHub Pages）**: https://poohredtem.github.io/asset-island/
このリポジトリの `index.html` が、そのまま公開サイトになる。

## 2つのモード

- **人生シミュレーション（看板）**: 住民を1人選んで、25歳から60歳までの架空の人生を1年ずつ進める。出来事カード30枚、市場の山札（暴落は必ず来る）、暴落時の「売る／持ち続ける」の選択、結果レポートと「積立しなかった自分」との差額表示。1つの人生は目安5〜10分。
- **マイ島（副機能）**: 自分の資産（現金・投信・個別株の3区分）を入力すると島が5段階に育つ。クエスト9件・建物9棟・配当コイン。正確な記録・集計の道具ではなく、簡易入力の箱庭。

## 仕様の前提

- データは端末のブラウザ内（localStorage）にだけ保存。外部送信なし。証券口座との連携なし。
- 保存キー `assetIslandSave_v3` は変更しない（変えると既存セーブが読めなくなる）。
- 初期表示の金額は入力例。作者の実資産を初期値に埋め込むことはしない。
- 配当は「個別株など × 設定した配当利回り」のゲーム内仮定。投資信託は配当ゼロ扱い。

## 開発

- 本体は `index.html` の1ファイル。開発ルールは [DEVELOPMENT.md](DEVELOPMENT.md)、変更履歴は [CHANGELOG.md](CHANGELOG.md)、決定の記録は [DECISIONS.md](DECISIONS.md)、前提・正規値は [CONTEXT.md](CONTEXT.md)。
- テスト: `npm install` のあと `npm test`（jsdom、回帰ケース含む）。
- 版付きアーカイブは `~/workspace/goals/note/files/asset_island_deluxe_v*.html` に残る（リポジトリ外）。
