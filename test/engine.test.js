'use strict';
const test = require('node:test');
const assert = require('node:assert');
const C = require('../js/engine/constants.js');
const GZ = require('../js/engine/ganzhi.js');
const WX = require('../js/engine/wuxing.js');
const SS = require('../js/engine/shishen.js');
const HG = require('../js/engine/hiddenGan.js');
const NY = require('../js/engine/nayin.js');
const XK = require('../js/engine/xunkong.js');
const CS = require('../js/engine/changsheng.js');
const TD = require('../js/engine/tigerDun.js');
const ST = require('../js/engine/solarTime.js');

test('六十甲子完整性：60 项、干支组合合法、序号互转与循环', () => {
  assert.strictEqual(GZ.SIZE, 60);
  assert.strictEqual(GZ.JIA_ZI.length, 60);
  assert.strictEqual(GZ.JIA_ZI_NAMES.length, 60);
  for (let i = 0; i < 60; i++) {
    const g = GZ.JIA_ZI[i].gan;
    const z = GZ.JIA_ZI[i].zhi;
    assert.ok(GZ.isValid(g, z), `序号${i}（${C.GAN[g]}${C.ZHI[z]}）应为合法干支`);
    assert.strictEqual(GZ.indexOf(g, z), i, `序号${i}应可互转`);
  }
  // 覆盖全部 10 干、12 支
  const gans = new Set(GZ.JIA_ZI.map(x => x.gan));
  const zhis = new Set(GZ.JIA_ZI.map(x => x.zhi));
  assert.strictEqual(gans.size, 10);
  assert.strictEqual(zhis.size, 12);
  // 循环：+60 回到自身；顺推一步正确
  assert.deepStrictEqual(GZ.at(60), GZ.at(0));
  assert.strictEqual(GZ.nameAt(0), '甲子');
  assert.strictEqual(GZ.nameAt(59), '癸亥');
  assert.strictEqual(GZ.nameAt(1), '乙丑');
  assert.deepStrictEqual(GZ.offset(0, 0, 1), { gan: 1, zhi: 1 }); // 甲子+1=乙丑
  assert.strictEqual(GZ.offsetName(0, 0, -1), '癸亥');
  assert.strictEqual(GZ.indexOf(0, 1), -1); // 甲丑非法
});

test('五行：生克关系与映射', () => {
  assert.ok(WX.sheng('木', '火'));
  assert.ok(WX.sheng('水', '木'));
  assert.ok(!WX.sheng('木', '金'));
  assert.ok(WX.ke('木', '土'));
  assert.ok(WX.ke('土', '水'));
  assert.strictEqual(WX.ganWuXing(0), '木'); // 甲
  assert.strictEqual(WX.ganWuXing(9), '水'); // 癸
  assert.strictEqual(WX.zhiWuXing(0), '水'); // 子
  assert.strictEqual(WX.zhiWuXing(11), '水'); // 亥
  const r = WX.count([{ type: 'gan', index: 0 }, { type: 'gan', index: 2 }, { type: 'zhi', index: 0 }, { type: 'zhi', index: 2 }]);
  assert.deepStrictEqual(r, { '木': 2, '火': 1, '土': 0, '金': 0, '水': 1, '总': 4 });
});

test('十神：甲日干与丙日干全矩阵', () => {
  // 甲(0) 日干
  const expectJia = { '甲': '比肩', '乙': '劫财', '丙': '食神', '丁': '伤官', '戊': '偏财', '己': '正财', '庚': '七杀', '辛': '正官', '壬': '偏印', '癸': '正印' };
  C.GAN.forEach((g, i) => assert.strictEqual(SS.of(0, i), expectJia[g], `${g}对甲日干`));
  // 丙(2) 日干
  const expectBing = { '甲': '偏印', '乙': '正印', '丙': '比肩', '丁': '劫财', '戊': '食神', '己': '伤官', '庚': '偏财', '辛': '正财', '壬': '七杀', '癸': '正官' };
  C.GAN.forEach((g, i) => assert.strictEqual(SS.of(2, i), expectBing[g], `${g}对丙日干`));
  // 全部 10×10 均有值且合法
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      assert.ok(SS.of(i, j), `十神 of(${i},${j}) 非空`);
    }
  }
});

test('地支藏干：完整性、子卯酉仅本气、气序', () => {
  assert.strictEqual(HG.TABLE.length, 12);
  // 子[癸] 丑[己癸辛] 寅[甲丙戊] 卯[乙] 辰[戊乙癸] 巳[丙庚戊] 午[丁己] 未[己丁乙] 申[庚壬戊] 酉[辛] 戌[戊辛丁] 亥[壬甲]
  const expected = [
    ['癸'], ['己', '癸', '辛'], ['甲', '丙', '戊'], ['乙'], ['戊', '乙', '癸'], ['丙', '庚', '戊'],
    ['丁', '己'], ['己', '丁', '乙'], ['庚', '壬', '戊'], ['辛'], ['戊', '辛', '丁'], ['壬', '甲']
  ];
  expected.forEach((list, zi) => {
    const gans = HG.getGanList(zi);
    assert.deepStrictEqual(gans, list.map(g => C.ganIndex(g)), `地支${C.ZHI[zi]}藏干`);
    const detail = HG.get(zi);
    assert.strictEqual(detail.length, list.length);
    detail.forEach((d, k) => assert.strictEqual(d.qi, HG.QI[k], `${C.ZHI[zi]}第${k}气`));
  });
});

