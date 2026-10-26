/**
 * 八字排盘引擎 · 干支（六十甲子）运算
 * 提供六十甲子序列、干支合法性、干支↔序号互转、顺逆推步。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./constants.js'));
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.GanZhi = factory(root.BaziCore.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  // 六十甲子序列：JIA_ZI[i] = { gan: 天干0-based索引, zhi: 地支0-based索引 }
  var JIA_ZI = [];
  var JIA_ZI_NAMES = [];
  var INDEX_MAP = {}; // key = gan*12+zhi → 序号 0..59
  for (var i = 0; i < 60; i++) {
    var g = i % 10;
    var z = i % 12;
    JIA_ZI.push({ gan: g, zhi: z });
    JIA_ZI_NAMES.push(C.GAN[g] + C.ZHI[z]);
    INDEX_MAP[g * 12 + z] = i;
  }

  /**
   * 干支组合是否合法：阳干配阳支、阴干配阴支。
   */
  function isValid(gan, zhi) {
    if (gan < 0 || gan > 9 || zhi < 0 || zhi > 11) { return false; }
    return C.GAN_YIN_YANG[gan] === C.ZHI_YIN_YANG[zhi];
  }

  /**
   * 干支 → 六十甲子序号（0..59）；非法组合返回 -1。
   */
  function indexOf(gan, zhi) {
    if (!isValid(gan, zhi)) { return -1; }
    return INDEX_MAP[gan * 12 + zhi];
  }

  /**
   * 序号 → 干支（0..59，自动取模）。
   */
  function at(index) {
    var i = ((index % 60) + 60) % 60;
    return JIA_ZI[i];
  }

  function nameAt(index) {
    return JIA_ZI_NAMES[((index % 60) + 60) % 60];
  }

  /**
   * 顺推/逆推 n 步后的干支。step>0 顺推，step<0 逆推。
   */
  function offset(gan, zhi, step) {
    var base = indexOf(gan, zhi);
    if (base < 0) { return null; }
    return at(base + step);
  }

  function offsetName(gan, zhi, step) {
    var r = offset(gan, zhi, step);
    return r ? (C.GAN[r.gan] + C.ZHI[r.zhi]) : null;
  }

  return {
    JIA_ZI: JIA_ZI,
    JIA_ZI_NAMES: JIA_ZI_NAMES,
    SIZE: 60,
    isValid: isValid,
    indexOf: indexOf,
    at: at,
    nameAt: nameAt,
    offset: offset,
    offsetName: offsetName
  };
});
