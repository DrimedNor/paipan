'use strict';
/**
 * 端到端测试：chart.compute 的输入校验、规则行为、真太阳时、大运方向、五行口径。
 */
const test = require('node:test');
const assert = require('node:assert');
const Chart = require('../js/engine/chart.js');

const BASE = { gender: 1, dateType: 'solar', solar: { y: 1988, m: 1, d: 1 }, time: { h: 12, min: 0 }, rules: {} };

test('输入校验：缺性别 / 坏时间 / 坏日期 / 越界年份', () => {
  let r = Chart.compute({ ...BASE, gender: undefined });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.error.code, 'NEED_GENDER');

  r = Chart.compute({ ...BASE, time: { h: 24, min: 0 } });
  assert.strictEqual(r.error.code, 'BAD_TIME');
  r = Chart.compute({ ...BASE, time: { h: 12, min: 60 } });
  assert.strictEqual(r.error.code, 'BAD_TIME');

  r = Chart.compute({ ...BASE, solar: { y: 2024, m: 2, d: 30 } });
  assert.strictEqual(r.error.code, 'BAD_SOLAR');
  r = Chart.compute({ ...BASE, solar: { y: 1899, m: 1, d: 1 } });
  assert.strictEqual(r.error.code, 'BAD_SOLAR');
  r = Chart.compute({ ...BASE, solar: { y: 2101, m: 1, d: 1 } });
  assert.strictEqual(r.error.code, 'BAD_SOLAR');
});

test('农历：非法闰月报错', () => {
  // 2023 无闰九月
  const r = Chart.compute({ ...BASE, dateType: 'lunar', lunarInput: { y: 2023, m: 9, d: 15, leap: true } });
  assert.strictEqual(r.ok, false);
  assert.ok(/闰月|无法转换/.test(r.error.message));
});

test('真太阳时：缺出生地经度必须拦截', () => {
  const r = Chart.compute({ ...BASE, rules: { timeCorrection: 'true' } });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.error.code, 'NEED_LONGITUDE');
  const r2 = Chart.compute({ ...BASE, rules: { timeCorrection: 'mean' }, birthPlace: { label: '北京' } }); // 无经度
  assert.strictEqual(r2.ok, false);
  assert.strictEqual(r2.error.code, 'NEED_LONGITUDE');
});

test('真太阳时：成都 104.06°E 校正（1988-06-15 12:00）', () => {
  const r = Chart.compute({
    gender: 1, dateType: 'solar', solar: { y: 1988, m: 6, d: 15 }, time: { h: 12, min: 0 },
    rules: { timeCorrection: 'true' }, birthPlace: { label: '成都', longitude: 104.06 }, timezoneOffset: 8
  });
  assert.ok(r.ok, r.error && r.error.message);
  const ti = r.chart.meta.timeInfo;
  assert.ok(ti, '应有时间校正信息');
  assert.strictEqual(ti.longitude, 104.06);
  assert.strictEqual(ti.stdMeridian, 120);
  // 经度差 (104.06-120)*4 = -63.76 分，再加均时差约 -1 分 → 总偏移约 -64~-65 分
  assert.ok(ti.offsetMin <= -60 && ti.offsetMin >= -70, `偏移 ${ti.offsetMin} 分应在合理范围`);
  const used = r.chart.meta.timeUsed;
  assert.ok(used.h === 10 && used.min >= 55 && used.min <= 56, `校正后应为 10:55 前后，实际 ${used.h}:${used.min}`);
  // 原始时间保留
  assert.deepStrictEqual(r.chart.meta.timeOriginal, { y: 1988, m: 6, d: 15, h: 12, min: 0 });
});

test('日界规则真正改变结果：晚子时 1988-01-01 23:30', () => {
  const s = { y: 1988, m: 1, d: 1 }, t = { h: 23, min: 30 };
  const r00 = Chart.compute({ gender: 1, dateType: 'solar', solar: s, time: t, rules: { dayBoundary: '00' } });
  const r23 = Chart.compute({ gender: 1, dateType: 'solar', solar: s, time: t, rules: { dayBoundary: '23' } });
  assert.strictEqual(r00.chart.pillars.day.ganzhi, '乙卯'); // 00:00 换日：晚子时算当天
  assert.strictEqual(r23.chart.pillars.day.ganzhi, '丙辰'); // 23:00 换日：晚子时算次日
  // 时干自洽：00 规则按当天日干五鼠遁（乙日→丙子）；23 规则按次日日干（丙日→戊子）
  assert.strictEqual(r00.chart.pillars.time.ganzhi, '丙子');
  assert.strictEqual(r23.chart.pillars.time.ganzhi, '戊子');
  assert.notStrictEqual(r00.chart.rules.dayBoundary, r23.chart.rules.dayBoundary);
});

