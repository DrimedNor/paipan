/**
 * 八字排盘引擎 · 五行运算与统计
 * 生克关系、天干/地支五行查询、多口径五行统计。
 * 说明：五行统计仅描述命盘结构，不直接等同于旺衰或喜用神结论。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./constants.js'));
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.WuXing = factory(root.BaziCore.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  function sheng(a, b) {
    // a 是否生 b
    var ia = C.SHENG_CYCLE.indexOf(a);
    var ib = C.SHENG_CYCLE.indexOf(b);
    return (ia >= 0 && ib >= 0) && ((ia + 1) % 5 === ib);
  }

  function ke(a, b) {
    // a 是否克 b
    return C.KE[a] === b;
  }

  function ganWuXing(gan) { return C.GAN_WU_XING[gan]; }
  function zhiWuXing(zhi) { return C.ZHI_WU_XING[zhi]; }

  /**
   * 统计一组元素（0-based 天干/地支索引 + 类型标记）的五行数量。
   * items: [{type:'gan'|'zhi', index:n}, ...]
   * 返回 { 木:n, 火:n, 土:n, 金:n, 水:n, 总:n }
   */
  function count(items) {
    var out = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0, '总': 0 };
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var wx = it.type === 'zhi' ? C.ZHI_WU_XING[it.index] : C.GAN_WU_XING[it.index];
      if (wx) { out[wx]++; out['总']++; }
    }
    return out;
  }

  return {
    sheng: sheng,
    ke: ke,
    ganWuXing: ganWuXing,
    zhiWuXing: zhiWuXing,
    count: count
  };
});
