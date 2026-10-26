'use strict';
/**
 * 交叉验证测试：本引擎输出与 lunar-javascript（6tail）历法库对照。
 * 对照前提：使用相同规则（时区、年界、换日、真太阳时），否则差异不代表错误。
 */
const test = require('node:test');
const assert = require('node:assert');
const NS = require('../js/vendor/lunar.js');
const Solar = NS.Solar;
const Lunar = NS.Lunar;
const U = NS.LunarUtil;

const C = require('../js/engine/constants.js');
const GZ = require('../js/engine/ganzhi.js');
const HG = require('../js/engine/hiddenGan.js');
const NY = require('../js/engine/nayin.js');
const SS = require('../js/engine/shishen.js');
const Chart = require('../js/engine/chart.js');

// ---- 数据表完整性对照 ----
test('藏干表与库一致', () => {
  for (let z = 0; z < 12; z++) {
    const mine = HG.getGanList(z).map(i => C.GAN[i]);
    const lib = U.ZHI_HIDE_GAN[C.ZHI[z]];
    assert.deepStrictEqual(mine, lib, `地支${C.ZHI[z]}`);
  }
});

test('纳音表与库一致（60 项）', () => {
  for (let i = 0; i < 60; i++) {
    const name = GZ.nameAt(i);
    assert.strictEqual(NY.at(i), U.NAYIN[name], `${name}`);
  }
});

test('六十甲子表与库一致', () => {
  assert.deepStrictEqual(GZ.JIA_ZI_NAMES, U.JIA_ZI);
});

test('长生偏移表与库一致', () => {
  for (const g of C.GAN) {
    assert.strictEqual(C.CHANG_SHENG_OFFSET[g], U.CHANG_SHENG_OFFSET[g], `长生偏移 ${g}`);
  }
});

test('五行映射与库一致', () => {
  for (let i = 0; i < 10; i++) assert.strictEqual(C.GAN_WU_XING[i], U.WU_XING_GAN[C.GAN[i]]);
  for (let i = 0; i < 12; i++) assert.strictEqual(C.ZHI_WU_XING[i], U.WU_XING_ZHI[C.ZHI[i]]);
});

test('十神矩阵与库一致（10×10）', () => {
  for (let d = 0; d < 10; d++) {
    for (let t = 0; t < 10; t++) {
      const expected = U.SHI_SHEN[C.GAN[d] + C.GAN[t]];
      assert.strictEqual(SS.of(d, t), expected, `${C.GAN[d]}日对${C.GAN[t]}`);
    }
  }
});

// ---- 四柱交叉验证（默认规则 23:00 换日 → 库 sect=1；年界立春；不校正）----
const SAMPLES = [
  { y: 1988, m: 1, d: 1, h: 23, min: 30 }, // 晚子时
  { y: 1988, m: 1, d: 1, h: 22, min: 30 }, // 亥时
  { y: 2000, m: 6, d: 15, h: 12, min: 0 },
  { y: 2024, m: 2, d: 5, h: 10, min: 0 },  // 立春后
  { y: 2024, m: 2, d: 4, h: 16, min: 20 }, // 立春(16:27)前
  { y: 2024, m: 2, d: 4, h: 16, min: 40 }, // 立春后
  { y: 2023, m: 6, d: 30, h: 8, min: 0 },
  { y: 2008, m: 8, d: 8, h: 20, min: 8 },
  { y: 1950, m: 5, d: 1, h: 0, min: 5 },
  { y: 2001, m: 12, d: 21, h: 23, min: 55 } // 冬至交节前后附近
];

function libEightChar(s) {
  const lunar = Solar.fromYmdHms(s.y, s.m, s.d, s.h, s.min, 0).getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(1);
  return { lunar, ec };
}

