// --- Inisialisasi Database (LocalStorage) ---
const defaultDB = {
    pemasukan: [],
    pengeluaran: [],
    pengaturan: { namaUsaha: "Barik Lana Galon", alamat: "", telepon: "" }
};

let db = JSON.parse(localStorage.getItem('barikLanaDB'));
if (!db) {
    db = defaultDB;
    saveDB();
}

let keuanganChartInstance = null;

// Helper: Simpan ke LocalStorage
function saveDB() {
    localStorage.setItem('barikLanaDB', JSON.stringify(db));
    updateDashboard();
    renderTables();
}

// Helper: Format Rupiah
const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
const getToday = () => new Date().toISOString().split('T')[0];

// --- Navigasi & Dark Mode ---
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        
        link.classList.add('active');
        const target = link.getAttribute('data-target');
        document.getElementById(target).classList.add('active');
        document.getElementById('pageTitle').innerText = link.innerText;
    });
});

const themeToggle = document.getElementById('themeToggle');
if(localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i> Light Mode' : '<i class="fa-solid fa-moon"></i> Dark Mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    initChart(); // Redraw chart for theme colors
});

// --- Notifikasi ---
function showNotification(msg, type = 'success') {
    const notif = document.getElementById('notification');
    notif.textContent = msg;
    notif.className = `notification show ${type}`;
    setTimeout(() => notif.classList.remove('show'), 3000);
}

// --- Perhitungan Form Pemasukan (Otomatis) ---
const inJumlah = document.getElementById('inJumlah');
const inHarga = document.getElementById('inHarga');
const inTotal = document.getElementById('inTotal');
const calcTotal = () => { inTotal.value = (inJumlah.value || 0) * (inHarga.value || 0); };
inJumlah.addEventListener('input', calcTotal);
inHarga.addEventListener('input', calcTotal);

// --- Set Tanggal Hari Ini Default ---
document.getElementById('inTanggal').value = getToday();
document.getElementById('outTanggal').value = getToday();

// --- CRUD Pemasukan ---
document.getElementById('formPemasukan').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('inId').value;
    const data = {
        id: id ? parseInt(id) : Date.now(),
        tanggal: document.getElementById('inTanggal').value,
        pelanggan: document.getElementById('inPelanggan').value,
        jumlahGalon: parseInt(inJumlah.value),
        harga: parseInt(inHarga.value),
        total: parseInt(inTotal.value)
    };

    if (id) {
        const idx = db.pemasukan.findIndex(p => p.id == id);
        db.pemasukan[idx] = data;
        showNotification('Data pemasukan diperbarui!');
    } else {
        db.pemasukan.push(data);
        showNotification('Pemasukan berhasil ditambahkan!');
    }
    
    saveDB();
    e.target.reset();
    document.getElementById('inTanggal').value = getToday();
    document.getElementById('inId').value = '';
});

// --- CRUD Pengeluaran ---
document.getElementById('formPengeluaran').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('outId').value;
    const data = {
        id: id ? parseInt(id) : Date.now(),
        tanggal: document.getElementById('outTanggal').value,
        kategori: document.getElementById('outKategori').value,
        keterangan: document.getElementById('outKeterangan').value,
        nominal: parseInt(document.getElementById('outNominal').value)
    };

    if (id) {
        const idx = db.pengeluaran.findIndex(p => p.id == id);
        db.pengeluaran[idx] = data;
        showNotification('Data pengeluaran diperbarui!');
    } else {
        db.pengeluaran.push(data);
        showNotification('Pengeluaran berhasil ditambahkan!');
    }
    
    saveDB();
    e.target.reset();
    document.getElementById('outTanggal').value = getToday();
    document.getElementById('outId').value = '';
});

