// PIXEL-STYLE minimal menu loader (Google Sheet) — DISESUAIKAN DENGAN LINK KAMU
document.addEventListener('DOMContentLoaded', () => {
  /* === Cara pakai: salah satu link di bawah sudah DIISI ===
     1) PUBLISHED_TSV_URL -> dari "Publikasikan ke web" (output=tsv)
     2) SHARE_LINK        -> link /d/.../edit#gid=... (auto pakai CSV gviz)
  */
  const PUBLISHED_TSV_URL = ""; 
  const SHARE_LINK        = "https://docs.google.com/spreadsheets/d/10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE/edit?usp=drivesdk";

  const { url: DATA_URL, type: DATA_TYPE } = buildDataURL(PUBLISHED_TSV_URL, SHARE_LINK);

  const grid = document.getElementById('menu-container');
  const filtersWrap = document.getElementById('menu-filter-buttons');
  const notice = document.getElementById('menu-notice');

  // Burger menu
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
  }

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
      console.error(err);
      showNotice('Gagal memuat menu. Pastikan Sheet dipublikasikan atau dibagikan untuk umum.');
    });

  function buildDataURL(tsvUrl, shareUrl) {
    if (tsvUrl && /output=tsv/.test(tsvUrl)) return { url: tsvUrl, type: 'tsv' };
    if (shareUrl && /\/spreadsheets\/d\//.test(shareUrl)) {
      const id = (shareUrl.match(/\/d\/([a-zA-Z0-9-_]+)/) || [])[1];
      const gid = (shareUrl.match(/gid=(\d+)/) || [,'0'])[1]; // default ke 0 jika tidak ada #gid
      return { url: `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`, type: 'csv' };
    }
    // fallback (boleh diganti kalau mau)
    const EID = '10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE';
    return { url: `https://docs.google.com/spreadsheets/d/e/${EID}/pub?gid=0&single=true&output=tsv`, type: 'tsv' };
  }

  function parseTSV(tsv){
    const rows = tsv.split('\n').map(r=>r.trim()).filter(Boolean);
    if (rows.length < 2) return [];
    const h = rows[0].split('\t').map(x=>x.trim());
    return rows.slice(1).map(line=>{
      const v = line.split('\t').map(x=>x.trim());
      const o = {}; h.forEach((k,i)=>o[k]=v[i]??''); return o;
    });
  }

  // CSV parser sederhana (cukup untuk output gviz)
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
      if(c === '"'){
        if(q && line[i+1] === '"'){ cur+='"'; i++; }
        else q = !q;
      }else if(c === ',' && !q){ out.push(cur); cur=''; }
      else cur += c;
    }
    out.push(cur); return out;
  }

  function createFilters(items){
    const cats = ['Semua', ...new Set(items.map(x=>x.Kategori).filter(Boolean))];
    filtersWrap.innerHTML = '';
    cats.forEach(cat=>{
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.textContent = cat;
      if (cat === 'Semua') btn.classList.add('active');
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const data = (cat==='Semua') ? items : items.filter(x=>x.Kategori===cat);
        render(data, true);
      });
      filtersWrap.appendChild(btn);
    });
  }

  function render(items, animate=false){
    grid.innerHTML = '';
    if (!items.length){ showNotice('Menu kosong.'); return; }
    hideNotice();

    items.forEach(it=>{
      if (!it['Nama Menu'] || !it.Harga) return;
      const media = it.MediaURL || 'https://via.placeholder.com/1200x800.png?text=Menu';
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img class="card__img" src="${media}" alt="${esc(it['Nama Menu'])}" loading="lazy"
             onerror="this.onerror=null;this.src='https://via.placeholder.com/1200x800.png?text=Gambar%20Error'">
        <div class="card__body">
          <div class="card__title">${esc(it['Nama Menu'])}</div>
          <div class="card__price">Rp ${toIDR(it.Harga)}</div>
          ${it.Deskripsi ? `<div class="card__desc">${esc(trimWords(it.Deskripsi, 14))}</div>` : ''}
        </div>
      `;
      if (animate){
        card.style.opacity = 0; card.style.transform = 'translateY(6px)';
        requestAnimationFrame(()=>{
          card.style.transition = 'opacity .25s ease, transform .25s ease';
          card.style.opacity = 1; card.style.transform = 'none';
        });
      }
      grid.appendChild(card);
    });
  }

  function trimWords(s, n){
    const words = String(s).split(/\s+/);
    return words.length<=n ? s : words.slice(0,n).join(' ') + '…';
  }
  function toIDR(x){
    const num = Number(String(x).replace(/[^\d]/g,''))||0;
    return num.toLocaleString('id-ID');
  }
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  const esc = s => String(s).replace(/[&<>"']/g, m=>map[m]);

  function showNotice(msg){ notice.hidden=false; notice.textContent=msg; }
  function hideNotice(){ notice.hidden=true; notice.textContent=''; }
});
