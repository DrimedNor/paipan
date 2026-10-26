/**
 * 八字排盘引擎 · 十神
 * 以日干为基准，按五行生克与阴阳同异确定十神。
 * 约定：日干自身的十神显示为「日主」，由主引擎处理。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./constants.js'));
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.ShiShen = factory(root.BaziCore.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  var NAMES = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];

  /**
   * 计算某天干相对日干的十神。
   * @param dayGan 日干 0-based
   * @param targetGan 目标天干 0-based
   * @returns 十神名
   */
  function of(dayGan, targetGan) {
    if (dayGan < 0 || dayGan > 9 || targetGan < 0 || targetGan > 9) { return null; }
    if (dayGan === targetGan) { return '比肩'; }
    var dayWx = C.GAN_WU_XING[dayGan];
    var tarWx = C.GAN_WU_XING[targetGan];
    var sameYang = C.GAN_YIN_YANG[dayGan] === C.GAN_YIN_YANG[targetGan];

    if (dayWx === tarWx) { return sameYang ? '比肩' : '劫财'; }
    // 我生者
    if ((C.SHENG_CYCLE.indexOf(dayWx) + 1) % 5 === C.SHENG_CYCLE.indexOf(tarWx)) {
      return sameYang ? '食神' : '伤官';
    }
    // 生我者
    if ((C.SHENG_CYCLE.indexOf(tarWx) + 1) % 5 === C.SHENG_CYCLE.indexOf(dayWx)) {
      return sameYang ? '偏印' : '正印';
    }
    // 克我者
    if (C.KE[tarWx] === dayWx) {
      return sameYang ? '七杀' : '正官';
    }
    // 我克者
    if (C.KE[dayWx] === tarWx) {
      return sameYang ? '偏财' : '正财';
    }
    return null;
  }

  /**
   * 一组藏干（0-based 数组）相对日干的十神列表。
   */
  function ofList(dayGan, ganList) {
    var out = [];
    for (var i = 0; i < ganList.length; i++) {
      out.push(of(dayGan, ganList[i]));
    }
    return out;
  }

  return {
    NAMES: NAMES,
    of: of,
    ofList: ofList
  };
});
