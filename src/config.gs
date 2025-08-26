/**
 * 設定値をまとめたファイル。
 * スクリプトプロパティから設定値を取得します。
 * 初回セットアップ時は setupProperties() 関数を実行してください。
 */

/**
 * スクリプトプロパティから設定値を取得
 */
function getConfig_(key, defaultValue = '') {
  return PropertiesService.getScriptProperties().getProperty(key) || defaultValue;
}

/**
 * 初回セットアップ用：スクリプトプロパティに設定値を保存
 * この関数を一度実行してから、実際の値に変更してください。
 */
function setupProperties() {
  const properties = {
    'ONSITE_SPREADSHEET_ID': 'YOUR_SPREADSHEET_ID_HERE',
    'ONSITE_CORRECTION_FORM_ID': 'YOUR_CORRECTION_FORM_ID_HERE', 
    'ONSITE_FORM_MANAGEMENT_ID_ITEM_ID': '1234567890',
    'ONSITE_FINAL_APPROVER_EMAIL': 'approver@example.com',
    'ONSITE_CORRECTION_RESPONSES_SHEET': 'フォームの回答 2'
  };
  
  PropertiesService.getScriptProperties().setProperties(properties);
  Logger.log('プロパティを初期化しました。Apps Scriptエディタの「プロジェクトの設定」で実際の値に変更してください。');
}

// 動的に設定値を取得
const SPREADSHEET_ID = getConfig_('ONSITE_SPREADSHEET_ID');
const CORRECTION_FORM_ID = getConfig_('ONSITE_CORRECTION_FORM_ID');
const CORRECTION_FORM_MANAGEMENT_ID_ITEM_ID = parseInt(getConfig_('ONSITE_FORM_MANAGEMENT_ID_ITEM_ID', '0'));
const FINAL_APPROVER_EMAIL = getConfig_('ONSITE_FINAL_APPROVER_EMAIL');

// シート名（固定値は定数として保持）
const SHEET_NAME_REPORTS = '報告一覧';
const SHEET_NAME_MASTER = '通知先マスタ';
const SHEET_NAME_CORRECTION_RESPONSES = getConfig_('ONSITE_CORRECTION_RESPONSES_SHEET', 'フォームの回答 2');

// 日時フォーマット（スプレッドシートのタイムゾーン基準で整形）
const DATETIME_FORMAT = 'yyyy/MM/dd HH:mm:ss';

// メール送信時のオプション（必要に応じて調整）
const MAIL_OPTIONS_DEFAULTS = {
  name: '現場チェックシステム',
};

