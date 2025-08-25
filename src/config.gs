/**
 * 設定値をまとめたファイル。
 * 実環境に合わせて ID / アドレスを入力してください。
 */

// 現場チェック管理スプレッドシートのID
const SPREADSHEET_ID = 'PUT_SPREADSHEET_ID_HERE';

// シート名（要件に合わせて固定）
const SHEET_NAME_REPORTS = '報告一覧';
const SHEET_NAME_MASTER = '通知先マスタ';

// 改善報告フォームのID
const CORRECTION_FORM_ID = 'PUT_CORRECTION_FORM_ID_HERE';

// 改善報告フォームの「管理ID」質問項目の Item ID（数値）。
// フォームエディタの「スクリプトエディタ」またはログ等で確認し設定してください。
const CORRECTION_FORM_MANAGEMENT_ID_ITEM_ID = 1234567890; // 例: 1234567890

// 最終承認者のメールアドレス（単一）
const FINAL_APPROVER_EMAIL = 'approver@example.com';

// 日時フォーマット（スプレッドシートのタイムゾーン基準で整形）
const DATETIME_FORMAT = 'yyyy/MM/dd HH:mm:ss';

// メール送信時のオプション（必要に応じて調整）
const MAIL_OPTIONS_DEFAULTS = {
  name: '現場チェックシステム',
};

