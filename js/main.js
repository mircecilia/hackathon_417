/* main.js: coordinate UI, cat reactions, shop flow, and combo logic */
(function () {
  const GAME = window.GAME;

  const lastCallAt = {};
  const POSITIVE_ACTION_KEYS = new Set([
    'voice',
    'touch:head',
    'touch:body',
    'feed:fish',
    'feed:milktea',
    'feed:catstrip',
    'interact:tease',
    'interact:brush',
    'interact:walk',
    'interact:laser'
  ]);

  const COMBO_MESSAGES = {
    voiceHead: '\u542c\u5b8c\u518d\u6478\u5934\uff0c\u5012\u4e5f\u987a\u5fc3',
    teaseFish: '\u73a9\u5b8c\u6709\u5956\u52b1\uff0c\u4eca\u5929\u539f\u8c05\u4f60',
    brushBody: '\u68b3\u987a\u4e86\u6bdb\uff0c\u6478\u7740\u66f4\u8212\u670d',
    poopPositive: '\u73af\u5883\u5e72\u51c0\u4e86\uff0c\u5fc3\u60c5\u4e5f\u987a\u4e9b',
    walkVoice: '\u6563\u5b8c\u6b65\uff0c\u66f4\u613f\u610f\u542c\u4f60\u8bb2\u8bdd',
    catnipTease: '\u6b63\u4e0a\u5934\u7684\u65f6\u5019\u6700\u60f3\u73a9',
    lemonTail: '\u4f60\u662f\u6545\u610f\u627e\u4e8b\u5417',
    mirrorLaser: '\u521a\u7167\u5b8c\u955c\u5b50\u53c8\u62ff\u7ea2\u70b9\u6643\uff0c\u70e6',
    teaseRepeat2: '\u73a9\u4e00\u4f1a\u513f\u884c\uff0c\u522b\u8001\u6643',
    teaseRepeat3: '\u73a9\u591f\u4e86\uff0c\u4e0d\u60f3\u518d\u8ffd\u4e86',
    tailRepeat: '\u5c3e\u5df4\u4e0d\u662f\u7ed9\u4f60\u4e00\u76f4\u78b0\u7684'
  };

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
    ring.style.left = clientX - rect.left + 'px';
    ring.style.top = clientY - rect.top + 'px';
    ring.style.width = '40px';
    ring.style.height = '40px';
    stage.appendChild(ring);
    setTimeout(() => ring.remove(), 500);
  }

  function iconHTML(iconId) {
    return GAME.Icons.render(iconId);
  }

  function playHissReaction() {
    GAME.Cat.setOpenMouth(true);
    GAME.Audio.duckStart();
    GAME.Audio.playHiss(() => {
      GAME.Cat.setOpenMouth(false);
      GAME.Audio.duckEnd();
    });
  }

  function showComboToasts(messages) {
    (messages || []).filter(Boolean).forEach((message, index) => {
      setTimeout(() => GAME.UI.toast(message), index * 180);
    });
  }

  function findRecentAction(type, id, withinMs) {
    const actions = GAME.State.getRecentActions(withinMs);
    for (let i = actions.length - 1; i >= 0; i--) {
      const item = actions[i];
      if (item.type === type && item.id === id) return item;
    }
    return null;
  }

  function isPositiveAction(type, id) {
    const key = type === 'voice' ? 'voice' : type + ':' + id;
    return POSITIVE_ACTION_KEYS.has(key);
  }

  function resolveComboBonus(ctx) {
    const result = {
      affinityDelta: 0,
      messages: [],
      forceHiss: false,
      consume: null
    };

    let negativeMatch = null;
    let positiveMatch = null;
    let repeatMatch = null;

    if (ctx.type === 'touch' && ctx.id === 'tail') {
      const lemon = findRecentAction('feed', 'lemon', 15000);
      if (lemon) {
        negativeMatch = { key: 'lemonTail', delta: -5 };
        result.forceHiss = true;
      }
    } else if (ctx.type === 'interact' && ctx.id === 'laser') {
      const mirror = findRecentAction('interact', 'mirror', 15000);
      if (mirror) negativeMatch = { key: 'mirrorLaser', delta: -2 };
    }

    if (ctx.type === 'touch' && ctx.id === 'head') {
      const voice = findRecentAction('voice', 'voice', 10000);
      if (voice) positiveMatch = { key: 'voiceHead', delta: 2 };
    } else if (ctx.type === 'feed' && ctx.id === 'fish') {
      const tease = findRecentAction('interact', 'tease', 15000);
      if (tease) positiveMatch = { key: 'teaseFish', delta: 3 };
    } else if (ctx.type === 'touch' && ctx.id === 'body') {
      const brush = findRecentAction('interact', 'brush', 12000);
      if (brush) positiveMatch = { key: 'brushBody', delta: 2 };
    } else if (ctx.type === 'voice' && ctx.id === 'voice') {
      const walk = findRecentAction('interact', 'walk', 20000);
      if (walk) positiveMatch = { key: 'walkVoice', delta: 1 };
    } else if (ctx.type === 'interact' && ctx.id === 'tease') {
      const catnip = findRecentAction('feed', 'catnip', 20000);
      if (catnip) positiveMatch = { key: 'catnipTease', delta: 2 };
    }

    if (isPositiveAction(ctx.type, ctx.id)) {
      const poop = findRecentAction('interact', 'poop', 20000);
      if (poop && !positiveMatch) {
        positiveMatch = {
          key: 'poopPositive',
          delta: 1,
          consume: { type: 'interact', id: 'poop', withinMs: 20000 }
        };
      }
    }

    if (ctx.type === 'interact' && ctx.id === 'tease') {
      const teaseCount = GAME.State.countRecentAction('interact', 'tease', 30000);
      if (teaseCount === 1) {
        repeatMatch = { key: 'teaseRepeat2', delta: -1 };
      } else if (teaseCount >= 2) {
        repeatMatch = { key: 'teaseRepeat3', delta: -3 };
      }
    } else if (ctx.type === 'touch' && ctx.id === 'tail') {
      const tailCount = GAME.State.countRecentAction('touch', 'tail', 20000);
      if (tailCount >= 1) repeatMatch = { key: 'tailRepeat', delta: -2 };
    }

    if (negativeMatch) {
      result.affinityDelta += negativeMatch.delta;
      result.messages.push(COMBO_MESSAGES[negativeMatch.key]);
    }
    if (positiveMatch) {
      result.affinityDelta += positiveMatch.delta;
      result.messages.push(COMBO_MESSAGES[positiveMatch.key]);
      if (positiveMatch.consume) result.consume = positiveMatch.consume;
    }
    if (repeatMatch) {
      result.affinityDelta += repeatMatch.delta;
      result.messages.push(COMBO_MESSAGES[repeatMatch.key]);
    }

    return result;
  }

  function applyComboResult(result) {
    if (!result) return;
    if (result.affinityDelta) {
      GAME.State.addAffinity(result.affinityDelta);
      GAME.Audio.updateBgmByMood(GAME.State.getAffinity());
    }
    if (result.consume) {
      GAME.State.consumeRecentAction(result.consume.type, result.consume.id, result.consume.withinMs);
    }
    showComboToasts(result.messages);
  }

  function calcPrice(item, quantity) {
    if (!item.discount || item.discount.rule !== 'halfEvery2') {
      return item.price * quantity;
    }
    const unit = item.discount.unitPrice || item.price;
    const half = item.discount.halfPrice;
    const bought = GAME.State.getPurchaseCount(item.id);
    let total = 0;
    for (let i = 0; i < quantity; i++) {
      const idx = bought + i + 1;
      total += idx % 2 === 0 ? half : unit;
    }
    return total;
  }

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

  async function handleHitArea(area, pos) {
    if (!cooldown('hit:' + area.id)) return;
    if (GAME.Cat.isLocked()) return;

    const mood = GAME.State.getAffinity();
    const action = '\u89e6\u6478' + area.name;
    if (pos) {
      const rect = pos.rect;
      showTapRing(rect.left + pos.x, rect.top + pos.y);
    }

    try {
      const text = await GAME.LLM.think(action, mood, area.corpusKey || ('touch:' + area.id));
      GAME.UI.setDialogue(text);
    } catch (e) {
      GAME.UI.setDialogue('\u55b5~');
    }

    const combo = resolveComboBonus({ type: 'touch', id: area.id, mood: GAME.State.getAffinity() });
    applyComboResult(combo);

    const hissCfg = GAME.config.hiss || {};
    const hissThreshold = hissCfg.triggerAffinityMax != null ? hissCfg.triggerAffinityMax : 19;
    if ((hissCfg.enabled && GAME.State.getAffinity() <= hissThreshold) || combo.forceHiss) {
      GAME.State.recordAction('touch', area.id);
      playHissReaction();
      return;
    }

    const p = (GAME.config.animations && GAME.config.animations.touchProbabilities) || {};
    const pText = p.text != null ? p.text : 0.8;
    const pLick = p.lick != null ? p.lick : 0.1;
    const r = Math.random();

    if (r < pText) {
      GAME.State.recordAction('touch', area.id);
      return;
    }
    if (r < pText + pLick) {
      GAME.Cat.playAnimation('lick');
    } else {
      GAME.Cat.playAnimation('stretch');
    }
    GAME.State.recordAction('touch', area.id);
  }

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
      const text = await GAME.LLM.think('\u5bf9\u8bdd', mood, 'voice');
      GAME.UI.setDialogue(text);
    } catch (e) {
      GAME.UI.setDialogue('\u55b5~');
    }

    const combo = resolveComboBonus({ type: 'voice', id: 'voice', mood: GAME.State.getAffinity() });
    applyComboResult(combo);
    GAME.State.recordAction('voice', 'voice');
  }

  async function handleFeed(food) {
    if (!cooldown('feed')) return;
    if (GAME.Cat.isLocked()) {
      GAME.UI.toast('\u732b\u54aa\u6b63\u5728\u5fd9\uff0c\u7a0d\u7b49~');
      return;
    }
    if (GAME.State.getItemCount(food.id) <= 0) {
      alert('\u9053\u5177\u4e0d\u8db3\uff0c\u8bf7\u524d\u5f80\u5546\u5e97\u8d2d\u4e70');
      return;
    }

    GAME.State.useItem(food.id, 1);
    GAME.State.addAffinity(food.affinity || 0);
    GAME.Audio.updateBgmByMood(GAME.State.getAffinity());
    GAME.UI.closeModal();

    const mood = GAME.State.getAffinity();
    try {
      const text = await GAME.LLM.think('\u6295\u5582' + food.name, mood, food.corpusKey || ('feed:' + food.id));
      GAME.UI.setDialogue(text);
    } catch (e) {
      GAME.UI.setDialogue('\u55b5~');
    }
    GAME.UI.toast('\u6295\u5582\u6210\u529f\uff1a' + food.name);

    const combo = resolveComboBonus({ type: 'feed', id: food.id, mood: GAME.State.getAffinity() });
    applyComboResult(combo);
    GAME.State.recordAction('feed', food.id);

    if (food.id === 'fish') {
      GAME.Cat.playAnimation('fish');
    }
  }

  async function handleInteraction(act) {
    if (!cooldown('interact')) return;
    if (GAME.Cat.isLocked()) {
      GAME.UI.toast('\u732b\u54aa\u6b63\u5728\u5fd9\uff0c\u7a0d\u7b49~');
      return;
    }
    if (act.requireItem && GAME.State.getItemCount(act.requireItem) <= 0) {
      alert('\u9053\u5177\u4e0d\u8db3\uff0c\u8bf7\u524d\u5f80\u5546\u5e97\u8d2d\u4e70');
      return;
    }

    const cdKey = 'interactCD:' + (act.requireItem || act.id);
    const remain = GAME.State.getCooldownRemain(cdKey);
    if (remain > 0) {
      alert('\u4f60\u70b9\u5f97\u592a\u5feb\u5566\uff0c' + Math.ceil(remain / 1000) + '\u79d2\u540e\u518d\u8bd5\u8bd5\u5427');
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
    } catch (e) {
      GAME.UI.setDialogue('\u55b5~');
    }
    GAME.UI.toast(act.name + '\u6210\u529f');

    const combo = resolveComboBonus({ type: 'interact', id: act.id, mood: GAME.State.getAffinity() });
    applyComboResult(combo);
    GAME.State.recordAction('interact', act.id);
  }

  function openBuyConfirm(item) {
    const coins = GAME.State.getCoins();
    const maxQ = maxAffordable(item);
    if (maxQ <= 0) {
      GAME.UI.toast('\u91d1\u5e01\u4e0d\u8db3');
      return;
    }

    const tagNote = item.discount
      ? `<div class="discount-note">\u4f18\u60e0\uff1a${item.tag || '\u7b2c\u4e8c\u676f\u534a\u4ef7'}</div>`
      : '';

    const html = `
      <div class="buy-head">
        <div class="buy-icon">${iconHTML(item.iconId)}</div>
        <div class="buy-name">${item.name}</div>
      </div>
      ${tagNote}
      <div class="buy-qty">
        <button class="qty-btn" data-act="dec" aria-label="\u51cf\u5c11">-</button>
        <input type="range" id="buyRange" min="1" max="${maxQ}" value="1" step="1"/>
        <button class="qty-btn" data-act="inc" aria-label="\u589e\u52a0">+</button>
      </div>
      <div class="buy-info">
        <span>\u6570\u91cf\uff1a<span id="buyQty">1</span> / ${maxQ}</span>
        <span>\u603b\u4ef7\uff1a<span id="buyTotal">${calcPrice(item, 1)}</span></span>
      </div>
      <div class="buy-coins">\u5f53\u524d\u91d1\u5e01\uff1a${coins}</div>
    `;

    const footer = `
      <div class="buy-footer">
        <button class="item-btn btn-cancel" id="buyCancel">\u53d6\u6d88</button>
        <button class="item-btn btn-confirm" id="buyOk">\u786e\u8ba4</button>
      </div>
    `;

    GAME.UI.openModal({
      title: '\u8d2d\u4e70\u786e\u8ba4',
      bodyHTML: html,
      footerHTML: footer,
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
      GAME.UI.closeModal();
      openShopModal();
    });
    document.getElementById('buyOk').addEventListener('click', () => {
      doBuy(item, Number(range.value));
    });
  }

  function doBuy(item, q) {
    if (!cooldown('buy')) return;
    const total = calcPrice(item, q);
    if (GAME.State.getCoins() < total) {
      GAME.UI.toast('\u91d1\u5e01\u4e0d\u8db3');
      return;
    }

    GAME.State.addCoins(-total);
    GAME.State.addItem(item.id, q);
    GAME.State.addPurchaseCount(item.id, q);
    GAME.UI.toast(`\u8d2d\u4e70\u6210\u529f\uff1a${item.name} x${q}`);
    GAME.UI.closeModal();
    openShopModal();
  }

  function renderShopSection(title, items) {
    let html = `<div class="shop-section-title">${title}</div>`;
    items.forEach((it) => {
      const owned = GAME.State.getItemCount(it.id);
      const canAfford = maxAffordable(it) >= 1;
      const tag = it.tag ? `<span class="tag-discount">${it.tag}</span>` : '';
      html += `
        <div class="item-row ${canAfford ? '' : 'disabled'}" data-id="${it.id}">
          <div class="item-icon">${iconHTML(it.iconId)}</div>
          <div class="item-info">
            <div class="item-name">${it.name}${owned > 0 ? '<span class="owned-badge">x' + owned + '</span>' : ''} ${tag}</div>
            <div class="item-desc">\u4ef7\u683c ${it.price}</div>
          </div>
          <button class="item-btn" data-act="buy" data-id="${it.id}" ${canAfford ? '' : 'disabled'}>\u8d2d\u4e70</button>
        </div>`;
    });
    return html;
  }

  function openShopModal() {
    const shop = GAME.config.shop;
    const coins = GAME.State.getCoins();
    const foods = shop.filter((x) => x.type === 'food').slice().sort((a, b) => a.price - b.price);
    const tools = shop.filter((x) => x.type === 'tool').slice().sort((a, b) => a.price - b.price);

    const body =
      `<div class="coins-bar">\u91d1\u5e01 \u5f53\u524d\u91d1\u5e01 ${coins}</div>` +
      renderShopSection('\u98df\u7269', foods) +
      renderShopSection('\u9053\u5177', tools);

    GAME.UI.openModal({ title: '\u5546\u5e97', bodyHTML: body });
    const bodyEl = document.getElementById('modalBody');
    bodyEl.querySelectorAll('button[data-act="buy"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.hasAttribute('disabled')) {
          GAME.UI.toast('\u91d1\u5e01\u4e0d\u8db3');
          return;
        }
        const id = btn.getAttribute('data-id');
        const item = shop.find((x) => x.id === id);
        if (!item) return;
        if (maxAffordable(item) <= 0) {
          GAME.UI.toast('\u91d1\u5e01\u4e0d\u8db3');
          return;
        }
        openBuyConfirm(item);
      });
    });
  }

  function openFeedModal() {
    const foods = GAME.config.foods.slice();
    let html = '';
    foods.forEach((food) => {
      const owned = GAME.State.getItemCount(food.id);
      const disabled = owned <= 0;
      html += `
        <div class="item-row ${disabled ? 'disabled' : ''}" data-id="${food.id}">
          <div class="item-icon">${iconHTML(food.iconId)}</div>
          <div class="item-info">
            <div class="item-name">${food.name}</div>
            <div class="item-desc">\u62e5\u6709\uff1a${owned}</div>
          </div>
          <button class="item-btn" data-act="feed" data-id="${food.id}" ${disabled ? 'disabled' : ''}>\u6295\u5582</button>
        </div>`;
    });
    if (!html) html = '<div class="empty-text">\u6682\u65e0\u53ef\u6295\u5582\u7684\u98df\u7269</div>';

    GAME.UI.openModal({ title: '\u6295\u5582', bodyHTML: html });
    const body = document.getElementById('modalBody');
    body.querySelectorAll('button[data-act="feed"]').forEach((btn) => {
      if (btn.hasAttribute('disabled')) return;
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const food = foods.find((x) => x.id === id);
        if (food) handleFeed(food);
      });
    });
  }

  let interactRefreshTimer = null;

  function renderInteractList() {
    GAME.State.clearExpiredCooldowns();
    const acts = GAME.config.interactions.slice();
    let html = '';
    let anyOnCooldown = false;

    acts.forEach((act) => {
      const itemShop = act.requireItem ? GAME.config.shop.find((x) => x.id === act.requireItem) : null;
      const need = act.requireItem ? GAME.State.getItemCount(act.requireItem) : 999;
      const cdKey = 'interactCD:' + (act.requireItem || act.id);
      const cdRemain = GAME.State.getCooldownRemain(cdKey);
      if (cdRemain > 0) anyOnCooldown = true;

      const missingItem = act.requireItem && need <= 0;
      const disabled = missingItem || cdRemain > 0;

      let desc;
      if (cdRemain > 0) {
        desc = `\u51b7\u5374\u4e2d\uff1a${Math.ceil(cdRemain / 1000)} \u79d2`;
      } else if (act.requireItem) {
        desc = `\u9700\u8981\uff1a${itemShop ? itemShop.name : act.requireItem}\uff08\u62e5\u6709 ${need}\uff09`;
      } else {
        desc = `\u5e38\u9a7b\u884c\u4e3a \u00b7 \u51b7\u5374 ${Math.round((act.cooldownMs || GAME.config.walkCooldownMs) / 1000)}s`;
      }

      html += `
        <div class="item-row ${disabled ? 'disabled' : ''} ${cdRemain > 0 ? 'on-cooldown' : ''}" data-id="${act.id}">
          ${cdRemain > 0 ? '<div class="cooldown-mask"></div>' : ''}
          <div class="item-icon">${iconHTML(act.iconId)}</div>
          <div class="item-info">
            <div class="item-name">${act.name}</div>
            <div class="item-desc">${desc}</div>
          </div>
          <button class="item-btn" data-act="interact" data-id="${act.id}" ${disabled ? 'disabled' : ''}>\u6267\u884c</button>
        </div>`;
    });

    if (!html) html = '<div class="empty-text">\u6682\u65e0\u53ef\u6267\u884c\u7684\u4e92\u52a8</div>';

    const body = document.getElementById('modalBody');
    if (!body) return;
    body.innerHTML = html;
    body.querySelectorAll('button[data-act="interact"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.hasAttribute('disabled')) return;
        const id = btn.getAttribute('data-id');
        const act = GAME.config.interactions.find((x) => x.id === id);
        if (act) handleInteraction(act);
      });
    });

    if (interactRefreshTimer) clearInterval(interactRefreshTimer);
    if (anyOnCooldown) {
      interactRefreshTimer = setInterval(() => {
        const mask = document.getElementById('modalMask');
        if (!mask || mask.classList.contains('hidden')) {
          clearInterval(interactRefreshTimer);
          interactRefreshTimer = null;
          return;
        }
        renderInteractList();
      }, 500);
    }
  }

  function openInteractModal() {
    GAME.UI.openModal({ title: '\u4e92\u52a8', bodyHTML: '' });
    renderInteractList();
  }

  function openSettingsModal() {
    const s = GAME.State.getLLMConfig();
    const html = `
      <div class="settings-row">
        <div class="toggle-row">
          <input type="checkbox" id="llmEnable" ${s.enabled ? 'checked' : ''}/>
          <label for="llmEnable">\u542f\u7528 LLM \u8d5b\u535a\u732b\u5a18\u788e\u788e\u5ff5</label>
        </div>
        <div class="item-desc" style="font-size:12px;color:#8a7d60;">
          \u5173\u95ed\u65f6\u5c06\u4f7f\u7528\u672c\u5730\u8bed\u6599\u5e93\u751f\u6210\u56de\u5e94\uff0c\u6253\u5f00\u540e\u4f1a\u4f7f\u7528\u4f60\u586b\u5199\u7684\u6a21\u578b\u63a5\u53e3\u3002\u63a8\u8350\u8c03\u8bd5\u9636\u6bb5\u5148\u5173\u95ed\u3002
        </div>
      </div>
      <div class="settings-row">
        <label for="llmEndpoint">API Endpoint</label>
        <input type="text" id="llmEndpoint" placeholder="https://..." value="${s.endpoint || ''}"/>
      </div>
      <div class="settings-row">
        <label for="llmKey">API Key\uff08\u9009\u586b\uff09</label>
        <input type="password" id="llmKey" placeholder="sk-..." value="${s.apiKey || ''}"/>
      </div>
      <div class="settings-row">
        <div class="item-desc">\u5f53\u524d\u597d\u611f\u5ea6\uff1a${GAME.State.getAffinity()} / 100</div>
        <div class="item-desc">\u5f53\u524d\u91d1\u5e01\uff1a${GAME.State.getCoins()} \u91d1\u5e01</div>
      </div>`;

    const footer = `
      <div style="display:flex; gap:10px;">
        <button class="item-btn" id="saveSettings" style="flex:1;">\u4fdd\u5b58</button>
        <button class="item-btn" id="resetAll" style="flex:1;background:#d9534f;color:#fff;">\u91cd\u7f6e\u5b58\u6863</button>
      </div>`;

    GAME.UI.openModal({ title: '\u8bbe\u7f6e', bodyHTML: html, footerHTML: footer });

    document.getElementById('saveSettings').addEventListener('click', () => {
      GAME.State.setLLMConfig({
        enabled: document.getElementById('llmEnable').checked,
        endpoint: document.getElementById('llmEndpoint').value.trim(),
        apiKey: document.getElementById('llmKey').value.trim()
      });
      GAME.UI.toast('\u8bbe\u7f6e\u5df2\u4fdd\u5b58');
      GAME.UI.closeModal();
    });

    document.getElementById('resetAll').addEventListener('click', () => {
      if (!confirm('\u786e\u8ba4\u8981\u6e05\u7a7a\u5f53\u524d\u6240\u6709\u5b58\u6863\u5417\uff1f')) return;
      localStorage.clear();
      GAME.State.init();
      GAME.UI.closeModal();
      GAME.UI.setDialogue('\u55b5~');
      GAME.UI.toast('\u5b58\u6863\u5df2\u91cd\u7f6e');
    });
  }

  function bindVoiceButton() {
    const btn = document.getElementById('btn-voice');
    let pressing = false;

    const start = (e) => {
      if (pressing) return;
      if (GAME.Cat.isLocked() && !GAME.Cat.isListening) return;
      if (e.cancelable) e.preventDefault();
      pressing = true;
      btn.classList.add('pressing');
      GAME.Cat.setListening(true);
      GAME.Audio.duckStart();
    };

    const end = (e) => {
      if (!pressing) return;
      if (e && e.cancelable) e.preventDefault();
      pressing = false;
      btn.classList.remove('pressing');
      handleVoiceEnd();
    };

    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('touchcancel', end, { passive: false });
    btn.addEventListener('mousedown', start);
    window.addEventListener('mouseup', end);
  }

  function init() {
    try {
      if (!GAME.config) throw new Error('\u914d\u7f6e\u52a0\u8f7d\u5931\u8d25');

      GAME.State.init();
      GAME.State.clearExpiredCooldowns();
      GAME.State.clearExpiredRecentActions();
      GAME.UI.init();
      GAME.Audio.init();
      GAME.Cat.init({
        onHit: (area, pos) => handleHitArea(area, pos)
      });

      const injectIcon = (id, iconId) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<span class="btn-svg-wrap">' + GAME.Icons.render(iconId) + '</span>';
      };

      injectIcon('btn-setting', 'setting');
      injectIcon('btn-shop', 'shop');
      injectIcon('btn-voice', 'voice');

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
      GAME.UI.setDialogue('\u55b5~');
    } catch (e) {
      console.error(e);
      GAME.UI.showError('\u54ce\u5440\uff0c\u51fa\u9519\u4e86\uff0c\u8bf7\u91cd\u542f\u8bd5\u8bd5\u5427~');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GAME.redraw = () => window.GAME.Cat.draw();
})();
