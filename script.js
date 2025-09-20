document.addEventListener('DOMContentLoaded', () => {
  /* ================== KONFIGURASI GOOGLE SHEET ==================
     Mengikuti pola publikasi "Publish to the web" dan ambil output TSV
     (struktur ini mempertahankan pendekatan file sebelumnya). */
  const SHEET_ID = '10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE'; // ganti bila perlu
  const GID = '0';
  const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${GID}&single=true&output=tsv`;

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

  fetch(SHEET_URL)
    .then(r => {
      if (!r.ok) throw new Error('Gagal mengambil data dari Google Sheet.');
      return r.text();
    })
    .then(text => {
      allItems = parseTSV(text);
      if (!allItems.length) throw new Error('Data menu kosong atau format tidak sesuai.');
      createFilters(allItems);
      renderMenu(allItems);
    })
    .catch(err => {
      console.error(err);
      showNotice('Gagal memuat menu. Coba bersihkan cache browser dan muat ulang halaman.');
    })
    .finally(() => {
      if (loading) loading.remove();
    });

  function parseTSV(tsv) {
    const rows = tsv.split('\n').map(r => r.trim()).filter(Boolean);
    if (rows.length < 2) return [];
    const headers = rows[0].split('\t').map(h => h.trim());
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split('\t').map(v => v.trim());
      if (values.length === headers.length) {
        const obj = {};
        headers.forEach((h, idx) => obj[h] = values[idx]);
        data.push(obj);
      }
    }
    return data;
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

    // IntersectionObserver untuk lazy-appear
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
        <img class="card-img" src="${media}" alt="${escapeHtml(item['Nama Menu'])}" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/800x500.png?text=Gambar+Error';" />
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
    // mendukung "50000" atau "50.000"
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
