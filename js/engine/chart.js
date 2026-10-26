/**
 * 八字排盘引擎 · 主引擎（编排层）
 * 历法层：lunar-javascript（节气/农历/干支日序/八字基准）。
 * 本引擎负责：输入校验、农历↔公历、真太阳时/平太阳时校正、规则应用、
 * 四柱装配（含正月初一年界下的月干重推）、十神/藏干/纳音/十二长生/旬空、
 * 五行多口径统计、大运编排，输出统一结构。
 *
 * 重要口径（与部分排盘软件可能不同之处，均显式记录）：
 *  - 时干一律按「所选日界下的日干」以五鼠遁推算，保证日柱与时柱自洽；
 *    默认 23:00 换日规则下与 lunar-javascript 口径一致（见测试）。
 *  - 五行统计仅描述命盘结构，不直接等同于旺衰或喜用神结论。
 *  - 命理内容属于中国传统文化体系，不构成科学证实的预测结论。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    var NS = require('../vendor/lunar.js');
    module.exports = factory(
      NS, require('./constants.js'), require('./ganzhi.js'), require('./wuxing.js'),
      require('./shishen.js'), require('./hiddenGan.js'), require('./nayin.js'),
      require('./xunkong.js'), require('./changsheng.js'), require('./tigerDun.js'),
      require('./solarTime.js'), require('./rules.js'), require('./daYun.js')
    );
  } else {
    root.BaziCore = root.BaziCore || {};
    var G = root.BaziCore;
    root.BaziCore.Chart = factory(
      { Solar: root.Solar, Lunar: root.Lunar },
      G.Constants, G.GanZhi, G.WuXing, G.ShiShen, G.HiddenGan, G.NaYin, G.XunKong,
      G.ChangSheng, G.TigerDun, G.SolarTime, G.Rules, G.DaYun
    );
  }
})(typeof self !== 'undefined' ? self : this, function (NS, C, GZ, WX, SS, HG, NY, XK, CS, TD, ST, Rules, DY) {
  'use strict';

  var C_Lunar = NS.Lunar;
  var C_Solar = NS.Solar;

  var YEAR_MIN = 1900;
  var YEAR_MAX = 2100;

  function validDate(y, m, d) {
    if (typeof y !== 'number' || typeof m !== 'number' || typeof d !== 'number') { return false; }
    if (y < YEAR_MIN || y > YEAR_MAX) { return false; }
    if (m < 1 || m > 12 || d < 1 || d > 31) { return false; }
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }

  function validTime(h, min) {
    return typeof h === 'number' && typeof min === 'number' && h >= 0 && h <= 23 && min >= 0 && min <= 59 && Math.floor(h) === h && Math.floor(min) === min;
  }

  function err(code, message) { return { ok: false, error: { code: code, message: message } }; }

  /**
   * 时辰交界警示：距各时辰整点边界（奇数小时整点）≤5 分钟时提示。
   */
  function boundaryWarnings(time) {
    var total = time.h * 60 + time.min;
    var out = [];
    for (var b = 1; b <= 23; b += 2) {
      var bm = b * 60;
      var diff = Math.abs(total - bm);
      if (diff <= 5) {
        var zhiName = C.ZHI[Math.floor(((bm + 60) % 1440) / 120)];
        out.push({
          boundaryHour: b,
          timeGapMinutes: diff,
          zhiName: zhiName,
          message: '出生时间 ' + time.h + ':' + String(time.min).padStart(2, '0') +
            ' 接近 ' + b + ':00 ' + zhiName + '时交界（相差' + diff + '分钟），时辰归属可能受分钟精度影响。'
        });
      }
    }
    return out;
  }

  function buildPillar(label, ganIdx, zhiIdx, dayGanIdx, rules) {
    var ganzhiIndex = GZ.indexOf(ganIdx, zhiIdx);
    var hide = HG.get(zhiIdx);
    var hideDetail = hide.map(function (h) {
      return {
        ganIndex: h.gan,
        gan: C.GAN[h.gan],
        qi: h.qi,
        wuXing: C.GAN_WU_XING[h.gan],
        shiShen: SS.of(dayGanIdx, h.gan)
      };
    });
    return {
      label: label,
      ganIndex: ganIdx,
      gan: C.GAN[ganIdx],
      zhiIndex: zhiIdx,
      zhi: C.ZHI[zhiIdx],
      ganzhiIndex: ganzhiIndex,
      ganzhi: GZ.nameAt(ganzhiIndex),
      ganYinYang: C.GAN_YIN_YANG[ganIdx],
      zhiYinYang: C.ZHI_YIN_YANG[zhiIdx],
      ganWuXing: C.GAN_WU_XING[ganIdx],
      zhiWuXing: C.ZHI_WU_XING[zhiIdx],
      naYin: NY.at(ganzhiIndex),
      shiShenGan: label === '日柱' ? '日主' : SS.of(dayGanIdx, ganIdx),
      hideGan: hideDetail,
      diShi: CS.stageOf(dayGanIdx, zhiIdx, rules.changShengRule),
      xunKong: XK.xunKongNames(ganzhiIndex),
      xunKongZhi: XK.xunKongZhi(ganzhiIndex)
    };
  }

  function fiveCount(items) { return WX.count(items); }

  /**
   * 排盘入口。
   * input: {
   *   name?, gender(1|0), dateType('solar'|'lunar'),
   *   solar?: {y,m,d}, lunarInput?: {y,m,d,leap},
   *   time: {h,min},
   *   birthPlace?: {label?, longitude?},
   *   timezoneOffset?（小时）, timeCorrection?('none'|'mean'|'true'),
   *   rules?: 部分规则
   * }
   */
  function compute(input) {
    var rules = Rules.snapshot(input.rules);
    if (input.gender !== 1 && input.gender !== 0) {
      return err('NEED_GENDER', '请选择性别（传统大运顺逆规则需要）');
    }
    if (!input.time || !validTime(input.time.h, input.time.min)) {
      return err('BAD_TIME', '出生时间无效，请填写正确的时分（0-23 时、0-59 分）');
    }

    // 1) 解析出生公历日期（农历输入含闰月校验）
    var baseSolar;
    if (input.dateType === 'lunar') {
      var li = input.lunarInput;
      if (!li || !validDate(li.y, li.m, li.d)) {
        return err('BAD_LUNAR', '农历日期无效（年份需在 1900-2100 之间）');
      }
      var leap = !!li.leap;
      try {
        var lunarObj = C_Lunar.fromYmd(li.y, leap ? -li.m : li.m, li.d);
        var s = lunarObj.getSolar();
        if (leap && lunarObj.getMonth() !== -li.m) {
          return err('BAD_LEAP', '该农历年不存在闰' + li.m + '月');
        }
        baseSolar = { y: s.getYear(), m: s.getMonth(), d: s.getDay() };
      } catch (e) {
        return err('BAD_LUNAR', '农历日期无法转换：' + (e && e.message ? e.message : '闰月不存在'));
      }
    } else {
      var si = input.solar;
      if (!si || !validDate(si.y, si.m, si.d)) {
        return err('BAD_SOLAR', '公历日期无效（年份需在 1900-2100 之间）');
      }
      baseSolar = { y: si.y, m: si.m, d: si.d };
    }

    // 2) 时间校正
    var original = { y: baseSolar.y, m: baseSolar.m, d: baseSolar.d, h: input.time.h, min: input.time.min };
    var timeCorrection = rules.timeCorrection;
    var timeInfo = null;
    var used = original;
    if (timeCorrection !== 'none') {
      var lon = input.birthPlace && typeof input.birthPlace.longitude === 'number' ? input.birthPlace.longitude : null;
      if (lon === null || lon < -180 || lon > 180) {
        return err('NEED_LONGITUDE', '选择真太阳时/平太阳时校正需要出生地经度（东经为正）。请补充出生地或经度。');
      }
      var stdMeridian = rules.timezoneOffset * 15;
      var offsetMin = timeCorrection === 'true'
        ? ST.trueSolarOffsetMin(lon, stdMeridian, original.y, original.m, original.d)
        : ST.meanSolarOffsetMin(lon, stdMeridian);
      used = ST.applyOffset(original, offsetMin);
      timeInfo = {
        original: original,
        corrected: used,
        offsetMin: Math.round(offsetMin * 100) / 100,
        longitude: lon,
        stdMeridian: stdMeridian,
        meanOffsetMin: Math.round(ST.meanSolarOffsetMin(lon, stdMeridian) * 100) / 100,
        equationOfTimeMin: timeCorrection === 'true'
          ? Math.round(ST.equationOfTimeMinutes(original.y, original.m, original.d) * 100) / 100
          : 0,
        basis: (timeCorrection === 'true' ? '真太阳时' : '地方平太阳时') +
          '：经度' + lon + '°E，时区标准经线' + stdMeridian + '°E（UTC+' + rules.timezoneOffset + '）'
      };
    }

    // 3) 历法对象（getEightChar 有缓存，全流程只取一次）
    var solar;
    try {
      solar = C_Solar.fromYmdHms(used.y, used.m, used.d, used.h, used.min, 0);
    } catch (e) {
      return err('BAD_SOLAR', '出生时刻无效：' + (e && e.message ? e.message : ''));
    }
    var lunar = solar.getLunar();
    var sect = Rules.sectOf(rules.dayBoundary);
    var ec = lunar.getEightChar();
    ec.setSect(sect);

    // 4) 四柱装配
    var yearGanIdx, yearZhiIdx;
    if (rules.yearBoundary === 'chunjie') {
      yearGanIdx = C.ganIndex(lunar.getYearGan());
      yearZhiIdx = C.zhiIndex(lunar.getYearZhi());
    } else {
      yearGanIdx = C.ganIndex(ec.getYearGan());
      yearZhiIdx = C.zhiIndex(ec.getYearZhi());
    }
    var monthZhiIdx = C.zhiIndex(ec.getMonthZhi());
    var monthGanIdxLib = C.ganIndex(ec.getMonthGan());
    var dayGanIdx = C.ganIndex(ec.getDayGan());
    var dayZhiIdx = C.zhiIndex(ec.getDayZhi());
    var timeZhiIdx = C.zhiIndex(ec.getTimeZhi());

    // 月干：默认用节令制月干（五虎遁）；正月初一年界且与立春年不同时按所选年干重推
    var monthGanIdx = monthGanIdxLib;
    var monthGanRecomputed = false;
    if (rules.yearBoundary === 'chunjie') {
      var lichunGanIdx = C.ganIndex(ec.getYearGan());
      if (yearGanIdx !== lichunGanIdx) {
        monthGanIdx = TD.monthGanOf(yearGanIdx, monthZhiIdx);
        monthGanRecomputed = true;
      }
    }
    // 时干：按所选日界下的日干以五鼠遁推算（自洽口径）
    var timeGanIdx = TD.timeGanOf(dayGanIdx, timeZhiIdx);

    var pillars = {
      year: buildPillar('年柱', yearGanIdx, yearZhiIdx, dayGanIdx, rules),
      month: buildPillar('月柱', monthGanIdx, monthZhiIdx, dayGanIdx, rules),
      day: buildPillar('日柱', dayGanIdx, dayZhiIdx, dayGanIdx, rules),
      time: buildPillar('时柱', timeGanIdx, timeZhiIdx, dayGanIdx, rules)
    };

    // 5) 五行多口径统计
    var eightItems = [];
    ['year', 'month', 'day', 'time'].forEach(function (k) {
      var p = pillars[k];
      eightItems.push({ type: 'gan', index: p.ganIndex });
      eightItems.push({ type: 'zhi', index: p.zhiIndex });
    });
    var ganItems = eightItems.filter(function (it) { return it.type === 'gan'; });
    var zhiBenQiItems = ['year', 'month', 'day', 'time'].map(function (k) {
      return { type: 'gan', index: HG.getGanList(pillars[k].zhiIndex)[0] };
    });
    var hideItems = [];
    ['year', 'month', 'day', 'time'].forEach(function (k) {
      HG.getGanList(pillars[k].zhiIndex).forEach(function (g) { hideItems.push({ type: 'gan', index: g }); });
    });
    var fiveElements = {
      eightChars: fiveCount(eightItems),
      ganOnly: fiveCount(ganItems),
      zhiBenQi: fiveCount(zhiBenQiItems),
      zhiHide: fiveCount(hideItems)
    };

    // 6) 大运
    var monthPillarIndex = GZ.indexOf(monthGanIdx, monthZhiIdx);
    var daYun = DY.computeDaYun({
      birth: used,
      lunar: lunar,
      gender: input.gender,
      yearGanIndex: yearGanIdx,
      monthPillarIndex: monthPillarIndex,
      daYunRule: rules.daYunRule
    });

    // 7) 辅助信息
    var prevJie = lunar.getPrevJie();
    var nextJie = lunar.getNextJie();
    var jieInfo = null;
    if (prevJie) {
      var ps = prevJie.getSolar();
      jieInfo = {
        prevJieName: prevJie.getName(),
        prevJieTime: { y: ps.getYear(), m: ps.getMonth(), d: ps.getDay(), h: ps.getHour(), min: ps.getMinute() },
        nextJieName: nextJie ? nextJie.getName() : null,
        nextJieTime: nextJie ? (function (ns) { return { y: ns.getYear(), m: ns.getMonth(), d: ns.getDay(), h: ns.getHour(), min: ns.getMinute() }; })(nextJie.getSolar()) : null
      };
    }

    var dayMaster = {
      gan: C.GAN[dayGanIdx],
      ganIndex: dayGanIdx,
      wuXing: C.GAN_WU_XING[dayGanIdx],
      yinYang: C.GAN_YIN_YANG[dayGanIdx],
      shiShenLabel: '日主'
    };

    var warnings = boundaryWarnings(used);

    return {
      ok: true,
      chart: {
        meta: {
          name: input.name || '',
          gender: input.gender,
          genderLabel: input.gender === 1 ? '男' : '女',
          dateType: input.dateType,
          solar: baseSolar,
          lunarInput: input.dateType === 'lunar' ? { y: input.lunarInput.y, m: input.lunarInput.m, d: input.lunarInput.d, leap: !!input.lunarInput.leap } : null,
          timeOriginal: original,
          timeUsed: used,
          timeInfo: timeInfo,
          birthPlace: input.birthPlace ? { label: input.birthPlace.label || '', longitude: input.birthPlace.longitude } : null,
          timezoneOffset: rules.timezoneOffset
        },
        lunarStr: lunar.toString(),
        lunarYearGanzhi: lunar.getYearInGanZhi(),
        rules: rules,
        sect: sect,
        dayBoundaryLabel: rules.dayBoundary === '00'
          ? '00:00 换日（晚子时算当天，早子时/晚子时同属当日）'
          : '23:00 换日（晚子时算次日）',
        yearBoundaryLabel: rules.yearBoundary === 'chunjie' ? '正月初一年界' : '立春年界',
        pillars: pillars,
        monthGanRecomputed: monthGanRecomputed,
        dayMaster: dayMaster,
        fiveElements: fiveElements,
        daYun: daYun,
        jieInfo: jieInfo,
        warnings: warnings
      }
    };
  }

  return {
    compute: compute,
    YEAR_MIN: YEAR_MIN,
    YEAR_MAX: YEAR_MAX
  };
});
