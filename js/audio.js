/* audio.js —— 猫叫加权随机 + 背景音乐管理
 *
 * BGM 规则：
 * - 进入页面后首个用户交互时自动启动（浏览器 autoplay 策略要求）
 * - 心情 20~50 用 special，否则用 default（动态切换 + 随心情变化无缝切轨）
 * - 讲话（长按 Voice）/ 猫叫期间音量降低到 duckVolume，结束后恢复
 */
(function () {
  const AudioMgr = {
    pool: {},
    _inited: false,

    bgmDefault: null,
    bgmSpecial: null,
    currentBgm: null,
    isDucking: false,
    _bgmStarted: false,

    init() {
      if (this._inited) return;
      this._inited = true;

      // 猫叫池
      const list = window.GAME.config.meows || [];
      list.forEach((item) => {
        try {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = item.file;
          audio.addEventListener('error', () => { delete this.pool[item.id]; });
          this.pool[item.id] = audio;
        } catch (e) { console.warn('[audio] 猫叫加载失败', item.id, e); }
      });

      // BGM
      const bgmCfg = window.GAME.config.bgm;
      if (bgmCfg) {
        this.bgmDefault = this._makeBgm(bgmCfg.default.file, bgmCfg.default.volume);
        this.bgmSpecial = this._makeBgm(bgmCfg.special.file, bgmCfg.special.volume);
      }

      // 首个用户手势后启动 BGM
      const onceHandler = () => {
        if (this._bgmStarted) return;
        this._bgmStarted = true;
        this.updateBgmByMood(window.GAME.State ? window.GAME.State.getAffinity() : 0);
        window.removeEventListener('pointerdown', onceHandler, true);
        window.removeEventListener('touchstart', onceHandler, true);
        window.removeEventListener('keydown', onceHandler, true);
      };
      window.addEventListener('pointerdown', onceHandler, true);
      window.addEventListener('touchstart', onceHandler, true);
      window.addEventListener('keydown', onceHandler, true);
    },

    _makeBgm(src, vol) {
      const a = new Audio();
      a.src = src;
      a.loop = true;
      a.preload = 'auto';
      a.volume = typeof vol === 'number' ? vol : 0.4;
      a.addEventListener('error', () => { console.warn('[audio] BGM 加载失败', src); });
      return a;
    },

    /** 加权随机播放一首猫叫 */
    playRandomMeow(onEnded) {
      const done = () => {
        if (typeof onEnded === 'function') { onEnded(); onEnded = null; }
      };
      const list = (window.GAME.config.meows || []).filter((m) => this.pool[m.id]);
      if (!list.length) { setTimeout(done, 400); return; }

      const total = list.reduce((s, m) => s + (m.weight || 1), 0);
      let r = Math.random() * total;
      let picked = list[0];
      for (let i = 0; i < list.length; i++) {
        r -= (list[i].weight || 1);
        if (r <= 0) { picked = list[i]; break; }
      }
      const audio = this.pool[picked.id];
      if (!audio) { setTimeout(done, 400); return; }

      try {
        audio.currentTime = 0;
        const onEnd = () => {
          audio.removeEventListener('ended', onEnd);
          done();
        };
        audio.addEventListener('ended', onEnd);
        const p = audio.play();
        if (p && p.catch) {
          p.catch(() => {
            audio.removeEventListener('ended', onEnd);
            setTimeout(done, 400);
          });
        }
        setTimeout(() => {
          audio.removeEventListener('ended', onEnd);
          done();
        }, 3000);
      } catch (e) {
        console.warn('[audio] 猫叫播放失败', e);
        setTimeout(done, 400);
      }
    },

    /** 根据好感度切换 BGM 轨道 */
    updateBgmByMood(mood) {
      const bgmCfg = window.GAME.config.bgm;
      if (!bgmCfg || !this.bgmDefault || !this.bgmSpecial || !this._bgmStarted) return;

      const useSpecial = mood >= bgmCfg.specialMin && mood <= bgmCfg.specialMax;
      const wantKey = useSpecial ? 'special' : 'default';
      if (this.currentBgm === wantKey) return;

      const target = useSpecial ? this.bgmSpecial : this.bgmDefault;
      const other  = useSpecial ? this.bgmDefault  : this.bgmSpecial;
      try {
        other.pause();
        target.volume = this.isDucking
          ? bgmCfg.duckVolume
          : (useSpecial ? bgmCfg.special.volume : bgmCfg.default.volume);
        const p = target.play();
        if (p && p.catch) p.catch(() => {});
        this.currentBgm = wantKey;
      } catch (e) { console.warn('[audio] BGM 切换失败', e); }
    },

    /** ducking 开始：降到 duckVolume */
    duckStart() {
      const bgmCfg = window.GAME.config.bgm;
      if (!bgmCfg) return;
      this.isDucking = true;
      const current = this._getCurrentAudio();
      if (current) current.volume = bgmCfg.duckVolume;
    },

    /** ducking 结束：淡入恢复 */
    duckEnd() {
      const bgmCfg = window.GAME.config.bgm;
      if (!bgmCfg) return;
      this.isDucking = false;
      const current = this._getCurrentAudio();
      if (!current) return;
      const volNormal = this.currentBgm === 'special'
        ? bgmCfg.special.volume : bgmCfg.default.volume;
      const step = (volNormal - current.volume) / 6;
      let i = 0;
      const timer = setInterval(() => {
        i++;
        current.volume = Math.min(volNormal, current.volume + step);
        if (i >= 6) {
          current.volume = volNormal;
          clearInterval(timer);
        }
      }, 40);
    },

    _getCurrentAudio() {
      if (this.currentBgm === 'special') return this.bgmSpecial;
      if (this.currentBgm === 'default') return this.bgmDefault;
      return null;
    }
  };

  window.GAME.Audio = AudioMgr;
})();
