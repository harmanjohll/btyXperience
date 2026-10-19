/* BTY UI kit — shared by the big screen (btx27.html) and the phones (x/).
   · A small drawn icon set: single-colour line icons (they take the text colour),
     in place of emoji, so every screen reads as one designed system.
   · QR codes drawn as crisp SVG (or into a canvas) from qrcode.js — no web service. */
(function () {
  const P = {   // 24×24, stroke = currentColor
    bee: '<path d="M10.2 10.6C7.6 7.1 3.6 7.4 3.9 10.1c.3 2.3 3.6 3 6.6 1.7M13.8 10.6c2.6-3.5 6.6-3.2 6.3-.5-.3 2.3-3.6 3-6.6 1.7"/><ellipse cx="12" cy="15" rx="4.3" ry="5.6"/><path d="M8 13h8M7.9 16.3h8.2M11 6.2 9.6 3.6M13 6.2l1.4-2.6"/><circle cx="12" cy="8" r="2"/>',
    innovator: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.7 10.7c.7.6 1.1 1.4 1.1 2.3v.3h5.2V16c0-.9.4-1.7 1.1-2.3A6 6 0 0 0 12 3Z"/><path d="M12 7.5v3l1.6 1.2"/>',
    explorer: '<circle cx="12" cy="12" r="9"/><path d="m15.6 8.4-2.2 5-5 2.2 2.2-5Z"/><path d="M12 3v1.6M12 19.4V21M3 12h1.6M19.4 12H21"/>',
    trailblazer: '<path d="M3 21V11.5l5 3v-3l5 3V6h3.5v4.5H20V21Z"/><path d="M7 18h2M11.5 18h2M16 18h1.5"/>',
    steward: '<path d="M12 11.6s-3.6-2.1-3.6-4.7A1.9 1.9 0 0 1 12 6a1.9 1.9 0 0 1 3.6.9c0 2.6-3.6 4.7-3.6 4.7Z"/><path d="M3 15.5 6 14l4 1.4h3a1.5 1.5 0 0 1 0 3H9.5"/><path d="m13.6 18.3 4.6-2a1.6 1.6 0 0 1 1.5 2.7L14.4 22H7.5L3 20"/>',
    artist: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.9-1 1.5-2-.5-1.1.3-2.3 1.5-2.3H17a4 4 0 0 0 4-4C21 7.4 17 3 12 3Z"/><circle cx="7.6" cy="11.2" r="1.15"/><circle cx="9.8" cy="7.2" r="1.15"/><circle cx="14.6" cy="7.2" r="1.15"/>',
    futurist: '<circle cx="12" cy="12" r="1.4"/><ellipse cx="12" cy="12" rx="9.2" ry="3.6"/><ellipse cx="12" cy="12" rx="9.2" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.2" ry="3.6" transform="rotate(-60 12 12)"/>',
    voice: '<path d="M3.5 10v4h3l7 4V6l-7 4Z"/><path d="m6.5 14 1.3 5h2.4l-1-4M16.5 9.2a4 4 0 0 1 0 5.6M19 6.8a7.6 7.6 0 0 1 0 10.4"/>',
    eco: '<path d="M12 21v-8.5"/><path d="M12 12.5C12 8 15.4 4.8 20 4.8c0 4.6-3.4 7.7-8 7.7Z"/><path d="M12 15.8c0-3.1-2.5-5.2-6.2-5.2 0 3.1 2.5 5.2 6.2 5.2Z"/>',
    flame: '<path d="M12 3c1 3.6 5.2 5.6 5.2 10.2a5.2 5.2 0 0 1-10.4 0c0-2.3 1.2-4 2.6-5.2.1 1.7.9 2.8 2.1 3.3C10.9 9 11 5.8 12 3Z"/>',
    rocket: '<path d="M9.2 14.8 6.4 12l3.9-5.8C13.5 2 18.6 2 21 3c1 2.4 1 7.5-3.2 10.7L12 17.6Z"/><circle cx="15" cy="9" r="1.7"/><path d="M6.6 15.4C4.9 16.2 4 20 4 20s3.8-.9 4.6-2.6M6.4 12H3.5l2.3-3.2h3.4M12 17.6v2.9l3.2-2.3v-3.4"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.3 14.2s1.4 2.3 3.7 2.3 3.7-2.3 3.7-2.3"/><path d="M9 9.6h.01M15 9.6h.01" stroke-width="2.6"/>',
    curious: '<path d="M20.5 11.8a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.2-4.4A8.5 8.5 0 1 1 20.5 11.8Z"/><path d="M10 9.8a2.1 2.1 0 1 1 3 1.9c-.6.3-1 .8-1 1.4v.4M12 16h.01"/>',
    phone: '<rect x="6.8" y="2.6" width="10.4" height="18.8" rx="2.4"/><path d="M10.6 18.4h2.8"/>',
    sail: '<path d="M12 3v14.5M12 4l7 11.5h-7M11 6.4 5.2 15.5H11"/><path d="M3 18.5h18l-2.2 2.8H5.2Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="3.9" ry="9"/><path d="M3.4 9h17.2M3.4 15h17.2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.4a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.6" r="2.5"/>',
    check: '<path d="m5 12.6 4.4 4.4L19 7.4"/>',
    eye: '<path d="M2 12s3.6-6.6 10-6.6S22 12 22 12s-3.6 6.6-10 6.6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    hex: '<path d="m12 2.8 8 4.6v9.2l-8 4.6-8-4.6V7.4Z"/>',
    spark: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M18.5 16.5v3M17 18h3"/>',
    wave: '<path d="M2 14.5c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M12 10.5V4l4 5h-4"/>',
    fold: '<path d="M4 4h16v16H4Z"/><path d="M4 4l16 16" stroke-dasharray="2.2 2.2"/><path d="M20 4v16H4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    poll: '<path d="M4 6h11M4 12h16M4 18h7"/><circle cx="18.5" cy="6" r="1.5"/>',
    qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h2.5v2.5H14ZM18 18h2.5v2.5H18ZM18 14h2.5M14 18v2.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"/>',
    school: '<path d="M2.5 9.5 12 4.5l9.5 5-9.5 5Z"/><path d="M6 11.4V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.6M21.5 9.5v5.5"/>',
  };
  const ARCH = { 'The Innovator': 'innovator', 'The Global Explorer': 'explorer', 'The Industry Trailblazer': 'trailblazer', 'The Community Steward': 'steward', 'The Creative Artist': 'artist', 'The STEM Futurist': 'futurist', 'The Voice Amplifier': 'voice', 'The Eco-Strategist': 'eco' };
  const MOOD = { 'On fire!': 'flame', 'Excited!': 'rocket', 'Enjoying it': 'smile', 'Tell me more': 'curious' };
  function icon(name, cls, sw) {
    const body = P[name] || P.hex;
    return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 1.6}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  }
  function qr(text) { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q; }
  // Crisp SVG QR: one path, quiet zone included.
  function qrSVG(text, o) {
    o = o || {}; const q = qr(text), n = q.getModuleCount(), m = o.margin == null ? 2 : o.margin, s = n + m * 2;
    let d = ''; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return `<svg class="${o.cls || 'qr'}" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges" role="img" aria-label="${o.label || 'QR code'}"><rect width="${s}" height="${s}" rx="${o.rx || 0}" fill="${o.bg || '#fff'}"/><path d="${d}" fill="${o.fg || '#000C53'}"/></svg>`;
  }
  // Draw into a 2D canvas at (x, y), `size` px square (quiet zone included).
  function qrDraw(ctx, text, x, y, size, o) {
    o = o || {}; const q = qr(text), n = q.getModuleCount(), m = o.margin == null ? 2 : o.margin, cell = size / (n + m * 2);
    ctx.fillStyle = o.bg || '#fff'; ctx.fillRect(x, y, size, size); ctx.fillStyle = o.fg || '#000C53';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(Math.floor(x + (c + m) * cell), Math.floor(y + (r + m) * cell), Math.ceil(cell), Math.ceil(cell));
  }
  // An icon as an Image (for canvas drawing), in a given colour.
  function iconImage(name, color, px) {
    const svg = icon(name, '', 1.7).replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${px || 96}" height="${px || 96}" `).replace(/currentColor/g, color || '#FFE200');
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  }
  window.BTY = { icon, ICONS: P, ARCH, MOOD, archIcon: k => icon(ARCH[k] || 'bee'), moodIcon: k => icon(MOOD[k] || 'smile'), qrSVG, qrDraw, iconImage };
})();
