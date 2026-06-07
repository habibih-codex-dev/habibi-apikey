/**
 * Image generators (welcome / goodbye cards + iPhone chat style) using
 * @napi-rs/canvas. Framework-free — returns PNG Buffers.
 */
import axios from 'axios';

let canvasLib = null;
try {
  // eslint-disable-next-line global-require
  canvasLib = require('@napi-rs/canvas');
  const fs = require('fs');
  const emojiFonts = [
    '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf',
    '/usr/share/fonts/google-noto-emoji/NotoColorEmoji.ttf',
    '/usr/share/fonts/noto/NotoColorEmoji.ttf',
    '/usr/share/fonts/NotoColorEmoji.ttf',
    '/System/Library/Fonts/Apple Color Emoji.ttc',
  ];
  for (const p of emojiFonts) {
    try { if (fs.existsSync(p)) { canvasLib.GlobalFonts.registerFromPath(p, 'Emoji'); break; } } catch {}
  }
} catch {
  canvasLib = null;
}

export const hasCanvas = () => !!canvasLib;

const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const WIDTH = 1000;
const HEIGHT = 450;

async function fetchImage(url) {
  if (!url) return null;
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 12_000,
      headers: { 'User-Agent': 'Habibi-API/1.0' },
    });
    return await canvasLib.loadImage(Buffer.from(res.data));
  } catch {
    return null;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(ctx, text, maxWidth) {
  let t = String(text || '');
  if (ctx.measureText(t).width <= maxWidth) return t;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1);
  return t + '…';
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const rawLine of String(text).split('\n')) {
    const words = rawLine.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        if (line) lines.push(line);
        if (ctx.measureText(word).width > maxWidth) {
          let chunk = '';
          for (const ch of word) {
            if (ctx.measureText(chunk + ch).width > maxWidth) { lines.push(chunk); chunk = ch; }
            else chunk += ch;
          }
          line = chunk;
        } else {
          line = word;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function generateCard(type, { avatar, name, group, members, bg, title }) {
  const canvas = canvasLib.createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const isWelcome = type === 'welcome';

  const bgImg = await fetchImage(bg);
  if (bgImg) {
    const scale = Math.max(WIDTH / bgImg.width, HEIGHT / bgImg.height);
    const w = bgImg.width * scale;
    const h = bgImg.height * scale;
    ctx.drawImage(bgImg, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
    ctx.fillStyle = 'rgba(8, 10, 20, 0.62)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  } else {
    const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    grad.addColorStop(0, isWelcome ? '#16213e' : '#2b1530');
    grad.addColorStop(1, isWelcome ? '#0f3460' : '#530c2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 3;
  roundRect(ctx, 24, 24, WIDTH - 48, HEIGHT - 48, 28);
  ctx.stroke();

  const avImg = await fetchImage(avatar);
  const cx = WIDTH / 2;
  const cy = 150;
  const radius = 90;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
  ctx.fillStyle = isWelcome ? 'rgba(124,92,255,0.55)' : 'rgba(255,92,124,0.55)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (avImg) {
    ctx.drawImage(avImg, cx - radius, cy - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = '#3a3f5a';
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 90px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((name || '?').charAt(0).toUpperCase(), cx, cy + 4);
  }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = isWelcome ? '#8be0ff' : '#ff9bb0';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText(truncate(ctx, title || (isWelcome ? 'WELCOME' : 'GOODBYE'), WIDTH - 120), cx, cy + radius + 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(truncate(ctx, name || 'Member', WIDTH - 140), cx, cy + radius + 125);

  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = '28px sans-serif';
  const sub = members
    ? `${isWelcome ? 'Welcome to' : 'Left'} ${group || 'the group'} • member #${members}`
    : `${group || 'the group'}`;
  ctx.fillText(truncate(ctx, sub, WIDTH - 160), cx, cy + radius + 170);

  return canvas.encode('png');
}

export async function generateIphoneChat(opts) {
  const { text, name, time, avatar, carrier, battery } = opts;
  const showPicker = opts.showPicker !== '0' && opts.showPicker !== false;
  const reactions = opts.reactions
    ? String(opts.reactions).split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_REACTIONS;

  const W = 820;
  const padX = 36;
  const bubbleMaxW = 540;
  const bubblePadX = 30;
  const bubblePadY = 22;
  const lineHeight = 42;
  const font = '30px sans-serif';

  const tmp = canvasLib.createCanvas(W, 100);
  const tctx = tmp.getContext('2d');
  tctx.font = font;
  const lines = wrapText(tctx, text || '', bubbleMaxW - bubblePadX * 2);

  const bubbleTextW = Math.min(
    bubbleMaxW - bubblePadX * 2,
    Math.max(120, ...lines.map((l) => tctx.measureText(l).width)),
  );
  const bubbleW = bubbleTextW + bubblePadX * 2;
  const bubbleH = lines.length * lineHeight + bubblePadY * 2 + 14;

  const pickerEmojiSize = 46;
  const pickerGap = 14;
  const pickerPadX = 26;
  const pickerH = showPicker ? 78 : 0;
  const pickerW = showPicker
    ? reactions.length * pickerEmojiSize + (reactions.length - 1) * pickerGap + pickerPadX * 2
    : 0;
  const pickerSpace = showPicker ? pickerH + 22 : 0;

  const statusH = 64;
  const headerH = 96;
  const topGap = 40;
  const bottomGap = 50;
  const H = statusH + headerH + topGap + pickerSpace + bubbleH + bottomGap;

  const canvas = canvasLib.createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0b141a';
  ctx.fillRect(0, 0, W, H);

  const clock = time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(clock, padX, statusH / 2 + 4);
  if (carrier) {
    ctx.font = '22px sans-serif';
    ctx.fillText(carrier, padX + 110, statusH / 2 + 4);
  }

  ctx.textAlign = 'right';
  ctx.font = '24px sans-serif';
  ctx.fillText('📶 🛜', W - padX - 78, statusH / 2 + 2);
  const bx = W - padX - 54;
  const by = statusH / 2 - 11;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, 44, 22, 5);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + 45, by + 6, 3, 10);
  const pct = Math.max(0, Math.min(100, Number(battery) || 88)) / 100;
  ctx.fillStyle = pct > 0.2 ? '#34d058' : '#ff5c5c';
  ctx.fillRect(bx + 3, by + 3, 38 * pct, 16);

  const headerY = statusH;
  ctx.fillStyle = '#1f2c34';
  ctx.fillRect(0, headerY, W, headerH);

  ctx.strokeStyle = '#3ba4f1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(padX + 14, headerY + headerH / 2 - 12);
  ctx.lineTo(padX, headerY + headerH / 2);
  ctx.lineTo(padX + 14, headerY + headerH / 2 + 12);
  ctx.stroke();

  const avSize = 58;
  const avX = padX + 34;
  const avY = headerY + (headerH - avSize) / 2;
  const avImg = await fetchImage(avatar);
  ctx.save();
  ctx.beginPath();
  ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
  ctx.clip();
  if (avImg) {
    ctx.drawImage(avImg, avX, avY, avSize, avSize);
  } else {
    ctx.fillStyle = '#3a4a54';
    ctx.fillRect(avX, avY, avSize, avSize);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((name || '?').charAt(0).toUpperCase(), avX + avSize / 2, avY + avSize / 2 + 2);
  }
  ctx.restore();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(truncate(ctx, name || 'Contact', 300), avX + avSize + 18, headerY + headerH / 2 - 12);
  ctx.fillStyle = '#8696a0';
  ctx.font = '22px sans-serif';
  ctx.fillText('online', avX + avSize + 18, headerY + headerH / 2 + 18);

  const bubbleX = padX;
  let cursorY = statusH + headerH + topGap;
  if (showPicker) {
    const pillX = bubbleX;
    const pillY = cursorY;
    ctx.fillStyle = '#2a3942';
    roundRect(ctx, pillX, pillY, pickerW, pickerH, pickerH / 2);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${pickerEmojiSize}px "Emoji", sans-serif`;
    reactions.forEach((emo, i) => {
      const ex = pillX + pickerPadX + pickerEmojiSize / 2 + i * (pickerEmojiSize + pickerGap);
      ctx.fillText(emo, ex, pillY + pickerH / 2 + 2);
    });
    cursorY += pickerSpace;
  }

  const bubbleY = cursorY;
  ctx.fillStyle = '#202c33';
  roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 22);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bubbleX, bubbleY + 14);
  ctx.lineTo(bubbleX - 12, bubbleY + 6);
  ctx.lineTo(bubbleX + 4, bubbleY + 30);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#e9edef';
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((ln, i) => {
    ctx.fillText(ln, bubbleX + bubblePadX, bubbleY + bubblePadY + i * lineHeight);
  });

  ctx.fillStyle = '#8696a0';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(clock, bubbleX + bubbleW - 16, bubbleY + bubbleH - 18);

  return canvas.encode('png');
}
