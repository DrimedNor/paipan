/**
 * 八字排盘引擎 · 旬空
 * 六十甲子每 10 个为一旬，旬尾两支为空亡（旬空）。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./constants.js'));
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.XunKong = factory(root.BaziCore.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  /**
   * 六十甲子序号 → 旬名（甲子/甲戌/甲申/甲午/甲辰/甲寅）
   */
  function xunOf(ganzhiIndex) {
    var i = ((ganzhiIndex % 60) + 60) % 60;
    var xunStart = i - (i % 10); // 旬首序号（甲X）
    return C.GAN[0] + C.ZHI[xunStart % 12];
  }

  /**
   * 六十甲子序号 → 旬空（两支，0-based 地支索引数组）
   */
  function xunKongZhi(ganzhiIndex) {
    var i = ((ganzhiIndex % 60) + 60) % 60;
    var xunStart = i - (i % 10);
    var z1 = (xunStart % 12 + 10) % 12;
    var z2 = (xunStart % 12 + 11) % 12;
    return [z1, z2];
  }

  function xunKongNames(ganzhiIndex) {
    var z = xunKongZhi(ganzhiIndex);
    return [C.ZHI[z[0]], C.ZHI[z[1]]];
  }

  return {
    xunOf: xunOf,
    xunKongZhi: xunKongZhi,
    xunKongNames: xunKongNames
  };
});
