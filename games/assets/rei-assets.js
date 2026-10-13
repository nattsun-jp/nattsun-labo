/* PixAI originals stay unchanged. Remove only the connected white backdrop when drawing. */
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
          while (head < tail) {
            const i = queue[head++], x = i % w, y = Math.floor(i / w);
            pixels[i * 4 + 3] = 0;
            if (x > 0) add(i - 1); if (x < w - 1) add(i + 1);
            if (y > 0) add(i - w); if (y < h - 1) add(i + w);
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
