const ONE_SHOT_DRIVE = {
  CENTRAL_FOLDER_ID: '11w54EN71nh8UHZZ6yB0Ps-hBrcB0Vi1M',
  ORIGINAL_FOLDER_ID: '1fEQ_3GCtI9sWix5n931x8oe9wdRxUGic',
  FINAL_FOLDER_ID: '1yEt1ZkfqmgSs9MPUzQvgXK1BRig-XJYz',
  INDEX_NAME: 'ONE_SHOT_MEDIA_INDEX',
  TOKEN_PROPERTY: 'ONE_SHOT_TOKEN'
};

function setupOneShotDriveBridge() {
  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty(ONE_SHOT_DRIVE.TOKEN_PROPERTY);
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty(ONE_SHOT_DRIVE.TOKEN_PROPERTY, token);
  }
  const sheet = getIndexSheet_();
  Logger.log('ONE SHOT TOKEN: ' + token);
  Logger.log('INDEX: ' + sheet.getParent().getUrl());
  return { token: token, indexUrl: sheet.getParent().getUrl() };
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const callback = safeCallback_(p.callback || '');
  let result;
  try {
    verifyToken_(p.token);
    const action = String(p.action || 'ping').toLowerCase();
    if (action === 'ping') result = { ok: true, service: 'ONE_SHOT_DRIVE', at: new Date().toISOString() };
    else if (action === 'lookup') result = lookup_(p.code, p.kind, p.sha256);
    else if (action === 'media') result = media_(p.code, p.kind);
    else result = { ok: false, error: 'Acción GET no soportada' };
  } catch (err) {
    result = { ok: false, error: err && err.message ? err.message : String(err) };
  }
  const text = callback ? `${callback}(${JSON.stringify(result)});` : JSON.stringify(result);
  return ContentService.createTextOutput(text).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function doPost(e) {
  let payload = {};
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
    if (raw) {
      try { payload = JSON.parse(raw); } catch (_) { payload = {}; }
    }
    if ((!payload || !Object.keys(payload).length) && e && e.parameter) {
      if (e.parameter.payload) {
        try { payload = JSON.parse(e.parameter.payload); } catch (_) { payload = {}; }
      } else payload = Object.assign({}, e.parameter);
    }
    verifyToken_(payload.token);
    const action = String(payload.action || '').toLowerCase();
    let result;
    if (action === 'upsertmedia') result = upsertMedia_(payload);
    else if (action === 'deleteevidence') result = deleteEvidence_(payload.code);
    else if (action === 'ping') result = { ok: true, service: 'ONE_SHOT_DRIVE', at: new Date().toISOString() };
    else result = { ok: false, error: 'Acción POST no soportada' };
    return json_(result);
  } catch (err) {
    return json_({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

function verifyToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty(ONE_SHOT_DRIVE.TOKEN_PROPERTY);
  if (!expected) throw new Error('Ejecuta setupOneShotDriveBridge() primero');
  if (!token || String(token) !== String(expected)) throw new Error('Token inválido');
}

function getIndexSheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('ONE_SHOT_INDEX_SHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (_) {}
  }
  const ss = SpreadsheetApp.create(ONE_SHOT_DRIVE.INDEX_NAME);
  id = ss.getId();
  props.setProperty('ONE_SHOT_INDEX_SHEET_ID', id);
  try { DriveApp.getFileById(id).moveTo(DriveApp.getFolderById(ONE_SHOT_DRIVE.CENTRAL_FOLDER_ID)); } catch (_) {}
  const sh = ss.getSheets()[0];
  sh.setName('MEDIA_INDEX');
  sh.appendRow(['created_at','updated_at','code','kind','sha256','file_id','file_name','status','canonical_code','party','district','latitude','longitude','source']);
  sh.setFrozenRows(1);
  return sh;
}

function rows_() {
  const sh = getIndexSheet_();
  const values = sh.getDataRange().getValues();
  const headers = values.shift() || [];
  return values.map((r, i) => {
    const o = {_row: i + 2};
    headers.forEach((h, j) => o[String(h)] = r[j]);
    return o;
  });
}

function norm_(v) { return String(v == null ? '' : v).trim(); }
function up_(v) { return norm_(v).toUpperCase(); }
function safe_(v) { return norm_(v).replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100) || 'EVIDENCIA'; }
function safeCallback_(v) { return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(String(v || '')) ? String(v) : ''; }
function now_() { return new Date().toISOString(); }
function extFor_(mime) { mime = String(mime || '').toLowerCase(); return mime.indexOf('png') >= 0 ? 'png' : mime.indexOf('webp') >= 0 ? 'webp' : 'jpg'; }
function folderFor_(kind) { return DriveApp.getFolderById(up_(kind) === 'ORIGINAL' ? ONE_SHOT_DRIVE.ORIGINAL_FOLDER_ID : ONE_SHOT_DRIVE.FINAL_FOLDER_ID); }
function json_(x) { return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON); }

function latestForCodeKind_(code, kind) {
  const C = up_(code), K = up_(kind || 'FINAL');
  return rows_().filter(r => up_(r.code) === C && up_(r.kind) === K && !['DELETED'].includes(up_(r.status))).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))[0] || null;
}

