document.addEventListener('DOMContentLoaded', () => {
  const GOOGLE_SHEET_SHARE_LINK = "https://docs.google.com/spreadsheets/d/10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE/edit?usp=drivesdk";

  const flashSaleSection = document.getElementById('flash-sale-section');
  const flashSaleContainer = document.getElementById('flash-sale-container');
  const mainMenuContainer = document.getElementById('main-menu-container');

  const csvUrl = buildProxyUrl(GOOGLE_SHEET_SHARE_LINK);

  // Util: sanitize
  function sanitize(str) {
    return String(str || '').replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
  }

  // Optimize ImageKit URL
  function optimizeImage(url, w = 600) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('imagekit.io')) {
        const qp = u.searchParams;
        const tr = qp.get('tr');
        if (!tr) qp.set('tr', `w-${w}`);
        else if (!/w-\\d+/.test(tr)) qp.set('tr', tr + `,w-${w}`);
        u.search = qp.toString();
        return u.toString();
      }
      return url;
    } catch { return url; }
  }

  const loadItems = async () => {
    try {
      const cacheKey = 'sambalix_csv_v1';
      const cacheTsKey = 'sambalix_csv_ts_v1';
      const maxAgeMs = 10 * 60 * 1000;

      const now = Date.now();
      const cached = localStorage.getItem(cacheKey);
      const cachedTs = parseInt(localStorage.getItem(cacheTsKey) || '0', 10);

      if (cached && (now - cachedTs) < maxAgeMs) {
        const items = parseCSV(cached);
        renderItems(items);
        fetchCSVAndRender(true);
      } else {
        await fetchCSVAndRender(false);
      }
    } catch (error) {
      console.error(error);
      mainMenuContainer.innerHTML = `<p style="text-align: center; color: var(--red);">Gagal memuat menu. Coba lagi nanti.</p>`;
    }
  };

  async function fetchCSVAndRender(isBackground = false) {
    const response = await fetch(csvUrl, { cache: 'no-cache' });
    const text = await response.text();
    try {
      localStorage.setItem('sambalix_csv_v1', text);
      localStorage.setItem('sambalix_csv_ts_v1', String(Date.now()));
    } catch {}
    const items = parseCSV(text);
    if (!isBackground) renderItems(items);
  }

  const renderItems = (items) => {
    flashSaleContainer.innerHTML = '';
    mainMenuContainer.innerHTML = '';

    const flashSaleItems = items.filter(i => i['Kategori'] === 'Flash Sale' && i['Harga Asli']);
    const mainMenuItems = items.filter(i => i['Kategori'] !== 'Flash Sale');

    if (flashSaleItems.length > 0) {
      flashSaleSection.hidden = false;

      if (flashSaleItems.length >= 3) {
        const grid = document.createElement('div');
        grid.className = 'flash-grid';

        const featured = document.createElement('div');
        featured.className = 'featured';
        featured.innerHTML = createSaleCard(flashSaleItems[0], 'grid');
        featured.querySelector('img')?.setAttribute('fetchpriority', 'high');
        featured.firstElementChild.classList.add('featured');
        grid.appendChild(featured.firstElementChild);

        for (let i = 1; i <= 2; i++) {
          const wrap = document.createElement('div');
          wrap.className = 'stacked';
          wrap.innerHTML = createSaleCard(flashSaleItems[i], 'grid');
          wrap.firstElementChild.classList.add('stacked');
          grid.appendChild(wrap.firstElementChild);
        }

        flashSaleContainer.appendChild(grid);
      } else {
        const scroller = document.createElement('div');
        scroller.className = 'horizontal-scroll';
        flashSaleItems.forEach(item => scroller.insertAdjacentHTML('beforeend', createSaleCard(item)));
        flashSaleContainer.appendChild(scroller);
      }
    }

    if (mainMenuItems.length > 0) {
      mainMenuItems.forEach(item => {
        mainMenuContainer.innerHTML += createMenuCard(item);
      });
    }
  };

  const createSaleCard = (item, variant = 'default') => {
    const price = parseFloat(item.Harga) || 0;
    const originalPrice = parseFloat(item['Harga Asli']) || 0;
    const discount = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    if (variant === 'grid') {
      return `
        <div class="flash-item">
          <img fetchpriority="low" class="thumb" src="${optimizeImage(sanitize(item.MediaURL), 720)}" decoding="async" alt="${sanitize(item['Nama Menu'])}" loading="lazy">
          ${discount > 0 ? `<div class="card--sale__badge">-${discount}%</div>` : ''}
          <div class="body">
            <h3 class="title">${sanitize(item['Nama Menu'])}</h3>
            <div class="price">
              ${formatCurrency(price)}
              ${originalPrice > 0 ? `<span class="original">${formatCurrency(originalPrice)}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="card--sale">
        <div class="card--sale__img">
          <img fetchpriority="low" src="${optimizeImage(sanitize(item.MediaURL), 480)}" decoding="async" alt="${sanitize(item['Nama Menu'])}" loading="lazy">
        </div>
        ${discount > 0 ? `<div class="card--sale__badge">-${discount}%</div>` : ''}
        <div class="card--sale__body">
          <h3 class="card--sale__title">${sanitize(item['Nama Menu'])}</h3>
          <p class="card--sale__price">
            ${formatCurrency(price)}
            ${originalPrice > 0 ? `<span class="card--sale__original-price">${formatCurrency(originalPrice)}</span>` : ''}
          </p>
        </div>
      </div>
    `;
  };

  // Placeholder util functions (isi sesuai aslinya)
  function buildProxyUrl(sheetUrl) { return sheetUrl; }
  function parseCSV(text) { return []; }
  function formatCurrency(num) { return "Rp" + num.toLocaleString("id-ID"); }
  function createMenuCard(item) { return `<div>${sanitize(item['Nama Menu'])}</div>`; }

  loadItems();
});
