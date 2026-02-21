# INTEGRACJA MODUŁU PROJEKTY — LoftDesk
# Dokument: gdzie co wkleić, co zmienić — minimalna praca z Twojej strony

## ═══════════════════════════════════════════════════
## KROK 1: PLIKI DO SKOPIOWANIA (bez zmian)
## ═══════════════════════════════════════════════════

Skopiuj 4 pliki do projektu:

| Plik źródłowy (z downloadu) | Cel w projekcie |
|---|---|
| projectValidation.js | src/components/projects/projectValidation.js |
| useProjects.js | src/components/projects/useProjects.js |
| ProjectModal.jsx | src/components/projects/ProjectModal.jsx |
| projects_migration.sql | SUPABASE/migrations/20260221_projects_module.sql |
| projects.spec.js | tests/projects.spec.js |

Komendy Windows (CMD z folderu loftdesk-app):
```
mkdir src\components\projects
copy projectValidation.js src\components\projects\projectValidation.js
copy useProjects.js src\components\projects\useProjects.js
copy ProjectModal.jsx src\components\projects\ProjectModal.jsx
copy projects_migration.sql SUPABASE\migrations\20260221_projects_module.sql
copy projects.spec.js tests\projects.spec.js
```

## ═══════════════════════════════════════════════════
## KROK 2: MIGRACJA SUPABASE
## ═══════════════════════════════════════════════════

Otwórz Supabase Dashboard → SQL Editor → wklej zawartość pliku
SUPABASE/migrations/20260221_projects_module.sql i kliknij RUN.

WAŻNE: jeśli tabela `contractors` ma inną nazwę w Twojej bazie,
zmień w SQL linię:
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
na właściwą nazwę tabeli.

## ═══════════════════════════════════════════════════
## KROK 3: ZMIANA W App.js (lub App.jsx)
## ═══════════════════════════════════════════════════

Znajdź plik: src/App.js (lub App.jsx)

### 3a) Dodaj import na górze pliku:
```jsx
import ProjectModal, { ProjectList } from './components/projects/ProjectModal';
```

### 3b) Dodaj state dla modalu projektów:
W komponencie App (lub tam gdzie masz inne stany modali) dodaj:
```jsx
const [showProjects, setShowProjects] = useState(false);
const [activeProjectId, setActiveProjectId] = useState(null);
```

### 3c) Dodaj renderowanie modalu:
Znajdź miejsce gdzie renderujesz inne modale (np. InvoiceModal, ContractModal)
i dodaj tuż obok:
```jsx
{showProjects && (
  <ProjectModal
    projectId={activeProjectId}
    onClose={() => { setShowProjects(false); setActiveProjectId(null); }}
    onProjectSaved={() => { /* opcjonalnie odśwież coś */ }}
    contractors={contractors} /* przekaż swoją listę kontrahentów */
  />
)}
```

### 3d) Aby otworzyć listę projektów jako widok:
Możesz też osadzić ProjectList w dowolnym widoku:
```jsx
<ProjectList
  onOpenProject={(id) => { setActiveProjectId(id); setShowProjects(true); }}
  onNewProject={() => { setActiveProjectId(null); setShowProjects(true); }}
/>
```

## ═══════════════════════════════════════════════════
## KROK 4: PRZYCISK W NAWIGACJI
## ═══════════════════════════════════════════════════

Znajdź komponent nawigacji bocznej lub górnej (szukaj pliku z
"Faktury", "Kosztorysy", "Kontrahenci" jako linki/buttony).

Dodaj przycisk projektów w tym samym stylu co pozostałe:

```jsx
<button
  onClick={() => { setShowProjects(true); setActiveProjectId(null); }}
  style={{ /* skopiuj styl z przycisku obok */ }}
  data-testid="nav-projects"
>
  🏗️ Projekty
</button>
```

## ═══════════════════════════════════════════════════
## KROK 5: WERYFIKACJA IMPORTU SUPABASE
## ═══════════════════════════════════════════════════

Plik useProjects.js importuje:
```js
import { supabase } from '../../lib/supabaseClient';
```

Sprawdź czy Twój plik supabase ma dokładnie tę ścieżkę:
  src/lib/supabaseClient.js (lub .ts)

