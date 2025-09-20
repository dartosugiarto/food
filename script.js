// SAMBELIX — Upgraded with IntersectionObserver & Enhanced UX
document.addEventListener('DOMContentLoaded', () => {
  /* --- Initial Setup & Helpers --- */
  const setRealVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  setRealVh();
  window.addEventListener('resize', setRealVh);

  /* --- Data Source Configuration --- */
  const SHARE_LINK = "https://docs.google.com/spreadsheets/d/10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE/edit?usp=drivesdk";
  const { url: DATA_URL, type: DATA_TYPE } = buildDataURL(null, SHARE_LINK);

  /* --- UI Element Selection --- */
  const grid = document.getElementById('menu-container');
  const filtersWrap = document.getElementById('menu-filter-buttons');
  const notice = document.getElementById('menu-notice');

  /* --- Mobile Navigation Logic --- */
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  const backdrop = document.querySelector('.nav-backdrop');

  function setNavOpen(open) {
    document.body.classList.toggle('nav-open', open);
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  }

  if (burger && nav) {
    burger.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
    backdrop.addEventListener('click', () => setNavOpen(false));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNavOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setNavOpen(false); });
  }

  /* --- Data Fetching & Rendering --- */
  let allItems = [];
  fetch(DATA_URL)
    .then(response => {
      if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
      return response.text();
    })
    .then(text => {
      allItems = (DATA_TYPE === 'tsv') ? parseTSV(text) : parseCSV(text);
      if (!allItems.length) throw new Error('Data is empty or format is incorrect.');
      
      grid.setAttribute('aria-busy', 'false');
      createFilters(allItems);
      render(allItems);
    })
    .catch(error => {
      console.error('Fetch Error:', error);
      grid.setAttribute('aria-busy', 'false');
      showNotice('Gagal memuat menu. Pastikan Google Sheet dapat diakses publik.');
    });

  /* --- Reveal on Scroll Animation (Performance First) --- */
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.revealDelay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px" });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* --- Core Functions --- */
  function buildDataURL(tsvUrl, shareUrl) {
    if (shareUrl && /\/spreadsheets\/d\//.test(shareUrl)) {
      const id = (shareUrl.match(/\/d\/([a-zA-Z0-9-_]+)/) || [])[1];
      const gid = (shareUrl.match(/gid=(\d+)/) || [, '0'])[1];
      return { url: `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`, type: 'csv' };
    }
    const EID = '10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE';
    return { url: `https://docs.google.com/spreadsheets/d/e/${EID}/pub?gid=0&single=true&output=tsv`, type: 'tsv' };
  }

  const parseTSV = (tsv) => { /* ... (parser function remains the same) ... */ };
  const parseCSV = (csv) => { /* ... (parser function remains the same) ... */ };
  
  // (Paste the existing parseTSV and parseCSV functions here to keep the script self-contained)
  function parseTSV(tsv){const h=tsv.split('\n')[0].split('\t');return tsv.split('\n').slice(1).map(r=>{const v=r.split('\t'),o={};h.forEach((k,i)=>o[k.trim()]=v[i]?.trim()??'');return o})}
  function parseCSV(csv){const rows=csv.split('\n').map(r=>r.replace(/\r$/,'')).filter(Boolean);if(rows.length<2)return[];const h=splitCSV(rows[0]);return rows.slice(1).map(l=>{const v=splitCSV(l),o={};h.forEach((k,i)=>o[k]=v[i]??'');return o})}
  function splitCSV(l){const o=[];let c='',q=!1;for(let i=0;i<l.length;i++){const d=l[i];if(d==='"'){if(q&&l[i+1]==='"'){c+='"';i++}else q=!q}else if(d===','&&!q){o.push(c);c=''}else c+=d}o.push(c);return o}


  function createFilters(items) {
    const categories = ['Semua', ...new Set(items.map(item => item.Kategori).filter(Boolean))];
    filtersWrap.innerHTML = categories.map(cat => 
      `<button class="filter-btn ${cat === 'Semua' ? 'active' : ''}">${cat}</button>`
    ).join('');

    filtersWrap.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        filtersWrap.querySelector('.active').classList.remove('active');
        e.target.classList.add('active');
        const category = e.target.textContent;
        const filteredItems = category === 'Semua' ? allItems : allItems.filter(item => item.Kategori === category);
        render(filteredItems);
      }
    });
  }

  function render(items) {
    grid.innerHTML = '';
    if (!items.length) { showNotice('Tidak ada menu dalam kategori ini.'); return; }
    hideNotice();

    items.forEach((item, index) => {
      if (!item['Nama Menu'] || !item.Harga) return;
      const media = item.MediaURL || `https://source.unsplash.com/800x600/?food,${item['Nama Menu']}`;
      const card = document.createElement('article');
      card.className = 'card reveal';
      card.setAttribute('data-reveal-delay', (index % 3) * 100);
      card.innerHTML = `
        <div class="card__img-wrap">
          <picture>
            <source srcset="${media}/avif" type="image/avif">
            <source srcset="${media}/webp" type="image/webp">
            <img class="card__img" src="${media}" alt="${esc(item['Nama Menu'])}" loading="lazy" decoding="async"
                 onerror="this.onerror=null;this.src='https://via.placeholder.com/800x600.png?text=Gambar%20Error'">
          </picture>
        </div>
        <div class="card__body">
          <h3 class="card__title">${esc(item['Nama Menu'])}</h3>
          <p class="card__price">Rp ${toIDR(item.Harga)}</p>
          ${item.Deskripsi ? `<p class="card__desc">${esc(trimWords(item.Deskripsi, 15))}</p>` : ''}
        </div>`;
      grid.appendChild(card);
      revealObserver.observe(card); // Observe dynamically added cards
    });
  }

  /* --- Utility Functions --- */
  const trimWords = (s, n) => { const w = String(s).split(/\s+/); return w.length <= n ? s : w.slice(0, n).join(' ') + '…'; };
  const toIDR = (x) => (Number(String(x).replace(/[^\d]/g, '')) || 0).toLocaleString('id-ID');
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s).replace(/[&<>"']/g, m => map[m]);
  const showNotice = msg => { notice.hidden = false; notice.textContent = msg; };
  const hideNotice = () => { notice.hidden = true; notice.textContent = ''; };
});
