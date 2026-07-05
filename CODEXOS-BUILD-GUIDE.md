# CodexOS — ISO Build Guide

**CodexSystem AI · MiniOS Integration**
Version 1.0 · July 2025

---

## Daftar Isi / Table of Contents

1. [Gambaran Umum / Overview](#1-gambaran-umum--overview)
2. [Metode A — GitHub Actions (Recommended)](#2-metode-a--github-actions-recommended)
3. [Metode B — Build di Linux PC](#3-metode-b--build-di-linux-pc)
4. [Konfigurasi ISO (build.conf)](#4-konfigurasi-iso-buildconf)
5. [Struktur Modul CodexSystem](#5-struktur-modul-codexsystem)
6. [Test ISO di QEMU / VirtualBox](#6-test-iso-di-qemu--virtualbox)
7. [Flash ke USB / Bootable Drive](#7-flash-ke-usb--bootable-drive)
8. [Troubleshooting](#8-troubleshooting)
9. [Referensi Cepat / Quick Reference](#9-referensi-cepat--quick-reference)

---

## 1. Gambaran Umum / Overview

CodexOS adalah distribusi Linux live bootable berbasis **MiniOS** (Debian trixie + XFCE)
yang sudah terpasang **CodexSystem AI** secara permanen.

```
Saat boot:
  MiniOS kernel → systemd → codexsystem.service (Python server di port 5000)
                           → XFCE desktop → Chromium terbuka otomatis
                                            → CodexOS Desktop Environment
```

### Yang sudah terpasang di ISO

| Komponen | Lokasi di ISO |
|---|---|
| CodexSystem AI server + UI | `/opt/codexsystem/` |
| Systemd service (auto-start) | `/usr/lib/systemd/system/codexsystem.service` |
| XFCE autostart (buka Chromium) | `/etc/skel/.config/autostart/codexsystem.desktop` |
| App menu entry | `/usr/share/applications/codexsystem.desktop` |
| Desktop icon | `/etc/skel/Desktop/CodexSystem AI.desktop` |

### Dua cara build

| Metode | Kebutuhan | Waktu | Kelebihan |
|---|---|---|---|
| **A — GitHub Actions** | Akun GitHub (gratis) | 30–90 menit | Tidak perlu PC kuat, otomatis |
| **B — Linux PC** | Debian/Ubuntu, 15 GB disk, root | 20–60 menit | Lebih cepat, kontrol penuh |

---

## 2. Metode A — GitHub Actions (Recommended)

GitHub Actions membangun ISO di server cloud GitHub **gratis**, lalu kamu download hasilnya.
Tidak perlu menginstall apapun di PC-mu.

### Langkah 1 — Push ke GitHub

Jika repo belum ada di GitHub:

```bash
# Di terminal lokal (bukan Replit), clone dulu dari Replit
git clone https://replit.com/@USERNAME/REPL-NAME.git codexos
cd codexos

# Buat repo baru di GitHub: https://github.com/new
# Nama contoh: codexos-minios

git remote add origin https://github.com/USERNAME/codexos-minios.git
git branch -M main
git push -u origin main
```

Atau dari Replit, klik **Version Control** → **Connect to GitHub** → push.

### Langkah 2 — Pastikan workflow ada

File `.github/workflows/build-iso.yml` sudah ada di repo ini.
Saat kamu push ke branch `main` atau `master`, build **langsung jalan otomatis**.

### Langkah 3 — Pantau build

1. Buka repo di GitHub
2. Klik tab **Actions** (atas halaman)
3. Klik workflow **"Build CodexOS ISO"** yang sedang berjalan
4. Klik job **"Build CodexOS MiniOS ISO"** untuk lihat log real-time

```
✅ Checkout repository          ~10 detik
✅ Free disk space              ~30 detik
✅ Install build dependencies   ~2 menit
✅ Sync CodexSystem → module    ~30 detik
✅ Set script permissions       ~5 detik
⏳ Build ISO                   30 – 90 menit   ← paling lama
✅ Collect ISO                  ~10 detik
✅ Upload ISO as artifact       ~2 menit
```

### Langkah 4 — Download ISO

Setelah build selesai (centang hijau):

1. Di halaman Actions, klik run yang sudah selesai
2. Scroll ke bawah ke bagian **Artifacts**
3. Klik **`CodexOS-ISO-N`** → file `.zip` akan terdownload
4. Extract zip → dapatkan file `.iso`

> **Catatan:** Artifact disimpan 14 hari. Setelah itu dihapus otomatis oleh GitHub.
> Simpan ISO-nya di PC kamu!

### Langkah 5 (Opsional) — Build manual dengan pilihan custom

Kamu bisa trigger build manual dengan pilihan desktop dan variant:

1. Tab **Actions** → klik **"Build CodexOS ISO"**
2. Klik tombol **"Run workflow"** (kanan atas)
3. Pilih:
   - **Desktop environment:** `xfce` (default) / `lxqt` / `flux` / `core`
   - **Package variant:** `standard` (default) / `minimum` / `toolbox`
4. Klik **"Run workflow"** hijau

| Pilihan | Keterangan |
|---|---|
| `xfce` + `minimum` | ISO paling kecil, loading cepat |
| `xfce` + `standard` | **Recommended** — seimbang ukuran & fitur |
| `xfce` + `toolbox` | Lengkap, ada dev tools, ISO lebih besar |
| `lxqt` + `standard` | Desktop ringan alternatif |

---

## 3. Metode B — Build di Linux PC

### 3.1 Persyaratan sistem

| Item | Minimum |
|---|---|
| OS | **Debian 12 (bookworm)** atau **Ubuntu 22.04 / 24.04** |
| CPU | x86_64 (64-bit), 2 core |
| RAM | 4 GB (8 GB recommended) |
| Disk | **15 GB** ruang kosong |
| Koneksi | Internet aktif (unduh ±2 GB paket) |
| Akses | **root** atau sudo |

> ⚠️ **Wajib Debian/Ubuntu.** Arch, Fedora, atau distro lain tidak support
> `debootstrap` untuk Debian trixie secara native.

### 3.2 Install dependensi

```bash
sudo apt update
sudo apt install -y \
    debootstrap \
    squashfs-tools \
    xorriso \
    grub-pc-bin \
    grub-efi-amd64-bin \
    isolinux \
    syslinux-common \
    rsync \
    python3 \
    curl wget ca-certificates \
    cpio gzip bzip2 xz-utils zstd pigz \
    kmod util-linux gettext git
```

Verifikasi instalasi:

```bash
debootstrap --version    # harus muncul versi
mksquashfs -version      # harus muncul versi
xorriso --version        # harus muncul versi
```

### 3.3 Dapatkan source code

**Opsi A — Clone dari GitHub (jika sudah push):**
```bash
git clone https://github.com/USERNAME/codexos-minios.git
cd codexos-minios
```

**Opsi B — Download dari Replit:**
Klik tombol tiga titik di Replit → **Download as zip** → extract di PC:
```bash
unzip codexos-minios.zip -d codexos-minios
cd codexos-minios
```

### 3.4 Jalankan build

```bash
# Dari folder utama proyek (ada CodexSystem/ dan minios-live-master/)
sudo bash build-iso.sh
```

Kamu akan melihat output seperti ini:

```
────────────────────────────────────────────────────
[build-iso] CodexOS MiniOS ISO Builder
────────────────────────────────────────────────────
[build-iso] Workspace : /home/user/codexos-minios
[build-iso] MiniOS dir: /home/user/codexos-minios/minios-live-master
[build-iso] Disk: 5.2G used / 50G total (42G free)
────────────────────────────────────────────────────
[build-iso] Step 1 — Syncing CodexSystem files into MiniOS module...
[build-iso] Step 2 — Setting permissions...
────────────────────────────────────────────────────
[build-iso] Step 3 — Running full MiniOS build  (this takes 20 – 60 min)...
[build-iso]          Output akan muncul di: minios-live-master/build/
```

Lalu proses build berjalan — kamu akan melihat banyak output dari debootstrap dan apt.

### 3.5 Hasil build

Setelah selesai, ISO ada di:

```
minios-live-master/build/
└── CodexOS-*.iso    (ukuran sekitar 800 MB – 1.5 GB)
```

Output script akan menampilkan:

```
────────────────────────────────────────────────────
[build-iso] ✓ Build complete!
[build-iso]   ISO  : /home/user/codexos-minios/minios-live-master/build/CodexOS-xfce-1.0-amd64.iso
[build-iso]   Size : 1.1G

  Flash to USB:
    sudo dd if="...CodexOS-xfce-1.0-amd64.iso" of=/dev/sdX bs=4M status=progress oflag=sync

  Test in QEMU:
    qemu-system-x86_64 -m 2G -cdrom "...CodexOS-xfce-1.0-amd64.iso" -boot d
```

### 3.6 Build hanya satu stage (lanjut dari titik tertentu)

Jika build gagal di tengah jalan dan ingin lanjut:

```bash
cd minios-live-master

# Lanjut dari stage tertentu sampai selesai
sudo ./minios-live build-modules - build-iso

# Atau jalankan satu stage saja
sudo ./minios-live build-iso
```

Urutan stage:

```
build-bootstrap → build-chroot → build-live → build-modules
               → build-boot → build-config → build-iso
```

---

## 4. Konfigurasi ISO (build.conf)

File konfigurasi utama: `minios-live-master/linux-live/build.conf`

Edit sebelum build untuk mengubah pengaturan ISO.

### Pengaturan penting

```bash
# ── Sistem dasar ─────────────────────────────────────────────────────────────
DISTRIBUTION="trixie"           # Versi Debian: buster/bullseye/bookworm/trixie
DISTRIBUTION_ARCH="amd64"       # Arsitektur: amd64 atau i386
DESKTOP_ENVIRONMENT="xfce"      # Desktop: core/flux/xfce/lxqt
PACKAGE_VARIANT="standard"      # Paket: minimum/standard/toolbox/ultra
COMP_TYPE="zstd"                # Kompresi: xz (kecil) / zstd (cepat) / lz4 (tercepat)

# ── Bahasa & waktu ───────────────────────────────────────────────────────────
LOCALE="en_US"                  # Ganti ke "id_ID" untuk Bahasa Indonesia
LIVE_TIMEZONE="Asia/Jakarta"    # Timezone Indonesia

# ── User default ─────────────────────────────────────────────────────────────
LIVE_USERNAME="live"            # Username user live
```

### Contoh konfigurasi untuk Indonesia

```bash
LOCALE="id_ID"
LIVE_TIMEZONE="Asia/Jakarta"
MULTILINGUAL="false"
```

---

## 5. Struktur Modul CodexSystem

Modul CodexSystem ada di:
```
minios-live-master/linux-live/scripts/10-codexsystem/
```

### File-file penting

| File | Fungsi |
|---|---|
| `packages.list` | Package yang diinstall: `python3`, `chromium` |
| `install` | Script yang berjalan di dalam chroot saat build |
| `prepare-files.sh` | Menyalin CodexSystem/ ke dalam modul sebelum build |
| `skip_conditions.conf` | Modul dilewati jika `DESKTOP_ENVIRONMENT=core` |
| `rootcopy-install/` | File yang disalin langsung ke rootfs ISO |

### Cara menambah paket ke CodexOS

Edit `packages.list`:

```bash
nano minios-live-master/linux-live/scripts/10-codexsystem/packages.list
```

Tambah nama package Debian, satu per baris:
```
python3
python3-pip
chromium
nodejs          # ← tambahkan di sini
npm             # ← tambahkan di sini
```

### Cara menambah file ke dalam ISO

Taruh file di dalam `rootcopy-install/` dengan path lengkap.

Contoh — tambah config file:
```
rootcopy-install/
└── etc/
    └── codexos.conf    ← akan jadi /etc/codexos.conf di dalam ISO
```

---

## 6. Test ISO di QEMU / VirtualBox

**Selalu test di VM sebelum flash ke USB!**

### QEMU (paling cepat)

```bash
# Install QEMU
sudo apt install qemu-system-x86

# Jalankan ISO (2 GB RAM, boot dari CD)
qemu-system-x86_64 \
    -m 2048 \
    -cdrom "/path/ke/CodexOS-*.iso" \
    -boot d \
    -vga std \
    -display gtk
```

Dengan KVM (jauh lebih cepat jika CPU support):
```bash
qemu-system-x86_64 \
    -enable-kvm \
    -m 2048 \
    -cpu host \
    -cdrom "/path/ke/CodexOS-*.iso" \
    -boot d \
    -vga std
```

### VirtualBox

1. Buka VirtualBox → **New**
2. Name: `CodexOS` · Type: `Linux` · Version: `Debian (64-bit)`
3. RAM: **2048 MB** minimum
4. Hard disk: **Skip** (live boot tidak perlu disk)
5. Settings → Storage → Controller IDE → tambah optical drive → pilih ISO
6. Start!

### Yang diharapkan saat boot

```
1. GRUB/SYSLINUX boot menu muncul
2. Pilih "CodexOS" atau tekan Enter
3. MiniOS boot splash
4. XFCE desktop muncul (~30 detik)
5. Chromium terbuka otomatis dengan CodexOS Desktop
6. Boot splash CodexOS → Lock screen → Desktop
```

> **Catatan:** Chromium butuh ~4 detik untuk muncul setelah XFCE load
> (ada jeda `sleep 4` di autostart).

---

## 7. Flash ke USB / Bootable Drive

### Metode 1 — `dd` (Linux, paling reliable)

```bash
# 1. Cari device USB kamu
lsblk
# Contoh output:
# sdb      8:16   1  14.9G  0 disk    ← ini USB 16GB
# └─sdb1   8:17   1  14.9G  0 part

# 2. PASTIKAN device yang benar! Salah device = data hilang!
# 3. Flash ISO (ganti /dev/sdb dengan device USB kamu)
sudo dd \
    if="/path/ke/CodexOS-*.iso" \
    of=/dev/sdb \
    bs=4M \
    status=progress \
    oflag=sync

# 4. Tunggu hingga selesai (ada output "X records out")
# 5. Eject USB
sync && sudo eject /dev/sdb
```

### Metode 2 — Balena Etcher (GUI, Windows/Mac/Linux)

1. Download: https://www.balena.io/etcher
2. Flash from file → pilih ISO
3. Select target → pilih USB drive
4. Flash!

### Metode 3 — Ventoy (multi-ISO di satu USB)

```bash
# Install Ventoy ke USB sekali
sudo sh Ventoy2Disk.sh -i /dev/sdX

# Lain kali, cukup copy file ISO ke USB yang sudah ada Ventoy
cp CodexOS-*.iso /media/user/Ventoy/
```

### Boot dari USB

1. Restart PC
2. Tekan tombol boot menu saat startup:
   - **Dell:** F12 · **HP:** F9 · **Lenovo:** F12 · **ASUS:** F8 · **Acer:** F12
3. Pilih USB drive dari boot menu
4. CodexOS akan boot!

---

## 8. Troubleshooting

### Build gagal: `debootstrap: command not found`
```bash
sudo apt install debootstrap
```

### Build gagal: `mksquashfs: command not found`
```bash
sudo apt install squashfs-tools
```

### Build gagal di `build-chroot` — internet error
Cek koneksi internet. Build membutuhkan koneksi untuk download paket Debian.
```bash
ping deb.debian.org
```

### Build gagal: `No space left on device`
Bebaskan disk. Build butuh ~15 GB:
```bash
df -h                           # cek ruang kosong
sudo apt clean                  # bersihkan cache apt
docker system prune -f          # jika pakai Docker
```

### GitHub Actions gagal di step "Build ISO"
- Buka log detail di GitHub Actions
- Cari baris error pertama (cari kata `ERROR` atau `FAILED`)
- Paling sering: package tidak ada di Debian trixie → hapus dari `packages.list`

### GitHub Actions: "Artifact not found"
Build gagal sebelum ISO selesai. Cek log step "Build ISO" untuk penyebabnya.

### Chromium tidak muncul saat boot ISO
Kemungkinan server Python belum siap. Cek status:
```bash
# Di dalam VM/live boot
systemctl status codexsystem
journalctl -u codexsystem -n 30
```

Jika service gagal start:
```bash
cd /opt/codexsystem && python3 server.py
# Lihat error di terminal
```

### CodexOS Desktop tidak muncul (halaman kosong)
Server berjalan tapi halaman error. Buka terminal di VM:
```bash
curl http://localhost:5000    # cek apakah server merespons
```

### Build berhasil tapi ISO tidak bisa boot
- Pastikan flash menggunakan `dd` atau Balena Etcher (bukan copy biasa)
- Coba boot di QEMU dulu untuk verifikasi
- Cek apakah USB port USB 3.0 atau 2.0 — coba port berbeda

---

## 9. Referensi Cepat / Quick Reference

### Perintah build

```bash
# Build penuh via script (LOCAL)
sudo bash build-iso.sh

# Build penuh via minios-live langsung (LOCAL)
cd minios-live-master
sudo ./minios-live -

# Build stage tertentu saja
sudo ./minios-live build-iso

# Build dari stage X sampai Y
sudo ./minios-live build-modules - build-iso
```

### Stage build dan durasinya

| Stage | Keterangan | Durasi |
|---|---|---|
| `build-bootstrap` | Install Debian base via debootstrap | 5–15 menit |
| `build-chroot` | Install desktop, packages di chroot | 10–30 menit |
| `build-live` | Buat SquashFS image sistem inti | 2–5 menit |
| `build-modules` | Build modul ekstra (termasuk CodexSystem) | 5–15 menit |
| `build-boot` | Generate initrd, boot files | 2–5 menit |
| `build-config` | Generate konfigurasi | < 1 menit |
| `build-iso` | Assemble ISO final | 1–3 menit |

### File penting

| File | Keterangan |
|---|---|
| `minios-live-master/linux-live/build.conf` | Konfigurasi utama ISO |
| `minios-live-master/linux-live/scripts/10-codexsystem/packages.list` | Paket CodexSystem |
| `minios-live-master/linux-live/scripts/10-codexsystem/install` | Script install modul |
| `minios-live-master/linux-live/scripts/10-codexsystem/prepare-files.sh` | Sync file CodexSystem |
| `.github/workflows/build-iso.yml` | GitHub Actions workflow |
| `build-iso.sh` | Script build lokal |
| `Dockerfile.build-iso` | Docker build (alternatif) |

### Link berguna

- MiniOS official: https://minios.dev
- MiniOS GitHub: https://github.com/minios-linux/minios-live
- Debian packages: https://packages.debian.org
- GitHub Actions docs: https://docs.github.com/en/actions

---

*CodexOS — Desktop AI Terintegrasi · Powered by CodexMind AI*