Jeśli jest inaczej (np. src/lib/supabase.js), zmień linię importu
w useProjects.js na właściwą ścieżkę.

## ═══════════════════════════════════════════════════
## KROK 6: OPCJONALNE - PRZEKAZANIE KONTRAHENTÓW
## ═══════════════════════════════════════════════════

ProjectModal przyjmuje prop `contractors` (lista kontrahentów do wyboru
przy tworzeniu projektu). Przekaż swoją istniejącą listę:

Jeśli masz hook useContractors lub podobny:
```jsx
const { contractors } = useContractors(); // Twój istniejący hook

<ProjectModal
  contractors={contractors || []}
  ...
/>
```

Jeśli contractors to już tablica w state - po prostu przekaż ją.

## ═══════════════════════════════════════════════════
## KROK 7: GIT I DEPLOY
## ═══════════════════════════════════════════════════

```cmd
git add src/components/projects/
git add SUPABASE/migrations/20260221_projects_module.sql
git add tests/projects.spec.js
git commit -m "feat: Dodaj modul Projekty i Harmonogram MVP"
git push origin main
```

## ═══════════════════════════════════════════════════
## PLAN WDROŻENIA: MVP → V2 → V3
## ═══════════════════════════════════════════════════

### MVP (teraz - gotowe):
✅ Tworzenie/edycja projektu (nazwa, kod, klient, daty, status, priorytet)
✅ Etapy i harmonogram z wizualizacją Gantt
✅ Zadania z filtrami, postępem, przypisaniem, statusami
✅ Archiwizacja (soft delete) projektów i zadań
✅ Historia aktywności (log zmian)
✅ Zmiana statusów z walidacją przejść
✅ Przesunięcie całego harmonogramu o N dni
✅ Izolacja danych per użytkownik (RLS Supabase)

### V2 (kolejne sprinty):
☐ Zakładka Budżet: połączenie z kosztorysami i fakturami
☐ Zakładka Dokumenty: powiązanie z plikami budowy
☐ Zakładka Zespół: RBAC per projekt (owner/manager/member/viewer)
☐ Zapraszanie współpracowników (e-mail)
☐ Powiadomienia o zbliżających się terminach
☐ Eksport projektu do PDF (raport dla klienta)
☐ Widok Kanban (kolumny statusów)
☐ Drag-and-drop zadań między etapami

### V3 (długoterminowo):
☐ Pełna integracja KSeF i dokumentów budowlanych
☐ Subprojekty / projekty wielopoziomowe
☐ Szablony projektów (kopiowanie struktury)
☐ Mapa (geolokalizacja placu budowy)
☐ Aplikacja mobilna PWA z offline mode
☐ Integracja z GUS (auto-uzupełnianie danych klienta po NIP)
☐ Raportowanie wieloprojektowe (dashboard zarządu)

## ═══════════════════════════════════════════════════
## TESTY QA - JAK URUCHOMIĆ
## ═══════════════════════════════════════════════════

Playwright jest już zainstalowany w projekcie. Uruchom:

```cmd
npx playwright test tests/projects.spec.js
```

Lub z raportem HTML:
```cmd
npx playwright test tests/projects.spec.js --reporter=html
npx playwright show-report
```

Zmienne środowiskowe dla testów (utwórz plik .env.test):
```
TEST_USER_EMAIL=twoj@email.pl
TEST_USER_PASSWORD=TwojeHaslo123
```

## ═══════════════════════════════════════════════════
## PODSUMOWANIE - STRUKTURA MODUŁU
## ═══════════════════════════════════════════════════

```
src/components/projects/
├── projectValidation.js   ← stałe, walidacja, logika statusów
├── useProjects.js         ← hook danych (Supabase CRUD)
└── ProjectModal.jsx       ← UI (modal + lista)

SUPABASE/migrations/
└── 20260221_projects_module.sql  ← 5 tabel + RLS + widok

tests/
└── projects.spec.js       ← 30+ testów Playwright
```

Tabele w bazie:
- projects              → główne projekty
- project_milestones    → etapy harmonogramu
- project_tasks         → zadania
- project_members       → RBAC per projekt
- project_activity_log  → historia zmian
- project_summary       → widok obliczeniowy (VIEW)