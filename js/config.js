/* config.js —— 读取内联 JSON 配置 */
window.GAME = window.GAME || {};

(function () {
  try {
    const el = document.getElementById('gameConfig');
    window.GAME.config = JSON.parse(el.textContent);
  } catch (e) {
    console.error('[config] 配置解析失败', e);
    window.GAME.config = null;
  }
})();