test('纳音：60 项完整、代表点抽查', () => {
  assert.strictEqual(NY.NAYIN.length, 60);
  NY.NAYIN.forEach(n => assert.ok(n && n.length >= 2, '纳音名非空'));
  assert.strictEqual(NY.at(0), '海中金');   // 甲子
  assert.strictEqual(NY.at(1), '海中金');   // 乙丑
  assert.strictEqual(NY.at(18), '杨柳木');  // 壬午? 序号核对
  assert.strictEqual(NY.at(30), '沙中金');  // 甲午
  assert.strictEqual(NY.at(54), '天上火');  // 戊午
  assert.strictEqual(NY.at(59), '大海水');  // 癸亥
  // 循环安全
  assert.strictEqual(NY.at(60), NY.at(0));
  assert.strictEqual(NY.at(-1), NY.at(59));
});

test('旬空：六甲旬与旬空对', () => {
  assert.strictEqual(XK.xunOf(0), '甲子');
  assert.strictEqual(XK.xunOf(9), '甲子');
  assert.strictEqual(XK.xunOf(10), '甲戌');
  assert.strictEqual(XK.xunOf(20), '甲申');
  assert.strictEqual(XK.xunOf(30), '甲午');
  assert.strictEqual(XK.xunOf(40), '甲辰');
  assert.strictEqual(XK.xunOf(50), '甲寅');
  assert.deepStrictEqual(XK.xunKongNames(0), ['戌', '亥']);   // 甲子旬空戌亥
  assert.deepStrictEqual(XK.xunKongNames(10), ['申', '酉']);  // 甲戌旬空申酉
  assert.deepStrictEqual(XK.xunKongNames(20), ['午', '未']);  // 甲申旬空午未
  assert.deepStrictEqual(XK.xunKongNames(30), ['辰', '巳']);  // 甲午旬空辰巳
  assert.deepStrictEqual(XK.xunKongNames(40), ['寅', '卯']);  // 甲辰旬空寅卯
  assert.deepStrictEqual(XK.xunKongNames(50), ['子', '丑']);  // 甲寅旬空子丑
});

test('十二长生：阳生阴死（甲木长生亥、死于午；乙木长生午）与同生同死', () => {
  assert.strictEqual(CS.stageOf(0, 11, 'yangShengYinSi'), '长生'); // 甲木长生亥
  assert.strictEqual(CS.stageOf(0, 6, 'yangShengYinSi'), '死');    // 甲木死于午
  assert.strictEqual(CS.stageOf(1, 6, 'yangShengYinSi'), '长生');  // 乙木长生午（阴干逆行）
  assert.strictEqual(CS.stageOf(2, 2, 'yangShengYinSi'), '长生');  // 丙火长生寅
  assert.strictEqual(CS.stageOf(2, 2, 'tongShengTongSi'), '长生'); // 同生同死：火长生寅
  assert.strictEqual(CS.stageOf(1, 11, 'tongShengTongSi'), '长生'); // 同生同死：乙木长生亥
  assert.strictEqual(CS.stageOf(4, 8, 'tongShengTongSi'), '长生');  // 同生同死：戊土长生申
  for (let g = 0; g < 10; g++) {
    for (let z = 0; z < 12; z++) {
      assert.ok(CS.stageOf(g, z, 'yangShengYinSi'), `长生(${g},${z}) 非空`);
      assert.ok(CS.stageOf(g, z, 'tongShengTongSi'), `同生同死(${g},${z}) 非空`);
    }
  }
});

test('五虎遁与五鼠遁：口诀表全量', () => {
  // 五虎遁：年干 → 正月（寅月）月干：甲己丙 乙庚戊 丙辛庚 丁壬壬 戊癸甲
  const yearToZhengYue = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
  for (let y = 0; y < 10; y++) {
    assert.strictEqual(TD.monthGanOf(y, 2), yearToZhengYue[y], `五虎遁${C.GAN[y]}年寅月`);
  }
  // 寅月往后顺推：庚年正月戊寅(4,2)，二月己卯(5,3)
  assert.strictEqual(TD.monthGanOf(6, 3), 5);
  assert.strictEqual(TD.monthGanOf(6, 0), 4); // 庚年子月戊子（正月戊+10）
  // 五鼠遁：日干 → 子时时干：甲己甲 乙庚丙 丙辛戊 丁壬庚 戊癸壬
  const dayToZi = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
  for (let d = 0; d < 10; d++) {
    assert.strictEqual(TD.timeGanOf(d, 0), dayToZi[d], `五鼠遁${C.GAN[d]}日子时`);
  }
  // 子时后顺推：甲日子时甲子(0)，丑时乙丑(1)
  assert.strictEqual(TD.timeGanOf(0, 1), 1);
});

test('真太阳时：经度偏移、均时差量级、跨日平移', () => {
  assert.strictEqual(ST.meanSolarOffsetMin(120, 120), 0);
  assert.ok(Math.abs(ST.meanSolarOffsetMin(116.4, 120) - (-14.4)) < 1e-9, '北京经度偏移约 -14.4 分');
  const eot = ST.equationOfTimeMinutes(2024, 2, 15);
  assert.ok(eot >= -17 && eot <= 15, `均时差 2 月应在合理区间，实际 ${eot}`);
  const r = ST.applyOffset({ y: 2024, m: 1, d: 1, h: 23, min: 50 }, 20);
  assert.deepStrictEqual(r, { y: 2024, m: 1, d: 2, h: 0, min: 10 });
  const r2 = ST.applyOffset({ y: 2024, m: 1, d: 1, h: 0, min: 10 }, -20);
  assert.deepStrictEqual(r2, { y: 2023, m: 12, d: 31, h: 23, min: 50 });
  assert.strictEqual(ST.dayOfYear(2024, 1, 1), 1);
});