test('四柱/藏干/纳音/长生/旬空/十神 与库 sect=1 一致（默认规则）', () => {
  for (const s of SAMPLES) {
    const { lunar, ec } = libEightChar(s);
    const r = Chart.compute({ gender: 1, dateType: 'solar', solar: { y: s.y, m: s.m, d: s.d }, time: { h: s.h, min: s.min }, rules: {} });
    assert.ok(r.ok, `${JSON.stringify(s)} 排盘失败：${r.error && r.error.message}`);
    const p = r.chart.pillars;
    const exp = {
      year: ec.getYear(),
      month: ec.getMonth(),
      day: ec.getDay(),
      time: ec.getTime()
    };
    assert.strictEqual(p.year.ganzhi, exp.year, `年柱 ${JSON.stringify(s)}`);
    assert.strictEqual(p.month.ganzhi, exp.month, `月柱 ${JSON.stringify(s)}`);
    assert.strictEqual(p.day.ganzhi, exp.day, `日柱 ${JSON.stringify(s)}`);
    assert.strictEqual(p.time.ganzhi, exp.time, `时柱 ${JSON.stringify(s)}`);
    // 藏干
    assert.deepStrictEqual(p.month.hideGan.map(x => x.gan), ec.getMonthHideGan(), `月藏干 ${JSON.stringify(s)}`);
    // 纳音
    assert.strictEqual(p.year.naYin, ec.getYearNaYin(), `年纳音 ${JSON.stringify(s)}`);
    // 旬空（库返回字符串，本引擎返回数组）
    assert.strictEqual(p.day.xunKong.join(''), ec.getDayXunKong(), `日旬空 ${JSON.stringify(s)}`);
    // 十二长生（阳生阴死，与库 _getDiShi 同口径）
    assert.strictEqual(p.month.diShi, ec.getMonthDiShi(), `月长生 ${JSON.stringify(s)}`);
    assert.strictEqual(p.day.diShi, ec.getDayDiShi(), `日长生 ${JSON.stringify(s)}`);
    // 天干十神
    assert.strictEqual(p.year.shiShenGan, ec.getYearShiShenGan(), `年干十神 ${JSON.stringify(s)}`);
    // 日柱十神
    assert.strictEqual(p.day.shiShenGan, '日主');
  }
});

// ---- 大运交叉验证 ----
const DAYUN_SAMPLES = [
  { s: { y: 1988, m: 1, d: 1, h: 23, min: 30 }, gender: 1 }, // 丁卯阴年男 → 逆
  { s: { y: 1988, m: 1, d: 1, h: 23, min: 30 }, gender: 0 }, // 阴年女 → 顺
  { s: { y: 2024, m: 2, d: 5, h: 10, min: 0 }, gender: 1 },  // 甲辰阳年男 → 顺
  { s: { y: 2024, m: 2, d: 5, h: 10, min: 0 }, gender: 0 },  // 阳年女 → 逆
  { s: { y: 2001, m: 12, d: 21, h: 23, min: 55 }, gender: 0 },
  { s: { y: 1950, m: 5, d: 1, h: 0, min: 5 }, gender: 1 }
];