// --- Render Tables ---
function renderTables(filterIn = "", filterOut = "") {
    // Render Pemasukan
    const tbIn = document.getElementById('tablePemasukan');
    tbIn.innerHTML = '';
    let filteredIn = db.pemasukan.filter(p => p.pelanggan.toLowerCase().includes(filterIn.toLowerCase()));
    filteredIn.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).forEach(item => {
        tbIn.innerHTML += `
            <tr>
                <td>${item.tanggal}</td>
                <td>${item.pelanggan}</td>
                <td>${item.jumlahGalon}</td>
                <td>${formatRupiah(item.harga)}</td>
                <td>${formatRupiah(item.total)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editData('in', ${item.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteData('in', ${item.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    // Render Pengeluaran
    const tbOut = document.getElementById('tablePengeluaran');
    tbOut.innerHTML = '';
    let filteredOut = db.pengeluaran.filter(p => p.keterangan.toLowerCase().includes(filterOut.toLowerCase()));
    filteredOut.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).forEach(item => {
        tbOut.innerHTML += `
            <tr>
                <td>${item.tanggal}</td>
                <td>${item.kategori}</td>
                <td>${item.keterangan}</td>
                <td>${formatRupiah(item.nominal)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editData('out', ${item.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete-btn" onclick="deleteData('out', ${item.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

// Pencarian
document.getElementById('searchPemasukan').addEventListener('input', (e) => renderTables(e.target.value, document.getElementById('searchPengeluaran').value));
document.getElementById('searchPengeluaran').addEventListener('input', (e) => renderTables(document.getElementById('searchPemasukan').value, e.target.value));

window.editData = (type, id) => {
    if (type === 'in') {
        const data = db.pemasukan.find(p => p.id == id);
        document.getElementById('inId').value = data.id;
        document.getElementById('inTanggal').value = data.tanggal;
        document.getElementById('inPelanggan').value = data.pelanggan;
        document.getElementById('inJumlah').value = data.jumlahGalon;
        document.getElementById('inHarga').value = data.harga;
        document.getElementById('inTotal').value = data.total;
    } else {
        const data = db.pengeluaran.find(p => p.id == id);
        document.getElementById('outId').value = data.id;
        document.getElementById('outTanggal').value = data.tanggal;
        document.getElementById('outKategori').value = data.kategori;
        document.getElementById('outKeterangan').value = data.keterangan;
        document.getElementById('outNominal').value = data.nominal;
    }
}

window.deleteData = (type, id) => {
    if(confirm('Yakin ingin menghapus data ini?')) {
        if(type === 'in') db.pemasukan = db.pemasukan.filter(p => p.id != id);
        else db.pengeluaran = db.pengeluaran.filter(p => p.id != id);
        saveDB();
        showNotification('Data berhasil dihapus');
    }
}

// --- Dashboard & Chart ---
function updateDashboard() {
    const today = getToday();
    const currentMonth = today.substring(0, 7);

    // Hitung Hari Ini
    const inToday = db.pemasukan.filter(p => p.tanggal === today).reduce((sum, p) => sum + p.total, 0);
    const outToday = db.pengeluaran.filter(p => p.tanggal === today).reduce((sum, p) => sum + p.nominal, 0);
    
    // Hitung Galon Bulan Ini
    const galonBulanIni = db.pemasukan.filter(p => p.tanggal.startsWith(currentMonth)).reduce((sum, p) => sum + p.jumlahGalon, 0);
    
    // Hitung Total Kas (Semua Waktu)
    const totalIn = db.pemasukan.reduce((sum, p) => sum + p.total, 0);
    const totalOut = db.pengeluaran.reduce((sum, p) => sum + p.nominal, 0);
    const saldo = totalIn - totalOut;

    document.getElementById('dashPemasukan').innerText = formatRupiah(inToday);
    document.getElementById('dashPengeluaran').innerText = formatRupiah(outToday);
    document.getElementById('dashSaldo').innerText = formatRupiah(saldo);
    document.getElementById('dashGalon').innerText = galonBulanIni;

    // Update Laporan Tab
    document.getElementById('lapPemasukan').innerText = formatRupiah(totalIn);
    document.getElementById('lapPengeluaran').innerText = formatRupiah(totalOut);
    document.getElementById('lapLaba').innerText = formatRupiah(saldo);

    initChart();
}

function initChart() {
    const ctx = document.getElementById('keuanganChart').getContext('2d');
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e0e0e0' : '#666';

    // Grup berdasarkan bulan (6 bulan terakhir)
    const labels = [];
    const inData = [];
    const outData = [];
    
    // Simple mock untuk 6 bulan terakhir berdasarkan data
    const months = [...new Set([...db.pemasukan, ...db.pengeluaran].map(item => item.tanggal.substring(0, 7)))].sort().slice(-6);
    if(months.length === 0) months.push(getToday().substring(0,7));

    months.forEach(month => {
        labels.push(month);
        inData.push(db.pemasukan.filter(p => p.tanggal.startsWith(month)).reduce((sum, p) => sum + p.total, 0));
        outData.push(db.pengeluaran.filter(p => p.tanggal.startsWith(month)).reduce((sum, p) => sum + p.nominal, 0));
    });

    if(keuanganChartInstance) keuanganChartInstance.destroy();

    keuanganChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Pemasukan', data: inData, backgroundColor: '#0d6efd', borderRadius: 5 },
                { label: 'Pengeluaran', data: outData, backgroundColor: '#dc3545', borderRadius: 5 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: textColor } } },
            scales: {
                y: { ticks: { color: textColor }, grid: { color: isDark ? '#333' : '#e5e5e5' } },
                x: { ticks: { color: textColor }, grid: { display: false } }
            }
        }
    });
}

// --- Database JSON (Backup / Restore) ---
document.getElementById('btnBackup').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `database_bariklana_${getToday()}.json`);
    dlAnchorElem.click();
    showNotification('Database berhasil dibackup!');
});

document.getElementById('restoreFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedDB = JSON.parse(e.target.result);
                if (importedDB.pemasukan && importedDB.pengeluaran && importedDB.pengaturan) {
                    db = importedDB;
                    saveDB();
                    showNotification('Database berhasil direstore!');
                } else {
                    showNotification('Format JSON tidak valid!', 'error');
                }
            } catch (err) {
                showNotification('Gagal membaca file JSON!', 'error');
            }
        };
        reader.readAsText(file);
    }
});

// --- Export Excel (SheetJS) ---
document.getElementById('btnExportExcel').addEventListener('click', () => {
    if(typeof XLSX === 'undefined') {
        showNotification('Library Excel belum dimuat, periksa koneksi internet.', 'error');
        return;
    }
    const wb = XLSX.utils.book_new();
    const wsIn = XLSX.utils.json_to_sheet(db.pemasukan);
    const wsOut = XLSX.utils.json_to_sheet(db.pengeluaran);
    XLSX.utils.book_append_sheet(wb, wsIn, "Pemasukan");
    XLSX.utils.book_append_sheet(wb, wsOut, "Pengeluaran");
    XLSX.writeFile(wb, `Laporan_Keuangan_${getToday()}.xlsx`);
    showNotification('Laporan Excel berhasil diunduh!');
});

// Initialize on Load
updateDashboard();
renderTables();