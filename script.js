document.addEventListener('DOMContentLoaded', () => {
  // --- KONFIGURASI ---
  const GOOGLE_SHEET_SHARE_LINK = "https://docs.google.com/spreadsheets/d/10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE/edit?usp=drivesdk";

  // --- ELEMEN DOM ---
  const flashSaleSection = document.getElementById('flash-sale-section');
  const flashSaleContainer = document.getElementById('flash-sale-container');
  const mainMenuContainer = document.getElementById('main-menu-container');

  // --- FUNGSI UTAMA ---
  const fetchData = async () => {
    const url = buildProxyUrl(GOOGLE_SHEET_SHARE_LINK);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal mengambil data dari Google Sheet.');
      const text = await response.text();
      const items = parseCSV(text);
      renderItems(items);
    } catch (error) {
      console.error(error);
      mainMenuContainer.innerHTML = `<p style="text-align: center; color: var(--red);">Gagal memuat menu. Coba lagi nanti.</p>`;
    }
  };

  const renderItems = (items) => {
    // Kosongkan kontainer
    flashSaleContainer.innerHTML = '';
    mainMenuContainer.innerHTML = '';

    const flashSaleItems = items.filter(item => item['Kategori'] === 'Flash Sale' && item['Harga Asli']);
    const mainMenuItems = items.filter(item => item['Kategori'] !== 'Flash Sale');
    
    // Tampilkan bagian Flash Sale jika ada itemnya
    if (flashSaleItems.length > 0) {
      flashSaleSection.hidden = false;
      flashSaleItems.forEach(item => {
        const card = createSaleCard(item);
        flashSaleContainer.innerHTML += card;
      });
    }

    // Tampilkan menu utama
    if (mainMenuItems.length > 0) {
        mainMenuItems.forEach(item => {
            const card = createMenuCard(item);
            mainMenuContainer.innerHTML += card;
        });
    }
  };

  // --- FUNGSI PEMBUAT KARTU HTML ---
  const createSaleCard = (item) => {
    const price = parseFloat(item.Harga) || 0;
    const originalPrice = parseFloat(item['Harga Asli']) || 0;
    const discount = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    return `
      <div class="card--sale">
        <div class="card--sale__img">
          <img src="${sanitize(item.MediaURL)}" alt="${sanitize(item['Nama Menu'])}" loading="lazy">
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

  const createMenuCard = (item) => {
    const price = parseFloat(item.Harga) || 0;
    return `
      <div class="card--menu">
        <div class="card--menu__img">
          <img src="${sanitize(item.MediaURL)}" alt="${sanitize(item['Nama Menu'])}" loading="lazy">
        </div>
        <div class="card--menu__body">
          <h3 class="card--menu__title">${sanitize(item['Nama Menu'])}</h3>
          <p class="card--menu__category">${sanitize(item.Kategori)}</p>
          <p class="card--menu__price">${formatCurrency(price)}</p>
        </div>
      </div>
    `;
  };


  // --- FUNGSI HELPERS ---
  const buildProxyUrl = (shareLink) => {
    const id = (shareLink.match(/\/d\/([a-zA-Z0-9-_]+)/) || [])[1];
    const gid = (shareLink.match(/gid=(\d+)/) || [, '0'])[1];
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;
  };

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        if (values.length === headers.length) {
            const row = {};
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = values[j].trim().replace(/"/g, '');
            }
            rows.push(row);
        }
    }
    return rows;
  };
    
  const formatCurrency = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };
    
  const sanitize = (str) => {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  };

  // --- INISIALISASI ---
  fetchData();
});
