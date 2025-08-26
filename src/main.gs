/**
 * メインエントリ（トリガー関数）
 * - onProblemFormSubmit: 問題報告フォーム送信時
 * - onCorrectionFormSubmit: 改善報告フォーム送信時
 */

/**
 * 問題報告フォームが送信されたときの処理
 * イベントオブジェクト e は「スプレッドシートの onFormSubmit（インストール型）」を想定
 */
function onProblemFormSubmit(e) {
    // ★★★ 追加: 正しいシートからの送信かを確認 ★★★
  if (e && e.range && e.range.getSheet().getName() !== SHEET_NAME_REPORTS) {
    Logger.log('onProblemFormSubmit: Not a submission to the report sheet. Skipping.');
    return;
  }

  const row = e && e.range ? e.range.getRow() : null;
  if (!row) {
    Logger.log('Invalid event object: no row');
    return;
  }

  try {
    // フォーム送信時の値を e.values から優先取得（列順に依存）。
    // 報告一覧シートの列: A:タイムスタンプ, B:管理ID(空), C:ステータス(空), D:報告者名, E:現場場所, F:問題点の内容, G:問題点の写真
    const v = (e && e.values) ? e.values : null;
    const rowValues = v && v.length >= 7 ? v : getReportRowValues_(row);
    const timestamp = rowValues[0];
    const reporter = rowValues[3];
    const place = rowValues[4];
    const problemText = rowValues[5];
    const photoCell = rowValues[6];
    const photoUrls = extractUrlsFromCell_(photoCell);

    // 管理ID生成＆書き込み、初期ステータス
    const managementId = generateManagementId_();
    writeManagementId_(row, managementId);
    updateStatus_(row, '対応待ち');

    // 通知先の取得
    const targets = getNotificationTargetsByPlace_(place);

    // 改善報告フォームのプレフィルURL生成（管理ID埋込）
    const form = FormApp.openById(CORRECTION_FORM_ID);
    const item = form.getItemById(CORRECTION_FORM_MANAGEMENT_ID_ITEM_ID).asTextItem();
    const prefilled = form.createResponse().withItemResponse(item.createResponse(managementId)).toPrefilledUrl();

    // 写真の権限をドメイン内リンク閲覧に緩和（失敗しても継続）
    relaxDrivePermissionsDomainWithLink_(photoUrls);

    // 通知本文の準備
    const ssTz = SpreadsheetApp.openById(SPREADSHEET_ID).getSpreadsheetTimeZone();
    const tsText = Utilities.formatDate(new Date(timestamp), ssTz, DATETIME_FORMAT);

    const subject = `【現場チェック】[${place}] より問題点の報告がありました`;
    const photoListHtml = (photoUrls.length ? '<ul>' + photoUrls.map(u => `<li><a href="${u}">${u}</a></li>`).join('') + '</ul>' : '（写真なし）');
    const html = [
      `<p><b>管理ID:</b> ${managementId}</p>`,
      `<p><b>報告日時:</b> ${tsText}</p>`,
      `<p><b>報告者:</b> ${reporter}</p>`,
      `<p><b>現場場所:</b> ${place}</p>`,
      `<p><b>問題点の内容:</b><br/>${(problemText || '').replace(/\n/g, '<br/>')}</p>`,
      `<p><b>問題点の写真:</b><br/>${photoListHtml}</p>`,
      `<p><a href="${prefilled}"><b>改善報告フォーム（管理ID自動入力）はこちら</b></a></p>`
    ].join('\n');

    // Slack用Blocks
    const blocks = buildSlackBlocksForProblem_({
      managementId,
      timestamp: tsText,
      reporter,
      place,
      problemText,
      photoUrls,
      correctionFormUrl: prefilled,
    });

    let sentAny = false;
    let hadError = false;

    // メール送信（設定がある場合のみ）
    if (targets.email) {
      try {
        sendEmail_(targets.email, subject, html);
        sentAny = true;
      } catch (err) {
        hadError = true;
        Logger.log('Email send error: %s', err);
      }
    }

    // Slack送信（設定がある場合のみ）
    if (targets.slackWebhookUrl) {
      try {
        sendSlackBlocks_(targets.slackWebhookUrl, blocks, subject);
        sentAny = true;
      } catch (err) {
        hadError = true;
        Logger.log('Slack send error: %s', err);
      }
    }

    // ステータス更新
    if (hadError) {
      updateStatus_(row, '通知エラー');
    } else if (sentAny) {
      updateStatus_(row, '通知済み');
    } else {
      // 送信先未設定の場合は「対応待ち」のまま
      Logger.log('No notification targets for place=%s', place);
    }
  } catch (error) {
    Logger.log('onProblemFormSubmit error: %s', error);
    try { updateStatus_(row, '通知エラー'); } catch (e2) {}
  }
}

