/* icons.js —— 为所有商品/道具绘制的像素风 SVG 图标集合 */
/* 统一 16×16 像素网格、viewBox="0 0 16 16"、shape-rendering="crispEdges" 保证像素边界清晰 */
window.GAME = window.GAME || {};
(function () {
  const wrap = (inner, bg) => (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges" width="100%" height="100%">' +
    (bg ? `<rect width="16" height="16" fill="${bg}"/>` : '') +
    inner + '</svg>'
  );

  const ICONS = {
    /* ========== 食物 ========== */
    // 小鱼干：一条橙红色小鱼，带骨头纹理
    fish: wrap(
      // 身体
      '<rect x="3" y="6" width="9" height="4" fill="#e06a3f"/>' +
      '<rect x="3" y="7" width="9" height="2" fill="#f0895b"/>' +
      // 侧线
      '<rect x="4" y="8" width="7" height="1" fill="#c75729"/>' +
      // 尾鳍
      '<rect x="12" y="5" width="1" height="6" fill="#e06a3f"/>' +
      '<rect x="13" y="4" width="1" height="8" fill="#e06a3f"/>' +
      '<rect x="14" y="3" width="1" height="10" fill="#c75729"/>' +
      // 眼
      '<rect x="4" y="7" width="1" height="1" fill="#2b2217"/>' +
      // 嘴
      '<rect x="2" y="8" width="1" height="1" fill="#c75729"/>'
    ),

    // 三分糖红豆奶茶：杯子 + 珍珠
    milktea: wrap(
      // 杯身
      '<rect x="4" y="3" width="8" height="1" fill="#2b2217"/>' +        // 杯口
      '<rect x="4" y="4" width="8" height="9" fill="#f7e3c4"/>' +        // 奶茶液体底色
      '<rect x="4" y="9" width="8" height="4" fill="#b47846"/>' +        // 奶茶红豆色
      // 红豆颗粒
      '<rect x="5" y="10" width="1" height="1" fill="#6b3617"/>' +
      '<rect x="8" y="11" width="1" height="1" fill="#6b3617"/>' +
      '<rect x="10" y="10" width="1" height="1" fill="#6b3617"/>' +
      '<rect x="6" y="12" width="1" height="1" fill="#6b3617"/>' +
      // 杯壁描边
      '<rect x="3" y="4" width="1" height="9" fill="#2b2217"/>' +
      '<rect x="12" y="4" width="1" height="9" fill="#2b2217"/>' +
      '<rect x="4" y="13" width="8" height="1" fill="#2b2217"/>' +
      // 吸管
      '<rect x="9" y="1" width="2" height="4" fill="#e86666"/>' +
      '<rect x="10" y="1" width="1" height="4" fill="#b84242"/>'
    ),

    // 猫条：一根长条包装袋
    catstrip: wrap(
      // 包装袋身
      '<rect x="2" y="6" width="12" height="4" fill="#f2c14e"/>' +
      '<rect x="2" y="6" width="12" height="1" fill="#ffdd7a"/>' +
      '<rect x="2" y="9" width="12" height="1" fill="#b38836"/>' +
      // 边缘齿形封口
      '<rect x="1" y="6" width="1" height="1" fill="#b38836"/>' +
      '<rect x="1" y="8" width="1" height="1" fill="#b38836"/>' +
      '<rect x="1" y="7" width="1" height="1" fill="#f2c14e"/>' +
      '<rect x="1" y="9" width="1" height="1" fill="#f2c14e"/>' +
      '<rect x="14" y="6" width="1" height="1" fill="#b38836"/>' +
      '<rect x="14" y="8" width="1" height="1" fill="#b38836"/>' +
      '<rect x="14" y="7" width="1" height="1" fill="#f2c14e"/>' +
      '<rect x="14" y="9" width="1" height="1" fill="#f2c14e"/>' +
      // 标签小方块
      '<rect x="5" y="7" width="6" height="2" fill="#e54747"/>' +
      '<rect x="6" y="7" width="1" height="1" fill="#fff2a8"/>' +
      '<rect x="9" y="8" width="1" height="1" fill="#fff2a8"/>'
    ),

    // 猫薄荷：一束绿色叶子 + 紫色小花
    catnip: wrap(
      // 茎
      '<rect x="7" y="6" width="2" height="8" fill="#3f7a3f"/>' +
      // 下部叶子
      '<rect x="3" y="10" width="4" height="2" fill="#5fa55f"/>' +
      '<rect x="2" y="11" width="2" height="1" fill="#3f7a3f"/>' +
      '<rect x="9" y="10" width="4" height="2" fill="#5fa55f"/>' +
      '<rect x="12" y="11" width="2" height="1" fill="#3f7a3f"/>' +
      // 上部叶子
      '<rect x="4" y="7" width="3" height="2" fill="#74bf74"/>' +
      '<rect x="9" y="7" width="3" height="2" fill="#74bf74"/>' +
      // 紫色花
      '<rect x="6" y="3" width="4" height="2" fill="#a371d4"/>' +
      '<rect x="7" y="2" width="2" height="1" fill="#c89ceb"/>' +
      '<rect x="5" y="4" width="1" height="1" fill="#c89ceb"/>' +
      '<rect x="10" y="4" width="1" height="1" fill="#c89ceb"/>' +
      '<rect x="7" y="5" width="2" height="1" fill="#6f3ea8"/>'
    ),

    // 柠檬片：亮黄色圆形切片 + 果肉放射纹
    lemon: wrap(
      // 外果皮圆
      '<rect x="5" y="2" width="6" height="1" fill="#e3c11f"/>' +
      '<rect x="3" y="3" width="2" height="2" fill="#e3c11f"/>' +
      '<rect x="11" y="3" width="2" height="2" fill="#e3c11f"/>' +
      '<rect x="2" y="5" width="1" height="6" fill="#e3c11f"/>' +
      '<rect x="13" y="5" width="1" height="6" fill="#e3c11f"/>' +
      '<rect x="3" y="11" width="2" height="2" fill="#e3c11f"/>' +
      '<rect x="11" y="11" width="2" height="2" fill="#e3c11f"/>' +
      '<rect x="5" y="13" width="6" height="1" fill="#e3c11f"/>' +
      // 果肉
      '<rect x="5" y="3" width="6" height="10" fill="#faeb7c"/>' +
      '<rect x="3" y="5" width="10" height="6" fill="#faeb7c"/>' +
      '<rect x="4" y="4" width="8" height="8" fill="#faeb7c"/>' +
      // 果肉纹路（分瓣线）
      '<rect x="8" y="4" width="0.5" height="8" fill="#e3c11f"/>' +
      '<rect x="4" y="8" width="8" height="0.5" fill="#e3c11f"/>' +
      '<rect x="5" y="5" width="1" height="1" fill="#e3c11f"/>' +
      '<rect x="10" y="5" width="1" height="1" fill="#e3c11f"/>' +
      '<rect x="5" y="10" width="1" height="1" fill="#e3c11f"/>' +
      '<rect x="10" y="10" width="1" height="1" fill="#e3c11f"/>' +
      // 中心亮点
      '<rect x="7" y="7" width="2" height="2" fill="#fffcde"/>'
    ),

    /* ========== 道具 ========== */
    // 铲子：木柄 + 金属铲头
    shovel: wrap(
      // 木柄
      '<rect x="9" y="2" width="2" height="8" fill="#a66e36"/>' +
      '<rect x="9" y="2" width="1" height="8" fill="#c98a4e"/>' +
      // 握把横木
      '<rect x="8" y="2" width="4" height="1" fill="#8a5820"/>' +
      // 铲头金属
      '<rect x="3" y="9" width="8" height="5" fill="#b0b0b8"/>' +
      '<rect x="3" y="9" width="8" height="1" fill="#dcdce4"/>' +
      '<rect x="3" y="13" width="8" height="1" fill="#70707a"/>' +
      // 铲头弧形边
      '<rect x="2" y="10" width="1" height="3" fill="#b0b0b8"/>' +
      '<rect x="11" y="10" width="1" height="3" fill="#b0b0b8"/>'
    ),

    // 逗猫棒：棒 + 彩色羽毛 + 绳
    teaser: wrap(
      // 棒子
      '<rect x="11" y="10" width="4" height="1" fill="#8a5820"/>' +
      '<rect x="11" y="11" width="4" height="1" fill="#a66e36"/>' +
      // 握把
      '<rect x="14" y="9" width="1" height="4" fill="#3f3f3f"/>' +
      // 绳
      '<rect x="10" y="9" width="1" height="1" fill="#ffffff"/>' +
      '<rect x="9" y="8" width="1" height="1" fill="#ffffff"/>' +
      '<rect x="8" y="7" width="1" height="1" fill="#ffffff"/>' +
      // 羽毛
      '<rect x="3" y="3" width="6" height="2" fill="#e54747"/>' +
      '<rect x="3" y="5" width="6" height="2" fill="#e3a91f"/>' +
      '<rect x="4" y="2" width="2" height="1" fill="#e54747"/>' +
      '<rect x="2" y="4" width="1" height="2" fill="#ffffff"/>' +
      '<rect x="5" y="4" width="1" height="2" fill="#ffeb7a"/>'
    ),

    // 宠物毛梳：木柄 + 梳齿
    brush: wrap(
      // 木柄
      '<rect x="10" y="7" width="5" height="2" fill="#a66e36"/>' +
      '<rect x="10" y="7" width="5" height="1" fill="#c98a4e"/>' +
      // 梳背
      '<rect x="2" y="6" width="8" height="4" fill="#6a87b8"/>' +
      '<rect x="2" y="6" width="8" height="1" fill="#8ba7d0"/>' +
      '<rect x="2" y="9" width="8" height="1" fill="#4f6690"/>' +
      // 梳齿
      '<rect x="2" y="10" width="1" height="3" fill="#ffffff"/>' +
      '<rect x="4" y="10" width="1" height="3" fill="#ffffff"/>' +
      '<rect x="6" y="10" width="1" height="3" fill="#ffffff"/>' +
      '<rect x="8" y="10" width="1" height="3" fill="#ffffff"/>'
    ),

    // 镜子：圆形镜面 + 把手
    mirror: wrap(
      // 把手
      '<rect x="7" y="11" width="2" height="3" fill="#a66e36"/>' +
      '<rect x="7" y="11" width="1" height="3" fill="#c98a4e"/>' +
      '<rect x="6" y="13" width="4" height="1" fill="#8a5820"/>' +
      // 镜框
      '<rect x="4" y="2" width="8" height="1" fill="#d4af5e"/>' +
      '<rect x="3" y="3" width="10" height="1" fill="#d4af5e"/>' +
      '<rect x="2" y="4" width="1" height="6" fill="#d4af5e"/>' +
      '<rect x="13" y="4" width="1" height="6" fill="#d4af5e"/>' +
      '<rect x="3" y="10" width="10" height="1" fill="#d4af5e"/>' +
      '<rect x="4" y="11" width="8" height="1" fill="#d4af5e"/>' +
      // 镜面
      '<rect x="3" y="4" width="10" height="6" fill="#b3e0ef"/>' +
      '<rect x="4" y="3" width="8" height="1" fill="#b3e0ef"/>' +
      '<rect x="4" y="10" width="8" height="1" fill="#b3e0ef"/>' +
      // 高光
      '<rect x="4" y="4" width="2" height="1" fill="#ffffff"/>' +
      '<rect x="4" y="5" width="1" height="2" fill="#ffffff"/>'
    ),

    // 激光笔：笔身 + 发射的红色光点
    laser: wrap(
      // 笔身
      '<rect x="6" y="7" width="7" height="2" fill="#3f3f3f"/>' +
      '<rect x="6" y="7" width="7" height="1" fill="#5a5a5a"/>' +
      // 笔头
      '<rect x="13" y="6" width="1" height="4" fill="#9c9c9c"/>' +
      '<rect x="14" y="7" width="1" height="2" fill="#c0c0c0"/>' +
      // 按钮
      '<rect x="8" y="6" width="2" height="1" fill="#e54747"/>' +
      // 尾端
      '<rect x="5" y="7" width="1" height="2" fill="#d4af5e"/>' +
      // 红色光束
      '<rect x="3" y="7" width="2" height="2" fill="#ff3030"/>' +
      '<rect x="1" y="8" width="2" height="1" fill="#ff6868"/>' +
      // 远端光点（放射）
      '<rect x="0" y="7" width="1" height="1" fill="#ffbaba"/>' +
      '<rect x="0" y="9" width="1" height="1" fill="#ffbaba"/>'
    ),

    // 汽车：红色小轿车侧视
    car: wrap(
      // 车顶
      '<rect x="5" y="5" width="7" height="1" fill="#d42f2f"/>' +
      '<rect x="4" y="6" width="9" height="1" fill="#d42f2f"/>' +
      // 窗户
      '<rect x="5" y="6" width="7" height="1" fill="#9ccde6"/>' +
      '<rect x="8" y="6" width="1" height="1" fill="#6a87b8"/>' + // 窗柱
      // 车身
      '<rect x="2" y="7" width="13" height="3" fill="#e54747"/>' +
      '<rect x="2" y="7" width="13" height="1" fill="#f27d7d"/>' +
      '<rect x="2" y="9" width="13" height="1" fill="#a02323"/>' +
      // 车灯
      '<rect x="14" y="8" width="1" height="1" fill="#ffeb7a"/>' +
      '<rect x="2" y="8" width="1" height="1" fill="#ffeb7a"/>' +
      // 车门缝
      '<rect x="8" y="7" width="1" height="3" fill="#a02323"/>' +
      // 车轮
      '<rect x="3" y="10" width="3" height="2" fill="#2b2217"/>' +
      '<rect x="4" y="12" width="1" height="1" fill="#2b2217"/>' +
      '<rect x="11" y="10" width="3" height="2" fill="#2b2217"/>' +
      '<rect x="12" y="12" width="1" height="1" fill="#2b2217"/>' +
      // 轮毂
      '<rect x="4" y="11" width="1" height="1" fill="#9c9c9c"/>' +
      '<rect x="12" y="11" width="1" height="1" fill="#9c9c9c"/>'
    ),

    // 遛猫：牵引绳+小脚印（用于遛猫行为）
    walk: wrap(
      // 握把（圆环）
      '<rect x="2" y="3" width="3" height="1" fill="#2b2217"/>' +
      '<rect x="1" y="4" width="1" height="2" fill="#2b2217"/>' +
      '<rect x="5" y="4" width="1" height="2" fill="#2b2217"/>' +
      '<rect x="2" y="6" width="3" height="1" fill="#2b2217"/>' +
      '<rect x="2" y="4" width="3" height="2" fill="#c75729"/>' +
      // 牵引绳（斜向下）
      '<rect x="5" y="7" width="1" height="1" fill="#5fa05f"/>' +
      '<rect x="6" y="8" width="1" height="1" fill="#5fa05f"/>' +
      '<rect x="7" y="9" width="1" height="1" fill="#5fa05f"/>' +
      '<rect x="8" y="10" width="1" height="1" fill="#5fa05f"/>' +
      '<rect x="9" y="11" width="1" height="1" fill="#5fa05f"/>' +
      // 连接卡扣
      '<rect x="10" y="11" width="1" height="2" fill="#c0c0c0"/>' +
      // 脚印
      '<rect x="12" y="12" width="1" height="1" fill="#c75729"/>' +
      '<rect x="14" y="10" width="1" height="1" fill="#c75729"/>' +
      '<rect x="13" y="13" width="2" height="1" fill="#c75729"/>' +
      '<rect x="11" y="14" width="1" height="1" fill="#c75729"/>' +
      '<rect x="14" y="14" width="1" height="1" fill="#c75729"/>'
    ),

    /* ========== 顶部按钮图标 ========== */
    // 设置：齿轮
    setting: wrap(
      // 中心圆
      '<rect x="6" y="6" width="4" height="4" fill="#5a5a5a"/>' +
      '<rect x="7" y="7" width="2" height="2" fill="#fffdf0"/>' +
      // 齿（上下左右）
      '<rect x="7" y="2" width="2" height="2" fill="#5a5a5a"/>' +
      '<rect x="7" y="12" width="2" height="2" fill="#5a5a5a"/>' +
      '<rect x="2" y="7" width="2" height="2" fill="#5a5a5a"/>' +
      '<rect x="12" y="7" width="2" height="2" fill="#5a5a5a"/>' +
      // 齿（斜向）
      '<rect x="3" y="3" width="2" height="2" fill="#5a5a5a"/>' +
      '<rect x="11" y="3" width="2" height="2" fill="#5a5a5a"/>' +
      '<rect x="3" y="11" width="2" height="2" fill="#5a5a5a"/>' +
      '<rect x="11" y="11" width="2" height="2" fill="#5a5a5a"/>' +
      // 外圈阴影（高光感）
      '<rect x="6" y="5" width="4" height="1" fill="#8a8a8a"/>' +
      '<rect x="6" y="10" width="4" height="1" fill="#3f3f3f"/>'
    ),

    // 商店：购物袋
    shop: wrap(
      // 提手
      '<rect x="5" y="2" width="1" height="3" fill="#8a5820"/>' +
      '<rect x="10" y="2" width="1" height="3" fill="#8a5820"/>' +
      '<rect x="6" y="2" width="4" height="1" fill="#8a5820"/>' +
      // 袋身
      '<rect x="3" y="5" width="10" height="9" fill="#e54747"/>' +
      '<rect x="3" y="5" width="10" height="1" fill="#ff8b8b"/>' +
      '<rect x="3" y="13" width="10" height="1" fill="#a02323"/>' +
      // 袋身白色商标
      '<rect x="6" y="8" width="4" height="3" fill="#fffdf0"/>' +
      '<rect x="7" y="9" width="2" height="1" fill="#e54747"/>' +
      // 左右描边
      '<rect x="2" y="5" width="1" height="9" fill="#2b2217"/>' +
      '<rect x="13" y="5" width="1" height="9" fill="#2b2217"/>'
    ),

    // 语音：麦克风
    voice: wrap(
      // 话筒头
      '<rect x="6" y="2" width="4" height="1" fill="#5a5a5a"/>' +
      '<rect x="5" y="3" width="6" height="5" fill="#8a8a8a"/>' +
      '<rect x="5" y="3" width="6" height="1" fill="#c0c0c0"/>' +
      '<rect x="5" y="7" width="6" height="1" fill="#3f3f3f"/>' +
      // 网格纹
      '<rect x="6" y="4" width="1" height="1" fill="#3f3f3f"/>' +
      '<rect x="9" y="4" width="1" height="1" fill="#3f3f3f"/>' +
      '<rect x="7" y="5" width="2" height="1" fill="#3f3f3f"/>' +
      '<rect x="6" y="6" width="1" height="1" fill="#3f3f3f"/>' +
      '<rect x="9" y="6" width="1" height="1" fill="#3f3f3f"/>' +
      // 连接杆
      '<rect x="7" y="8" width="2" height="3" fill="#5a5a5a"/>' +
      // 底座
      '<rect x="4" y="11" width="8" height="1" fill="#5a5a5a"/>' +
      '<rect x="5" y="12" width="6" height="2" fill="#2b2217"/>'
    ),

    /* ========== 兜底图标（没有定义时使用） ========== */
    _default: wrap(
      '<rect x="3" y="3" width="10" height="10" fill="#d4af5e"/>' +
      '<rect x="4" y="4" width="8" height="8" fill="#f0c986"/>' +
      '<rect x="7" y="7" width="2" height="2" fill="#2b2217"/>'
    )
  };

  /** 渲染 icon 成一个包含 SVG 的 HTML 片段；若找不到则使用默认 */
  function render(id) {
    return ICONS[id] || ICONS._default;
  }

  window.GAME.Icons = { render, ICONS };
})();
