document.addEventListener('DOMContentLoaded', () => {

    // --- Pengaturan Dasar ---
    const canvas = document.getElementById('sand-canvas');
    const ctx = canvas.getContext('2d');
    const ambientSound = document.getElementById('ambient-sound');
    // [BARU] Ambil elemen P untuk pesan
    const messageElement = document.getElementById('message-text');

    const PARTICLE_SIZE = 4;
    
    const SAND_COLOR = 'rgba(254, 249, 195, 0.9)'; 
    const BG_COLOR = 'rgb(15, 23, 42)'; 
    // [DIHAPUS] MESSAGE_COLOR tidak perlu lagi
    // const MESSAGE_COLOR = 'rgb(15, 23, 42)'; 

    const BRUSH_RADIUS = 4; 

    let grid;
    let gridWidth, gridHeight;
    let isMouseDown = false;
    let hasPlayedAudio = false;

    // [DIUBAH] Daftar pesan tetap ada, tapi akan dipakai untuk teks HTML
    const messages = [
        "Aku belajar bahwa waktu bukan penyembuh, ia hanya pengingat yang halus—tentang siapa yang pernah membuat dunia terasa utuh.",
        "Waktu tak memberi kesempatan kedua; ia hanya memberikan kenangan agar penyesalan punya tempat beristirahat.",
        "Mungkin waktu memang cemburu—ia mengambilmu agar aku mengerti bahwa keabadian tak selalu bersama, kadang hanya tersisa dalam ingatan."
    ];


    // --- Fungsi Inisialisasi ---
    function init() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gridWidth = Math.floor(canvas.width / PARTICLE_SIZE);
        gridHeight = Math.floor(canvas.height / PARTICLE_SIZE);

        // [DIUBAH] Kita selalu buat grid baru, lalu coba load state
        grid = createGrid(gridWidth, gridHeight, 0);

        if (!loadState()) {
            console.log("Membuat grid baru...");
            // Tidak perlu apa-apa, grid sudah dibuat di atas
        }
        
        // [DIUBAH] Ambil pesan dan tampilkan di elemen HTML
        getMessage(); 
        // [DIHAPUS] rasterizeMessage(message); tidak dipakai lagi

        requestAnimationFrame(animate);
    }

    // --- Fungsi Logika Inti ---
    function createGrid(width, height, fillValue = 0) {
        return new Array(height).fill(null)
            .map(() => new Array(width).fill(fillValue));
    }

    function update() {
        // [DIUBAH] Kita buat salinan grid agar update tidak bentrok
        // Ini lebih stabil, tapi kita bisa sederhanakan
        
        // Loop tetap dari bawah ke atas agar pasir jatuh dengan benar
        for (let y = gridHeight - 2; y >= 0; y--) {
            for (let x = 0; x < gridWidth; x++) {
                
                // [DIUBAH] Logika disederhanakan. Hanya partikel 1 (pasir)
                // yang perlu dicek. Partikel 2 (pesan) sudah tidak ada.
                if (grid[y][x] === 1) { 
                    
                    // Jatuh lurus ke bawah
                    if (y + 1 < gridHeight && grid[y + 1][x] === 0) {
                        grid[y][x] = 0;
                        grid[y + 1][x] = 1;
                    } 
                    // Jatuh ke samping (diagonal)
                    else {
                        const dir = Math.random() < 0.5 ? -1 : 1;

                        if (x + dir >= 0 && x + dir < gridWidth && grid[y + 1][x + dir] === 0) {
                            grid[y][x] = 0;
                            grid[y + 1][x + dir] = 1;
                        } 
                        else if (x - dir >= 0 && x - dir < gridWidth && grid[y + 1][x - dir] === 0) {
                            grid[y][x] = 0;
                            grid[y + 1][x - dir] = 1;
                        }
                    }
                }
            }
        }
    }

    // [DIUBAH TOTAL] Ini adalah kunci optimasi performa
    function draw() {
        // 1. Gambar background (tetap sama)
        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        // 2. Mulai "batch" untuk semua partikel pasir
        ctx.beginPath();
    
        // 3. Loop dan tambahkan semua persegi pasir ke path
        //    Ini SANGAT CEPAT karena tidak menggambar, hanya mencatat.
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                if (grid[y][x] === 1) {
                    // JANGAN fillRect(). Cukup rect().
                    ctx.rect(x * PARTICLE_SIZE, y * PARTICLE_SIZE, PARTICLE_SIZE, PARTICLE_SIZE);
                }
                // [DIHAPUS] Logika "else if (grid[y][x] === 2)" dihapus
            }
        }
    
        // 4. Set warna dan gambar SEMUA partikel sekaligus dalam 1 perintah
        ctx.fillStyle = SAND_COLOR;
        ctx.fill();
    }


    function animate() {
        update(); 
        draw();   
        requestAnimationFrame(animate); 
    }

    // --- Fungsi Interaksi & Persistensi ---
    function addSand(x, y) {
        for (let i = -BRUSH_RADIUS; i <= BRUSH_RADIUS; i++) {
            for (let j = -BRUSH_RADIUS; j <= BRUSH_RADIUS; j++) {
                if (i * i + j * j < BRUSH_RADIUS * BRUSH_RADIUS) {
                    const newX = x + i;
                    const newY = y + j;
                    if (newX >= 0 && newX < gridWidth && newY >= 0 && newY < gridHeight) {
                        // [DIUBAH] Cukup cek jika = 0 (kosong).
                        // Tidak perlu khawatir menimpa partikel pesan.
                        if (grid[newY][newX] === 0) {
                            grid[newY][newX] = 1;
                        }
                    }
                }
            }
        }
    }

    function saveState() {
        console.log("Menyimpan state...");
        const state = {
            grid: grid,
            width: gridWidth,
            height: gridHeight
        };
        localStorage.setItem('sandClockState', JSON.stringify(state));
    }

    function loadState() {
        const savedStateJSON = localStorage.getItem('sandClockState');
        if (savedStateJSON) {
            console.log("State ditemukan. Mencoba memuat...");
            const savedState = JSON.parse(savedStateJSON);
            
            if (savedState.width === gridWidth && savedState.height === gridHeight) {
                grid = savedState.grid;
                console.log("State berhasil dimuat.");
                return true;
            } else {
                console.warn("Ukuran grid tidak cocok. State lama tidak dimuat.");
                localStorage.removeItem('sandClockMessage'); 
                return false;
            }
        }
        console.log("Tidak ada state tersimpan.");
        return false;
    }

    // [DIUBAH] Fungsi ini sekarang juga mengatur teks di elemen HTML
    function getMessage() {
        let savedMessage = localStorage.getItem('sandClockMessage');
        if (!savedMessage) {
            savedMessage = messages[Math.floor(Math.random() * messages.length)];
            localStorage.setItem('sandClockMessage', savedMessage);
        }
        
        // [BARU] Set teks di elemen HTML
        if (messageElement) {
            messageElement.innerText = savedMessage;
        }
        // (return value tidak lagi dipakai, tapi tidak apa-apa)
        return savedMessage;
    }

    // [DIHAPUS] Fungsi rasterizeMessage dihapus seluruhnya
    // function rasterizeMessage(message) { ... }


    // [BARU] Fungsi terpisah untuk memulai audio
    function playAudioOnce() {
        if (!hasPlayedAudio) {
            ambientSound.play()
                .then(() => {
                    hasPlayedAudio = true;
                    console.log("Audio dimulai.");
                })
                .catch(error => {
                    console.warn("Autoplay audio gagal:", error);
                });
        }
    }

    // --- Event Listeners ---
    // (Tidak ada perubahan di semua Event Listener, sudah benar)
    canvas.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        playAudioOnce(); 
        const x = Math.floor(e.clientX / PARTICLE_SIZE);
        const y = Math.floor(e.clientY / PARTICLE_SIZE);
        addSand(x, y);
    });

    canvas.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isMouseDown) {
            const x = Math.floor(e.clientX / PARTICLE_SIZE);
            const y = Math.floor(e.clientY / PARTICLE_SIZE);
            addSand(x, y);
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        isMouseDown = true;
        playAudioOnce(); 
        const touch = e.touches[0];
        const x = Math.floor(touch.clientX / PARTICLE_SIZE);
        const y = Math.floor(touch.clientY / PARTICLE_SIZE);
        addSand(x, y);
        e.preventDefault(); 
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        isMouseDown = false;
        e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (isMouseDown) {
            const touch = e.touches[0];
            const x = Math.floor(touch.clientX / PARTICLE_SIZE);
            const y = Math.floor(touch.clientY / PARTICLE_SIZE);
            addSand(x, y);
        }
        e.preventDefault(); 
    }, { passive: false });


    window.addEventListener('beforeunload', saveState);

    window.addEventListener('resize', () => {
        localStorage.removeItem('sandClockState');
        localStorage.removeItem('sandClockMessage'); 
        init();
    });

    localStorage.removeItem('sandClockState');
localStorage.removeItem('sandClockMessage');

    // --- Mulai ---
    init();

});