/* cat.js —— 猫 Canvas 渲染、点击区域判定、状态切换 */
(function () {
  const Cat = {
    canvas: null,
    ctx: null,
    wrap: null,
    imgNormal: null,
    imgListen: null,
    currentImg: null,
    dpr: 1,
    logicalW: 0,    // CSS 像素下 canvas 绘制区域宽
    logicalH: 0,
    _clickHandler: null,
    _listening: false,

    init({ onHit }) {
      this.wrap = document.getElementById('catWrap');
      this.canvas = document.getElementById('catCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.onHit = onHit;

      this.imgNormal = new Image();
      this.imgListen = new Image();
      this.imgNormal.src = './images/Cat.png';
      this.imgListen.src = './images/Cat_listen.png';

      let readyCount = 0;
      const onReady = () => {
        readyCount++;
        if (readyCount >= 2) {
          this.currentImg = this.imgNormal;
          this.resize();
          this.draw();
        }
      };
      this.imgNormal.addEventListener('load', onReady);
      this.imgListen.addEventListener('load', onReady);
      // 若图片加载失败，用占位绘制（只算一次）
      this.imgNormal.addEventListener('error', () => {
        console.warn('[cat] Cat.png 加载失败');
        onReady();
      });
      this.imgListen.addEventListener('error', () => {
        console.warn('[cat] Cat_listen.png 加载失败');
        onReady();
      });

      window.addEventListener('resize', () => {
        this.resize();
        this.draw();
      });

      this._bindInput();
    },

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
      // 计算并缓存实际绘制矩形（用于点击区域判定）
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
        this.ctx.fillStyle = '#2b2217';
        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('加载中...', w / 2, h / 2);
      }

      // 调试模式：显示点击区域（基于实际绘制矩形）
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
      this._listening = !!isListening;
      this.currentImg = isListening ? this.imgListen : this.imgNormal;
      this.draw();
    },

    _bindInput() {
      const handle = (clientX, clientY) => {
        if (this._listening) return; // 听音状态下不触发身体点击
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

        // 将点击坐标换算到 "绘制矩形" 坐标系下
        // canvas 显示尺寸 rect 与逻辑尺寸 logicalW/H 在 CSS 层一致（都为 CSS 像素）
        const dr = this.drawRect;
        if (!dr) return;
        const scaleX = rect.width / this.logicalW;
        const scaleY = rect.height / this.logicalH;
        const drLeft   = dr.x * scaleX;
        const drTop    = dr.y * scaleY;
        const drWidth  = dr.w * scaleX;
        const drHeight = dr.h * scaleY;

        // 点击必须在实际绘制的图片范围内
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
            hit = a;
            break;
          }
        }
        if (hit && typeof this.onHit === 'function') {
          this.onHit(hit, { x, y, rect });
        }
      };

      this.canvas.addEventListener('click', (e) => {
        handle(e.clientX, e.clientY);
      });
    }
  };

  window.GAME.Cat = Cat;
})();
