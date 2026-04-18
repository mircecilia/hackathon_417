/* cat.js —— Canvas 渲染、点击区域、状态切换、反应动画
 *
 * 动画约定：
 *   Cat.png  →  mid  →  action  →  mid  →  Cat.png
 *   每两帧之间固定间隔 frameIntervalMs（默认 500ms）
 *   在第二个 mid 帧"播放结束"时切回 Cat.png 前瞬间，播放一次随机猫叫
 *
 * 动作锁：_animating === true 期间 isLocked() 返回 true，
 *   点击、投喂、互动均需通过这个判断来决定是否忽略请求。
 */
(function () {
  const Cat = {
    canvas: null, ctx: null, wrap: null,
    imgNormal: null, imgListen: null, imgOpenMouth: null, imgBackground: null,
    sprites: {},
    currentImg: null,
    dpr: 1, logicalW: 0, logicalH: 0, drawRect: null,
    _listening: false,
    _openMouth: false,
    _animating: false,
    _onReady: null,

    init({ onHit }) {
      this.wrap = document.getElementById('catWrap');
      this.canvas = document.getElementById('catCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.onHit = onHit;

      this.imgNormal    = this._loadImg('./images/Cat.png');
      this.imgListen    = this._loadImg('./images/Cat_listen.png');
      this.imgOpenMouth = this._loadImg('./images/Cat_openMouth.png');
      this.imgBackground = this._loadImg('./images/Background.png');

      const spriteCfg = (window.GAME.config.animations || {}).sprites || {};
      const spriteKeys = Object.keys(spriteCfg);
      spriteKeys.forEach((key) => {
        const c = spriteCfg[key];
        this.sprites[key] = {
          mid:    this._loadImg(c.midFrame),
          action: this._loadImg(c.actionFrame)
        };
      });

      const all = [this.imgNormal, this.imgListen, this.imgOpenMouth, this.imgBackground];
      spriteKeys.forEach((k) => { all.push(this.sprites[k].mid, this.sprites[k].action); });
      const total = all.length;
      let ready = 0;
      const onOne = () => {
        ready++;
        if (ready >= total) {
          this.currentImg = this.imgNormal;
          this.resize();
          this.draw();
          if (typeof this._onReady === 'function') this._onReady();
        }
      };
      all.forEach((img) => {
        img.addEventListener('load',  onOne);
        img.addEventListener('error', () => {
          console.warn('[cat] 图片加载失败', img.src); onOne();
        });
      });

      window.addEventListener('resize', () => { this.resize(); this.draw(); });
      this._bindInput();
    },

    _loadImg(src) { const i = new Image(); i.src = src; return i; },

    onImagesReady(cb) { this._onReady = cb; },

    resize() {
      const rect = this.wrap.getBoundingClientRect();
      this.logicalW = rect.width;
      this.logicalH = rect.height;
      this.dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
      this.canvas.width  = Math.round(this.logicalW * this.dpr);
      this.canvas.height = Math.round(this.logicalH * this.dpr);
      this.canvas.style.width  = this.logicalW + 'px';
      this.canvas.style.height = this.logicalH + 'px';
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
    },

    draw() {
      if (!this.ctx) return;
      const w = this.logicalW, h = this.logicalH;
      this.ctx.clearRect(0, 0, w, h);
      const img = this.currentImg;
      if (img && img.naturalWidth) {
        const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        this.drawRect = { x: dx, y: dy, w: dw, h: dh };
        this.ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        this.drawRect = { x: 0, y: 0, w: w, h: h };
        this.ctx.fillStyle = '#f0c986';
        this.ctx.fillRect(0, 0, w, h);
      }
      if (window.GAME.DEBUG_HITAREAS) {
        const areas = window.GAME.config.hitAreas;
        const r = this.drawRect;
        this.ctx.strokeStyle = 'rgba(255,0,0,0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.font = '12px sans-serif';
        this.ctx.fillStyle = 'rgba(255,0,0,0.9)';
        this.ctx.textAlign = 'left';
        areas.forEach((a) => {
          const x = r.x + a.xPct * r.w;
          const y = r.y + a.yPct * r.h;
          const aw = a.wPct * r.w;
          const ah = a.hPct * r.h;
          this.ctx.strokeRect(x, y, aw, ah);
          this.ctx.fillText(a.name, x + 2, y + 14);
        });
      }
    },

    setListening(isListening) {
      if (this._animating) return;
      this._listening = !!isListening;
      this.currentImg = isListening ? this.imgListen : this.imgNormal;
      this.draw();
    },

    setOpenMouth(isOpen) {
      if (this._animating) return;
      this._openMouth = !!isOpen;
      if (isOpen) {
        this.currentImg = this.imgOpenMouth;
      } else if (!this._listening) {
        this.currentImg = this.imgNormal;
      }
      this.draw();
    },

    isLocked() {
      return this._animating || this._listening || this._openMouth;
    },
    isAnimating() { return this._animating; },

    /**
     * 播放反应动画
     * Cat.png -> mid -> action -> mid -> Cat.png (每帧间隔 interval ms)
     * 在"第二个 mid 帧结束时"切回 Cat.png 前触发随机猫叫（带 ducking）
     * @param {string} spriteKey  'lick' | 'stretch' | 'fish'
     * @param {Function} onDone
     */
    playAnimation(spriteKey, onDone) {
      if (this._animating) { if (onDone) onDone({ skipped: true }); return; }
      const sprite = this.sprites[spriteKey];
      if (!sprite || !sprite.mid || !sprite.action) {
        console.warn('[cat] 未知动画', spriteKey);
        if (onDone) onDone({ error: true }); return;
      }

      this._animating = true;
      const cfg = window.GAME.config.animations || {};
      const interval = cfg.frameIntervalMs || 500;

      // 严格按需求：Cat.png → mid → action → mid → Cat.png（共 5 阶段）
      // 当前已经显示 Cat.png；先停留 interval 再开始切帧
      const frames = [sprite.mid, sprite.action, sprite.mid];
      let idx = -1; // -1 表示仍在展示 Cat.png

      const timer = setInterval(() => {
        if (!this._animating) { clearInterval(timer); return; }
        idx++;
        if (idx < frames.length) {
          // 切入 mid / action / mid
          this.currentImg = frames[idx];
          this.draw();
        } else {
          // 第二个 mid 刚刚展示完 → 播放猫叫 + ducking + 切回 Cat.png
          clearInterval(timer);
          try {
            window.GAME.Audio.duckStart();
            window.GAME.Audio.playRandomMeow(() => {
              window.GAME.Audio.duckEnd();
            });
          } catch (_) {}
          this.currentImg = this.imgNormal;
          this.draw();
          this._animating = false;
          if (onDone) onDone({ ok: true });
        }
      }, interval);
    },

    _bindInput() {
      const handle = (clientX, clientY) => {
        if (this.isLocked()) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

        const dr = this.drawRect;
        if (!dr) return;
        const scaleX = rect.width / this.logicalW;
        const scaleY = rect.height / this.logicalH;
        const drLeft   = dr.x * scaleX;
        const drTop    = dr.y * scaleY;
        const drWidth  = dr.w * scaleX;
        const drHeight = dr.h * scaleY;
        if (x < drLeft || y < drTop || x > drLeft + drWidth || y > drTop + drHeight) return;

        const localX = x - drLeft;
        const localY = y - drTop;
        const areas = window.GAME.config.hitAreas;
        let hit = null;
        for (const a of areas) {
          const ax = a.xPct * drWidth;
          const ay = a.yPct * drHeight;
          const aw = a.wPct * drWidth;
          const ah = a.hPct * drHeight;
          if (localX >= ax && localX <= ax + aw && localY >= ay && localY <= ay + ah) {
            hit = a; break;
          }
        }
        if (hit && typeof this.onHit === 'function') {
          this.onHit(hit, { x, y, rect });
        }
      };
      this.canvas.addEventListener('click', (e) => handle(e.clientX, e.clientY));
    }
  };

  window.GAME.Cat = Cat;
})();
