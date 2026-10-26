/**
 * 八字排盘引擎 · 排盘规则配置
 * 所有存在流派差异的规则集中在此定义，供 UI 配置与命盘快照记录。
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BaziCore = root.BaziCore || {};
    root.BaziCore.Rules = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 默认规则（立春年界、23:00 换日、不校正、阳生阴死、时辰级起运折算）
  var DEFAULT_RULES = {
    yearBoundary: 'lichun',      // 'lichun' 立春 | 'chunjie' 正月初一
    dayBoundary: '23',           // '00' 00:00 换日（晚子时算当天）| '23' 23:00 换日（晚子时算次日）
    timeCorrection: 'none',      // 'none' 不校正 | 'mean' 平太阳时 | 'true' 真太阳时
    changShengRule: 'yangShengYinSi', // 'yangShengYinSi' | 'tongShengTongSi'
    daYunRule: 'hour',           // 起运折算：'hour' 时辰级近似（传统）| 'minute' 分钟级精确
    timezoneOffset: 8            // 时区 UTC+ 小时数，用于标准经线 = offset*15°
  };

  // 各选项说明（供界面展示）
  var OPTION_DESC = {
    yearBoundary: {
      lichun: '年柱以立春交接时刻为年界（主流）',
      chunjie: '年柱以农历正月初一为年界；立春前出生者月干按五虎遁重新推算'
    },
    dayBoundary: {
      '00': '00:00 换日：晚子时（23:00–24:00）日柱算当天（早子时/晚子时同日子时）',
      '23': '23:00 换日：晚子时日柱算次日（23:00 起即算次日）'
    },
    timeCorrection: {
      none: '不做时间校正，直接采用所填钟表时间',
      mean: '校正为地方平太阳时（按出生地经度与标准经线）',
      true: '校正为真太阳时（平太阳时 + 均时差，近似公式）'
    },
    changShengRule: {
      yangShengYinSi: '阳生阴死：五阳干顺行十二宫、五阴干逆行（主流）',
      tongShengTongSi: '同生同死：阴阳干同以五行长生位顺行（木亥、火寅、金巳、水土申）'
    },
    daYunRule: {
      hour: '起运折算（时辰级近似·传统）：距节气时刻差，3天=1年、1天=4个月、1时辰=10天',
      minute: '起运折算（分钟级精确）：同上规则按分钟精确折算'
    }
  };

  /**
   * 深拷贝规则快照（排盘记录保存用，保证历史结果可复现）。
   */
  function snapshot(rules) {
    var out = {};
    var keys = Object.keys(DEFAULT_RULES);
    for (var i = 0; i < keys.length; i++) {
      out[keys[i]] = rules && typeof rules[keys[i]] !== 'undefined' ? rules[keys[i]] : DEFAULT_RULES[keys[i]];
    }
    return out;
  }

  /**
   * 日界配置 → 历法库 sect 参数（实测确认，见探针与测试）：
   * '00'（00:00 换日，晚子时算当天）→ sect 2（Exact2）；
   * '23'（23:00 换日，晚子时算次日）→ sect 1（Exact）。
   */
  function sectOf(dayBoundary) {
    return dayBoundary === '00' ? 2 : 1;
  }

  return {
    DEFAULT_RULES: DEFAULT_RULES,
    OPTION_DESC: OPTION_DESC,
    snapshot: snapshot,
    sectOf: sectOf
  };
});
