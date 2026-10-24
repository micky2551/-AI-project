const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_CHARS = 50_000;
const SUPPORTED_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

function inferMimeType(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const byExtension = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  const reportedType = (file.type || '').toLowerCase();
  return SUPPORTED_MIME_TYPES.has(reportedType) ? reportedType : (byExtension[extension] || '');
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ กรุณาลองเลือกไฟล์อีกครั้ง'));
    reader.readAsDataURL(file);
  });
}

export async function readStudyFile(file) {
  if (!file) throw new Error('กรุณาเลือกไฟล์ก่อน');
  if (file.size <= 0) throw new Error('ไฟล์ว่าง กรุณาเลือกไฟล์อื่น');
  if (file.size > MAX_FILE_BYTES) throw new Error('ไฟล์มีขนาดเกิน 20 MB กรุณาเลือกไฟล์ที่เล็กลง');

  const extension = file.name.split('.').pop()?.toLowerCase();
  const isText = ['txt', 'md', 'markdown', 'csv', 'log'].includes(extension) ||
    ['text/plain', 'text/markdown', 'text/csv'].includes(file.type);

  if (isText) {
    const content = await file.text();
    if (!content.trim()) throw new Error('ไม่พบข้อความในไฟล์นี้');
    if (content.length > MAX_TEXT_CHARS) throw new Error('ไฟล์ข้อความยาวเกิน 50,000 ตัวอักษร กรุณาแบ่งเป็นส่วนย่อย');
    return { content, attachment: null, fileName: file.name };
  }

  const mimeType = inferMimeType(file);
  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new Error('รองรับไฟล์ .txt, .md, .csv, PDF, PNG, JPG และ WEBP เท่านั้น');
  }

  const dataUrl = await readAsDataUrl(file);
  const comma = dataUrl.indexOf(',');
  if (comma < 0 || !dataUrl.slice(comma + 1)) throw new Error('แปลงไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง');
  return {
    content: '',
    attachment: { mimeType, base64: dataUrl.slice(comma + 1), name: file.name },
    fileName: file.name,
  };
}

function wrapText(ctx, text, maxWidth) {
  const result = [];
  const segments = String(text || '').split(/\s+/);
  let line = '';
  for (const segment of segments) {
    const candidate = line ? line + ' ' + segment : segment;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      let piece = '';
      for (const character of Array.from(candidate)) {
        if (piece && ctx.measureText(piece + character).width > maxWidth) {
          result.push(piece);
          piece = character;
        } else {
          piece += character;
        }
      }
      line = piece;
    } else {
      result.push(line);
      line = segment;
    }
  }
  if (line) result.push(line);
  return result.length ? result : [''];
}

function buildLines(summary, title, canvasContext) {
  const width = 1040;
  const lines = [];
  const input = String(summary || '').replace(/\r\n?/g, '\n').split('\n');
  for (const rawLine of input) {
    if (!rawLine.trim()) {
      lines.push({ text: '', kind: 'blank', height: 20 });
      continue;
    }
    let text = rawLine.trim();
    let kind = 'body';
    if (text.startsWith('### ')) { text = text.slice(4); kind = 'h3'; }
    else if (text.startsWith('## ')) { text = text.slice(3); kind = 'h2'; }
    else if (text.startsWith('# ')) { text = text.slice(2); kind = 'h1'; }
    else if (text.startsWith('- ') || text.startsWith('* ')) { text = '•  ' + text.slice(2); kind = 'body'; }
    canvasContext.font = kind === 'h1' ? 'bold 34px "Noto Sans Thai", sans-serif' :
      kind === 'h2' ? 'bold 30px "Noto Sans Thai", sans-serif' :
      kind === 'h3' ? 'bold 26px "Noto Sans Thai", sans-serif' :
      '25px "Noto Sans Thai", sans-serif';
    for (const wrapped of wrapText(canvasContext, text, width)) {
      lines.push({ text: wrapped, kind, height: kind === 'h1' ? 48 : kind === 'h2' ? 44 : kind === 'h3' ? 40 : 38 });
      kind = 'body';
    }
  }
  return lines;
}

function renderPage(lines, title, pageNo, totalPages, width = 1200, height = 1600) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('เบราว์เซอร์ไม่รองรับการส่งออกภาพ');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#293149';
  ctx.fillRect(0, 0, width, 18);
  ctx.fillStyle = '#273354';
  ctx.font = 'bold 32px "Noto Sans Thai", sans-serif';
  ctx.fillText(String(title || 'สรุปบทเรียน').slice(0, 90), 80, 90, 1040);
  ctx.fillStyle = '#667085';
  ctx.font = '19px "Noto Sans Thai", sans-serif';
  ctx.fillText('Buddy AI  •  Study Summary', 80, 130);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 158);
  ctx.lineTo(width - 80, 158);
  ctx.stroke();

  let y = 210;
  for (const line of lines) {
    if (line.kind === 'blank') {
      y += line.height;
      continue;
    }
    ctx.font = line.kind === 'h1' ? 'bold 34px "Noto Sans Thai", sans-serif' :
      line.kind === 'h2' ? 'bold 30px "Noto Sans Thai", sans-serif' :
      line.kind === 'h3' ? 'bold 26px "Noto Sans Thai", sans-serif' :
      '25px "Noto Sans Thai", sans-serif';
    ctx.fillStyle = line.kind === 'body' ? '#364152' : '#202a43';
    ctx.fillText(line.text, 80, y, 1040);
    y += line.height;
  }
  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(80, height - 80);
  ctx.lineTo(width - 80, height - 80);
  ctx.stroke();
  ctx.fillStyle = '#737b8c';
  ctx.font = '17px "Noto Sans Thai", sans-serif';
  ctx.fillText('ส่งออกจาก Buddy AI', 80, height - 45);
  ctx.textAlign = 'right';
  ctx.fillText('หน้า ' + pageNo + ' / ' + totalPages, width - 80, height - 45);
  ctx.textAlign = 'left';
  return canvas;
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function safeFilename(title, extension) {
  const base = String(title || 'buddy-ai-summary').normalize('NFKC')
    .replace(/[^\p{L}\p{N}\- _]/gu, '')
    .trim().replace(/\s+/g, '-').slice(0, 70) || 'buddy-ai-summary';
  return base + extension;
}

