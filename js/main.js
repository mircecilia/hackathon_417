/* main.js —— 入口：初始化所有模块并绑定交互 */
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

  // ======== 行为处理 ========
  async function handleHitArea(area, pos) {
    if (!cooldown('hit:' + area.id)) return;
    const mood = GAME.State.getAffinity();
    const action = '触摸' + area.name;
    // 触摸反馈
    if (pos) {
      const rect = pos.rect;
      showTapRing(rect.left + pos.x, rect.top + pos.y);
    }
    // 触摸本身不直接改变好感度（靠 LLM 叙事），如需调整可改为按区域 +/-
    try {
      const text = await GAME.LLM.think(action, mood);
      GAME.UI.setDialogue(text);
    } catch (e) {
      console.warn(e);
      GAME.UI.setDialogue('喵~');
    }
  }

  async function handleVoiceEnd() {
    const cfg = GAME.config.affinity;
    let gained = false;
    if (GAME.State.canGainVoiceAffinity() && Math.random() < cfg.voiceGainChance) {
      GAME.State.addAffinity(1);
      GAME.State.recordVoiceAffinityGain();
      gained = true;
    }

    // 随机一声猫叫
    GAME.Audio.playRandomMeow();

    // 叫完后回到 normal 图
    GAME.Cat.setListening(false);

    const mood = GAME.State.getAffinity();
    try {
      const text = await GAME.LLM.think('对话', mood);
      GAME.UI.setDialogue(text);
    } catch (e) {
      GAME.UI.setDialogue('喵~');
    }
    if (gained) {
      // 轻微提示（可选）
      // GAME.UI.toast('好感 +1');
    }
  }

  async function handleFeed(food) {
    if (!cooldown('feed')) return;
    const have = GAME.State.getItemCount(food.id);
    if (have <= 0) {
      alert('道具不足，请前往商店购买');
      return;
    }
    GAME.State.useItem(food.id, 1);
    GAME.State.addAffinity(food.affinity || 0);
    GAME.UI.closeModal();
    const mood = GAME.State.getAffinity();
    try {
      const text = await GAME.LLM.think('投喂' + food.name, mood);
      GAME.UI.setDialogue(text);
    } catch (e) {
      GAME.UI.setDialogue('喵~');
    }
    GAME.UI.toast('投喂成功：' + food.name);
  }

  async function handleInteraction(act) {
    if (!cooldown('interact')) return;
    if (act.requireItem) {
      const have = GAME.State.getItemCount(act.requireItem);
      if (have <= 0) {
        alert('道具不足，请前往商店购买');
        return;
      }
      // 互动类道具默认不消耗（可按需改为 useItem）
      // 如需消耗：GAME.State.useItem(act.requireItem, 1);
    }
    GAME.State.addAffinity(act.affinity || 0);
    GAME.UI.closeModal();
    const mood = GAME.State.getAffinity();
    try {
      const text = await GAME.LLM.think(act.name, mood);
      GAME.UI.setDialogue(text);
    } catch (e) {
      GAME.UI.setDialogue('喵~');
    }
    GAME.UI.toast(act.name + '成功');
  }

  function handleBuy(item) {
    if (!cooldown('buy')) return;
    const coins = GAME.State.getCoins();
    if (coins < item.price) {
      GAME.UI.toast('金币不足');
      return;
    }
    GAME.State.addCoins(-item.price);
    GAME.State.addItem(item.id, 1);
    GAME.UI.toast('购买成功：' + item.name);
    openShopModal(); // 刷新
  }

  // ======== 弹窗内容构造 ========
  function renderShopItems() {
    const items = GAME.config.shop;
    const coins = GAME.State.getCoins();
    let html = `<div class="coins-bar">💰 金币 ${coins}</div>`;
    items.forEach((it) => {
      const owned = GAME.State.getItemCount(it.id);
      const disable = coins < it.price ? 'disabled' : '';
      html += `
        <div class="item-row" data-id="${it.id}">
          <div class="item-icon">${it.icon || '🎁'}</div>
          <div class="item-info">
            <div class="item-name">${it.name}${owned > 0 ? '<span class="owned-badge">x'+owned+'</span>' : ''}</div>
            <div class="item-desc">💰 ${it.price}</div>
          </div>
          <button class="item-btn" data-act="buy" data-id="${it.id}" ${disable}>购买</button>
        </div>`;
    });
    return html;
  }

  function openShopModal() {
    GAME.UI.openModal({ title: '商店', bodyHTML: renderShopItems() });
    // 绑定购买事件
    const body = document.getElementById('modalBody');
    body.querySelectorAll('button[data-act="buy"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = GAME.config.shop.find((x) => x.id === id);
        if (item) handleBuy(item);
      });
    });
  }

  function openFeedModal() {
    const foods = GAME.config.foods;
    let html = '';
    foods.forEach((f) => {
      const owned = GAME.State.getItemCount(f.id);
      html += `
        <div class="item-row" data-id="${f.id}">
          <div class="item-icon">${f.icon || '🍽'}</div>
          <div class="item-info">
            <div class="item-name">${f.name}</div>
            <div class="item-desc">拥有：${owned}</div>
          </div>
          <button class="item-btn" data-act="feed" data-id="${f.id}" ${owned<=0?'disabled':''}>投喂</button>
        </div>`;
    });
    if (!html) html = '<div class="empty-text">暂无可投喂食物</div>';

    GAME.UI.openModal({ title: '投喂', bodyHTML: html });
    const body = document.getElementById('modalBody');
    body.querySelectorAll('button[data-act="feed"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const f = GAME.config.foods.find((x) => x.id === id);
        if (f) handleFeed(f);
      });
    });
  }

  function openInteractModal() {
    const acts = GAME.config.interactions;
    let html = '';
    acts.forEach((a) => {
      const need = a.requireItem ? GAME.State.getItemCount(a.requireItem) : 999;
      const disabled = (a.requireItem && need <= 0) ? 'disabled' : '';
      const desc = a.requireItem
        ? '需要道具：' + (GAME.config.shop.find(x=>x.id===a.requireItem)?.name || a.requireItem) + `（拥有 ${need}）`
        : '可直接使用';
      html += `
        <div class="item-row" data-id="${a.id}">
          <div class="item-icon">${a.icon || '🎮'}</div>
          <div class="item-info">
            <div class="item-name">${a.name}</div>
            <div class="item-desc">${desc}</div>
          </div>
          <button class="item-btn" data-act="interact" data-id="${a.id}" ${disabled}>执行</button>
        </div>`;
    });
    if (!html) html = '<div class="empty-text">暂无可执行的互动</div>';

    GAME.UI.openModal({ title: '互动', bodyHTML: html });
    const body = document.getElementById('modalBody');
    body.querySelectorAll('button[data-act="interact"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const a = GAME.config.interactions.find((x) => x.id === id);
        if (a) handleInteraction(a);
      });
    });
  }

  function openSettingsModal() {
    const s = GAME.State.getLLMConfig();
    const html = `
      <div class="settings-row">
        <div class="toggle-row">
          <input type="checkbox" id="llmEnable" ${s.enabled?'checked':''}/>
          <label for="llmEnable">启用 LLM 心理活动</label>
        </div>
        <div class="item-desc" style="font-size:12px;color:#8a7d60;">未启用时会显示 "${GAME.config.llm.fallbackText}"</div>
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

  // ======== Voice 长按处理 ========
  function bindVoiceButton() {
    const btn = document.getElementById('btn-voice');
    let pressing = false;

    const start = (e) => {
      if (pressing) return;
      if (e.cancelable) e.preventDefault();
      pressing = true;
      btn.classList.add('pressing');
      GAME.Cat.setListening(true);
    };
    const end = (e) => {
      if (!pressing) return;
      if (e && e.cancelable) e.preventDefault();
      pressing = false;
      btn.classList.remove('pressing');
      // 仅在用户确有长按时触发
      handleVoiceEnd();
    };

    // 触摸设备
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end,   { passive: false });
    btn.addEventListener('touchcancel', end, { passive: false });

    // 桌面端鼠标
    btn.addEventListener('mousedown', start);
    window.addEventListener('mouseup', end);
    btn.addEventListener('mouseleave', (e) => {
      // 鼠标移出按钮但仍按着，仍等 mouseup 才结束；不在这里 end
    });
  }

  // ======== 初始化 ========
  function init() {
    try {
      if (!GAME.config) throw new Error('配置加载失败');

      GAME.State.init();
      GAME.UI.init();
      GAME.Audio.init();
      GAME.Cat.init({
        onHit: (area, pos) => handleHitArea(area, pos)
      });

      // 按钮
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

  // 调试开关：在控制台 window.GAME.DEBUG_HITAREAS = true 可看到点击框
  window.GAME.redraw = () => window.GAME.Cat.draw();
})();
