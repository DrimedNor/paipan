/**
 * 八字排盘引擎 · 五虎遁（月起干）与五鼠遁（时起干）
 * 五虎遁：以年干推正月（寅月）月干，甲己之年丙作首，其余顺推。
 * 五鼠遁：以日干推子时时干，甲己还加甲，其余顺推。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./constants.js'));
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.TigerDun = factory(root.BaziCore.Constants);
  }
})(typeof self !== 'undefined' ? self : this, function (C) {
  'use strict';

  // 五虎遁：年干 % 5 → 正月（寅月）天干 0-based
  // 甲己→丙(2)、乙庚→戊(4)、丙辛→庚(6)、丁壬→壬(8)、戊癸→甲(0)
  var H = [2, 4, 6, 8, 0];
  // 五鼠遁：日干 % 5 → 子时天干 0-based
  // 甲己→甲(0)、乙庚→丙(2)、丙辛→戊(4)、丁壬→庚(6)、戊癸→壬(8)
  var S = [0, 2, 4, 6, 8];

  /**
   * 月干：以年干与月支（节令月）推月干。
   * @param yearGanIndex 年干 0-based
   * @param monthZhiIndex 月支 0-based（寅=2 为正月，对应月序 0）
   * @returns 月干 0-based
   */
  function monthGanOf(yearGanIndex, monthZhiIndex) {
    var monthOrder = ((monthZhiIndex - 2) % 12 + 12) % 12; // 寅=0 起
    return (H[yearGanIndex % 5] + monthOrder) % 10;
  }

  /**
   * 时干：以日干与时辰支推时干。
   * @param dayGanIndex 日干 0-based
   * @param timeZhiIndex 时辰支 0-based（子=0）
   * @returns 时干 0-based
   */
  function timeGanOf(dayGanIndex, timeZhiIndex) {
    return (S[dayGanIndex % 5] + timeZhiIndex) % 10;
  }

  return {
    monthGanOf: monthGanOf,
    timeGanOf: timeGanOf
  };
});