test('时辰交界警示：22:56 提示接近 23:00 子时', () => {
  const r = Chart.compute({ ...BASE, time: { h: 22, min: 56 } });
  assert.ok(r.chart.warnings.length >= 1);
  assert.ok(r.chart.warnings[0].message.includes('23:00'));
  const r2 = Chart.compute({ ...BASE, time: { h: 12, min: 30 } });
  assert.strictEqual(r2.chart.warnings.length, 0);
});

test('大运方向：阳男顺 / 阴男逆 / 阳女逆 / 阴女顺', () => {
  // 甲辰阳年
  const yang = { y: 2024, m: 2, d: 5 }, t = { h: 10, min: 0 };
  assert.strictEqual(Chart.compute({ gender: 1, dateType: 'solar', solar: yang, time: t, rules: {} }).chart.daYun.forward, true);
  assert.strictEqual(Chart.compute({ gender: 0, dateType: 'solar', solar: yang, time: t, rules: {} }).chart.daYun.forward, false);
  // 丁丑阴年
  const yin = { y: 1997, m: 2, d: 10 }, t2 = { h: 9, min: 0 };
  assert.strictEqual(Chart.compute({ gender: 1, dateType: 'solar', solar: yin, time: t2, rules: {} }).chart.daYun.forward, false);
  assert.strictEqual(Chart.compute({ gender: 0, dateType: 'solar', solar: yin, time: t2, rules: {} }).chart.daYun.forward, true);
});

test('五行多口径：1988-01-01 23:30 男（丁卯/壬子/丙辰/戊子）', () => {
  const r = Chart.compute({ gender: 1, dateType: 'solar', solar: { y: 1988, m: 1, d: 1 }, time: { h: 23, min: 30 }, rules: {} });
  const f = r.chart.fiveElements;
  assert.deepStrictEqual(f.eightChars, { '木': 1, '火': 2, '土': 2, '金': 0, '水': 3, '总': 8 });
  assert.deepStrictEqual(f.ganOnly, { '木': 0, '火': 2, '土': 1, '金': 0, '水': 1, '总': 4 });
  assert.deepStrictEqual(f.zhiBenQi, { '木': 1, '火': 0, '土': 1, '金': 0, '水': 2, '总': 4 });
  assert.deepStrictEqual(f.zhiHide, { '木': 2, '火': 0, '土': 1, '金': 0, '水': 3, '总': 6 });
});

test('规则快照：默认值与自定义合并，含 sect 与标签', () => {
  const r = Chart.compute({ ...BASE, rules: { dayBoundary: '00', changShengRule: 'tongShengTongSi' } });
  const rs = r.chart.rules;
  assert.strictEqual(rs.dayBoundary, '00');
  assert.strictEqual(rs.changShengRule, 'tongShengTongSi');
  assert.strictEqual(rs.yearBoundary, 'lichun'); // 未指定取默认
  assert.strictEqual(rs.daYunRule, 'hour');
  assert.strictEqual(r.chart.sect, 2); // '00' → sect 2
  assert.ok(r.chart.dayBoundaryLabel.includes('00:00 换日'));
  // 同生同死：BASE 为 1988-01-01 12:00，日柱乙卯 → 乙木帝旺于卯
  assert.strictEqual(r.chart.pillars.day.diShi, '帝旺');
});

test('农历输入与公历输入同盘一致 + 农历字符串输出', () => {
  const rL = Chart.compute({ gender: 1, dateType: 'lunar', lunarInput: { y: 2023, m: 12, d: 30, leap: false }, time: { h: 6, min: 0 }, rules: {} });
  assert.ok(rL.ok, rL.error && rL.error.message);
  assert.ok(rL.chart.lunarStr.length >= 4);
  const solar = rL.chart.meta.solar;
  const rS = Chart.compute({ gender: 1, dateType: 'solar', solar, time: { h: 6, min: 0 }, rules: {} });
  assert.strictEqual(rL.chart.pillars.year.ganzhi, rS.chart.pillars.year.ganzhi);
  assert.strictEqual(rL.chart.pillars.month.ganzhi, rS.chart.pillars.month.ganzhi);
  assert.strictEqual(rL.chart.pillars.day.ganzhi, rS.chart.pillars.day.ganzhi);
  assert.strictEqual(rL.chart.pillars.time.ganzhi, rS.chart.pillars.time.ganzhi);
});
