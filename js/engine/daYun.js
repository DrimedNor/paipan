/**
 * 八字排盘引擎 · 大运编排
 * 排运方向与起运折算逻辑分离：
 *  - 方向：阳年男、阴年女顺排；阴年男、阳年女逆排（年干阴阳以所选年柱为准）。
 *  - 起运折算：距最近节气的时刻差，3天=1年、1天=4个月、1时辰=10天。
 *    'hour'  时辰级近似（传统）：时辰差向上取整折算（与 lunar-javascript sect=1 口径一致）。
 *    'minute' 分钟级精确：按分钟精确折算（与 lunar-javascript sect=2 口径一致）。
 * 算法镜像自 lunar-javascript 的 Yun，起运日期用公历算术复现（见测试交叉验证）。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./constants.js'), require('./ganzhi.js'));
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.DaYun = factory(root.BaziCore.Constants, root.BaziCore.GanZhi);
  }
})(typeof self !== 'undefined' ? self : this, function (C, GZ) {
  'use strict';

  function timeZhiIndex(h, min) {
    // 子0(23:00-00:59) 丑1(01:00-02:59) … 亥11(21:00-22:59)，与 lunar-javascript 口径一致
    var hm = h * 60 + min;
    return Math.floor(((hm + 60) % 1440) / 120);
  }

  // 与库一致的特殊口径：整点 23 时按亥(11)计（库在时辰差折算中的处理）
  function timeZhiIndexForYun(solar) {
    var h = solar.h;
    return h === 23 ? 11 : timeZhiIndex(h, solar.min);
  }

  function dateToMs(s) { return Date.UTC(s.y, s.m - 1, s.d, s.h, s.min, 0); }
  // 与库口径一致：日历日差（忽略时刻，即 SolarUtil.getDaysBetween）
  function dayDiffMs(end, start) {
    return Math.round((Date.UTC(end.y, end.m - 1, end.d) - Date.UTC(start.y, start.m - 1, start.d)) / 86400000);
  }
  // 精确分钟差（含时刻，即库的 subtractMinute 语义）
  function minuteDiff(end, start) { return (dateToMs(end) - dateToMs(start)) / 60000; }

  // 库的 Solar 对象转普通对象（getter 访问）
  function solarToObj(s) {
    return { y: s.getYear(), m: s.getMonth(), d: s.getDay(), h: s.getHour(), min: s.getMinute() };
  }

  /**
   * 起运日期：出生时刻 + 年/月/日/时偏移（公历算术；与库 nextYear/nextMonth/next/nextHour 语义对齐，测试交叉验证）。
   */
  function addYMDH(base, years, months, days, hours) {
    var d = new Date(dateToMs(base));
    d.setUTCFullYear(d.getUTCFullYear() + years);
    d.setUTCMonth(d.getUTCMonth() + months);
    d.setUTCDate(d.getUTCDate() + days);
    d.setUTCHours(d.getUTCHours() + hours);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes() };
  }

  /**
   * 计算大运。
   * input: {
   *   birth: {y,m,d,h,min},           // 使用后的出生时刻（可能已校正）
   *   lunar,                           // 该时刻对应的 Lunar 对象
   *   gender: 1 男 | 0 女,
   *   yearGanIndex: 所选年柱天干 0-based,
   *   monthPillarIndex: 所选月柱六十甲子序号（大运干支基准）,
   *   daYunRule: 'hour' | 'minute'
   * }
   */
  function computeDaYun(input) {
    var birth = input.birth;
    var lunar = input.lunar;
    var gender = input.gender;
    var yearGanIndex = input.yearGanIndex;
    var basePillar = input.monthPillarIndex;
    var rule = input.daYunRule === 'minute' ? 'minute' : 'hour';

    var yang = yearGanIndex % 2 === 0; // 偶索引=阳干
    var forward = (yang && gender === 1) || (!yang && gender === 0);
    var forwardDesc = (yang ? '阳年' : '阴年') + (gender === 1 ? '男命' : '女命') + (forward ? '顺排' : '逆排');

    var prev = lunar.getPrevJie();
    var next = lunar.getNextJie();
    var cur = { y: birth.y, m: birth.m, d: birth.d, h: birth.h, min: birth.min };
    var start = forward ? cur : solarToObj(prev.getSolar());
    var end = forward ? solarToObj(next.getSolar()) : cur;

    var startYear, startMonth, startDay, startHour;
    if (rule === 'hour') {
      var endTz = timeZhiIndexForYun(end);
      var startTz = timeZhiIndexForYun(start);
      var hourDiff = endTz - startTz;
      var dayDiff = dayDiffMs(end, start);
      if (hourDiff < 0) { hourDiff += 12; dayDiff--; }
      var monthDiff = Math.floor(hourDiff * 10 / 30);
      var month = dayDiff * 4 + monthDiff;
      var day = hourDiff * 10 - monthDiff * 30;
      startYear = Math.floor(month / 12);
      startMonth = month - startYear * 12;
      startDay = day;
      startHour = 0;
    } else {
      var minutes = minuteDiff(end, start);
      startYear = Math.floor(minutes / 4320);
      var rem = minutes % 4320;
      startMonth = Math.floor(rem / 360);
      var rem2 = rem % 360;
      startDay = Math.floor(rem2 / 12);
      startHour = rem2 % 12 * 2;
    }

    var startSolar = addYMDH(birth, startYear, startMonth, startDay, startHour);
    var birthYear = birth.y;
    var startAge = startSolar.y - birthYear + 1;

    // 大运列表（10 步；第 0 步为「出生至起运前」）
    var list = [];
    for (var i = 1; i <= 10; i++) {
      var idx = ((basePillar + (forward ? i : -i)) % 60 + 60) % 60;
      var gz = GZ.at(idx);
      var sy = startSolar.y + (i - 1) * 10;
      var ey = sy + 9;
      list.push({
        index: i,
        ganzhi: GZ.nameAt(idx),
        ganIndex: gz.gan,
        zhiIndex: gz.zhi,
        startYear: sy,
        endYear: ey,
        startAge: sy - birthYear + 1,
        endAge: ey - birthYear + 1
      });
    }

    var pre = {
      startYear: birthYear,
      endYear: startSolar.y - 1,
      startAge: 1,
      endAge: startSolar.y - birthYear
    };

    return {
      forward: forward,
      forwardDesc: forwardDesc,
      daYunRule: rule,
      startYear: startYear,
      startMonth: startMonth,
      startDay: startDay,
      startHour: startHour,
      startSolar: startSolar,
      startAge: startAge,
      pre: pre,
      list: list
    };
  }

  return {
    computeDaYun: computeDaYun,
    _timeZhiIndex: timeZhiIndex,
    _addYMDH: addYMDH
  };
});
