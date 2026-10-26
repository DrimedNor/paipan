/**
 * 八字排盘引擎 · 常量与基础映射表
 * 独立数据模块：天干、地支、五行、阴阳。
 * 全库使用 0-based 索引：天干 0=甲 … 9=癸；地支 0=子 … 11=亥。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.Constants = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 1=阳 0=阴
  var GAN_YIN_YANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
  var ZHI_YIN_YANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

  // 五行
  var GAN_WU_XING = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
  var ZHI_WU_XING = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];

  // 五行相生：木→火→土→金→水→木；相克：木→土→水→火→金→木
  var SHENG_CYCLE = ['木', '火', '土', '金', '水']; // index 顺序即相生链
  var KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  // 十二长生位顺序
  var CHANG_SHENG_STAGES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

  // 阳生阴死（阴干逆行）流派的长生偏移，与 lunar-javascript 的 CHANG_SHENG_OFFSET 一致：
  // stage = offset + (阳干 ? zhiIndex : -zhiIndex)，对 12 取模。
  var CHANG_SHENG_OFFSET = { '甲': 1, '丙': 10, '戊': 10, '庚': 7, '壬': 4, '乙': 6, '丁': 9, '己': 9, '辛': 0, '癸': 3 };

  // 同生同死流派：五行长生位（木亥、火寅、金巳、水土申）
  var WU_XING_CHANG_SHENG_ZHI = { '木': 11, '火': 2, '金': 5, '水': 8, '土': 8 };

  function ganIndex(g) { return GAN.indexOf(g); }
  function zhiIndex(z) { return ZHI.indexOf(z); }
  function isYangGan(g) { return GAN_YIN_YANG[ganIndex(g)] === 1; }

  return {
    GAN: GAN,
    ZHI: ZHI,
    GAN_YIN_YANG: GAN_YIN_YANG,
    ZHI_YIN_YANG: ZHI_YIN_YANG,
    GAN_WU_XING: GAN_WU_XING,
    ZHI_WU_XING: ZHI_WU_XING,
    SHENG_CYCLE: SHENG_CYCLE,
    KE: KE,
    CHANG_SHENG_STAGES: CHANG_SHENG_STAGES,
    CHANG_SHENG_OFFSET: CHANG_SHENG_OFFSET,
    WU_XING_CHANG_SHENG_ZHI: WU_XING_CHANG_SHENG_ZHI,
    ganIndex: ganIndex,
    zhiIndex: zhiIndex,
    isYangGan: isYangGan
  };
});
