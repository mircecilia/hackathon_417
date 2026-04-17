/* ui.js —— 弹窗、Toast、对话框更新 */
(function () {
  const UI = {
    $mask: null,
    $title: null,
    $body: null,
    $footer: null,
    $close: null,
    $toast: null,
    $dialogueText: null,
    _toastTimer: null,

    init() {
      this.$mask   = document.getElementById('modalMask');
      this.$title  = document.getElementById('modalTitle');
      this.$body   = document.getElementById('modalBody');
      this.$footer = document.getElementById('modalFooter');
      this.$close  = document.getElementById('modalClose');
      this.$toast  = document.getElementById('toast');
      this.$dialogueText = document.getElementById('dialogueText');

      this.$close.addEventListener('click', () => this.closeModal());
      this.$mask.addEventListener('click', (e) => {
        if (e.target === this.$mask) this.closeModal();
      });
    },

    setDialogue(text) {
      this.$dialogueText.textContent = text;
    },

    openModal({ title, bodyHTML, footerHTML }) {
      this.$title.textContent = title || '';
      this.$body.innerHTML = bodyHTML || '';
      this.$footer.innerHTML = footerHTML || '';
      this.$mask.classList.remove('hidden');
    },

    closeModal() {
      this.$mask.classList.add('hidden');
      this.$body.innerHTML = '';
      this.$footer.innerHTML = '';
    },

    toast(msg, duration) {
      duration = duration || 1500;
      this.$toast.textContent = msg;
      this.$toast.classList.remove('hidden');
      if (this._toastTimer) clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => {
        this.$toast.classList.add('hidden');
      }, duration);
    },

    showError(msg) {
      const banner = document.getElementById('errorBanner');
      banner.textContent = msg || '哎呀，出错了，请重启试试吧~';
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 3000);
    }
  };

  window.GAME.UI = UI;
})();
