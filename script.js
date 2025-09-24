// Link Google Sheet Anda yang sudah diubah ke format CSV publik.
const googleSheetURL = 'https://docs.google.com/spreadsheets/d/10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE/gviz/tq?tqx=out:csv&sheet=Sheet1';

// Menunggu halaman web selesai dimuat sebelum menjalankan kode
document.addEventListener('DOMContentLoaded', () => {
    loadMenuData();
});

async function loadMenuData() {
    try {
        const response = await fetch(googleSheetURL);
        const csvText = await response.text();
        const data = parseCSV(csvText);

        displayMenu(data);
    } catch (error) {
        console.error('Gagal mengambil data menu:', error);
    }
}

function parseCSV(text) {
    // Menghapus kutipan ganda yang mungkin ditambahkan oleh Google Sheets
    const cleanedText = text.slice(1, -1);
    const lines = cleanedText.split('"\n"');
    const headers = lines[0].split('","');
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const obj = {};
        const currentline = lines[i].split('","');

        for (let j = 0; j < headers.length; j++) {
            obj[headers[j].trim()] = currentline[j].trim();
        }
        rows.push(obj);
    }
    return rows;
}

function displayMenu(menuItems) {
    const flashSaleContainer = document.getElementById('flash-sale-container');
    const mainMenuContainer = document.getElementById('menu-utama');

    // Kosongkan kontainer sebelum mengisi
    flashSaleContainer.innerHTML = '';
    mainMenuContainer.innerHTML = '';

    menuItems.forEach(item => {
        // Cek jika data baris tidak kosong
        if (!item['Nama Menu']) return;

        // Format harga ke Rupiah
        const hargaJual = parseInt(item['Harga Jual']);
        const hargaAsli = parseInt(item['Harga Asli']);
        const formattedHargaJual = `Rp${hargaJual.toLocaleString('id-ID')}`;
        const formattedHargaAsli = `Rp${hargaAsli.toLocaleString('id-ID')}`;

        if (item.Kategori === 'Flash Sale') {
            const discount = Math.round(((hargaAsli - hargaJual) / hargaAsli) * 100);
            
            const cardHTML = `
                <div class="product-card">
                    <img src="${item['Image Link']}" alt="${item['Nama Menu']}">
                    <div class="discount-badge">-${discount}%</div>
                    <div class="info">
                        <h3>${item['Nama Menu']}</h3>
                        <p class="price">${formattedHargaJual} <span class="original-price">${formattedHargaAsli}</span></p>
                    </div>
                </div>
            `;
            flashSaleContainer.innerHTML += cardHTML;

        } else { // Untuk kategori selain Flash Sale
            const cardHTML = `
                <div class="product-card">
                    <img src="${item['Image Link']}" alt="${item['Nama Menu']}">
                    <div class="info">
                        <h3>${item['Nama Menu']}</h3>
                        <p class="category">${item.Kategori}</p>
                        <p class="price">${formattedHargaJual}</p>
                    </div>
                </div>
            `;
            mainMenuContainer.innerHTML += cardHTML;
        }
    });
}
