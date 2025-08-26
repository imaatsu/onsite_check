# セットアップ手順

## 1. スクリプトプロパティの設定

このプロジェクトでは機密情報をハードコーディングを避けるため、Google Apps Scriptのスクリプトプロパティを使用します。

### 初回セットアップ

1. Google Apps Script エディタで `config.gs` を開く
2. `setupProperties()` 関数を実行してプロパティを初期化
3. Apps Script エディタで「プロジェクトの設定」→「スクリプト プロパティ」を開く
4. 以下のプロパティに実際の値を設定：

| プロパティ名 | 説明 | 例 |
|-------------|------|-----|
| `ONSITE_SPREADSHEET_ID` | 現場チェック管理スプレッドシートのID | `1ABC...xyz` |
| `ONSITE_CORRECTION_FORM_ID` | 改善報告フォームのID | `1DEF...abc` |
| `ONSITE_FORM_MANAGEMENT_ID_ITEM_ID` | フォームの管理ID質問項目のID（数値） | `1234567890` |
| `ONSITE_FINAL_APPROVER_EMAIL` | 最終承認者のメールアドレス | `manager@company.com` |
| `ONSITE_CORRECTION_RESPONSES_SHEET` | 改善報告フォームの回答シート名 | `フォームの回答 2` |

### スプレッドシートIDの確認方法
スプレッドシートのURLから取得：
```
https://docs.google.com/spreadsheets/d/[ここがスプレッドシートID]/edit
```

### フォームIDの確認方法
Google フォームのURLから取得：
```
https://docs.google.com/forms/d/[ここがフォームID]/edit
```

### フォーム質問項目IDの確認方法
1. Google フォームエディタでスクリプトエディタを開く
2. 以下のコードを実行してログで確認：
```javascript
function getFormItemIds() {
  const form = FormApp.getActiveForm();
  const items = form.getItems();
  items.forEach((item, index) => {
    Logger.log(`${index}: ${item.getTitle()} - ID: ${item.getId()}`);
  });
}
```

## 2. トリガーの設定

Apps Script エディタでトリガーを設定：
1. 「トリガー」→「トリガーを追加」
2. 問題報告フォーム用：
   - 関数：`onProblemFormSubmit`
   - イベントソース：スプレッドシートから
   - イベントタイプ：フォーム送信時
3. 改善報告フォーム用：
   - 関数：`onCorrectionFormSubmit` 
   - イベントソース：スプレッドシートから
   - イベントタイプ：フォーム送信時

## 3. 権限の承認

初回実行時に以下の権限が要求されます：
- Gmail送信
- Google Drive アクセス
- Google Forms アクセス
- Google Sheets アクセス
- 外部URL取得（Slack通知用）

## セキュリティ上の注意

- スクリプトプロパティに設定した値は、スクリプトの編集権限がある人のみ閲覧可能
- 本コードをGitHubなどで公開する場合、実際の設定値は含まれません
- 各環境で個別にスクリプトプロパティの設定が必要