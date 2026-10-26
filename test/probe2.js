/* 探针2：日柱三口径 + sect 语义 + 节气名 + 大运 */
'use strict';
var NS = require('../js/vendor/lunar.js');
var Solar = NS.Solar;
var Lunar = NS.Lunar;
function show(l, v) { console.log(l, '=', JSON.stringify(v)); }

function probe(label, y, m, d, h, min) {
  console.log('--- ' + label + ' ' + y + '-' + m + '-' + d + ' ' + h + ':' + min + ' ---');
  var solar = Solar.fromYmdHms(y, m, d, h, min, 0);
  var lunar = solar.getLunar();
  show('lunar solar', lunar.getSolar().toYmdHms());
  show('日柱(标准)', lunar.getDayInGanZhi());
  show('日柱Exact(23:00换日)', lunar.getDayInGanZhiExact());
  show('日柱Exact2(00:00换日)', lunar.getDayInGanZhiExact2());
  var b1 = lunar.getEightChar(); b1.setSect(1);
  var b2 = lunar.getEightChar(); b2.setSect(2);
  show('八字 sect1 日', b1.getDay());
  show('八字 sect2 日', b2.getDay());
  show('八字 sect1 时', b1.getTime());
  show('八字 sect2 时', b2.getTime());
  show('八字 sect1 时支', b1.getTimeZhi());
  show('八字 sect1 年', b1.getYear());
  show('八字 sect1 月', b1.getMonth());
  show('八字 sect1 年支', b1.getYearZhi());
  show('八字 sect1 月支', b1.getMonthZhi());
  return lunar;
}

probe('晚子时23:30', 1988, 1, 1, 23, 30, 0);
probe('亥时22:30', 1988, 1, 1, 22, 30, 0);
probe('子初00:30', 1988, 1, 2, 0, 30, 0);
probe('午时12:00', 1988, 1, 2, 12, 0, 0);

// 节气名
var l = Solar.fromYmdHms(2024, 2, 5, 10, 0, 0).getLunar();
var pj = l.getPrevJie();
show('prevJie getName', pj.getName());
show('prevJie solar', pj.getSolar().toYmdHms());
var nj = l.getNextJie();
show('nextJie getName', nj.getName());
show('nextJie solar', nj.getSolar().toYmdHms());
show('currentJieQi', l.getCurrentJieQi() ? l.getCurrentJieQi().getName() : null);

// 大运 sect 差异
var lunar23 = Solar.fromYmdHms(1988, 1, 1, 23, 30, 0).getLunar();
var bz23 = lunar23.getEightChar(); bz23.setSect(1);
var y1 = bz23.getYun(1, 1);
var y2 = bz23.getYun(1, 2);
show('yun sect1 起运 年月日时', y1.getStartYear() + '/' + y1.getStartMonth() + '/' + y1.getStartDay() + '/' + y1.getStartHour());
show('yun sect2 起运 年月日时', y2.getStartYear() + '/' + y2.getStartMonth() + '/' + y2.getStartDay() + '/' + y2.getStartHour());
show('yun sect1 起运公历', y1.getStartSolar().toYmdHms());
show('yun sect1 大运1', y1.getDaYun(8)[1].getGanZhi() + ' 起' + y1.getDaYun(8)[1].getStartAge() + '岁');
show('yun sect1 大运8', y1.getDaYun(8)[8].getGanZhi() + ' 起' + y1.getDaYun(8)[8].getStartAge() + '岁');

// 时辰指数：23:30 与 00:30
show('23:30 时辰支', LunarUtil_getTimeZhiIndex('23:30'));
show('00:30 时辰支', LunarUtil_getTimeZhiIndex('00:30'));
show('22:30 时辰支', LunarUtil_getTimeZhiIndex('22:30'));
function LunarUtil_getTimeZhiIndex(hm) {
  var x = 1;
  for (var i = 1; i < 22; i += 2) {
    if (hm >= ((i < 10 ? '0' : '') + i + ':00') && hm <= ((i + 1 < 10 ? '0' : '') + (i + 1) + ':59')) { return x; }
    x++;
  }
  return 0;
}