/**
 * 改善報告フォームが送信されたときの処理
 * イベントオブジェクト e は「スプレッドシートの onFormSubmit（インストール型）」を想定
 */
function onCorrectionFormSubmit(e) {
  // ★★★ 追加: 正しいシートからの送信かを確認 ★★★
  if (e && e.range && e.range.getSheet().getName() !== SHEET_NAME_CORRECTION_RESPONSES) {
    Logger.log('onCorrectionFormSubmit: Not a submission to the correction sheet. Skipping.');
    return;
  }

  try {
    // e.valuesから取得を試みる (e.g., [タイムスタンプ, 管理ID, 改善内容, 写真URL])
    const values = e.values;
    let managementId, correctionTextRaw, correctionPhotosRaw;

    if (values && values.length > 1) {
      managementId = String(values[1]).trim();
      correctionTextRaw = String(values[2] || '');
      correctionPhotosRaw = String(values[3] || '');
    } else {
      // フォールバック: namedValuesから取得
      const named = e && e.namedValues ? e.namedValues : {};
      function pick(keys) {
        for (var i = 0; i < keys.length; i++) {
          const k = Object.keys(named).find(nk => nk.indexOf(keys[i]) !== -1);
          if (k) return named[k];
        }
        return '';
      }
      managementId = String(pick(['管理ID'])).trim();
      correctionTextRaw = String(pick(['改善内容']));
      correctionPhotosRaw = String(pick(['改善後の写真', '写真']));
    }
    
    const correctionPhotoUrls = extractUrlsFromCell_((correctionPhotosRaw || '').toString());

    if (!managementId) {
      Logger.log('管理IDが取得できませんでした。e.values=%s, e.namedValues=%s', 
        JSON.stringify(e.values), JSON.stringify(e.namedValues));
      return;
    }

    // 対応する報告行を検索 (TextFinder使用)
    const row = findRowByManagementId_(managementId);
    if (row < 0) {
      Logger.log('管理IDに一致する行が見つかりません: %s', managementId);
      return;
    }

    // 写真権限をドメイン内リンク閲覧に（失敗しても継続）
    relaxDrivePermissionsDomainWithLink_(correctionPhotoUrls);

    // 改善報告の書き込み（H,I,J）とステータス更新
    const correctionDatetime = formatNow_();
    writeCorrectionToRow_(row, correctionDatetime, correctionTextRaw, correctionPhotoUrls.join(', '));
    updateStatus_(row, '承認待ち');

    // 報告行の情報を取得（通知用）
    const reportValues = getReportRowValues_(row);
    const problemTimestamp = reportValues[0];
    const reporter = reportValues[3];
    const place = reportValues[4];
    const problemText = reportValues[5];
    const problemPhotoUrls = extractUrlsFromCell_(reportValues[6]);

    // 承認者宛メール送信
    const ssTz = SpreadsheetApp.openById(SPREADSHEET_ID).getSpreadsheetTimeZone();
    const probTsText = Utilities.formatDate(new Date(problemTimestamp), ssTz, DATETIME_FORMAT);
    const subject = `【現場チェック承認依頼】[${place}] の改善が報告されました`;
    const rowLink = buildRowLink_(row);
    const html = buildApprovalEmailHtml_({
      managementId,
      place,
      problemText,
      problemPhotoUrls,
      problemTimestamp: probTsText,
      reporter,
      correctionText: correctionTextRaw,
      correctionPhotoUrls,
      correctionTimestamp: correctionDatetime,
      rowLink,
    });

    try {
      sendEmail_(FINAL_APPROVER_EMAIL, subject, html);
    } catch (err) {
      Logger.log('Approval email send error: %s', err);
      // ステータスは承認待ちのまま
    }
  } catch (error) {
    Logger.log('onCorrectionFormSubmit error: %s', error);
  }
}