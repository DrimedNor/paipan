/* 探针：验证 lunar-javascript 关键行为，供引擎封装参考（非测试文件） */
'use strict';
var NS = require('../js/vendor/lunar.js');
var Solar = NS.Solar;
var Lunar = NS.Lunar;

function show(label, v) { console.log(label, '=', JSON.stringify(v)); }

// 1. 闰月输入：2023 闰二月十五 → 公历？
var leap = Lunar.fromYmd(2023, -2, 15);
show('闰二月十五 solar', leap.getSolar().toYmd());

// 2. 晚子时 sect：1988-01-01 23:30
var solar = Solar.fromYmdHms(1988, 1, 1, 23, 30, 0);
var lunar = solar.getLunar();
var bz1 = lunar.getEightChar(); bz1.setSect(1);
var bz2 = lunar.getEightChar(); bz2.setSect(2);
show('sect1 日柱', bz1.getDay());
show('sect2 日柱', bz2.getDay());
show('sect1 年/月/时', bz1.getYear() + '/' + bz1.getMonth() + '/' + bz1.getTime());
show('sect1 日干', bz1.getDayGan());
show('sect1 日支', bz1.getDayZhi());

// 3. 上一节（月令）
var prevJie = lunar.getPrevJie();
show('prevJie 名', prevJie.getJieQi());
show('prevJie solar', prevJie.getSolar().toYmdHms());
var nextJie = lunar.getNextJie();
show('nextJie 名', nextJie.getJieQi());
show('nextJie solar', nextJie.getSolar().toYmdHms());

// 4. 正月初一年界 vs 立春年界：2024-02-05（正月初一 2024-02-10，2月5日尚在癸卯年腊月）
var s2 = Solar.fromYmdHms(2024, 2, 5, 10, 0, 0);
var l2 = s2.getLunar();
show('2024-02-05 农历', l2.toString());
show('正月初一年柱', l2.getYearInGanZhi());
show('立春精确年柱', l2.getYearInGanZhiExact());
show('立春(按日)年柱', l2.getYearInGanZhiByLiChun());
var bz3 = l2.getEightChar(); bz3.setSect(1);
show('八字月柱', bz3.getMonth());
show('八字年柱', bz3.getYear());

// 5. 大运：男，1988-01-01 23:30（立春前 → 丁卯年）
var yun = bz1.getYun(1, 1);
show('大运顺逆', yun.isForward());
show('起运偏移 年月日时', yun.getStartYear() + '/' + yun.getStartMonth() + '/' + yun.getStartDay() + '/' + yun.getStartHour());
show('起运公历', yun.getStartSolar().toYmdHms());
var dy = yun.getDaYun(8);
show('大运1', dy[1].getGanZhi() + ' 起' + dy[1].getStartAge() + '岁(' + dy[1].getStartYear() + ')-' + dy[1].getEndAge() + '岁(' + dy[1].getEndYear() + ')');
show('大运2', dy[2].getGanZhi() + ' 起' + dy[2].getStartAge() + '岁(' + dy[2].getStartYear() + ')');
show('起运前', '出生年' + dy[0].getStartYear() + '至' + dy[0].getEndYear() + ' 岁' + dy[0].getStartAge() + '-' + dy[0].getEndAge());

// 6. 时辰支：23:30 → 子？
show('时柱', bz1.getTime() + ' 时支=' + bz1.getTimeZhi());

// 7. subtractMinute 与 subtract
show('subtractMinute(前后节气)', nextJie.getSolar().subtractMinute(prevJie.getSolar()));
show('subtract(天数)', nextJie.getSolar().subtract(prevJie.getSolar()));

// 8. 八字藏干/纳音/旬空/长生样例
show('年藏干', bz1.getYearHideGan());
show('年纳音', bz1.getYearNaYin());
show('年旬空', bz1.getYearXunKong());
show('日长生', bz1.getDayDiShi());
show('月长生', bz1.getMonthDiShi());
show('年十神(天干)', bz1.getYearShiShenGan());
show('日干十神', bz1.getDayShiShenGan());
show('天干五行', bz1.getYearWuXing());
