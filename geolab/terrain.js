/* Detailed relief from NASA GIBS. No labels, keys, or background prefetch. */
(function (root) {
  'use strict';
  const TAU = 2 * Math.PI;
  const MAX_ZOOM = 12;
  const SVG = 'http://www.w3.org/2000/svg';
  const ENDPOINT = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/ASTER_GDEM_Color_Shaded_Relief/default/GoogleMapsCompatible_Level12';

  function tileURL(z, x, y) { return `${ENDPOINT}/${z}/${y}/${x}.jpg`; }
  function planTiles(scale, translate, transform, width, height, pixelRatio) {
    const world = TAU * scale * transform.k;
    if (!(world > 0 && width > 0 && height > 0)) return { tiles: [], zoom: 0 };
    const ratio = Math.max(1, Math.min(2, pixelRatio || 1));
    let z = Math.max(0, Math.min(MAX_ZOOM, Math.ceil(Math.log2(world * ratio / 256))));
    const initialLeft = transform.x + transform.k * (translate[0] - Math.PI * scale);
    const initialTop = transform.y + transform.k * (translate[1] - Math.PI * scale);
    // Bound memory/network use on large or high-density classroom displays.
    while(z>0){const step=world/(2**z),cols=Math.ceil((width-initialLeft)/step)-Math.floor(-initialLeft/step),rows=Math.ceil((height-initialTop)/step)-Math.floor(-initialTop/step);if(cols*rows<=128)break;z--;}
    const n = 2 ** z, size = world / n;
    const left = transform.x + transform.k * (translate[0] - Math.PI * scale);
    const top = transform.y + transform.k * (translate[1] - Math.PI * scale);
    const x0 = Math.max(0, Math.floor(-left / size));
    const x1 = Math.min(n - 1, Math.floor((width - left - 1e-6) / size));
    const y0 = Math.max(0, Math.floor(-top / size));
    const y1 = Math.min(n - 1, Math.floor((height - top - 1e-6) / size));
    const tiles = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const sx = left + x * size, sy = top + y * size;
      tiles.push({ z, x, y, key: `${z}/${x}/${y}`, url: tileURL(z, x, y),
        distance: Math.hypot(sx + size / 2 - width / 2, sy + size / 2 - height / 2) });
    }
    tiles.sort((a, b) => a.distance - b.distance);
    return { zoom: z, tiles, left, top, size };
  }

  function readyCoverage(cache) {
    const covered = new Set();
    const levels = Array.from({length: MAX_ZOOM + 1}, () => new Set());
    for (const [key, entry] of cache) if (entry.status === 'ready') {
      covered.add(key); levels[entry.tile.z].add(key);
    }
    // Four fully covered children also cover their parent, without downloading it.
    for (let z = MAX_ZOOM; z > 0; z--) {
      for (const key of levels[z]) {
        const [, x, y] = key.split('/').map(Number), px = Math.floor(x / 2), py = Math.floor(y / 2);
        const parent = `${z - 1}/${px}/${py}`;
        if (covered.has(parent)) continue;
        if ([0,1].every(dy => [0,1].every(dx => covered.has(`${z}/${px*2+dx}/${py*2+dy}`)))) {
          covered.add(parent); levels[z - 1].add(parent);
        }
      }
    }
    return covered;
  }

  class TerrainTiles {
    constructor(options = {}) {
      this.createImage = options.createImage || (() => new Image());
      this.onStatus = options.onStatus || (() => {});
      this.pixelRatio = options.pixelRatio || (() => root.devicePixelRatio || 1);
      this.cache = new Map(); this.nodes = new Map(); this.active = 0;
      this.layer = null; this.plan = { tiles: [] }; this.timer = null;
      this.enabled = false; this.concurrency = 6; this.limit = 256;
      this.queue = []; this.clock = 0; this.covered = new Set();
    }
    mount(layer, options) {
      this.layer = layer; this.options = options; this.nodes = new Map();
      this.enabled = Boolean(layer); clearTimeout(this.timer); this.timer = null;
      if (!this.enabled) {
        this.plan = { tiles: [] }; this.queue = []; this.cancelObsolete();
        this.emit(); return;
      }
      this.update(options.transform || { k: 1, x: 0, y: 0 });
    }
    update(transform) {
      if (!this.enabled) return;
      this.transform = transform;
      const o = this.options;
      this.plan = planTiles(o.scale, o.translate, transform, o.width, o.height, this.pixelRatio());
      this.wanted = new Set(this.plan.tiles.map(t => t.key));
      this.queue = [];
      this.cancelObsolete(); this.paint();
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 160);
    }
    flush() {
      clearTimeout(this.timer); this.timer = null;
      if (!this.enabled) return;
      if (root.navigator && root.navigator.onLine === false) { this.emit('offline'); return; }
      this.covered = readyCoverage(this.cache);
      this.queue = this.plan.tiles.filter(t => {
        if (this.covered.has(t.key)) return false;
        const entry = this.cache.get(t.key);
        return !entry || (entry.status === 'error' && Date.now() - entry.errorAt > 60000);
      });
      this.pump(); this.emit();
    }
    cancelObsolete() {
      for (const [key, entry] of this.cache) {
        if (entry.status === 'loading' && (!this.enabled || !this.wanted?.has(key))) {
          entry.cancel(); this.cache.delete(key);
        }
      }
    }
    pump() {
      if (!this.enabled) return;
      while (this.active < this.concurrency && this.queue.length) {
        const tile = this.queue.shift();
        if (!this.wanted.has(tile.key) || this.covered.has(tile.key) || this.cache.get(tile.key)?.status === 'loading') continue;
        this.load(tile);
      }
    }
    load(tile) {
      const image = this.createImage();
      const entry = { tile, image, status: 'loading', touched: ++this.clock };
      this.cache.set(tile.key, entry); this.active++;
      let done = false, timeout;
      const settle = (status) => {
        if (done) return;
        done = true; clearTimeout(timeout); image.onload = null; image.onerror = null;
        this.active--; entry.status = status; entry.touched = ++this.clock;
        if (status === 'error') entry.errorAt = Date.now();
        this.paint(); this.pump(); this.prune();
      };
      entry.cancel = () => {
        if (done) return;
        done = true; clearTimeout(timeout); image.onload = null; image.onerror = null;
        this.active--; image.src = '';
      };
      image.onload = () => { if (image.naturalWidth > 0) settle('ready'); else settle('error'); };
      image.onerror = () => settle('error');
      timeout = setTimeout(() => { settle('error'); image.src = ''; }, 12000);
      image.src = tile.url;
    }
    paint() {
      if (!this.enabled || !this.layer) { this.emit(); return; }
      // Keep every visible ready NASA tile, including sharper children on zoom-out.
      // A newly requested coarse tile is drawn underneath, never over fine detail.
      this.covered = readyCoverage(this.cache);
      const visible = new Map(), o = this.options, world = TAU * o.scale;
      const left = o.translate[0] - world / 2, top = o.translate[1] - world / 2;
      for (const [key, entry] of this.cache) {
        if (entry.status !== 'ready') continue;
        const t = entry.tile, size = world / (2 ** t.z);
        const x = this.transform.x + this.transform.k * (left + t.x * size);
        const y = this.transform.y + this.transform.k * (top + t.y * size);
        const pixels = size * this.transform.k;
        if (x >= o.width || y >= o.height || x + pixels <= 0 || y + pixels <= 0) continue;
        // A fully covered ancestor adds no visual coverage; its children are sharper.
        const childrenCover = t.z < MAX_ZOOM && [0,1].every(dy => [0,1].every(dx =>
          this.covered.has(`${t.z+1}/${t.x*2+dx}/${t.y*2+dy}`)));
        if (!childrenCover) { visible.set(key, entry); entry.touched = ++this.clock; }
      }
      for (const [key, node] of this.nodes) if (!visible.has(key)) { node.remove(); this.nodes.delete(key); }
      const ordered = [...visible.values()].sort((a, b) => a.tile.z - b.tile.z);
      for (const entry of ordered) {
        const t = entry.tile, size = world / (2 ** t.z);
        let node = this.nodes.get(t.key);
        if (!node) {
          node = this.layer.ownerDocument.createElementNS(SVG, 'image');
          node.setAttribute('href', t.url); node.setAttribute('preserveAspectRatio', 'none');
          node.setAttribute('pointer-events', 'none');
          this.nodes.set(t.key, node);
        }
        node.setAttribute('x', left + t.x * size); node.setAttribute('y', top + t.y * size);
        // A fraction of a screen pixel covers subpixel seams between adjoining tiles.
        const overlap = .3 / Math.max(.8, this.transform.k);
        node.setAttribute('width', size + overlap); node.setAttribute('height', size + overlap);
        this.layer.appendChild(node);
      }
      this.emit();
    }
    prune() {
      if (this.cache.size <= this.limit) return;
      const victims = [...this.cache.entries()].filter(([key, e]) =>
        e.status !== 'loading' && !this.wanted?.has(key) && !this.nodes.has(key))
        .sort((a, b) => a[1].touched - b[1].touched);
      for (const [key] of victims) { if (this.cache.size <= this.limit) break; this.cache.delete(key); }
    }
    retry() {
      for (const [key, e] of this.cache) if (e.status === 'error') this.cache.delete(key);
      this.flush();
    }
    emit(forced) {
      const entries = this.plan.tiles.map(t => this.cache.get(t.key));
      const loaded = this.plan.tiles.filter(t => this.covered.has(t.key)).length;
      const failed = this.plan.tiles.filter(t => !this.covered.has(t.key) && this.cache.get(t.key)?.status === 'error').length;
      const total = entries.length;
      const state = forced || (!this.enabled ? 'inactive' : !total ? 'outside' :
        loaded === total ? 'ready' : failed === total ? 'error' :
        failed > 0 && loaded + failed === total ? 'partial' : 'loading');
      this.onStatus({ state, loaded, failed, total, displayed: this.enabled ? this.nodes.size : 0, zoom: this.plan.zoom });
    }
  }
  const api = { TerrainTiles, planTiles, tileURL, MAX_ZOOM };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GeoLabTerrain = api;
})(typeof window !== 'undefined' ? window : globalThis);
