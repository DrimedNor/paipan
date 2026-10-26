/**
 * 八字排盘 · 界面逻辑（app.js）
 * 依赖 BaziCore（引擎各模块）与全局 Solar/Lunar（lunar-javascript）。
 * 数据仅存本机 localStorage；排盘完全本地完成。
 */
(function () {
  'use strict';

  var C = BaziCore.Constants;
  var GZ = BaziCore.GanZhi;
  var Rules = BaziCore.Rules;
  var Chart = BaziCore.Chart;

  var LS = { rules: 'bazi.rules', last: 'bazi.last', records: 'bazi.records' };

  function $(id) { return document.getElementById(id); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 隐私模式下忽略 */ } }
  function load(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtD(d) { return d.y + '-' + pad2(d.m) + '-' + pad2(d.d); }
  function fmtT(t) { return pad2(t.h) + ':' + pad2(t.min); }
  function fmtDT(d) { return fmtD(d) + ' ' + fmtT(d); }

  var state = {
    settings: load(LS.rules, null),
    lastInput: load(LS.last, null),
    currentChart: null
  };
  state.settings = { rules: Rules.snapshot(state.settings && state.settings.rules) };

  // ---------- 工具 ----------
  function fillSelect(sel, list) {
    sel.innerHTML = '';
    list.forEach(function (it) {
      var o = document.createElement('option');
      o.value = it.value;
      o.textContent = it.label;
      sel.appendChild(o);
    });
  }

  function wxClass(name) {
    return { '木': 'wx-mu', '火': 'wx-huo', '土': 'wx-tu', '金': 'wx-jin', '水': 'wx-shui' }[name] || '';
  }

  // ---------- 视图切换 ----------
  function showView(name) {
    $$('.view').forEach(function (v) { v.classList.remove('active'); });
    $('view-' + name).classList.add('active');
    $$('.nav-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-view') === name); });
  }

  // ---------- 输入表单 ----------
  function buildStaticOptions() {
    var mSel = $('f-m'), dSel = $('f-d'), hSel = $('f-h'), minSel = $('f-min');
    var months = [];
    for (var m = 1; m <= 12; m++) months.push({ value: m, label: m + '月' });
    fillSelect(mSel, months);
    var days = [];
    for (var d = 1; d <= 31; d++) days.push({ value: d, label: d + '日' });
    fillSelect(dSel, days);
    var hs = [], ms = [];
    for (var h = 0; h < 24; h++) hs.push({ value: h, label: pad2(h) + '时' });
    for (var mi = 0; mi < 60; mi++) ms.push({ value: mi, label: pad2(mi) + '分' });
    fillSelect(hSel, hs);
    fillSelect(minSel, ms);
    mSel.value = 1;
    dSel.value = 1;
    hSel.value = 12;
    minSel.value = 0;
  }

  function bindInputToggles() {
    $('f-dateType').addEventListener('change', function () {
      $('leap-wrap').classList.toggle('hidden', this.value !== 'lunar');
    });
    $('f-correction').addEventListener('change', function () {
      $('f-place').parentElement.classList.toggle('needs-lon', this.value !== 'none');
    });
  }

  function gatherInput() {
    var gender = parseInt($$('input[name="gender"]').filter(function (r) { return r.checked; })[0].value, 10);
    var dateType = $('f-dateType').value;
    var y = parseInt($('f-y').value, 10);
    var m = parseInt($('f-m').value, 10);
    var d = parseInt($('f-d').value, 10);
    var time = { h: parseInt($('f-h').value, 10), min: parseInt($('f-min').value, 10) };
    var input = {
      name: $('f-name').value.trim(),
      gender: gender,
      dateType: dateType,
      time: time,
      birthPlace: null
    };
    if (dateType === 'lunar') {
      input.lunarInput = { y: y, m: m, d: d, leap: $('f-leap').checked };
    } else {
      input.solar = { y: y, m: m, d: d };
    }
    var place = $('f-place').value.trim();
    var lonRaw = $('f-lon').value.trim();
    if (place || lonRaw) {
      input.birthPlace = { label: place || '', longitude: lonRaw === '' ? null : parseFloat(lonRaw) };
    }
    return input;
  }

  function showInputError(msg) {
    var box = $('input-error');
    box.textContent = msg || '';
    box.classList.toggle('hidden', !msg);
  }

  // ---------- 排盘与渲染 ----------
  function doChart(input, rulesOverride) {
    var rules = rulesOverride || state.settings.rules;
    var result = Chart.compute({
      name: input.name, gender: input.gender, dateType: input.dateType,
      solar: input.solar, lunarInput: input.lunarInput, time: input.time,
      birthPlace: input.birthPlace, rules: rules
    });
    if (!result.ok) { showInputError(result.error.message); return null; }
    showInputError('');
    state.lastInput = input;
    store(LS.last, input);
    state.currentChart = result.chart;
    renderChart(result.chart);
    showView('chart');
    return result.chart;
  }

  function renderChart(ch) {
    // 头部
    var head = $('chart-head');
    head.innerHTML = '';
    var h2 = document.createElement('h2');
    h2.textContent = (ch.meta.name ? ch.meta.name + ' · ' : '') + ch.dayMaster.gan + ch.pillars.day.zhi + ' 日主（' + (ch.dayMaster.yinYang === 1 ? '阳' : '阴') + ch.dayMaster.wuXing + '）';
    var sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = '出生：' + fmtDT(ch.meta.timeOriginal) + (ch.meta.timeInfo ? '（校正后 ' + fmtDT(ch.meta.timeUsed) + '）' : '') +
      '　农历：' + ch.lunarStr + '　' + ch.yearBoundaryLabel + ' · ' + ch.dayBoundaryLabel;
    head.appendChild(h2);
    head.appendChild(sub);

    // 警示
    var wBox = $('warnings');
    wBox.innerHTML = '';
    ch.warnings.forEach(function (w) {
      var div = document.createElement('div');
      div.className = 'warn';
      div.textContent = '⚠ ' + w.message;
      wBox.appendChild(div);
    });

    // 四柱
    var pillars = $('pillars');
    pillars.innerHTML = '';
    ['year', 'month', 'day', 'time'].forEach(function (k) {
      var p = ch.pillars[k];
      var card = document.createElement('div');
      card.className = 'pillar' + (k === 'day' ? ' day' : '');

      var label = document.createElement('div');
      label.className = 'p-label';
      label.textContent = p.label;

      var gan = document.createElement('div');
      gan.className = 'p-gan';
      var ganChar = document.createElement('span');
      ganChar.className = wxClass(p.ganWuXing);
      ganChar.textContent = p.gan;
      gan.appendChild(ganChar);
      if (k === 'day') {
        var badge = document.createElement('span');
        badge.className = 'day-badge';
        badge.textContent = '日主';
        gan.appendChild(badge);
      }

      var shi = document.createElement('div');
      shi.className = 'p-shi';
      shi.textContent = p.shiShenGan;

      var zhi = document.createElement('div');
      zhi.className = 'p-zhi ' + wxClass(p.zhiWuXing);
      zhi.textContent = p.zhi;

      var hide = document.createElement('div');
      hide.className = 'p-hide';
      p.hideGan.forEach(function (hg) {
        var s = document.createElement('span');
        s.className = 'hg';
        s.textContent = hg.gan + '·' + hg.shiShen;
        hide.appendChild(s);
      });

      var meta = document.createElement('div');
      meta.className = 'p-meta';
      meta.textContent = '纳音 ' + p.naYin + ' ｜ ' + p.diShi + ' ｜ 空亡 ' + p.xunKong.join('、');

      card.appendChild(label);
      card.appendChild(gan);
      card.appendChild(shi);
      card.appendChild(zhi);
      card.appendChild(hide);
      card.appendChild(meta);
      pillars.appendChild(card);
    });

    // 辅助信息
    var aux = $('aux-info');
    aux.innerHTML = '';
    function kv(k, v) {
      var row = document.createElement('div');
      row.className = 'kv';
      var kd = document.createElement('span'); kd.className = 'k'; kd.textContent = k;
      var vd = document.createElement('span'); vd.className = 'v'; vd.textContent = v;
      row.appendChild(kd); row.appendChild(vd);
      aux.appendChild(row);
    }
    kv('出生公历', fmtDT(ch.meta.timeOriginal) + '（' + ch.meta.timezoneOffset + ' 时区）');
    kv('农历', ch.lunarStr);
    if (ch.meta.lunarInput) kv('农历输入', ch.meta.lunarInput.y + '年' + (ch.meta.lunarInput.leap ? '闰' : '') + ch.meta.lunarInput.m + '月' + ch.meta.lunarInput.d + '日');
    kv('出生地', ch.meta.birthPlace ? (ch.meta.birthPlace.label || '未命名') + (ch.meta.birthPlace.longitude != null ? '（经度 ' + ch.meta.birthPlace.longitude + '°E）' : '（未填经度）') : '未填写');
    if (ch.meta.timeInfo) {
      kv('时间校正', '原始 ' + fmtDT(ch.meta.timeInfo.original) + ' → 校正 ' + fmtDT(ch.meta.timeInfo.corrected));
      kv('校正依据', ch.meta.timeInfo.basis + '（总偏移 ' + ch.meta.timeInfo.offsetMin + ' 分钟）');
    } else {
      kv('时间校正', '未校正，直接采用所填钟表时间');
    }
    kv('年柱年界', ch.yearBoundaryLabel + (ch.monthGanRecomputed ? '（月干已按所选年干重推）' : ''));
    if (ch.jieInfo) {
      kv('月令依据', '上一节 ' + ch.jieInfo.prevJieName + ' ' + fmtDT(ch.jieInfo.prevJieTime) + (ch.jieInfo.nextJieName ? '；下一节 ' + ch.jieInfo.nextJieName + ' ' + fmtDT(ch.jieInfo.nextJieTime) : ''));
    }
    kv('日界 / 子时规则', ch.dayBoundaryLabel);
    kv('时干口径', '按所选日界下的日干以五鼠遁推算（与日柱自洽）');

    // 大运
    var dayun = $('dayun-info');
    dayun.innerHTML = '';
    var dy = ch.daYun;
    var dHead = document.createElement('p');
    dHead.textContent = dy.forwardDesc + '；起运折算：' + (dy.daYunRule === 'minute' ? '分钟级精确（3天=1年、1天=4个月、1时辰=10天）' : '时辰级近似·传统（3天=1年、1天=4个月、1时辰=10天）') +
      '；起运 ' + dy.startYear + '年' + dy.startMonth + '个月' + dy.startDay + '天' + dy.startHour + '时，公历 ' + fmtDT(dy.startSolar) + '，虚岁 ' + dy.startAge + ' 岁起运。';
    dayun.appendChild(dHead);
    var table = document.createElement('table');
    table.className = 'dayun-table';
    var trH = document.createElement('tr');
    ['', '大运干支', '公历年份', '虚岁'].forEach(function (t) {
      var th = document.createElement('th'); th.textContent = t; trH.appendChild(th);
    });
    table.appendChild(trH);
    var trPre = document.createElement('tr');
    trPre.className = 'pre';
    [['0', '出生至起运前', dy.pre.startYear + '-' + dy.pre.endYear, dy.pre.startAge + '-' + dy.pre.endAge + ' 岁']].forEach(function (r) {
      r.forEach(function (t, i) {
        var td = document.createElement('td');
        if (i === 1) td.textContent = t;
        else td.textContent = t;
        trPre.appendChild(td);
      });
    });
    table.appendChild(trPre);
    dy.list.forEach(function (dyi) {
      var tr = document.createElement('tr');
      [dyi.index, dyi.ganzhi, dyi.startYear + '-' + dyi.endYear, dyi.startAge + '-' + dyi.endAge + ' 岁'].forEach(function (t) {
        var td = document.createElement('td');
        td.textContent = t;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    dayun.appendChild(table);

    // 五行
    var five = $('five-info');
    five.innerHTML = '';
    var order = ['木', '火', '土', '金', '水'];
    function fiveBlock(title, data) {
      var block = document.createElement('div');
      block.className = 'five-block';
      var h = document.createElement('h4');
      h.textContent = title + '：' + order.map(function (wx) { return wx + ' ' + (data[wx] || 0); }).join('　') + '　合计 ' + data['总'];
      block.appendChild(h);
      var bar = document.createElement('div');
      bar.className = 'five-bar';
      order.forEach(function (wx) {
        var s = document.createElement('span');
        s.className = wxClass(wx).replace('wx-', '');
        s.textContent = wx + (data[wx] || 0);
        bar.appendChild(s);
      });
      block.appendChild(bar);
      five.appendChild(block);
    }
    fiveBlock('四柱八字（4 干 + 4 支本气）', ch.fiveElements.eightChars);
    fiveBlock('天干五行（4 干）', ch.fiveElements.ganOnly);
    fiveBlock('地支本气（4 支本气藏干）', ch.fiveElements.zhiBenQi);
    fiveBlock('藏干五行（全部藏干）', ch.fiveElements.zhiHide);

    // 排盘依据
    var basis = $('basis-info');
    basis.innerHTML = '';
    var ul = document.createElement('ul');
    [
      '年柱年界：' + Rules.OPTION_DESC.yearBoundary[ch.rules.yearBoundary],
      '日界与子时：' + Rules.OPTION_DESC.dayBoundary[ch.rules.dayBoundary],
      '时间校正：' + Rules.OPTION_DESC.timeCorrection[ch.rules.timeCorrection] + (ch.meta.timeInfo ? '（实际已校正，依据见辅助信息）' : ''),
      '十二长生：' + Rules.OPTION_DESC.changShengRule[ch.rules.changShengRule],
      '大运起运折算：' + Rules.OPTION_DESC.daYunRule[ch.rules.daYunRule],
      '时区：UTC+' + ch.rules.timezoneOffset + '（标准经线 ' + (ch.rules.timezoneOffset * 15) + '°E）',
      '时干口径：本盘时干按所选日界下的日干以五鼠遁推算（00:00 换日规则下与部分软件按次日推时干的口径不同，属流派差异）',
      '历法：公历↔农历与节气交接时刻由 lunar-javascript 计算；真太阳时均时差为近似公式（误差约 ±1–2 分钟）',
      '待验证项：均时差高精度口径、同生同死流派中土长生位派别、大运时辰级折算整点 23 时约定、跨时区极端样张（见 docs/待验证项.md），本盘不作已确认结论',
      '声明：命理内容属中国传统文化体系，不构成科学证实的预测结论'
    ].forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    basis.appendChild(ul);
  }

  // ---------- 复制 ----------
  function chartText(ch) {
    var lines = [];
    lines.push('【八字排盘】' + (ch.meta.name ? ch.meta.name + ' ' : '') + ch.dayMaster.gan + ch.pillars.day.zhi + '日主');
    lines.push('出生：' + fmtDT(ch.meta.timeOriginal) + (ch.meta.timeInfo ? '（校正后 ' + fmtDT(ch.meta.timeUsed) + '）' : '') + '　农历：' + ch.lunarStr);
    ['year', 'month', 'day', 'time'].forEach(function (k) {
      var p = ch.pillars[k];
      lines.push(p.label + '：' + p.ganzhi + '（' + p.shiShenGan + '）　纳音 ' + p.naYin + '　' + p.diShi + '　空亡 ' + p.xunKong.join('、') + '　藏干 ' + p.hideGan.map(function (h) { return h.gan + h.shiShen; }).join(' '));
    });
    var dy = ch.daYun;
    lines.push('大运：' + dy.forwardDesc + '，' + dy.startYear + '年' + dy.startMonth + '个月' + dy.startDay + '天' + dy.startHour + '时起运（公历 ' + fmtDT(dy.startSolar) + '，虚岁 ' + dy.startAge + '）');
    dy.list.forEach(function (d) { lines.push('  ' + d.index + '. ' + d.ganzhi + ' ' + d.startYear + '-' + d.endYear + '（' + d.startAge + '-' + d.endAge + ' 岁）'); });
    var f = ch.fiveElements;
    lines.push('五行（四柱八字）：' + ['木', '火', '土', '金', '水'].map(function (wx) { return wx + f.eightChars[wx]; }).join(' '));
    lines.push('规则：' + ch.yearBoundaryLabel + '；' + ch.dayBoundaryLabel + '；时间校正 ' + (ch.meta.timeInfo ? '已校正' : '未校正') + '；' + Rules.OPTION_DESC.changShengRule[ch.rules.changShengRule] + '；' + Rules.OPTION_DESC.daYunRule[ch.rules.daYunRule]);
    lines.push('声明：命理内容属中国传统文化体系，不构成科学证实的预测结论。');
    return lines.join('\n');
  }

  // ---------- 历史记录 ----------
  function getRecords() { return load(LS.records, []); }
  function saveRecord() {
    if (!state.currentChart) { alert('当前没有命盘可保存'); return; }
    var recs = getRecords();
    recs.unshift({
      createdAt: Date.now(),
      name: state.lastInput.name,
      input: state.lastInput,
      rules: state.currentChart.rules,
      summary: state.currentChart.pillars.year.ganzhi + '/' + state.currentChart.pillars.month.ganzhi + '/' + state.currentChart.pillars.day.ganzhi + '/' + state.currentChart.pillars.time.ganzhi
    });
    if (recs.length > 100) recs.length = 100;
    store(LS.records, recs);
    renderRecords();
    alert('已保存到历史记录（仅本机浏览器）。');
  }
  function renderRecords() {
    var recs = getRecords();
    var empty = $('records-empty');
    var list = $('records-list');
    list.innerHTML = '';
    empty.classList.toggle('hidden', recs.length > 0);
    recs.forEach(function (r, idx) {
      var li = document.createElement('li');
      var t = document.createElement('div');
      t.className = 'r-title';
      t.textContent = (r.name || '未命名') + '　' + r.summary;
      var sub = document.createElement('div');
      sub.className = 'r-sub';
      var d = new Date(r.createdAt);
      sub.textContent = (r.input.dateType === 'lunar' ? '农历' : '公历') + ' ' + JSON.stringify(r.input.dateType === 'lunar' ? r.input.lunarInput : r.input.solar) + ' ' + fmtT(r.input.time) + '｜规则：' +
        (r.rules.yearBoundary === 'lichun' ? '立春' : '正月初一') + ' / ' + (r.rules.dayBoundary === '00' ? '00:00' : '23:00') + ' / ' + (r.rules.timeCorrection === 'none' ? '不校正' : r.rules.timeCorrection === 'mean' ? '平太阳时' : '真太阳时') +
        '　保存于 ' + (d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()));
      li.appendChild(t);
      li.appendChild(sub);
      li.addEventListener('click', function () {
        state.settings.rules = Rules.snapshot(r.rules);
        store(LS.rules, { rules: state.settings.rules });
        syncRulesForm();
        doChart(r.input);
      });
      list.appendChild(li);
    });
  }

  // ---------- 规则设置 ----------
  function buildRulesForm() {
    function bindRule(selId, descId, key, options) {
      var sel = $(selId);
      fillSelect(sel, options.map(function (v) { return { value: v, label: Rules.OPTION_DESC[key][v] }; }));
      sel.value = state.settings.rules[key];
      sel.addEventListener('change', function () {
        $(descId).textContent = Rules.OPTION_DESC[key][sel.value];
      });
      $(descId).textContent = Rules.OPTION_DESC[key][sel.value];
    }
    bindRule('r-yearBoundary', 'desc-yearBoundary', 'yearBoundary', ['lichun', 'chunjie']);
    bindRule('r-dayBoundary', 'desc-dayBoundary', 'dayBoundary', ['00', '23']);
    bindRule('r-changShengRule', 'desc-changShengRule', 'changShengRule', ['yangShengYinSi', 'tongShengTongSi']);
    bindRule('r-daYunRule', 'desc-daYunRule', 'daYunRule', ['hour', 'minute']);
    var tzSel = $('r-timezoneOffset');
    var tz = [];
    for (var i = -12; i <= 14; i++) tz.push({ value: i, label: 'UTC' + (i >= 0 ? '+' : '') + i + '（标准经线 ' + i * 15 + '°' + (i >= 0 ? 'E' : 'W') + '）' });
    fillSelect(tzSel, tz);
    tzSel.value = state.settings.rules.timezoneOffset;
  }
  function syncRulesForm() {
    var r = state.settings.rules;
    ['r-yearBoundary', 'r-dayBoundary', 'r-changShengRule', 'r-daYunRule'].forEach(function (id) {
      $(id).value = r[id.replace('r-', '')];
    });
    $('r-timezoneOffset').value = r.timezoneOffset;
    ['yearBoundary', 'dayBoundary', 'changShengRule', 'daYunRule'].forEach(function (k) {
      $('desc-' + k).textContent = Rules.OPTION_DESC[k][state.settings.rules[k]];
    });
  }

  // ---------- 初始化 ----------
  function init() {
    buildStaticOptions();
    bindInputToggles();
    buildRulesForm();

    // 输入提交
    $('input-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = gatherInput();
      if (input.solar === undefined && input.lunarInput === undefined) {
        showInputError('请填写出生日期');
        return;
      }
      doChart(input);
    });

    // 视图切换
    $$('.nav-btn').forEach(function (b) {
      b.addEventListener('click', function () { showView(b.getAttribute('data-view')); });
    });

    // 规则保存
    $('rules-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var newRules = Rules.snapshot(state.settings.rules);
      newRules.yearBoundary = $('r-yearBoundary').value;
      newRules.dayBoundary = $('r-dayBoundary').value;
      newRules.changShengRule = $('r-changShengRule').value;
      newRules.daYunRule = $('r-daYunRule').value;
      newRules.timezoneOffset = parseInt($('r-timezoneOffset').value, 10);
      state.settings.rules = newRules;
      store(LS.rules, { rules: newRules });
      if (state.lastInput) {
        doChart(state.lastInput);
        alert('规则已保存，命盘已按新规则重新计算。');
      } else {
        showView('input');
        alert('规则已保存，将在下次排盘时生效。');
      }
    });

    // 复制 / 打印 / 保存
    $('btn-copy').addEventListener('click', function () {
      if (!state.currentChart) return;
      var text = chartText(state.currentChart);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { alert('已复制排盘文字。'); }, function () { fallbackCopy(text); });
      } else { fallbackCopy(text); }
    });
    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); alert('已复制排盘文字。'); } catch (e) { alert('复制失败，请手动选择复制。'); }
      document.body.removeChild(ta);
    }
    $('btn-print').addEventListener('click', function () { window.print(); });
    $('btn-save').addEventListener('click', saveRecord);
    $('btn-records-clear').addEventListener('click', function () {
      if (confirm('确定清空全部排盘记录？')) { store(LS.records, []); renderRecords(); }
    });

    renderRecords();
    showView('input');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
