// SAMBELIX — Mobile-first loader (Google Sheet)
document.addEventListener('DOMContentLoaded', () => {
  /* Fix 100vh iOS */
  function setRealVh(){ document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`); }
  setRealVh(); window.addEventListener('resize', setRealVh); window.addEventListener('orientationchange', setRealVh);

  /* Sumber data: isi salah satu */
  const PUBLISHED_TSV_URL = ""; // opsional: link dari "Publikasikan ke web" (output=tsv)
  const SHARE_LINK = "https://docs.google.com/spreadsheets/d/10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE/edit?usp=drivesdk"; // linkmu

  const { url: DATA_URL, type: DATA_TYPE } = buildDataURL(PUBLISHED_TSV_URL, SHARE_LINK);

  const grid = document.getElementById('menu-container');
  const filtersWrap = document.getElementById('menu-filter-buttons');
  const notice = document.getElementById('menu-notice');

  /* NAV mobile */
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  const backdrop = document.querySelector('.nav-backdrop');
  function setNavOpen(open){
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
  }
  if (burger && nav){
    burger.addEventListener('click', ()=> setNavOpen(!nav.classList.contains('open')));
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=> setNavOpen(false)));
    if (backdrop) backdrop.addEventListener('click', ()=> setNavOpen(false));
    document.addEventListener('keydown', e=>{ if (e.key === 'Escape') setNavOpen(false); });
  }

  /* Load data */
  let allItems = [];
  fetch(DATA_URL)
    .then(r => { if (!r.ok) throw new Error('Fetch gagal'); return r.text(); })
    .then(text => {
      allItems = (DATA_TYPE === 'tsv') ? parseTSV(text) : parseCSV(text);
      if (!allItems.length) throw new Error('Data kosong/format salah');
      createFilters(allItems);
      render(allItems);
    })
    .catch(err => {
      console.error(err); showNotice('Gagal memuat menu. Pastikan Sheet dipublikasikan atau dibagikan untuk umum.');
    });

  function buildDataURL(tsvUrl, shareUrl){
    if (tsvUrl && /output=tsv/.test(tsvUrl)) return { url: tsvUrl, type: 'tsv' };
    if (shareUrl && /\/spreadsheets\/d\//.test(shareUrl)) {
      const id = (shareUrl.match(/\/d\/([a-zA-Z0-9-_]+)/) || [])[1];
      const gid = (shareUrl.match(/gid=(\d+)/) || [,'0'])[1]; // default: sheet pertama
      return { url: `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`, type: 'csv' };
    }
    const EID = '10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE';
    return { url: `https://docs.google.com/spreadsheets/d/e/${EID}/pub?gid=0&single=true&output=tsv`, type: 'tsv' };
  }

  /* Parsing */
  function parseTSV(tsv){
    const rows = tsv.split('\n').map(r=>r.trim()).filter(Boolean);
    if (rows.length < 2) return [];
    const h = rows[0].split('\t').map(x=>x.trim());
    return rows.slice(1).map(line=>{
      const v = line.split('\t').map(x=>x.trim());
      const o = {}; h.forEach((k,i)=>o[k]=v[i]??''); return o;
    });
  }
  function parseCSV(csv){
    const rows = csv.split('\n').map(r=>r.replace(/\r$/,'')).filter(Boolean);
    if (rows.length < 2) return [];
    const headers = splitCSV(rows[0]);
    return rows.slice(1).map(line=>{
      const vals = splitCSV(line);
      const obj = {}; headers.forEach((h,i)=>obj[h]=vals[i]??''); return obj;
    });
  }
  function splitCSV(line){
    const out=[]; let cur='', q=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c === '"'){ if(q && line[i+1] === '"'){ cur+='"'; i++; } else q = !q; }
      else if(c === ',' && !q){ out.push(cur); cur=''; }
      else cur += c;
    }
    out.push(cur); return out;
  }

  /* UI */
  function createFilters(items){
    const cats = ['Semua', ...new Set(items.map(x=>x.Kategori).filter(Boolean))];
    filtersWrap.innerHTML = '';
    cats.forEach(cat=>{
      const btn = document.createElement('button');
      btn.className = 'filter-btn'; btn.textContent = cat;
      if (cat === 'Semua') btn.classList.add('active');
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        render(cat==='Semua' ? items : items.filter(x=>x.Kategori===cat), true);
      });
      filtersWrap.appendChild(btn);
    });
  }

  function render(items, animate=false){
    grid.innerHTML = '';
    if (!items.length){ showNotice('Menu kosong.'); return; }
    hideNotice();
    items.forEach((it, idx)=>{
      if (!it['Nama Menu'] || !it.Harga) return;
      const media = it.MediaURL || 'https://via.placeholder.com/1200x800.png?text=Menu';
      const card = document.createElement('article');
      card.className = 'card'; card.style.opacity = 0; card.style.transform = 'translateY(6px)';
      card.innerHTML = `
        <img class="card__img" src="${media}" alt="${esc(it['Nama Menu'])}" loading="lazy"
             onerror="this.onerror=null;this.src='https://via.placeholder.com/1200x800.png?text=Gambar%20Error'">
        <div class="card__body">
          <div class="card__title">${esc(it['Nama Menu'])}</div>
          <div class="card__price">Rp ${toIDR(it.Harga)}</div>
          ${it.Deskripsi ? `<div class="card__desc">${esc(trimWords(it.Deskripsi, 14))}</div>` : ''}
        </div>`;
      grid.appendChild(card);
      setTimeout(()=>{ card.style.transition='opacity .28s ease, transform .28s ease';
        card.style.opacity=1; card.style.transform='none'; }, 30 + idx*24);
    });
  }

  /* Utils */
  function trimWords(s, n){ const w=String(s).split(/\s+/); return w.length<=n ? s : w.slice(0,n).join(' ') + '…'; }
  function toIDR(x){ const n=Number(String(x).replace(/[^\d]/g,''))||0; return n.toLocaleString('id-ID'); }
  const map={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}; const esc=s=>String(s).replace(/[&<>"']/g,m=>map[m]);
  function showNotice(msg){ notice.hidden=false; notice.textContent=msg; }
  function hideNotice(){ notice.hidden=true; notice.textContent=''; }
});
