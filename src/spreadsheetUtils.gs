/**
 * スプレッドシート読み書きユーティリティ
 * 報告一覧/通知先マスタの取得、検索、更新系を集約
 */

/** スプレッドシートのインスタンスを取得 */
function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/** メイン（報告一覧）シートを取得 */
function getReportSheet_() {
  const ss = getSpreadsheet_();
  return ss.getSheetByName(SHEET_NAME_REPORTS);
}

/** 通知先マスタシートを取得 */
function getMasterSheet_() {
  const ss = getSpreadsheet_();
  return ss.getSheetByName(SHEET_NAME_MASTER);
}

/**
 * スプレッドシートのタイムゾーンで日時をフォーマット
 */
function formatNow_() {
  const tz = getSpreadsheet_().getSpreadsheetTimeZone();
  return Utilities.formatDate(new Date(), tz, DATETIME_FORMAT);
}

/**
 * 管理IDを生成（yyyyMMdd-HHmmss-SSS）
 */
function generateManagementId_() {
  const tz = getSpreadsheet_().getSpreadsheetTimeZone();
  const now = new Date();
  return Utilities.formatDate(now, tz, 'yyyyMMdd-HHmmss-SSS');
}

/**
 * 指定行の「ステータス」列（C列）を更新
 */
function updateStatus_(row, status) {
  const sheet = getReportSheet_();
  sheet.getRange(row, 3).setValue(status);
}

/**
 * 指定行の「管理ID」列（B列）を書き込み
 */
function writeManagementId_(row, managementId) {
  const sheet = getReportSheet_();
  sheet.getRange(row, 2).setValue(managementId);
}

/**
 * 報告一覧のB列（管理ID）で行を検索
 */
function findRowByManagementId_(managementId) {
  const sheet = getReportSheet_();
  const range = sheet.getRange('B:B');
  const finder = range.createTextFinder(String(managementId).trim()).matchEntireCell(true);
  const found = finder.findNext();
  return found ? found.getRow() : -1;
}

/**
 * 現場場所から通知先（メール/Slack Webhook URL）を取得
 * 通知先マスタ：A 現場場所 / C メール / D Slack Webhook URL
 */
function getNotificationTargetsByPlace_(place) {
  const sheet = getMasterSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { email: '', slackWebhookUrl: '' };
  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (String(row[0]).trim() === String(place).trim()) {
      return { email: String(row[2] || '').trim(), slackWebhookUrl: String(row[3] || '').trim() };
    }
  }
  return { email: '', slackWebhookUrl: '' };
}

/**
 * 指定行の A:J を取得（配列）。
 * 1: タイムスタンプ, 2: 管理ID, 3: ステータス, 4: 報告者名, 5: 現場場所,
 * 6: 問題点の内容, 7: 問題点の写真, 8: 改善報告日時, 9: 改善内容, 10: 改善後の写真
 */
function getReportRowValues_(row) {
  const sheet = getReportSheet_();
  return sheet.getRange(row, 1, 1, 10).getValues()[0];
}

/**
 * 指定行へ改善報告の情報（H,I,J）を書き込み
 */
function writeCorrectionToRow_(row, correctionDatetime, correctionText, photoUrlsJoined) {
  const sheet = getReportSheet_();
  sheet.getRange(row, 8, 1, 3).setValues([[correctionDatetime, correctionText, photoUrlsJoined]]);
}

/**
 * 問題点の写真セル/改善後の写真セルからURLリストを抽出
 * - Googleフォームの複数ファイルは、改行またはカンマ区切りで格納されることがあるため両対応
 */
function extractUrlsFromCell_(cellValue) {
  if (!cellValue) return [];
  const text = String(cellValue);
  const parts = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  return parts;
}

/**
 * Driveの共有権限を「組織内、リンクを知っている全員が閲覧可能」に変更
 * 失敗しても処理は継続し、失敗ファイルはログに出力
 */
function relaxDrivePermissionsDomainWithLink_(urls) {
  const ids = urls.map(extractDriveFileIdFromUrl_).filter(Boolean);
  ids.forEach(id => {
    try {
      const file = DriveApp.getFileById(id);
      file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (err) {
      Logger.log('[Drive permission] Failed to relax sharing for id=%s: %s', id, err);
    }
  });
}

/**
 * GoogleドライブのURLから fileId を抽出
 * 例: https://drive.google.com/file/d/<id>/view  または open?id=<id>
 */
function extractDriveFileIdFromUrl_(url) {
  try {
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
    if (m1) return m1[1];
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    if (m2) return m2[1];
  } catch (e) {
    // noop
  }
  return '';
}

/**
 * 該当行への直接リンクを生成（#gid=...&range=A{row}）
 */
function buildRowLink_(row) {
  const ss = getSpreadsheet_();
  const sheet = getReportSheet_();
  const gid = sheet.getSheetId();
  return ss.getUrl() + '#gid=' + gid + '&range=A' + row;
}
