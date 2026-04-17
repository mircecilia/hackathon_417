/* audio.js —— 猫叫声预加载与加权随机播放 */
(function () {
  const AudioMgr = {
    pool: {},       // { id: HTMLAudioElement }
    loaded: {},     // { id: true }
    _inited: false,

    init() {
      if (this._inited) return;
      this._inited = true;
      const list = window.GAME.config.meows || [];
      list.forEach((item) => {
        try {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = item.file;
          audio.addEventListener('canplaythrough', () => {
            this.loaded[item.id] = true;
          }, { once: true });
          audio.addEventListener('error', () => {
            // 加载失败不阻塞，只是从池子中剔除
            delete this.pool[item.id];
          });
          this.pool[item.id] = audio;
        } catch (e) {
          console.warn('[audio] 加载失败', item.id, e);
        }
      });
    },

    /** 按照配置中的 weight 做加权随机挑一首，并播放 */
    playRandomMeow() {
      const list = (window.GAME.config.meows || []).filter((m) => this.pool[m.id]);
      if (!list.length) return;

      const total = list.reduce((s, m) => s + (m.weight || 1), 0);
      let r = Math.random() * total;
      let picked = list[0];
      for (let i = 0; i < list.length; i++) {
        r -= (list[i].weight || 1);
        if (r <= 0) { picked = list[i]; break; }
      }

      const audio = this.pool[picked.id];
      if (!audio) return;
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && p.catch) p.catch(() => {/* 忽略自动播放阻止 */});
      } catch (e) {
        console.warn('[audio] 播放失败', e);
      }
    }
  };

  window.GAME.Audio = AudioMgr;
})();