function jpegBytes(canvas) {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function buildImagePdf(canvases) {
  const chunks = [];
  let byteLength = 0;
  const encoder = new TextEncoder();
  const append = (value) => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    chunks.push(bytes);
    byteLength += bytes.length;
  };
  const pageCount = canvases.length;
  const objectCount = 2 + pageCount * 3;
  const offsets = new Array(objectCount + 1).fill(0);
  append('%PDF-1.4\n%âãÏÓ\n');
  const object = (id, body) => {
    offsets[id] = byteLength;
    append(id + ' 0 obj\n');
    if (Array.isArray(body)) body.forEach(append);
    else append(body);
    append('\nendobj\n');
  };
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  const kids = canvases.map((_, i) => (3 + i * 3) + ' 0 R').join(' ');
  object(2, '<< /Type /Pages /Kids [' + kids + '] /Count ' + pageCount + ' >>');
  canvases.forEach((canvas, index) => {
    const pageId = 3 + index * 3;
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    const img = jpegBytes(canvas);
    object(pageId, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 ' + imageId + ' 0 R >> >> /Contents ' + contentId + ' 0 R >>');
    object(imageId, [
      '<< /Type /XObject /Subtype /Image /Width ' + canvas.width + ' /Height ' + canvas.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.length + ' >>\nstream\n',
      img,
      '\nendstream',
    ]);
    const stream = 'q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ';
    object(contentId, '<< /Length ' + encoder.encode(stream).length + ' >>\nstream\n' + stream + '\nendstream');
  });
  const xrefOffset = byteLength;
  append('xref\n0 ' + (objectCount + 1) + '\n0000000000 65535 f \n');
  for (let id = 1; id <= objectCount; id += 1) append(String(offsets[id]).padStart(10, '0') + ' 00000 n \n');
  append('trailer\n<< /Size ' + (objectCount + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF');
  return new Blob(chunks, { type: 'application/pdf' });
}

export async function downloadSummaryExport(summary, title, format) {
  if (!String(summary || '').trim()) throw new Error('ยังไม่มีสรุปบทเรียนสำหรับส่งออก');
  const measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) throw new Error('เบราว์เซอร์ไม่รองรับการส่งออกไฟล์');
  const lines = buildLines(summary, title, ctx);
  const contentLinesPerPage = 34;
  const pageSlices = [];
  for (let i = 0; i < lines.length || i === 0; i += contentLinesPerPage) {
    pageSlices.push(lines.slice(i, i + contentLinesPerPage));
  }
  const pages = pageSlices.map((slice, index) => renderPage(slice, title, index + 1, pageSlices.length));
  if (format === 'png') {
    const width = 1200;
    const lineHeight = lines.reduce((sum, line) => sum + line.height, 0);
    const canvasHeight = Math.max(1600, Math.min(16000, lineHeight + 300));
    const full = document.createElement('canvas');
    full.width = width;
    full.height = canvasHeight;
    const fullCtx = full.getContext('2d');
    if (!fullCtx) throw new Error('เบราว์เซอร์ไม่รองรับการส่งออกภาพ');
    fullCtx.fillStyle = '#fff';
    fullCtx.fillRect(0, 0, width, canvasHeight);
    fullCtx.fillStyle = '#293149';
    fullCtx.fillRect(0, 0, width, 18);
    fullCtx.fillStyle = '#273354';
    fullCtx.font = 'bold 32px "Noto Sans Thai", sans-serif';
    fullCtx.fillText(String(title || 'สรุปบทเรียน').slice(0, 90), 80, 90, 1040);
    fullCtx.fillStyle = '#667085';
    fullCtx.font = '19px "Noto Sans Thai", sans-serif';
    fullCtx.fillText('Buddy AI  •  Study Summary', 80, 130);
    fullCtx.strokeStyle = '#e5e7eb';
    fullCtx.beginPath(); fullCtx.moveTo(80, 158); fullCtx.lineTo(width - 80, 158); fullCtx.stroke();
    let y = 210;
    for (const line of lines) {
      if (line.kind === 'blank') { y += line.height; continue; }
      fullCtx.font = line.kind === 'h1' ? 'bold 34px "Noto Sans Thai", sans-serif' : line.kind === 'h2' ? 'bold 30px "Noto Sans Thai", sans-serif' : line.kind === 'h3' ? 'bold 26px "Noto Sans Thai", sans-serif' : '25px "Noto Sans Thai", sans-serif';
      fullCtx.fillStyle = line.kind === 'body' ? '#364152' : '#202a43';
      fullCtx.fillText(line.text, 80, y, 1040);
      y += line.height;
    }
    saveBlob(await awaitCanvasBlob(full), safeFilename(title, '.png'));
    return;
  }
  saveBlob(buildImagePdf(pages), safeFilename(title, '.pdf'));
}

function awaitCanvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('สร้างไฟล์ PNG ไม่สำเร็จ กรุณาลองอีกครั้ง')), 'image/png');
  });
}
