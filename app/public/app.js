// Minimal client for SSE + broadcast
const API = {
  onEvent(handler){
    const es = new EventSource('/events');
    es.addEventListener('init', (e)=> handler('init', JSON.parse(e.data)));
    es.onmessage = (e)=> handler('message', JSON.parse(e.data||'{}'));
    const types = ['scene','join','poll:start','poll:vote','poll:stop','poll:reveal','persona','timeline:status','media:play','media:stop','social:feature','journey:summary','ops:ping'];
    for (const t of types) es.addEventListener(t, (e)=> handler(t, JSON.parse(e.data||'{}')));
    return es;
  },
  async send(type, payload){
    await fetch('/broadcast', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, payload }) });
  }
};

function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function formatPercent(n){ return `${Math.round(n)}%`; }

window.API = API;
