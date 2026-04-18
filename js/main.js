/* main.js —— 入口：初始化所有模块并绑定交互 (V1.1) */
(function () {
  const GAME = window.GAME;

  // ======== 小工具 ========
  const lastCallAt = {};
  function cooldown(key) {
    const now = Date.now();
    const ms = GAME.config.cooldownMs || 200;
    if (lastCallAt[key] && now - lastCallAt[key] < ms) return false;
    lastCallAt[key] = now;
    return true;
  }

  function showTapRing(clientX, clientY) {
    const stage = document.querySelector('.stage');
    const rect = stage.getBoundingClientRect();
    const ring = document.createElement('div');
    ring.className = 'tap-ring';
    ring.style.left = (clientX - rect.left) + 'px';
    ring.style.top  = (clientY - rect.top) + 'px';
    ring.style.width = ring.style.height = '40px';
    stage.appendChild(ring);
    setTimeout(() => ring.remove(), 500);
  }

  function iconHTML(iconId) { return GAME.Icons.render(iconId); }

  // ========= 奶茶半价价格计算 =========
  /** 每 2 个为一组：第一个原价，第二个半价 —— 跨次购买连续计数 */
  function calcPrice(item, quantity) {
    if (!item.discount || item.discount.rule !== 'halfEvery2') {
      return item.price * quantity;
    }
    const unit = item.discount.unitPrice || item.price;
    const half = item.discount.halfPrice;
    const bought = GAME.State.getPurchaseCount(item.id);
    let total = 0;
    for (let i = 0; i < quantity; i++) {
      const idx = bought + i + 1; // 1-based
      total += (idx % 2 === 0) ? half : unit;
    }
    return total;
  }

  /** 当前金币最多能买几个（受半价规则影响，逐个累加计算） */
  function maxAffordable(item) {
    const coins = GAME.State.getCoins();
    if (!item.discount) return Math.floor(coins / item.price);
    let n = 0;
    while (calcPrice(item, n + 1) <= coins) {
      n++;
      if (n > 999999) break;
    }
    return n;
  }

  // ======== 行为处理 ========
  async function handleHitArea(area, pos) {
    if (!cooldown('hit:' + area.id)) return;
    if (GAME.Cat.isLocked()) return;  // 动画/聆听/张嘴期间忽略

    const mood = GAME.State.getAffinity();
    const action = '触摸' + area.name;
    if (pos) {
      const rect = pos.rect;
      showTapRing(rect.left + pos.x, rect.top + pos.y);
    }

    // 先出文本（无论是否跟随动画，文字框都要正常输出）
    try {
      const text = await GAME.LLM.think(action, mood, area.corpusKey || ('touch:' + area.id));
      GAME.UI.setDialogue(text);
    } catch (e) { GAME.UI.setDialogue('喵~'); }

    // 然后按概率决定是否叠加动画：text=0.8 不做动画；lick/stretch 各 0.1
    const p = (GAME.config.animations && GAME.config.animations.touchProbabilities) || {};
    const pText    = p.text    != null ? p.text    : 0.8;
    const pLick    = p.lick    != null ? p.lick    : 0.1;
    // const pStretch = p.stretch != null ? p.stretch : 0.1;  // 剩余概率自动归入 stretch
    const r = Math.random();
    if (r < pText) {
      // 仅文本
      return;
    }
    if (r < pText + pLick) {
      GAME.Cat.playAnimation('lick');
    } else {
      GAME.Cat.playAnimation('stretch');
    }
  }

  /** Voice 松开：切张嘴图 → 播放猫叫（带 ducking）→ 切回 Cat.png */
  async function handleVoiceEnd() {
    const cfgAff = GAME.config.affinity;
    if (GAME.State.canGainVoiceAffinity() && Math.random() < cfgAff.voiceGainChance) {
      GAME.State.addAffinity(1);
      GAME.State.recordVoiceAffinityGain();
      GAME.Audio.updateBgmByMood(GAME.State.getAffinity());
    }

    GAME.Cat.setListening(false);
    GAME.Cat.setOpenMouth(true);
    GAME.Audio.duckStart();
    GAME.Audio.playRandomMeow(() => {
      GAME.Cat.setOpenMouth(false);
      GAME.Audio.duckEnd();
    });

    const mood = GAME.State.getAffinity();
    try {
      const text = await GAME.LLM.think('对话', mood, 'voice');
      GAME.UI.setDialogue(text);
    } catch (e) { GAME.UI.setDialogue('喵~'); }
  }

  async function handleFeed(food) {
    if (!cooldown('feed')) return;
    if (GAME.Cat.isLocked()) { GAME.UI.toast('猫咪正在忙，稍等~'); return; }
    const have = GAME.State.getItemCount(food.id);
    if (have <= 0) {
      alert('道具不足，请前往商店购买');
      return;
    }
    GAME.State.useItem(food.id, 1);
    GAME.State.addAffinity(food.affinity || 0);
    GAME.Audio.updateBgmByMood(GAME.State.getAffinity());  // 好感变化触发 BGM 段切换
    GAME.UI.closeModal();
    const mood = GAME.State.getAffinity();
    try {
      const text = await GAME.LLM.think('投喂' + food.name, mood, food.corpusKey || ('feed:' + food.id));
      GAME.UI.setDialogue(text);
    } catch (e) { GAME.UI.setDialogue('喵~'); }
    GAME.UI.toast('投喂成功：' + food.name);

    // 小鱼干专属进食动画（其他食物暂未实现，按需扩展 animations.sprites）
    if (food.id === 'fish') {
      GAME.Cat.playAnimation('fish');
    }
  }

  async function handleInteraction(act) {
    if (!cooldown('interact')) return;
    if (GAME.Cat.isLocked()) { GAME.UI.toast('猫咪正在忙，稍等~'); return; }
    if (act.requireItem) {
      const have = GAME.State.getItemCount(act.requireItem);
      if (have <= 0) {
        alert('道具不足，请前往商店购买');
        return;
      }
    }
    // 冷却：有道具 → 按道具 id 维度；无道具 → 按行为 id
    const cdKey = 'interactCD:' + (act.requireItem || act.id);
    const remain = GAME.State.getCooldownRemain(cdKey);
    if (remain > 0) {
      const sec = Math.ceil(remain / 1000);
      alert('你点的太快啦，' + sec + '秒后再试试吧');
      return;
    }
    const cdMs = act.cooldownMs
      ? act.cooldownMs
      : (act.requireItem ? GAME.config.toolCooldownMs : GAME.config.walkCooldownMs);
    GAME.State.setCooldown(cdKey, cdMs);

    GAME.State.addAffinity(act.affinity || 0);
    GAME.Audio.updateBgmByMood(GAME.State.getAffinity());
    GAME.UI.closeModal();
    const mood = GAME.State.getAffinity();
    try {
      const text = await GAME.LLM.think(act.name, mood, act.corpusKey || ('action:' + act.id));
      GAME.UI.setDialogue(text);
    } catch (e) { GAME.UI.setDialogue('喵~'); }
    GAME.UI.toast(act.name + '成功');
  }

  // ======== 购买确认弹窗 ========
  function openBuyConfirm(item) {
    const coins = GAME.State.getCoins();
    const maxQ = maxAffordable(item);
    if (maxQ <= 0) { GAME.UI.toast('金币不足'); return; }

    const tagNote = item.discount
      ? `<div class="discount-note">💡 ${item.tag || '享受折扣'}</div>`
      : '';

    const html = `
      <div class="buy-head">
        <div class="buy-icon">${iconHTML(item.iconId)}</div>
        <div class="buy-name">${item.name}</div>
      </div>
      ${tagNote}
      <div class="buy-qty">
        <button class="qty-btn" data-act="dec" aria-label="减少">−</button>
        <input type="range" id="buyRange" min="1" max="${maxQ}" value="1" step="1"/>
        <button class="qty-btn" data-act="inc" aria-label="增加">+</button>
      </div>
      <div class="buy-info">
        <span>数量：<span id="buyQty">1</span> / ${maxQ}</span>
        <span>总价：💰 <span id="buyTotal">${calcPrice(item, 1)}</span></span>
      </div>
      <div class="buy-coins">当前金币：💰 ${coins}</div>
    `;
    const footer = `
      <div class="buy-footer">
        <button class="item-btn btn-cancel" id="buyCancel">取消</button>
        <button class="item-btn btn-confirm" id="buyOk">确认</button>
      </div>
    `;

    GAME.UI.openModal({
      title: '购买确认',
      bodyHTML: html,
      footerHTML: footer,
      // 自定义关闭回调：点击蒙层关闭时回到商店
      onMaskClose: () => openShopModal()
    });

    const range = document.getElementById('buyRange');
    const qtyEl = document.getElementById('buyQty');
    const totalEl = document.getElementById('buyTotal');
    const updateView = () => {
      const q = Number(range.value);
      qtyEl.textContent = q;
      totalEl.textContent = calcPrice(item, q);
    };
    range.addEventListener('input', updateView);
    document.querySelector('#modalBody button[data-act="dec"]').addEventListener('click', () => {
      range.value = Math.max(1, Number(range.value) - 1);
      updateView();
    });
    document.querySelector('#modalBody button[data-act="inc"]').addEventListener('click', () => {
      range.value = Math.min(maxQ, Number(range.value) + 1);
      updateView();
    });
    document.getElementById('buyCancel').addEventListener('click', () => {
      GAME.UI.closeModal(); openShopModal();
    });
    document.getElementById('buyOk').addEventListener('click', () => {
      doBuy(item, Number(range.value));
    });
  }

  function doBuy(item, q) {
    if (!cooldown('buy')) return;
    const total = calcPrice(item, q);
    if (GAME.State.getCoins() < total) {
      GAME.UI.toast('金币不足'); return;
    }
    GAME.State.addCoins(-total);
    GAME.State.addItem(item.id, q);
    GAME.State.addPurchaseCount(item.id, q);
    GAME.UI.toast(`购买成功：${item.name} ×${q}`);
    GAME.UI.closeModal();
    openShopModal();
  }

  // ======== 商店（食物/道具分区，价格升序） ========
  function renderShopSection(title, items, coins) {
    let html = `<div class="shop-section-title">${title}</div>`;
    items.forEach((it) => {
      const owned = GAME.State.getItemCount(it.id);
      const canAfford = maxAffordable(it) >= 1;
      const unaffordable = !canAfford;
      const tag = it.tag ? `<span class="tag-discount">${it.tag}</span>` : '';
      html += `
        <div class="item-row ${unaffordable ? 'disabled' : ''}" data-id="${it.id}">
          <div class="item-icon">${iconHTML(it.iconId)}</div>
          <div class="item-info">
            <div class="item-name">${it.name}${owned > 0 ? '<span class="owned-badge">x'+owned+'</span>' : ''} ${tag}</div>
            <div class="item-desc">💰 ${it.price}</div>
          </div>
          <button class="item-btn" data-act="buy" data-id="${it.id}" ${unaffordable ? 'disabled' : ''}>购买</button>
        </div>`;
    });
    return html;
  }

  function openShopModal() {
    const shop = GAME.config.shop;
    const coins = GAME.State.getCoins();
    const foods = shop.filter(x => x.type === 'food').slice().sort((a,b) => a.price - b.price);
    const tools = shop.filter(x => x.type === 'tool').slice().sort((a,b) => a.price - b.price);

    const body =
      `<div class="coins-bar">💰 金币 ${coins}</div>` +
      renderShopSection('🍴 食物', foods, coins) +
      renderShopSection('🎒 道具', tools, coins);

    GAME.UI.openModal({ title: '商店', bodyHTML: body });
    const bodyEl = document.getElementById('modalBody');
    bodyEl.querySelectorAll('button[data-act="buy"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.hasAttribute('disabled')) {
          GAME.UI.toast('金币不足');
          return;
        }
        const id = btn.getAttribute('data-id');
        const it = shop.find((x) => x.id === id);
        if (!it) return;
        if (maxAffordable(it) <= 0) { GAME.UI.toast('金币不足'); return; }
        openBuyConfirm(it);
      });
    });
  }

  // ======== 投喂弹窗 ========
  function openFeedModal() {
    const foods = GAME.config.foods.slice();
    let html = '';
    foods.forEach((f) => {
      const owned = GAME.State.getItemCount(f.id);
      const disabled = owned <= 0;
      html += `
        <div class="item-row ${disabled ? 'disabled' : ''}" data-id="${f.id}">
          <div class="item-icon">${iconHTML(f.iconId)}</div>
          <div class="item-info">
            <div class="item-name">${f.name}</div>
            <div class="item-desc">拥有：${owned}</div>
          </div>
          <button class="item-btn" data-act="feed" data-id="${f.id}" ${disabled?'disabled':''}>投喂</button>
        </div>`;
    });
    if (!html) html = '<div class="empty-text">暂无可投喂食物</div>';
    GAME.UI.openModal({ title: '投喂', bodyHTML: html });
    const body = document.getElementById('modalBody');
    body.querySelectorAll('button[data-act="feed"]').forEach((btn) => {
      if (btn.hasAttribute('disabled')) return;
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const f = foods.find((x) => x.id === id);
        if (f) handleFeed(f);
      });
    });
  }

  // ======== 互动弹窗（含冷却 UI 与每秒刷新） ========
  let _interactRefreshTimer = null;

  function renderInteractList() {
    GAME.State.clearExpiredCooldowns();
    const acts = GAME.config.interactions.slice();
    let html = '';
    let anyOnCooldown = false;

    acts.forEach((a) => {
      const itemShop = a.requireItem ? GAME.config.shop.find(x => x.id === a.requireItem) : null;
      const need = a.requireItem ? GAME.State.getItemCount(a.requireItem) : 999;
      const cdKey = 'interactCD:' + (a.requireItem || a.id);
      const cdRemain = GAME.State.getCooldownRemain(cdKey);
      if (cdRemain > 0) anyOnCooldown = true;

      const missingItem = a.requireItem && need <= 0;
      const disabled = missingItem || cdRemain > 0;

      let desc;
      if (cdRemain > 0) {
        desc = `冷却中：${Math.ceil(cdRemain / 1000)} 秒`;
      } else if (a.requireItem) {
        desc = `需要：${itemShop ? itemShop.name : a.requireItem}（拥有 ${need}）`;
      } else {
        desc = `常驻行为 · 冷却 ${Math.round((a.cooldownMs || GAME.config.walkCooldownMs)/1000)}s`;
      }

      html += `
        <div class="item-row ${disabled ? 'disabled' : ''} ${cdRemain>0?'on-cooldown':''}" data-id="${a.id}">
          ${cdRemain>0 ? '<div class="cooldown-mask"></div>' : ''}
          <div class="item-icon">${iconHTML(a.iconId)}</div>
          <div class="item-info">
            <div class="item-name">${a.name}</div>
            <div class="item-desc">${desc}</div>
          </div>
          <button class="item-btn" data-act="interact" data-id="${a.id}" ${disabled?'disabled':''}>执行</button>
        </div>`;
    });
    if (!html) html = '<div class="empty-text">暂无可执行的互动</div>';

    const body = document.getElementById('modalBody');
    if (!body) return;
    body.innerHTML = html;
    body.querySelectorAll('button[data-act="interact"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.hasAttribute('disabled')) return;
        const id = btn.getAttribute('data-id');
        const a = GAME.config.interactions.find((x) => x.id === id);
        if (a) handleInteraction(a);
      });
    });

    if (_interactRefreshTimer) clearInterval(_interactRefreshTimer);
    if (anyOnCooldown) {
      _interactRefreshTimer = setInterval(() => {
        const mask = document.getElementById('modalMask');
        if (!mask || mask.classList.contains('hidden')) {
          clearInterval(_interactRefreshTimer);
          _interactRefreshTimer = null;
          return;
        }
        renderInteractList();
      }, 500);
    }
  }

  function openInteractModal() {
    GAME.UI.openModal({ title: '互动', bodyHTML: '' });
    renderInteractList();
  }

  // ======== 设置弹窗 ========
  function openSettingsModal() {
    const s = GAME.State.getLLMConfig();
    const html = `
      <div class="settings-row">
        <div class="toggle-row">
          <input type="checkbox" id="llmEnable" ${s.enabled?'checked':''}/>
          <label for="llmEnable">启用 LLM 心理活动</label>
        </div>
        <div class="item-desc" style="font-size:12px;color:#8a7d60;">未启用时使用内置离线语料库（每种情境 ≥3 条）</div>
      </div>
      <div class="settings-row">
        <label for="llmEndpoint">API Endpoint</label>
        <input type="text" id="llmEndpoint" placeholder="https://..." value="${s.endpoint || ''}"/>
      </div>
      <div class="settings-row">
        <label for="llmKey">API Key (可选)</label>
        <input type="password" id="llmKey" placeholder="sk-..." value="${s.apiKey || ''}"/>
      </div>
      <div class="settings-row">
        <div class="item-desc">当前好感度：${GAME.State.getAffinity()} / 100</div>
        <div class="item-desc">当前金币：${GAME.State.getCoins()} 💰</div>
      </div>`;
    const footer = `
      <div style="display:flex; gap:10px;">
        <button class="item-btn" id="saveSettings" style="flex:1;">保存</button>
        <button class="item-btn" id="resetAll" style="flex:1;background:#d9534f;color:#fff;">重置存档</button>
      </div>`;
    GAME.UI.openModal({ title: '设置', bodyHTML: html, footerHTML: footer });

    document.getElementById('saveSettings').addEventListener('click', () => {
      GAME.State.setLLMConfig({
        enabled: document.getElementById('llmEnable').checked,
        endpoint: document.getElementById('llmEndpoint').value.trim(),
        apiKey: document.getElementById('llmKey').value.trim()
      });
      GAME.UI.toast('设置已保存');
      GAME.UI.closeModal();
    });
    document.getElementById('resetAll').addEventListener('click', () => {
      if (!confirm('确认清空所有数据？')) return;
      localStorage.clear();
      GAME.State.init();
      GAME.UI.closeModal();
      GAME.UI.setDialogue('喵~');
      GAME.UI.toast('已重置');
    });
  }

  // ======== Voice 长按 ========
  function bindVoiceButton() {
    const btn = document.getElementById('btn-voice');
    let pressing = false;

    const start = (e) => {
      if (pressing) return;
      if (GAME.Cat.isLocked() && !GAME.Cat.isListening) { /* 动画中忽略 */ return; }
      if (e.cancelable) e.preventDefault();
      pressing = true;
      btn.classList.add('pressing');
      GAME.Cat.setListening(true);
      GAME.Audio.duckStart();  // 讲话时立刻降音量
    };
    const end = (e) => {
      if (!pressing) return;
      if (e && e.cancelable) e.preventDefault();
      pressing = false;
      btn.classList.remove('pressing');
      handleVoiceEnd();
    };

    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend',   end,   { passive: false });
    btn.addEventListener('touchcancel', end,   { passive: false });
    btn.addEventListener('mousedown', start);
    window.addEventListener('mouseup', end);
  }

  // ======== 初始化 ========
  function init() {
    try {
      if (!GAME.config) throw new Error('配置加载失败');

      GAME.State.init();
      GAME.State.clearExpiredCooldowns();
      GAME.UI.init();
      GAME.Audio.init();
      GAME.Cat.init({
        onHit: (area, pos) => handleHitArea(area, pos)
      });

      // 顶部按钮注入 SVG 图标（替代 emoji 占位）
      const injectIcon = (id, iconId) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="btn-svg-wrap">' + GAME.Icons.render(iconId) + '</span>';
      };
      injectIcon('btn-setting', 'setting');
      injectIcon('btn-shop',    'shop');
      injectIcon('btn-voice',   'voice');

      document.getElementById('btn-setting').addEventListener('click', () => {
        if (cooldown('setting')) openSettingsModal();
      });
      document.getElementById('btn-shop').addEventListener('click', () => {
        if (cooldown('shop')) openShopModal();
      });
      document.getElementById('btn-feed').addEventListener('click', () => {
        if (cooldown('feed-open')) openFeedModal();
      });
      document.getElementById('btn-interact').addEventListener('click', () => {
        if (cooldown('interact-open')) openInteractModal();
      });
      bindVoiceButton();

      GAME.UI.setDialogue('喵~');
    } catch (e) {
      console.error(e);
      GAME.UI.showError('哎呀，出错了，请重启试试吧~');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GAME.redraw = () => window.GAME.Cat.draw();
})();
