/* Keep the PixAI originals and white clothing intact; mask the backdrop at render time. */
window.ReiAssets = (() => {
  const base = new URL('.', document.currentScript.src);
  const cache = new Map();
  function load(name, cutout = false) {
    const key = name + ':' + cutout;
    if (cache.has(key)) return cache.get(key);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (!cutout) { resolve(image); return; }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d', {willReadFrequently: true});
          context.drawImage(image, 0, 0);
          const frame = context.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = frame.data, w = canvas.width, h = canvas.height;
          const visited = new Uint8Array(w * h), queue = new Int32Array(w * h);
          let head = 0, tail = 0;
          const add = (i) => {
            if (visited[i]) return;
            visited[i] = 1;
            const p = i * 4;
            if (pixels[p] >= 242 && pixels[p + 1] >= 242 && pixels[p + 2] >= 242) queue[tail++] = i;
          };
          for (let x = 0; x < w; x++) { add(x); add((h - 1) * w + x); }
          for (let y = 0; y < h; y++) { add(y * w); add(y * w + w - 1); }
          // White pockets enclosed by hair, arms and legs are also background.
          // Asset-specific seeds avoid removing the blouse, cuffs, skin or eye highlights.
          const pockets = {
            'rei-uniform-smile.png': [[363,155],[363,197],[360,234],[374,251],[368,287],[376,305],[571,195],[571,235],[580,276],[580,305],[560,547],[475,1193]],
            'rei-uniform-shy.png': [[355,254],[351,317],[335,385],[329,449],[602,267],[599,283],[608,320],[628,843],[489,1315]]
          };
          for (const [x,y] of pockets[name] || []) {
            add(Math.round(y * h / 1584) * w + Math.round(x * w / 944));
          }
          while (head < tail) {
            const i = queue[head++], x = i % w, y = Math.floor(i / w);
            pixels[i * 4 + 3] = 0;
            if (x > 0) add(i - 1); if (x < w - 1) add(i + 1);
            if (y > 0) add(i - w); if (y < h - 1) add(i + w);
          }
          // Remove the white matte from bright antialiased edge pixels too.
          // Only the single-pixel boundary of the known backdrop is softened.
          const backdrop = new Uint8Array(w * h);
          for (let j = 0; j < tail; j++) backdrop[queue[j]] = 1;
          for (let i = 0; i < w * h; i++) {
            if (backdrop[i]) continue;
            const x = i % w, y = Math.floor(i / w), p = i * 4;
            const lo = Math.min(pixels[p],pixels[p+1],pixels[p+2]);
            const hi = Math.max(pixels[p],pixels[p+1],pixels[p+2]);
            if (lo < 180 || hi - lo > 25) continue;
            if (!((x > 0 && backdrop[i-1]) || (x < w-1 && backdrop[i+1]) ||
                  (y > 0 && backdrop[i-w]) || (y < h-1 && backdrop[i+w]))) continue;
            const alpha = (255 - lo) / 195;
            pixels[p+3] = Math.round(255 * alpha);
            if (alpha > 0) for (let c = 0; c < 3; c++) {
              pixels[p+c] = Math.max(0,Math.min(255,(pixels[p+c] - 255 * (1-alpha)) / alpha));
            }
          }
          context.putImageData(frame, 0, 0);
          resolve(canvas);
        } catch (error) { reject(error); }
      };
      image.onerror = () => reject(new Error('画像を読み込めません: ' + name));
      image.src = new URL(name, base).href;
    });
    cache.set(key, promise);
    return promise;
  }
  return {load};
})();
