export const dashboardHtml = String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>Pack Sentinel</title>
<style>
:root{--fir:#071310;--pine:#10231f;--moss:#1d3530;--signal:#7fb6ae;--fog:#9caaa6;--bone:#e8e8df;--danger:#d88471;--warn:#d7b56d}
*{box-sizing:border-box}body{margin:0;background:var(--fir);color:var(--bone);font:15px/1.5 system-ui,sans-serif}
header{display:flex;justify-content:space-between;align-items:center;padding:24px 5vw;border-bottom:1px solid var(--moss)}
.brand{display:flex;gap:14px;align-items:center}.mark{font:700 25px Georgia,serif;color:var(--signal)}h1{font:400 24px Georgia,serif;margin:0}.muted{color:var(--fog)}
main{max-width:1280px;margin:auto;padding:45px 5vw}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--moss);margin-bottom:48px}
.metric{background:var(--pine);padding:24px}.metric strong{font:400 38px Georgia,serif;display:block}.metric span{text-transform:uppercase;letter-spacing:.14em;font-size:11px;color:var(--fog)}
.toolbar{display:flex;justify-content:space-between;align-items:end;margin-bottom:18px}h2{font:400 34px Georgia,serif;margin:0}button,select{background:var(--pine);border:1px solid var(--moss);color:var(--bone);padding:10px 14px}
table{width:100%;border-collapse:collapse;background:var(--pine)}th,td{text-align:left;padding:15px;border-bottom:1px solid var(--moss);vertical-align:top}th{color:var(--fog);font-size:11px;text-transform:uppercase;letter-spacing:.12em}
.severity{font-size:11px;text-transform:uppercase;letter-spacing:.08em}.critical,.high{color:var(--danger)}.medium{color:var(--warn)}.low,.info{color:var(--signal)}
.status{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--signal);margin-right:7px}.empty{padding:54px;text-align:center;color:var(--fog)}
@media(max-width:750px){.summary{grid-template-columns:1fr 1fr}.hide-small{display:none}table{font-size:13px}th,td{padding:11px}}
</style></head><body><header><div class="brand"><span class="mark">W</span><div><h1>Pack Sentinel</h1><div class="muted">Local security operations</div></div></div><div><span class="status"></span><span id="health">connecting</span></div></header>
<main><section class="summary"><div class="metric"><strong id="open">—</strong><span>Open incidents</span></div><div class="metric"><strong id="critical">—</strong><span>Critical</span></div><div class="metric"><strong id="signals">—</strong><span>Signals</span></div><div class="metric"><strong id="collectors">—</strong><span>Collectors running</span></div></section>
<section><div class="toolbar"><div><div class="muted">Latest assessment</div><h2>Incident timeline</h2></div><button id="refresh">Refresh</button></div><div id="content"></div></section></main>
<script>
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function refresh(){try{const [health,incidents,signals,state]=await Promise.all(['/api/v1/health','/api/v1/incidents','/api/v1/signals?limit=200','/api/v1/state'].map(u=>fetch(u).then(r=>{if(!r.ok)throw Error(r.status);return r.json()})));document.querySelector('#health').textContent='operational';document.querySelector('#open').textContent=incidents.items.filter(x=>x.status==='open').length;document.querySelector('#critical').textContent=incidents.items.filter(x=>x.severity==='critical'&&x.status==='open').length;document.querySelector('#signals').textContent=health.signals;document.querySelector('#collectors').textContent=state.running.length;const rows=incidents.items.map(x=>'<tr><td><span class="severity '+escapeHtml(x.severity)+'">'+escapeHtml(x.severity)+'</span></td><td><strong>'+escapeHtml(x.title)+'</strong><br><span class="muted">'+escapeHtml(x.summary)+'</span></td><td class="hide-small">'+escapeHtml(x.host)+'</td><td>'+escapeHtml(x.status)+'</td><td class="hide-small">'+new Date(x.updatedAt).toLocaleString()+'</td></tr>').join('');document.querySelector('#content').innerHTML=rows?'<table><thead><tr><th>Severity</th><th>Incident</th><th class="hide-small">Host</th><th>Status</th><th class="hide-small">Updated</th></tr></thead><tbody>'+rows+'</tbody></table>':'<div class="empty">No incidents recorded. Collector findings will appear here.</div>'}catch(e){document.querySelector('#health').textContent='unavailable'}}
document.querySelector('#refresh').addEventListener('click',refresh);refresh();setInterval(refresh,15000);
</script></body></html>`;
