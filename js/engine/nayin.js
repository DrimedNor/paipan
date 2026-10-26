/**
 * 八字排盘引擎 · 六十甲子纳音（独立数据模块）
 * 标准纳音表：每两句（两组干支）共一纳音，共 30 组 60 条。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.NaYin = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 按 60 甲子顺序（甲子=0）给出纳音
  var NAYIN = [
    '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木', '路旁土', '路旁土', '剑锋金', '剑锋金',
    '山头火', '山头火', '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金', '杨柳木', '杨柳木',
    '泉中水', '泉中水', '屋上土', '屋上土', '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
    '沙中金', '沙中金', '山下火', '山下火', '平地木', '平地木', '壁上土', '壁上土', '金箔金', '金箔金',
    '覆灯火', '覆灯火', '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金', '桑柘木', '桑柘木',
    '大溪水', '大溪水', '沙中土', '沙中土', '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水'
  ];

  /**
   * @param ganzhiIndex 六十甲子序号 0..59
   * @returns 纳音名
   */
  function at(ganzhiIndex) {
    var i = ((ganzhiIndex % 60) + 60) % 60;
    return NAYIN[i];
  }

  return {
    NAYIN: NAYIN,
    SIZE: 60,
    at: at
  };
});
