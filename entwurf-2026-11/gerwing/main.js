// Gerwing-Szene, Fassung 2026-11, Bogen + Bastellinien. Zustände über #p=0…1, Handy-Ausschnitt über #…&w=390&h=844.
// Die Shopbilder liegen eingebettet in bilder/bilder.js (die Vorschau sperrt Nachladen) und werden vor dem Aufbau dekodiert.
import { run } from "./kern.js";
import gerwing, { setBilder } from "./gerwing.js";
import { BILDER } from "./bilder/bilder.js";

async function bitmaps() {
  const out = {};
  await Promise.all(Object.entries(BILDER).map(async ([k, b64]) => {
    const bin = atob(b64), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    out[k] = await createImageBitmap(new Blob([buf], { type: "image/jpeg" }));
  }));
  return out;
}
bitmaps().then(setBilder).catch(() => {}).finally(() => run({ g: gerwing }));
