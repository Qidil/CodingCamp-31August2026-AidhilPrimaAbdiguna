# To-Do List Life Dashboard

Dashboard produktivitas pribadi berbasis browser yang dikembangkan sebagai final
project untuk pengambilan sertifikat **RevoU Coding Camp — Software
Engineering**. Dashboard ini menggabungkan sapaan (greeting), focus timer,
to-do list, dan quick links dalam satu halaman — seluruh data tersimpan di
browser, sehingga tetap bisa dipakai bahkan saat offline.

## Key Features

- **Greeting** — menampilkan tanggal dan waktu saat ini, disertai pesan sapaan
  yang berubah otomatis sesuai waktu (pagi, siang, sore, malam).
- **Focus Timer** — hitung mundur 25 menit dengan tombol Start, Stop, dan
  Reset. Durasi bisa diatur kapan saja (jam, menit, detik), dan notifikasi
  browser muncul saat sesi selesai.
- **To-Do List** — tambah, edit, tandai selesai, dan hapus task. Judul
  duplikat otomatis diblokir, task bisa diurutkan dengan 4 cara, dan semuanya
  tersimpan di Local Storage sehingga tidak hilang saat halaman ditutup.
- **Quick Links** — simpan situs favorit sebagai tombol sekali klik yang
  membuka tab baru. Link tersimpan di Local Storage.

## Challenges

Sertifikasi mensyaratkan menyelesaikan minimal **3 dari 5** tantangan
opsional. Project ini menyelesaikan **4 dari 5**:

- [x] Light / Dark mode
- [ ] Custom name in greeting
- [x] Change Pomodoro time
- [x] Prevent duplicate tasks
- [x] Sort tasks

### Kenapa 4 dari 5?

Hanya tiga tantangan yang disyaratkan untuk lulus, tetapi saya ingin
submission ini melampaui syarat minimum. Setiap tantangan tambahan membuat
dashboard semakin enak dipakai: light/dark mode membuat tampilan tetap nyaman
di waktu mana pun, timer yang bisa diatur menyesuaikan sesi fokus dengan
durasi apa pun, prevent duplicate tasks menjaga daftar tetap rapi dan
tepercaya, dan sorting membuat daftar yang terus bertambah tetap mudah
dikelola. Satu tantangan yang tidak dicentang adalah custom name in greeting
— saya memilih menjaga greeting tetap sederhana dan membiarkan pesan
berbasis waktu berbicara sendiri, supaya dashboard tetap bersih dan terasa
sama untuk siapa pun yang membukanya.

## Struktur Project

```
project-root/
├── index.html       # satu-satunya file HTML
├── css/
│   └── styles.css   # satu-satunya file CSS
└── js/
    └── app.js       # satu-satunya file JavaScript
```

Submission mengikuti folder rules: hanya 1 file CSS di dalam `css/`, hanya
1 file JavaScript di dalam `js/`, dan kode dijaga tetap bersih serta mudah
dibaca.
