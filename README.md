# VSvgCode

リアルタイムプレビュー付き SVG コードエディタ。コードとプレビューが双方向に連動します。

**[>>> デモを試す <<<](https://cocoaai-it.github.io/VSvgCode/)**

## 機能

- **リアルタイムプレビュー** — SVG コードを編集すると即座にプレビューに反映
- **双方向ハイライト** — エディタのカーソル位置に対応する SVG 要素がハイライトされ、プレビュー上の要素をホバー/クリックするとエディタの該当行にジャンプ
- **Vim モード** — `Ctrl+Shift+V` で Vim キーバインドに切り替え（相対行番号表示付き）
- **エクスポート** — SVG / PNG（2x 解像度） / JPEG 形式でダウンロード
- **シングルファイルビルド** — ビルド成果物は単一の HTML ファイルに結合

## 技術スタック

| 種別 | 技術 |
|------|------|
| 言語 | TypeScript |
| ビルド | Vite 6 + vite-plugin-singlefile |
| エディタ | CodeMirror 6（XML シンタックスハイライト、One Dark テーマ） |
| Vim | @replit/codemirror-vim |

## プロジェクト構成

```
src/
├── main.ts          # アプリ初期化・イベント接続
├── editor.ts        # CodeMirror エディタの構築・管理
├── preview.ts       # SVG レンダリング・要素ハイライト
├── export.ts        # SVG/PNG/JPEG エクスポート
├── highlighter.ts   # エディタ ↔ プレビューの双方向同期
├── line-mapper.ts   # ソース行 ↔ DOM 要素のマッピング
└── styles.css       # スタイル定義
```
