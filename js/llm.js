/* llm.js —— LLM 调用封装，失败/未配置时返回占位 */
(function () {
  const LLM = {
    /**
     * 请求 LLM 生成猫的心理活动
     * @param {string} action   用户行为：对话/投喂/互动/触摸头部 等
     * @param {number} mood     当前好感度（0~100）
     * @returns {Promise<string>} 不超过15字的中文短句
     */
    async think(action, mood) {
      const cfg = window.GAME.config.llm;
      const userCfg = window.GAME.State.getLLMConfig();
      const enabled = userCfg.enabled && userCfg.endpoint;
      if (!enabled) return cfg.fallbackText;

      const prompt = cfg.systemPrompt
        .replace('{action}', action)
        .replace('{mood}', String(mood));

      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(userCfg.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(userCfg.apiKey ? { 'Authorization': 'Bearer ' + userCfg.apiKey } : {})
          },
          body: JSON.stringify({
            prompt: prompt,
            action: action,
            mood: mood
          }),
          signal: controller.signal
        });
        clearTimeout(t);

        if (!res.ok) throw new Error('LLM HTTP ' + res.status);
        const data = await res.json();

        // 尝试多种可能的返回结构
        let text = '';
        if (typeof data === 'string') text = data;
        else if (data.text) text = data.text;
        else if (data.data && data.data.text) text = data.data.text;
        else if (data.choices && data.choices[0]) {
          const c = data.choices[0];
          text = c.message ? c.message.content : (c.text || '');
          // 可能是 JSON 字符串
          try {
            const inner = JSON.parse(text);
            if (inner && inner.text) text = inner.text;
          } catch (_) {}
        }

        text = (text || '').trim();
        if (!text) return cfg.fallbackText;
        if (text.length > 30) text = text.slice(0, 30);
        return text;
      } catch (e) {
        console.warn('[llm] 调用失败', e);
        return cfg.fallbackText;
      }
    }
  };

  window.GAME.LLM = LLM;
})();
