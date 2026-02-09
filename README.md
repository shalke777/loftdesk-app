# 🏗️ LoftDesk - System zarządzania kosztorysami budowlanymi

Aplikacja do zarządzania kosztorysami, fakturami i umowami dla firm budowlanych.

## 🚀 Instalacja

1. Sklonuj repozytorium:
```bash
git clone https://github.com/twoj-nick/loftdesk-app.git
cd loftdesk-app
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Skonfiguruj Supabase:
   - Załóż konto na [supabase.com](https://supabase.com)
   - Utwórz nowy projekt
   - Wykonaj SQL z pliku `supabase/schema.sql`
   - Skopiuj klucze API z Settings → API

4. Utwórz plik `.env`:
```bash
cp .env.example .env
```

5. Edytuj `.env` i wklej swoje klucze Supabase:
```
VITE_SUPABASE_URL=https://twoj-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=twoj-klucz-anon
```

6. Uruchom aplikację:
```bash
npm start
```

## 🗄️ Konfiguracja bazy danych

Wykonaj w Supabase SQL Editor:
```sql
-- Zobacz plik supabase/schema.sql
```

## ✨ Funkcje

- ✅ Kosztorysy budowlane
- ✅ Faktury VAT
- ✅ Umowy
- ✅ Zarządzanie kontrahentami
- ✅ Cennik usług
- ✅ Cloud backup (Supabase)
- ✅ Generowanie PDF

## 🛠️ Technologie

- React
- Supabase (backend + auth)
- jsPDF + html2canvas
- Tailwind CSS (style inline)

## 📄 Licencja

MIT