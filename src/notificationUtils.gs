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
  const {
    managementId,
    place,
    problemText,
    problemPhotoUrls,
    problemTimestamp,
    reporter,
    correctionText,
    correctionPhotoUrls,
    correctionTimestamp,
    rowLink,
  } = data;

  const problemPhotosHtml = (problemPhotoUrls && problemPhotoUrls.length)
    ? '<ul>' + problemPhotoUrls.map(u => `<li><a href="${u}">${u}</a></li>`).join('') + '</ul>'
    : '（写真なし）';
  const correctionPhotosHtml = (correctionPhotoUrls && correctionPhotoUrls.length)
    ? '<ul>' + correctionPhotoUrls.map(u => `<li><a href="${u}">${u}</a></li>`).join('') + '</ul>'
    : '（写真なし）';

  return [
    `<p>以下の改善が報告されました。承認をお願いします。</p>`,
    `<p><b>管理ID:</b> ${managementId}</p>`,
    `<p><b>現場場所:</b> ${place}</p>`,
    `<hr/>`,
    `<h3>問題報告</h3>`,
    `<p><b>報告日時:</b> ${problemTimestamp}</p>`,
    `<p><b>報告者:</b> ${reporter}</p>`,
    `<p><b>内容:</b><br/>${(problemText || '').replace(/\n/g, '<br/>')}</p>`,
    `<p><b>写真:</b><br/>${problemPhotosHtml}</p>`,
    `<hr/>`,
    `<h3>改善報告</h3>`,
    `<p><b>改善報告日時:</b> ${correctionTimestamp}</p>`,
    `<p><b>改善内容:</b><br/>${(correctionText || '').replace(/\n/g, '<br/>')}</p>`,
    `<p><b>改善後の写真:</b><br/>${correctionPhotosHtml}</p>`,
    `<hr/>`,
    `<p><a href="${rowLink}">スプレッドシートの該当行を開く</a></p>`
  ].join('\n');
}