for (const mode of ['hour', 'minute']) {
  test(`大运（${mode} 折算）与库 Yun(sect=${mode === 'hour' ? 1 : 2}) 一致`, () => {
    for (const t of DAYUN_SAMPLES) {
      const s = t.s;
      const lunar = Solar.fromYmdHms(s.y, s.m, s.d, s.h, s.min, 0).getLunar();
      const ec = lunar.getEightChar();
      ec.setSect(mode === 'hour' ? 1 : 2);
      const libGender = t.gender === 1 ? 1 : 2;
      const yun = ec.getYun(libGender, mode === 'hour' ? 1 : 2);
      const r = Chart.compute({ gender: t.gender, dateType: 'solar', solar: { y: s.y, m: s.m, d: s.d }, time: { h: s.h, min: s.min }, rules: { daYunRule: mode } });
      assert.ok(r.ok, `${JSON.stringify(t)} 排盘失败`);
      const d = r.chart.daYun;
      assert.strictEqual(d.forward, yun.isForward(), `方向 ${JSON.stringify(t)}`);
      assert.strictEqual(d.startYear, yun.getStartYear(), `起运年 ${JSON.stringify(t)}`);
      assert.strictEqual(d.startMonth, yun.getStartMonth(), `起运月 ${JSON.stringify(t)}`);
      assert.strictEqual(d.startDay, yun.getStartDay(), `起运日 ${JSON.stringify(t)}`);
      assert.strictEqual(d.startHour, yun.getStartHour(), `起运时 ${JSON.stringify(t)}`);
      const ls = yun.getStartSolar();
      assert.deepStrictEqual(d.startSolar, { y: ls.getYear(), m: ls.getMonth(), d: ls.getDay(), h: ls.getHour(), min: ls.getMinute() }, `起运公历 ${JSON.stringify(t)}`);
      assert.strictEqual(d.startAge, yun.getStartAge ? yun.getStartAge() : (ls.getYear() - s.y + 1), `起运虚岁 ${JSON.stringify(t)}`);
      const dy = yun.getDaYun(11); // 返回下标 0..10（第 0 项为出生至起运前）
      for (let i = 1; i <= 10; i++) {
        const mine = d.list[i - 1];
        assert.strictEqual(mine.ganzhi, dy[i].getGanZhi(), `大运${i} ${JSON.stringify(t)}`);
        assert.strictEqual(mine.startYear, dy[i].getStartYear(), `大运${i}起年 ${JSON.stringify(t)}`);
        assert.strictEqual(mine.startAge, dy[i].getStartAge(), `大运${i}起岁 ${JSON.stringify(t)}`);
      }
    }
  });
}

// ---- 年界规则对照 ----
test('年界：立春 vs 正月初一（2024-02-05 立春后/正月初一前）', () => {
  const s = { y: 2024, m: 2, d: 5, h: 10, min: 0 };
  const rL = Chart.compute({ gender: 1, dateType: 'solar', solar: s, time: { h: 10, min: 0 }, rules: { yearBoundary: 'lichun' } });
  const rC = Chart.compute({ gender: 1, dateType: 'solar', solar: s, time: { h: 10, min: 0 }, rules: { yearBoundary: 'chunjie' } });
  assert.strictEqual(rL.chart.pillars.year.ganzhi, '甲辰', '立春年界=甲辰');
  assert.strictEqual(rL.chart.pillars.month.ganzhi, '丙寅', '立春年界寅月=丙寅');
  assert.strictEqual(rC.chart.pillars.year.ganzhi, '癸卯', '正月初一年界=癸卯');
  assert.strictEqual(rC.chart.pillars.month.ganzhi, '甲寅', '正月初一年界下月干按癸年五虎遁重推=甲寅');
  assert.strictEqual(rC.chart.monthGanRecomputed, true);
  assert.strictEqual(rL.chart.monthGanRecomputed, false);
});

// ---- 闰月 ----
test('农历闰月：2023 闰二月十五 ↔ 公历 2023-04-05', () => {
  const r = Chart.compute({ gender: 1, dateType: 'lunar', lunarInput: { y: 2023, m: 2, d: 15, leap: true }, time: { h: 8, min: 0 }, rules: {} });
  assert.ok(r.ok, r.error && r.error.message);
  assert.deepStrictEqual(r.chart.meta.solar, { y: 2023, m: 4, d: 5 });
  // 公历同日输入应得相同命盘
  const r2 = Chart.compute({ gender: 1, dateType: 'solar', solar: { y: 2023, m: 4, d: 5 }, time: { h: 8, min: 0 }, rules: {} });
  assert.strictEqual(r.chart.pillars.day.ganzhi, r2.chart.pillars.day.ganzhi);
});

// ---- 确定性 ----
test('确定性：同输入两次结果完全一致', () => {
  const input = { gender: 1, dateType: 'solar', solar: { y: 1995, m: 8, d: 17 }, time: { h: 14, min: 30 }, rules: { dayBoundary: '23' } };
  const a = JSON.stringify(Chart.compute(input));
  const b = JSON.stringify(Chart.compute(input));
  assert.strictEqual(a, b);
});
