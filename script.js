document.addEventListener("DOMContentLoaded", function() {
    // --- KONFIGURASI ---
    // SHEET_ID sudah diisi sesuai link Anda. GID diasumsikan 0 (sheet pertama).
    const SHEET_ID = '10bjcfNHBP6jCnLE87pgk5rXgVS8Qwyu8hc-LXCkdqEE';
    const GID = '0';
    // -------------------

    const menuContainer = document.getElementById('menu-container');
    const loadingText = document.getElementById('loading-text');
    const filterButtonsContainer = document.getElementById('menu-filter-buttons');
    
    const url = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${GID}&single=true&output=tsv`;
    
    let allMenuItems = [];

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Gagal mengambil data. Pastikan sheet sudah di "Publish to web".');
            }
            return response.text();
        })
        .then(data => {
            allMenuItems = parseTSV(data);
            createFilterButtons(allMenuItems);
            displayMenu(allMenuItems); 
        })
        .catch(error => {
            console.error('Error:', error);
            if (loadingText) {
                loadingText.textContent = 'Gagal memuat menu. Cek konsol untuk detail error.';
            }
        });

    function parseTSV(tsv) {
        const rows = tsv.split('\n').map(row => row.trim());
        const headers = rows[0].split('\t').map(header => header.trim());
        const data = [];

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split('\t').map(value => value.trim());
            if (values.length === headers.length) {
                let entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index];
                });
                data.push(entry);
            }
        }
        return data;
    }
    
    function createFilterButtons(items) {
        // Mengambil kategori unik dari data, mengabaikan baris yang kategorinya kosong
        const categories = ['Semua', ...new Set(items.map(item => item.Kategori).filter(Boolean))];
        
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = category;
            if (category === 'Semua') button.classList.add('active');
            
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const filteredItems = (category === 'Semua') ? allMenuItems : allMenuItems.filter(item => item.Kategori === category);
                displayMenu(filteredItems);
            });
            filterButtonsContainer.appendChild(button);
        });
    }

    function displayMenu(items) {
        if (!menuContainer) return;
        
        menuContainer.innerHTML = ''; 

        if (items.length === 0) {
            menuContainer.innerHTML = '<p>Menu tidak ditemukan.</p>';
            return;
        }

        if (loadingText) loadingText.style.display = 'none';

        items.forEach(item => {
            // Menggunakan nama kolom dari sheet Anda: 'Nama Menu' dan 'MediaURL'
            if (!item['Nama Menu'] || !item.Harga) return;

            const menuItemDiv = document.createElement('div');
            menuItemDiv.className = 'menu-item';

            menuItemDiv.innerHTML = `
                <img src="${item.MediaURL || 'https://via.placeholder.com/400x250.png?text=Gambar+Menu'}" alt="${item['Nama Menu']}">
                <div class="menu-item-content">
                    <h3>${item['Nama Menu']}</h3>
                    <p>${item.Deskripsi || ''}</p>
                    <div class="price">Rp ${item.Harga}</div>
                </div>
            `;
            menuContainer.appendChild(menuItemDiv);
        });
    }
});
