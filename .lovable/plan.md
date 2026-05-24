## Perubahan

Klinika hanya melayani via WhatsApp (target user B40), jadi channel "Web" tidak relevan.

1. **Hapus card "Channels"** (PieChart) dari `src/components/klinika/ImpactTab.tsx`. Grid charts jadi satu kolom (Cases by flow) atau saya naikkan chart flow jadi full-width.
2. **Hapus perhitungan `channelCounts`** dari `useMemo` di file yang sama.
3. **Update seed data**: ubah 5 baris `channel='web'` jadi `'whatsapp'` di tabel `triage_cases` supaya konsisten.
4. **Simpan ke memory proyek**: aturan "Klinika hanya pakai channel WhatsApp (target B40), jangan tampilkan/tambahkan channel lain" di `mem://index.md` Core, supaya tidak muncul lagi di fitur baru.

Tidak ada perubahan schema — kolom `channel` tetap ada (mungkin berguna nanti), hanya data dan UI yang dirapikan.