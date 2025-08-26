# 現場チェック管理システム

Google Apps ScriptとGoogle Formsを活用した現場での問題報告・改善管理システムです。

## 📋 概要

このシステムは、現場での問題点の報告から改善完了まで、一連のワークフローを自動化します：

1. **問題報告**: Google Formで問題を報告
2. **自動通知**: 担当者にメール・Slack通知
3. **改善報告**: プリフィル済みフォームで改善内容を報告
4. **承認フロー**: 管理者による最終承認

## 🚀 主な機能

### 問題報告フロー
- ✅ Google Formでの問題報告受付
- ✅ 自動管理ID生成（日時ベース）
- ✅ 現場場所別の通知先振り分け
- ✅ メール・Slack への自動通知
- ✅ Google Drive画像の自動権限設定

### 改善報告フロー
- ✅ 管理ID付きプリフィルフォーム生成
- ✅ 改善内容・写真の自動記録
- ✅ 承認者への自動通知
- ✅ ステータス自動更新

### セキュリティ機能
- 🔒 PropertiesServiceによる設定値管理
- 🔒 組織内限定のDrive画像共有
- 🔒 シート名検証による誤作動防止

## 📁 ファイル構成

```
src/
├── main.gs                 # メイン処理（トリガー関数）
├── config.gs              # 設定管理（PropertiesService）
├── spreadsheetUtils.gs    # スプレッドシート操作
├── notificationUtils.gs   # 通知機能（メール・Slack）
├── approval-email.html    # 承認依頼メールテンプレート
└── appsscript.json        # Apps Script設定

docs/
└── specification.md       # 要件仕様書

SETUP.md                   # セットアップ手順
README.md                  # このファイル
```

## ⚙️ セットアップ

詳細な手順は [SETUP.md](SETUP.md) をご覧ください。

### 前提条件
- Google Workspace アカウント
- Google Forms（問題報告用・改善報告用）
- Google Spreadsheet（管理用）

### 簡易手順

1. **Google Apps Scriptプロジェクト作成**
2. **ソースコードデプロイ**
   ```bash
   git clone https://github.com/imaatsu/onsite_check.git
   # src/ 内のファイルをApps Scriptエディタにコピー
   ```

3. **設定値の登録**
   ```javascript
   // config.gsのsetupProperties()を実行
   // スクリプトプロパティで実際の値に変更
   ```

4. **トリガー設定**
   - `onProblemFormSubmit`: 問題報告フォーム送信時
   - `onCorrectionFormSubmit`: 改善報告フォーム送信時

## 📊 データ構造

### 報告一覧シート
| 列 | 項目 | 説明 |
|---|------|------|
| A | タイムスタンプ | 報告日時 |
| B | 管理ID | 自動生成ID |
| C | ステータス | 対応待ち/通知済み/承認待ち/完了 |
| D | 報告者名 | 報告者 |
| E | 現場場所 | 現場識別子 |
| F | 問題内容 | 問題の詳細 |
| G | 問題写真 | Drive画像URL |
| H | 改善日時 | 改善報告日時 |
| I | 改善内容 | 改善の詳細 |
| J | 改善写真 | 改善後画像URL |

### 通知先マスタシート
| 列 | 項目 | 説明 |
|---|------|------|
| A | 現場場所 | 現場識別子 |
| B | （予備） | - |
| C | メールアドレス | 通知先メール |
| D | Slack Webhook URL | 通知先Slack |

## 🔧 カスタマイズ

### 通知先の追加
通知先マスタシートに現場場所と対応する通知先を追加

### Slack通知のカスタマイズ
`notificationUtils.gs` の `buildSlackBlocksForProblem_()` 関数を編集

### メールテンプレートの変更
`buildApprovalEmailHtml_()` 関数でHTML形式のメール内容を編集

## 🛡️ セキュリティ

- **機密情報保護**: スプレッドシートIDやメールアドレスはPropertiesServiceで管理
- **アクセス制御**: Google Drive画像は組織内限定共有
- **入力検証**: フォーム送信時のシート名検証

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 サポート

- Issues: [GitHub Issues](https://github.com/imaatsu/onsite_check/issues)
- 要件詳細: [docs/specification.md](docs/specification.md)
- セットアップ: [SETUP.md](SETUP.md)

---

Made with ❤️ for better workplace safety management