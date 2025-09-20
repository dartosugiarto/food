document.addEventListener("DOMContentLoaded", function() {
    // --- KONFIGURASI ---
    // GANTI DENGAN SHEET ID DAN GID ANDA
    const SHEET_ID = 'YOUR_SHEET_ID';
    const GID = 'YOUR_GID';
    // -------------------

    const menuContainer = document.getElementById('menu-container');
    const loadingText = document.getElementById('loading-text');
    const filterButtonsContainer = document.getElementById('menu-filter-buttons');
    
    // URL untuk mengambil data sebagai TSV (Tab Separated Values)
    // TSV lebih ringan dan mudah di-parse daripada JSON dari API v4 untuk kasus ini
    const url = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?gid=${GID}&single=true&output=tsv`;
    
    let allMenuItems = [];

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            allMenuItems = parseTSV(data);
            createFilterButtons(allMenuItems);
            displayMenu(allMenuItems); // Tampilkan semua menu saat pertama kali load
        })
        .catch(error => {
            console.error('Error fetching or parsing data:', error);
            if (loadingText) {
                loadingText.textContent = 'Gagal memuat menu. Silakan coba lagi nanti.';
            }
        });

    function parseTSV(tsv) {
        const rows = tsv.split('\n').map(row => row.trim());
        const headers = rows[0].split('\t').map(header => header.trim());
        const data = [];

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split('\t').map(value => value.trim());
            if (values.length === headers.length) {
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index];
                });
                data.push(entry);
            }
        }
        return data;
    }
    
    function createFilterButtons(items) {
        const categories = ['Semua', ...new Set(items.map(item => item.Kategori))];
        
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.textContent = category;
            if (category === 'Semua') {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                // Hapus kelas active dari semua tombol
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                // Tambahkan kelas active ke tombol yang diklik
                button.classList.add('active');

                if (category === 'Semua') {
                    displayMenu(allMenuItems);
                } else {
                    const filteredItems = allMenuItems.filter(item => item.Kategori === category);
                    displayMenu(filteredItems);
                }
            });
            filterButtonsContainer.appendChild(button);
        });
    }

    function displayMenu(items) {
        if (!menuContainer) return;
        
        menuContainer.innerHTML = ''; // Kosongkan container

        if (items.length === 0 && loadingText) {
            menuContainer.innerHTML = '<p>Menu tidak ditemukan.</p>';
            return;
        }

        if (loadingText) {
            loadingText.style.display = 'none'; // Sembunyikan pesan loading
        }

        items.forEach(item => {
            // Cek jika data penting ada, jika tidak, lewati item ini
            if (!item.NamaMenu || !item.Harga) {
                return;
            }

            const menuItemDiv = document.createElement('div');
            menuItemDiv.className = 'menu-item';

            menuItemDiv.innerHTML = `
                <img src="${item.URLGambar || 'https://via.placeholder.com/400x250.png?text=Gambar+Menu'}" alt="${item.NamaMenu}">
                <div class="menu-item-content">
                    <h3>${item.NamaMenu}</h3>
                    <p>${item.Deskripsi || ''}</p>
                    <div class="price">Rp ${item.Harga}</div>
                </div>
            `;
            menuContainer.appendChild(menuItemDiv);
        });
    }
});
