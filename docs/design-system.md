# Fuar CRM — Design System (Glassmorphism)

Bu doküman, Fuar CRM web uygulamasının Glassmorphism tabanlı tasarım sistemini tanımlar. Yeni bileşen veya sayfa geliştirirken bu kurallara uyulmalıdır.

---

## Tasarım Prensipleri

1. **Glassmorphism:** Yarı saydam arka planlar, `backdrop-blur` ile bulanık cam efekti.
2. **Tutarlılık:** Tüm sayfa ve bileşenler aynı tasarım dilini kullanır.
3. **Erişilebilirlik:** Yeterli kontrast, okunabilir metin boyutları.

---

## Renk Paleti

### Arka Plan
- **Ana gradient:** `from-slate-950 via-slate-900 to-slate-950` (statik, animasyon yok)
- **Body:** `globals.css` içinde `linear-gradient` ile tanımlı

### Vurgu Renkleri (Mor–Turkuaz)
- **Primary gradient:** `from-violet-500 to-cyan-500`
- **Accent:** `#8b5cf6` (violet-500)
- **Accent-to:** `#06b6d4` (cyan-500)

### Metin
- **Ana metin:** `text-white` veya `#f8fafc`
- **İkincil metin:** `text-white/60` veya `text-white/80`

### Glass Token'ları
- **Glass arka plan:** `bg-white/5` veya `bg-white/10`
- **Glass border:** `border-white/10` veya `border-white/20`
- **Blur:** `backdrop-blur-sm`, `backdrop-blur-xl`, `backdrop-blur-2xl`

---

## Bileşen Stilleri

### Kart (Glass Card)
```
backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl
```
Hover: `hover:border-white/30`, `hover:scale-[1.02]` (opsiyonel)

### Primary Button
```
bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-lg shadow-violet-500/50
hover:shadow-violet-500/70 hover:opacity-95
```

### Secondary Button
```
backdrop-blur-xl bg-white/5 border border-white/10 text-white
hover:bg-white/10 hover:border-white/20
```

### Form Alanları (Input, Select, Textarea)
```
rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm
focus:border-violet-400/60 focus:ring-1 focus:ring-violet-400/30
placeholder:text-white/50
```

### Modal
- **Overlay:** `backdrop-blur-sm bg-black/60`
- **Panel:** `backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl`

### TopBar / Header
```
backdrop-blur-xl bg-slate-950/30 border-b border-white/10
```
- **Aktif nav:** `bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-white border border-white/20`
- **İnaktif nav:** `text-white/60 hover:text-white hover:bg-white/5`

### Badge
- **Varsayılan:** `backdrop-blur-xl bg-white/10 border border-white/20 text-white/90 rounded-full`
- **Renkli:** `color` prop ile dinamik `backgroundColor` ve `borderColor`

---

## Fuar Kartı Gradient'leri

Her fuar kartı için farklı gradient kullanılır (kart ID'sine göre hash):

| Sıra | Gradient |
|------|----------|
| 1 | `from-violet-500/20 to-purple-500/20` |
| 2 | `from-blue-500/20 to-cyan-500/20` |
| 3 | `from-pink-500/20 to-rose-500/20` |
| 4 | `from-emerald-500/20 to-teal-500/20` |
| 5 | `from-amber-500/20 to-orange-500/20` |
| 6 | `from-indigo-500/20 to-blue-500/20` |
| 7 | `from-fuchsia-500/20 to-pink-500/20` |
| 8 | `from-lime-500/20 to-green-500/20` |
| 9 | `from-cyan-500/20 to-sky-500/20` |

---

## Token Referansı (globals.css)

| Token | Değer |
|-------|-------|
| `--color-bg` | `#020617` |
| `--color-accent-from` | `#8b5cf6` |
| `--color-accent-to` | `#06b6d4` |
| `--color-glass-bg` | `rgba(255,255,255,0.05)` |
| `--color-glass-border` | `rgba(255,255,255,0.2)` |
| `--blur-sm` | `4px` |
| `--blur-md` | `12px` |
| `--blur-xl` | `24px` |
| `--blur-2xl` | `40px` |

---

## Yeni Bileşen Eklerken

1. **Kart tipi:** Yukarıdaki Glass Card pattern'ini kullan.
2. **Buton:** Primary için gradient, secondary için glass.
3. **Form alanı:** Input/Select/Textarea ile uyumlu glass stil.
4. **Modal:** Modal bileşenini kullan; içerik zaten glass panel içinde.
5. **Tablo:** `backdrop-blur-2xl bg-white/10 border border-white/20` container.

---

## Referanslar

- **Figma tasarım:** [Dark Mode Glassmorphism Design](https://www.figma.com/design/TLSeAb4pXt3ST72bPvT2VX/Dark-Mode-Glassmorphism-Design)
- **Kod örneği:** `docs/ui-example/` klasörü
- **Token tanımları:** `apps/web/src/app/globals.css`
