/**
 * 八字排盘引擎 · 十二长生（支持两种流派，可配置）
 * 流派一「阳生阴死」（默认）：五阳干顺行、五阴干逆行，偏移表与 lunar-javascript 一致。
 * 流派二「同生同死」：以五行长生位为准，阴阳干同宫同顺行（土取申，水土同宫；另有取寅者属流派差异，见文档）。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./constants.js'));
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.ChangSheng = factory(root.BaziCore.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  var RULES = {
    yangShengYinSi: '阳生阴死（五阳干顺行、五阴干逆行）',
    tongShengTongSi: '同生同死（以五行长生位为准，阴阳同宫）'
  };

  /**
   * @param gan 天干 0-based
   * @param zhi 地支 0-based
   * @param rule 'yangShengYinSi' | 'tongShengTongSi'
   * @returns 阶段名
   */
  function stageOf(gan, zhi, rule) {
    if (gan < 0 || gan > 9 || zhi < 0 || zhi > 11) { return null; }
    var index;
    if (rule === 'tongShengTongSi') {
      var cs = C.WU_XING_CHANG_SHENG_ZHI[C.GAN_WU_XING[gan]];
      index = (zhi - cs + 12) % 12;
    } else {
      var offset = C.CHANG_SHENG_OFFSET[C.GAN[gan]];
      var yang = C.GAN_YIN_YANG[gan] === 1;
      index = offset + (yang ? zhi : -zhi);
      index = ((index % 12) + 12) % 12;
    }
    return C.CHANG_SHENG_STAGES[index];
  }

  return {
    RULES: RULES,
    stageOf: stageOf
  };
});
