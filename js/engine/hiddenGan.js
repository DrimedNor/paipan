/**
 * 八字排盘引擎 · 地支藏干（独立数据模块）
 * 每支按本气、中气、余气顺序列出藏干；子、卯、酉只含本气。
 * 数据与 lunar-javascript 的 ZHI_HIDE_GAN 一致。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.HiddenGan = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 地支(0-based 索引) → 藏干列表（0-based 索引，按本气/中气/余气顺序）
  // 子0 丑1 寅2 卯3 辰4 巳5 午6 未7 申8 酉9 戌10 亥11
  var TABLE = [
    [9],          // 子：癸
    [5, 9, 7],    // 丑：己癸辛
    [0, 2, 4],    // 寅：甲丙戊
    [1],          // 卯：乙
    [4, 1, 9],    // 辰：戊乙癸
    [2, 6, 4],    // 巳：丙庚戊
    [3, 5],       // 午：丁己
    [5, 3, 1],    // 未：己丁乙
    [6, 8, 4],    // 申：庚壬戊
    [7],          // 酉：辛
    [4, 7, 3],    // 戌：戊辛丁
    [8, 0]        // 亥：壬甲
  ];

  var QI = ['本气', '中气', '余气'];

  /**
   * 取某支藏干，返回 [{gan: 0-based, qi: '本气'|'中气'|'余气'}, ...]
   */
  function get(zhiIndex) {
    if (zhiIndex < 0 || zhiIndex > 11) { return null; }
    var list = TABLE[zhiIndex];
    var out = [];
    for (var i = 0; i < list.length; i++) {
      out.push({ gan: list[i], qi: QI[i] });
    }
    return out;
  }

  function getGanList(zhiIndex) {
    var r = get(zhiIndex);
    if (!r) { return null; }
    return r.map(function (x) { return x.gan; });
  }

  return {
    TABLE: TABLE,
    QI: QI,
    get: get,
    getGanList: getGanList
  };
});
