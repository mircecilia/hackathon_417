/* storage.js —— 封装 localStorage 及玩家状态 */
(function () {
  const KEY = 'cat_game_save_v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[storage] 读取失败', e);
      return null;
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[storage] 写入失败', e);
    }
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function createDefaultState() {
    const cfg = window.GAME.config;
    return {
      affinity: cfg.affinity.initial,
      coins: cfg.player.initialCoins,
      inventory: {},            // { itemId: count }
      voiceGainToday: { date: todayKey(), gained: 0 },
      cooldowns: {},            // { key: nextAvailableTimestamp } —— 支持跨刷新
      purchaseCounters: {},     // { itemId: 累计购买数 }（用于奶茶半价规则）
      recentActions: [],        // [{ type, id, at }] 最近行为记录，用于组合判定
      llm: {
        enabled: cfg.llm.enabled,
        endpoint: cfg.llm.endpoint,
        apiKey: cfg.llm.apiKey
      }
    };
  }

  const State = {
    data: null,

    init() {
      const loaded = load();
      if (loaded) {
        this.data = loaded;
        // 补全新增字段（前向兼容）
        const def = createDefaultState();
        for (const k in def) {
          if (this.data[k] === undefined) this.data[k] = def[k];
        }
        // 日期重置
        if (!this.data.voiceGainToday || this.data.voiceGainToday.date !== todayKey()) {
          this.data.voiceGainToday = { date: todayKey(), gained: 0 };
        }
      } else {
        this.data = createDefaultState();
      }
      this.persist();
    },

    persist() { save(this.data); },

    getAffinity() { return this.data.affinity; },

    setAffinity(v) {
      const cfg = window.GAME.config.affinity;
      this.data.affinity = Math.max(cfg.min, Math.min(cfg.max, Math.round(v)));
      this.persist();
    },

    addAffinity(delta) {
      this.setAffinity(this.data.affinity + delta);
    },

    getCoins() { return this.data.coins; },

    addCoins(n) {
      this.data.coins = Math.max(0, this.data.coins + n);
      this.persist();
    },

    addItem(id, n) {
      n = n || 1;
      this.data.inventory[id] = (this.data.inventory[id] || 0) + n;
      this.persist();
    },

    useItem(id, n) {
      n = n || 1;
      if ((this.data.inventory[id] || 0) < n) return false;
      this.data.inventory[id] -= n;
      if (this.data.inventory[id] <= 0) delete this.data.inventory[id];
      this.persist();
      return true;
    },

    getItemCount(id) { return this.data.inventory[id] || 0; },

    /* 每日对话好感上限 */
    canGainVoiceAffinity() {
      if (this.data.voiceGainToday.date !== todayKey()) {
        this.data.voiceGainToday = { date: todayKey(), gained: 0 };
      }
      const cap = window.GAME.config.affinity.dailyVoiceChanceCap;
      return this.data.voiceGainToday.gained < cap;
    },

    recordVoiceAffinityGain() {
      this.data.voiceGainToday.gained += 1;
      this.persist();
    },

    getLLMConfig() { return this.data.llm; },
    setLLMConfig(cfg) {
      this.data.llm = Object.assign({}, this.data.llm, cfg);
      this.persist();
    },

    /* ========== 冷却管理（跨刷新保留） ========== */
    /** 返回 0 表示可用；否则返回剩余毫秒 */
    getCooldownRemain(key) {
      const until = (this.data.cooldowns || {})[key];
      if (!until) return 0;
      const remain = until - Date.now();
      return remain > 0 ? remain : 0;
    },
    setCooldown(key, ms) {
      if (!this.data.cooldowns) this.data.cooldowns = {};
      this.data.cooldowns[key] = Date.now() + ms;
      this.persist();
    },
    clearExpiredCooldowns() {
      if (!this.data.cooldowns) return;
      const now = Date.now();
      let changed = false;
      for (const k in this.data.cooldowns) {
        if (this.data.cooldowns[k] <= now) {
          delete this.data.cooldowns[k];
          changed = true;
        }
      }
      if (changed) this.persist();
    },

    /* ========== 购买计数（用于奶茶半价规则） ========== */
    getPurchaseCount(id) {
      return (this.data.purchaseCounters || {})[id] || 0;
    },
    addPurchaseCount(id, n) {
      if (!this.data.purchaseCounters) this.data.purchaseCounters = {};
      this.data.purchaseCounters[id] = (this.data.purchaseCounters[id] || 0) + n;
      this.persist();
    },

    /* ========== 最近行为记录（用于连携系统） ========== */
    clearExpiredRecentActions(maxAgeMs) {
      const maxAge = typeof maxAgeMs === 'number' ? maxAgeMs : 30000;
      if (!Array.isArray(this.data.recentActions)) {
        this.data.recentActions = [];
        this.persist();
        return;
      }
      const now = Date.now();
      const next = this.data.recentActions.filter((x) => x && x.at && now - x.at <= maxAge);
      if (next.length !== this.data.recentActions.length) {
        this.data.recentActions = next;
        this.persist();
      }
    },
    getRecentActions(withinMs) {
      this.clearExpiredRecentActions();
      const list = Array.isArray(this.data.recentActions) ? this.data.recentActions.slice() : [];
      if (typeof withinMs !== 'number') return list;
      const now = Date.now();
      return list.filter((x) => x && x.at && now - x.at <= withinMs);
    },
    recordAction(type, id) {
      this.clearExpiredRecentActions();
      if (!Array.isArray(this.data.recentActions)) this.data.recentActions = [];
      this.data.recentActions.push({ type, id, at: Date.now() });
      if (this.data.recentActions.length > 30) {
        this.data.recentActions = this.data.recentActions.slice(-30);
      }
      this.persist();
    },
    countRecentAction(type, id, withinMs) {
      return this.getRecentActions(withinMs).filter((x) => x.type === type && x.id === id).length;
    },
    consumeRecentAction(type, id, withinMs) {
      this.clearExpiredRecentActions();
      if (!Array.isArray(this.data.recentActions) || !this.data.recentActions.length) return false;
      const now = Date.now();
      let idx = -1;
      for (let i = this.data.recentActions.length - 1; i >= 0; i--) {
        const item = this.data.recentActions[i];
        if (!item || item.type !== type || item.id !== id) continue;
        if (typeof withinMs === 'number' && now - item.at > withinMs) continue;
        idx = i;
        break;
      }
      if (idx < 0) return false;
      this.data.recentActions.splice(idx, 1);
      this.persist();
      return true;
    }
  };

  window.GAME.State = State;
})();
