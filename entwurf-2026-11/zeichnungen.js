// Druckbilder für Bildschirme und Flächen: gezeichnet wie Druck auf Papier, Tinte #303033, keine Fotos
const INK = "48,48,51";
const ink = a => `rgba(${INK},${a})`;
function rr(x, X, Y, w, h, r) { x.beginPath(); x.roundRect(X, Y, w, h, r); }

// Website: Kopfzeile, Überschrift, Bildfläche, drei Spalten
export function website(x, W, H, opt = {}) {
  const s = W / 1000;
  x.fillStyle = opt.bg || "#ffffff"; x.fillRect(0, 0, W, H);
  x.fillStyle = ink(.85); x.fillRect(60 * s, 52 * s, 130 * s, 18 * s);
  x.fillStyle = ink(.35); for (let i = 0; i < 4; i++) x.fillRect((560 + i * 100) * s, 55 * s, 70 * s, 12 * s);
  x.fillStyle = ink(.12); x.fillRect(0, 112 * s, W, 2 * s);
  x.fillStyle = ink(.8);
  x.fillRect(60 * s, 170 * s, 470 * s, 46 * s); x.fillRect(60 * s, 236 * s, 330 * s, 46 * s);
  x.fillStyle = ink(.3); for (let i = 0; i < 3; i++) x.fillRect(60 * s, (322 + i * 30) * s, (440 - i * 60) * s, 12 * s);
  x.strokeStyle = ink(.85); x.lineWidth = 3 * s; rr(x, 60 * s, 430 * s, 170 * s, 50 * s, 4 * s); x.stroke();
  x.fillStyle = ink(.1); x.fillRect(580 * s, 160 * s, 360 * s, 320 * s);
  x.strokeStyle = ink(.25); x.lineWidth = 2 * s; x.beginPath(); x.moveTo(580 * s, 480 * s); x.lineTo(700 * s, 330 * s); x.lineTo(790 * s, 420 * s); x.lineTo(850 * s, 370 * s); x.lineTo(940 * s, 480 * s); x.stroke();
  for (let c = 0; c < 3; c++) {
    const X = (60 + c * 300) * s;
    x.fillStyle = ink(.7); x.fillRect(X, 560 * s, 160 * s, 16 * s);
    x.fillStyle = ink(.25); for (let i = 0; i < 3; i++) x.fillRect(X, (596 + i * 24) * s, (250 - i * 40) * s, 9 * s);
  }
}
// Shop am Handy: Kopf, Suche, Raster aus Produkten mit Preis, Warenkorb-Knopf
export function shop(x, W, H, opt = {}) {
  const s = W / 400;
  x.fillStyle = opt.bg || "#ffffff"; x.fillRect(0, 0, W, H);
  x.fillStyle = ink(.85); x.fillRect(28 * s, 40 * s, 90 * s, 14 * s);
  x.strokeStyle = ink(.8); x.lineWidth = 3 * s; rr(x, 330 * s, 34 * s, 40 * s, 26 * s, 4 * s); x.stroke();
  x.strokeStyle = ink(.3); x.lineWidth = 2 * s; rr(x, 28 * s, 86 * s, 344 * s, 40 * s, 20 * s); x.stroke();
  const top = 156 * s, cw = 164 * s, ch = (opt.rows === 3 ? 172 : 210) * s;
  for (let r = 0; r < (opt.rows || 2); r++) for (let c = 0; c < 2; c++) {
    const X = (28 + c * 180) * s, Y = top + r * (ch + 22 * s);
    x.fillStyle = ink(.1); x.fillRect(X, Y, cw, ch * .62);
    x.fillStyle = ink(.6); x.fillRect(X, Y + ch * .7, cw * .75, 10 * s);
    x.fillStyle = ink(.85); x.fillRect(X, Y + ch * .82, cw * .35, 12 * s);
  }
}
// Tastatur und Trackpad
export function keyboard(x, W, H) {
  const cols = 14, rows = 5, g = W * .006, kw = (W - g * (cols + 1)) / cols, kh = (H * .78 - g * (rows + 1)) / rows;
  x.strokeStyle = ink(.32); x.lineWidth = Math.max(1, W * .0016);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let X = g + c * (kw + g), w = kw;
    if (r === rows - 1 && c >= 4 && c <= 9) { if (c !== 4) continue; w = kw * 6 + g * 5; }
    rr(x, X, g + r * (kh + g), w, kh, kw * .12); x.stroke();
  }
}
export function trackpad(x, W, H) {
  x.strokeStyle = ink(.28); x.lineWidth = Math.max(1, W * .004);
  rr(x, W * .02, H * .04, W * .96, H * .92, W * .04); x.stroke();
}
// Rechnerfront: Lüftungsschlitze und zwei Laufwerksschächte
export function rack(x, W, H) {
  x.strokeStyle = ink(.3); x.lineWidth = Math.max(1, W * .003);
  for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(W * .06, H * (.18 + i * .08)); x.lineTo(W * .42, H * (.18 + i * .08)); x.stroke(); }
  for (let i = 0; i < 2; i++) { rr(x, W * .52, H * (.2 + i * .34), W * .42, H * .24, W * .01); x.stroke(); x.beginPath(); x.moveTo(W * .56, H * (.32 + i * .34)); x.lineTo(W * .7, H * (.32 + i * .34)); x.stroke(); }
}
