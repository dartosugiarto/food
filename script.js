// script.js — versi robust: cukup tempel satu link, sisanya auto
document.addEventListener('DOMContentLoaded', () => {
  /* ============================================================
     CARA PAKAI (pilih salah satu yang kamu punya):
     1) PUBLISHED_TSV_URL  -> tempel link dari "File → Bagikan → Publikasikan ke web"
        Contoh: https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=tsv
     2) SHARE_LINK         -> kalau belum publish, tempel link edit/view biasa
        Contoh: https://docs.google.com/spreadsheets/d/1AbCdEfGh.../edit#gid=123456789
     3) (OPSIONAL) RAW_ID & GID -> kalau ingin manual
  ============================================================ */

  // === PASTE DI SINI (salah satu sudah cukup) ===
  const PUBLISHED_TSV_URL = ""; // << tempel link "Publikasikan ke web" (output=tsv) di sini
  const SHARE_LINK       = "";  // << atau tempel link /d/…/edit#gid=… (bila belum publish)

  // === Opsi manual (boleh dikosongkan bila pakai 1) atau 2)) ===
  const RAW_DOC_ID = "";         // mis. 1AbCdEfGhIjKl... (ID setelah /d/)
  const RAW_GID    = "";         // mis. 0 atau angka lain sesuai sheet

  /* ============================================================
     KONSTRUKSI URL SUMBER DATA (otomatis pilih yang tersedia)
  ============================================================ */
  function buildDataURL() {
    // 1) Jika ada link publish (TSV), pakai itu.
    if (PUBLISHED_TSV_URL && /output=tsv/.test(PUBLISHED_TSV_URL)) {
      return { url: PUBLISHED_TSV_URL, type: 'tsv' };
    }

    // 2) Jika ada SHARE_LINK (edit/view), turunkan ke gviz CSV
    if (SHARE_LINK && /\/spreadsheets\/d\//.test(SHARE_LINK)) {
      const docId = (SHARE_LINK.match(/\/d\/([a-zA-Z0-9-_]+)/) || [])[1];
      // cari gid=… (kalau tidak ada, default 0)
      const gidMatch = SHARE_LINK.match(/gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      if (docId) {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&gid=${gid}`;
        return { url: csvUrl, type: 'csv' };
      }
    }

    // 3) Jika RAW_DOC_ID & RAW_GID diisi, pakai gviz CSV
    if (RAW_DOC_ID) {
      const gid = RAW_GID || '0';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${RAW_DOC_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
      return { url: csvUrl, type: 'csv' };
    }

    // 4) Fallback (tetap kompatibel dengan versi lama kamu) — ganti jika perlu
    const LEGACY_SHEET_E_ID = '10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE'; // ID /d/e/ dari versi sebelumnya
    const LEGACY_GID = '0';
    const legacyUrl = `https://docs.google.com/spreadsheets/d/e/${LEGACY_SHEET_E_ID}/pub?gid=${LEGACY_GID}&single=true&output=tsv`;
    return { url: legacyUrl, type: 'tsv' };
  }

  const { url: DATA_URL, type: DATA_TYPE } = buildDataURL();

  /* ================== ELEMENTS ================== */
  const menuContainer = document.getElementById('menu-container');
  const filterButtonsContainer = document.getElementById('menu-filter-buttons');
  const notice = document.getElementById('menu-notice');
  const loading = document.getElementById('loading');

  /* ================== NAV TOGGLE (Mobile) ================== */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('primary-nav');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* ================== FETCH & RENDER MENU ================== */
  let allItems = [];

  fetch(DATA_URL)
    .then(r => {
      if (!r.ok) throw new Error('Gagal mengambil data dari Google Sheet.');
      return r.text();
    })
    .then(text => {
      allItems = (DATA_TYPE === 'tsv') ? parseTSV(text) : parseCSV(text);
      if (!allItems.length) throw new Error('Data menu kosong atau format tidak sesuai.');
      createFilters(allItems);
      renderMenu(allItems);
    })
    .catch(err => {
      console.error(err);
      showNotice('Gagal memuat menu. Pastikan Sheet dipublikasi / berbagi untuk umum, lalu muat ulang.');
    })
    .finally(() => {
      if (loading) loading.remove();
    });

  function parseTSV(tsv) {
    const rows = tsv.split('\n').map(r => r.trim()).filter(Boolean);
    if (rows.length < 2) return [];
    const headers = rows[0].split('\t').map(h => h.trim());
    return rows.slice(1).map(line => {
      const values = line.split('\t').map(v => v.trim());
      const obj = {};
      headers.forEach((h, i) => obj[h] = values[i] ?? '');
      return obj;
    });
  }

  function parseCSV(csv) {
    // parsing CSV sederhana (tanpa tanda kutip kompleks). Untuk kasus umum sheet sudah cukup.
    const rows = csv.split('\n').map(r => r.replace(/\r$/,'')).filter(Boolean);
    if (rows.length < 2) return [];
    const headers = rows[0].split(',').map(h => h.trim());
    return rows.slice(1).map(line => {
      const values = splitCSV(line);
      const obj = {};
      headers.forEach((h, i) => obj[h] = (values[i] || '').trim());
      return obj;
    });
  }

  function splitCSV(line) {
    // dukung nilai bertanda kutip dan koma di dalam kutip
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; } // escape ""
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        out.push(cur); cur = '';
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out;
    // Catatan: cukup untuk output gviz default.
  }

  function createFilters(items) {
    const categories = ['Semua', ...new Set(items.map(x => x.Kategori).filter(Boolean))];
    filterButtonsContainer.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.textContent = cat;
      if (cat === 'Semua') btn.classList.add('active');
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filtered = (cat === 'Semua') ? allItems : allItems.filter(x => x.Kategori === cat);
        renderMenu(filtered, true);
      });
      filterButtonsContainer.appendChild(btn);
    });
  }

  function renderMenu(items, animate = false) {
    menuContainer.innerHTML = '';
    if (!items.length) {
      showNotice('Menu tidak ditemukan untuk kategori ini.');
      return;
    }
    hideNotice();

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          obs.unobserve(en.target);
        }
      });
    }, { rootMargin: '60px' });

    items.forEach(item => {
      if (!item['Nama Menu'] || !item.Harga) return;

      const card = document.createElement('article');
      card.className = 'card';
      if (animate) card.style.opacity = 0;

      const media = item.MediaURL || 'https://via.placeholder.com/800x500.png?text=Gambar+Menu';
      const desc = item.Deskripsi || '';

      card.innerHTML = `
        <img class="card-img" src="${media}" alt="${escapeHtml(item['Nama Menu'])}" loading="lazy"
             onerror="this.onerror=null;this.src='https://via.placeholder.com/800x500.png?text=Gambar+Error';" />
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(item['Nama Menu'])}</h3>
          <p class="card-desc">${escapeHtml(desc)}</p>
          <div class="card-price">Rp ${formatRupiah(item.Harga)}</div>
        </div>
      `;

      menuContainer.appendChild(card);
      io.observe(card);

      if (animate) {
        requestAnimationFrame(() => {
          card.style.transition = 'opacity .25s ease, transform .25s ease';
          card.style.transform = 'translateY(6px)';
          card.style.opacity = 1;
          setTimeout(() => card.style.transform = 'none', 250);
        });
      }
    });
  }

  function formatRupiah(x) {
    const num = Number(String(x).replace(/[^\d]/g, '')) || 0;
    return num.toLocaleString('id-ID');
  }

  function showNotice(msg) {
    if (!notice) return;
    notice.hidden = false;
    notice.textContent = msg;
  }
  function hideNotice() {
    if (!notice) return;
    notice.hidden = true;
    notice.textContent = '';
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
});
