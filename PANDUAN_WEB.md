# TANDZUR Desktop Web (berbasis Android v1.7.2)

## Yang perlu disiapkan sekali
1. Firebase Console > Project settings > Your apps > aplikasi Web **TANDZUR Cloud** > SDK setup and configuration > Config.
2. Salin nilai **appId** (format `1:...:web:...`) ke file `firebase-config.js`, menggantikan `GANTI_DENGAN_APP_ID_WEB_FIREBASE`. `apiKey`, `authDomain`, dan `projectId` telah disiapkan dari proyek Android; cocokkan dengan config aplikasi Web yang resmi.
3. Upload file `index.html`, `web-bridge.js`, `firebase-config.js`, `404.html`, `.nojekyll` ke repository GitHub Pages, idealnya repository TERPISAH `tandzur-web`. Jangan mengunggah ZIP rahasia, keystore, atau password.
4. GitHub repo web > Settings > Pages > Deploy from branch > main > /(root) > Save. Alamat situs umumnya `https://beebima.github.io/tandzur-web/`.
5. Firebase Console > Authentication > Settings > Authorized domains > tambahkan `beebima.github.io` (bukan URL lengkap).
6. Firestore Rules harus memberi izin Owner dan Admin ke dokumen `users/{OWNER_UID}/garden/state` dan izin baca profil sendiri di `members/{email}`. Role Super Admin membutuhkan aturan tambahan untuk mengelola members. Jangan gunakan aturan publik.

## Pengujian
- Buka alamat GitHub Pages lewat Chrome/Edge. Login Google sebagai Owner. Pastikan data sama dengan Android.
- Tambahkan satu catatan simulasi di web; pastikan muncul di Android, lalu sebaliknya.
- Coba Admin dan Super Admin.
- Jangan menjalankan Reset Total saat pengujian dengan data penting.

## Batasan
- Web memakai login popup Firebase JS; browser mungkin memblokir popup, atau browser tertentu memerlukan redirect.
- Alarm latar belakang Android tidak tersedia di browser tertutup.
- Status sinkronisasi memakai respons Firestore; konflik edit bersamaan belum diselesaikan secara transaksional.
- Pembatasan reset total pada dokumen state yang sama belum bisa ditegakkan hanya melalui tombol UI; gunakan untuk keluarga tepercaya sampai struktur database dipecah.
- File ini belum dideploy; perlu konfigurasi appId Web dan hosting HTTPS.