function lookup_(code, kind, sha256) {
  const C = up_(code), K = up_(kind || 'FINAL'), H = up_(sha256);
  const rs = rows_();
  let row = rs.filter(r => up_(r.code) === C && up_(r.kind) === K && up_(r.status) !== 'DELETED').sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))[0] || null;
  if (row && H && up_(row.sha256) !== H) row = null;
  return row ? { ok:true, found:true, code:row.code, kind:row.kind, sha256:row.sha256, fileId:row.file_id, fileName:row.file_name, status:row.status, canonicalCode:row.canonical_code || row.code } : { ok:true, found:false };
}

function media_(code, kind) {
  const row = latestForCodeKind_(code, kind || 'FINAL');
  if (!row || !row.file_id) return { ok:true, found:false };
  const f = DriveApp.getFileById(String(row.file_id));
  const blob = f.getBlob();
  return { ok:true, found:true, code:row.code, kind:row.kind, sha256:row.sha256, fileId:f.getId(), fileName:f.getName(), mime:blob.getContentType(), base64:Utilities.base64Encode(blob.getBytes()), status:row.status, canonicalCode:row.canonical_code || row.code };
}

function upsertMedia_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const code = up_(p.code), kind = up_(p.kind || 'FINAL'), sha = up_(p.sha256), mime = norm_(p.mime || 'image/jpeg');
    if (!code) throw new Error('Falta code');
    if (!sha) throw new Error('Falta sha256');
    if (!p.base64) throw new Error('Falta base64');
    if (!['ORIGINAL','FINAL'].includes(kind)) throw new Error('kind debe ser ORIGINAL o FINAL');

    const sh = getIndexSheet_(), rs = rows_();
    const exactSameCode = rs.find(r => up_(r.code)===code && up_(r.kind)===kind && up_(r.sha256)===sha && up_(r.status)!=='DELETED');
    if (exactSameCode) return {ok:true, deduped:true, sameCode:true, fileId:exactSameCode.file_id, fileName:exactSameCode.file_name, canonicalCode:exactSameCode.canonical_code||exactSameCode.code, status:exactSameCode.status};

    const exactHash = rs.find(r => up_(r.kind)===kind && up_(r.sha256)===sha && up_(r.status)!=='DELETED' && r.file_id);
    if (exactHash) {
      const t = now_();
      sh.appendRow([t,t,code,kind,sha,exactHash.file_id,exactHash.file_name,'DUPLICATE_EXACT',exactHash.canonical_code||exactHash.code,p.party||'',p.district||'',p.latitude||'',p.longitude||'',p.source||'ONE_SHOT']);
      return {ok:true,deduped:true,duplicateExact:true,fileId:exactHash.file_id,fileName:exactHash.file_name,canonicalCode:exactHash.canonical_code||exactHash.code,status:'DUPLICATE_EXACT'};
    }

    const previous = rs.filter(r=>up_(r.code)===code && up_(r.kind)===kind && up_(r.status)==='ACTIVE');
    if (kind === 'FINAL') previous.forEach(r=>sh.getRange(r._row,8).setValue('HISTORICAL'));

    const bytes = Utilities.base64Decode(String(p.base64).replace(/^data:[^,]+,/,''));
    const ext = extFor_(mime), shortHash = sha.slice(0,12), stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone()||'America/Lima', 'yyyyMMdd_HHmmss');
    const conflictOriginal = kind === 'ORIGINAL' && previous.length > 0;
    const filename = conflictOriginal ? `${safe_(code)}__ORIGINAL__CONFLICT__${stamp}__${shortHash}.${ext}` : `${safe_(code)}__${kind}__${stamp}__${shortHash}.${ext}`;
    const blob = Utilities.newBlob(bytes, mime, filename);
    const file = folderFor_(kind).createFile(blob);
    try { file.setDescription(JSON.stringify({code,kind,sha256:sha,party:p.party||'',district:p.district||'',latitude:p.latitude||'',longitude:p.longitude||'',source:p.source||'ONE_SHOT'})); } catch (_) {}
    const status = conflictOriginal ? 'CONFLICT_ORIGINAL' : 'ACTIVE', t = now_();
    sh.appendRow([t,t,code,kind,sha,file.getId(),filename,status,code,p.party||'',p.district||'',p.latitude||'',p.longitude||'',p.source||'ONE_SHOT']);
    return {ok:true,deduped:false,fileId:file.getId(),fileName:filename,canonicalCode:code,status:status};
  } finally { lock.releaseLock(); }
}

function deleteEvidence_(code) {
  const C = up_(code);
  if (!C) throw new Error('Falta code');
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sh = getIndexSheet_(), rs = rows_(), mine = rs.filter(r=>up_(r.code)===C && up_(r.status)!=='DELETED');
    if (!mine.length) return {ok:true,deleted:false,reason:'not_found'};
    const fileIds = {};
    mine.forEach(r=>{sh.getRange(r._row,8).setValue('DELETED');sh.getRange(r._row,2).setValue(now_());if(r.file_id)fileIds[String(r.file_id)]=true});
    const fresh = rows_();
    Object.keys(fileIds).forEach(id=>{
      const usedElsewhere = fresh.some(r=>String(r.file_id)===id && up_(r.status)!=='DELETED');
      if (!usedElsewhere) { try { DriveApp.getFileById(id).setTrashed(true); } catch (_) {} }
    });
    return {ok:true,deleted:true,code:C,rows:mine.length};
  } finally { lock.releaseLock(); }
}
