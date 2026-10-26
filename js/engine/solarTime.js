/**
 * 八字排盘引擎 · 真太阳时 / 地方平太阳时校正
 * 平太阳时：地方平时 = 钟表时 + (出生地经度 − 时区标准经线经度) × 4 分钟/度。
 * 真太阳时：真太阳时 = 地方平时 + 均时差（EoT）。
 * 均时差采用常见近似公式（NOAA 风格）：
 *   B = 2π(N − 81)/364（N 为一年中的第几天）
 *   EoT(分钟) = 9.87·sin(2B) − 7.53·cos(B) − 1.5·sin(B)
 * 该公式为近似算法，误差约 ±1–2 分钟；如需更高精度应使用天文历表（见 docs/待验证项.md）。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.SolarTime = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function dayOfYear(y, m, d) {
    var t = Date.UTC(y, m - 1, d);
    var start = Date.UTC(y, 0, 1);
    return Math.floor((t - start) / 86400000) + 1;
  }

  /**
   * 均时差（分钟）。year/month/day 用出生日期（公历）。
   */
  function equationOfTimeMinutes(y, m, d) {
    var N = dayOfYear(y, m, d);
    var B = (2 * Math.PI * (N - 81)) / 364;
    return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  }

  /**
   * 地方平太阳时与标准时的差值（分钟）。
   * longitude：东经为正（度）；stdMeridian：时区标准经线（度，如 UTC+8 → 120）。
   */
  function meanSolarOffsetMin(longitude, stdMeridian) {
    return (longitude - stdMeridian) * 4;
  }

  /**
   * 真太阳时总偏移（分钟）= 平太阳时偏移 + 均时差。
   */
  function trueSolarOffsetMin(longitude, stdMeridian, y, m, d) {
    return meanSolarOffsetMin(longitude, stdMeridian) + equationOfTimeMinutes(y, m, d);
  }

  /**
   * 把钟表时间按 offsetMin（可为负）平移，返回新的 {y,m,d,h,min}（自动跨日）。
   */
  function applyOffset(date, offsetMin) {
    var total = date.h * 60 + date.min + offsetMin;
    var days = Math.floor(total / 1440);
    var rem = total - days * 1440;
    var dt = new Date(Date.UTC(date.y, date.m - 1, date.d));
    dt.setUTCDate(dt.getUTCDate() + days);
    var h = Math.floor(rem / 60);
    var min = rem - h * 60;
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), h: h, min: min };
  }

  return {
    dayOfYear: dayOfYear,
    equationOfTimeMinutes: equationOfTimeMinutes,
    meanSolarOffsetMin: meanSolarOffsetMin,
    trueSolarOffsetMin: trueSolarOffsetMin,
    applyOffset: applyOffset
  };
});
