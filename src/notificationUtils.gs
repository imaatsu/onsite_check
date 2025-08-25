/**
 * 通知ユーティリティ（メール送信 / Slack通知）
 */

/**
 * メール送信（HTML本文）
 */
function sendEmail_(to, subject, htmlBody) {
  const options = Object.assign({}, MAIL_OPTIONS_DEFAULTS, { htmlBody });
  GmailApp.sendEmail(to, subject, '', options);
}

/**
 * Slack Incoming Webhook へ Block Kit で送信
 */
function sendSlackBlocks_(webhookUrl, blocks, textFallback) {
  const payload = {
    blocks: blocks,
    text: textFallback || '現場チェック通知',
  };
  const params = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  const res = UrlFetchApp.fetch(webhookUrl, params);
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('Slack Webhook error: HTTP ' + code + ' body=' + res.getContentText());
  }
}

/**
 * 問題報告 通知用 Slack Blocks を生成
 */
function buildSlackBlocksForProblem_(data) {
  const {
    managementId,
    timestamp,
    reporter,
    place,
    problemText,
    photoUrls,
    correctionFormUrl,
  } = data;

  const photoLines = (photoUrls && photoUrls.length)
    ? photoUrls.map((u, i) => `• 写真${i + 1}: ${u}`).join('\n')
    : '（写真なし）';

  return [
    { type: 'header', text: { type: 'plain_text', text: '【現場チェック】問題報告', emoji: true } },
    { type: 'section', fields: [
        { type: 'mrkdwn', text: `*管理ID*\n${managementId}` },
        { type: 'mrkdwn', text: `*現場場所*\n${place}` },
        { type: 'mrkdwn', text: `*報告日時*\n${timestamp}` },
        { type: 'mrkdwn', text: `*報告者*\n${reporter}` },
      ]
    },
    { type: 'section', text: { type: 'mrkdwn', text: `*問題点の内容*\n${problemText || '（記載なし）'}` } },
    { type: 'section', text: { type: 'mrkdwn', text: `*写真*\n${photoLines}` } },
    { type: 'actions', elements: [
        { type: 'button', text: { type: 'plain_text', text: '改善報告フォームを開く', emoji: true }, url: correctionFormUrl }
      ]
    }
  ];
}

/**
 * 承認依頼メール本文（HTML）を生成
 */
function buildApprovalEmailHtml_(data) {
  const template = HtmlService.createTemplateFromFile('src/approval-email');
  template.managementId = data.managementId;
  template.place = data.place;
  template.problemTimestamp = data.problemTimestamp;
  template.reporter = data.reporter;
  template.problemText = data.problemText;
  template.problemPhotoUrls = data.problemPhotoUrls || [];
  template.correctionTimestamp = data.correctionTimestamp;
  template.correctionText = data.correctionText;
  template.correctionPhotoUrls = data.correctionPhotoUrls || [];
  template.rowLink = data.rowLink;
  return template.evaluate().getContent();
}
