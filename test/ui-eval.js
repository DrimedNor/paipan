const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
set('f-name', '测试排盘');
set('f-y', '1988');
set('f-m', '1');
set('f-d', '1');
set('f-h', '23');
set('f-min', '30');
const form = document.getElementById('input-form');
if (form.requestSubmit) { form.requestSubmit(); } else { document.getElementById('btn-chart').click(); }
await new Promise(r => setTimeout(r, 400));
return {
  pillarCards: document.querySelectorAll('.pillar').length,
  chartHead: document.querySelector('#chart-head h2') ? document.querySelector('#chart-head h2').textContent : null,
  warnCount: document.querySelectorAll('.warn').length,
  visibleError: document.querySelectorAll('#input-error:not(.hidden)').length,
  activeView: document.querySelector('.view.active').id,
  dayunRows: document.querySelectorAll('.dayun-table tr').length,
  fiveBlocks: document.querySelectorAll('.five-block').length
};
