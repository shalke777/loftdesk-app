// tests/projects.spec.js
// Testy QA dla modułu "Projekty i harmonogram" — Playwright

import { test, expect } from '@playwright/test';

// ============================================================
// HELPERS
// ============================================================
async function login(page) {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', process.env.TEST_USER_EMAIL || 'test@loftdesk.pl');
  await page.fill('[data-testid="password"]', process.env.TEST_USER_PASSWORD || 'TestPass123!');
  await page.click('[data-testid="submit"]');
  await page.waitForURL(/\/(app|dashboard)/, { timeout: 10000 });
}

async function openProjectsModule(page) {
  await page.click('[data-testid="nav-projects"], text=Projekty');
  await page.waitForSelector('[data-testid="projects-list"], text=Projekty');
}

async function openNewProjectModal(page) {
  await page.click('text=Nowy projekt');
  await page.waitForSelector('role=dialog');
}

const validProject = {
  name:       'Testowy Remont Łazienki',
  code:       'TRL-26',
  start_date: '2026-03-01',
  end_date:   '2026-06-30',
  status:     'planned',
  priority:   'high',
};

// ============================================================
// BLOK 1: TWORZENIE PROJEKTU
// ============================================================
test.describe('Tworzenie projektu', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await openProjectsModule(page);
  });

  test('otwiera modal nowego projektu', async ({ page }) => {
    await openNewProjectModal(page);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Nowy projekt')).toBeVisible();
  });

  test('zapisuje prawidłowy projekt', async ({ page }) => {
    await openNewProjectModal(page);
    await page.fill('[name="name"], [placeholder*="projekt"]', validProject.name);
    // Kod powinien się auto-uzupełnić
    await expect(page.locator('[name="code"]')).not.toHaveValue('');
    await page.fill('[name="start_date"]', validProject.start_date);
    await page.fill('[name="end_date"]', validProject.end_date);
    await page.selectOption('[name="status"]', validProject.status);
    await page.selectOption('[name="priority"]', validProject.priority);
    await page.click('text=Zapisz projekt');
    // Modal powinien się zamknąć lub przejść do widoku projektu
    await expect(page.locator(`text=${validProject.name}`)).toBeVisible({ timeout: 8000 });
  });

  test('pokazuje błędy walidacji przy pustym formularzu', async ({ page }) => {
    await openNewProjectModal(page);
    await page.click('text=Zapisz projekt');
    await expect(page.getByText(/Nazwa projektu musi mieć/)).toBeVisible();
    await expect(page.getByText(/Data rozpoczęcia jest wymagana/)).toBeVisible();
  });

  test('blokuje datę zakończenia wcześniejszą niż startu', async ({ page }) => {
    await openNewProjectModal(page);
    await page.fill('[name="name"]', 'Test projekt');
    await page.fill('[name="start_date"]', '2026-06-01');
    await page.fill('[name="end_date"]', '2026-05-01');
    await page.click('text=Zapisz projekt');
    await expect(page.getByText(/nie może być wcześniejsza/)).toBeVisible();
  });

  test('auto-generuje kod projektu z nazwy', async ({ page }) => {
    await openNewProjectModal(page);
    await page.fill('[name="name"]', 'Remont Kuchni Nowak');
    const code = await page.inputValue('[name="code"]');
    expect(code.length).toBeGreaterThan(0);
    expect(code).toMatch(/[A-Z0-9\-]+/);
  });

  test('waliduje format kodu projektu', async ({ page }) => {
    await openNewProjectModal(page);
    await page.fill('[name="name"]', 'Test');
    await page.fill('[name="code"]', 'INVALID CODE!');
    await page.fill('[name="start_date"]', '2026-03-01');
    await page.fill('[name="end_date"]', '2026-06-01');
    await page.click('text=Zapisz projekt');
    await expect(page.getByText(/Kod może zawierać tylko/)).toBeVisible();
  });
});

// ============================================================
// BLOK 2: STATUSY PROJEKTU
// ============================================================
test.describe('Statusy projektu', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await openProjectsModule(page);
  });

  test('zmienia status z Planowany na W realizacji', async ({ page }) => {
    // Znajdź istniejący projekt w statusie "planned"
    await page.click('[data-testid="project-card"]:has-text("Planowany")');
    await page.waitForSelector('role=dialog');
    await page.click('text=→ W realizacji');
    await expect(page.getByText('W realizacji')).toBeVisible();
  });

  test('nie pozwala na niedozwolone przejście statusu', async ({ page }) => {
    // Projekt zakończony nie może zmienić statusu
    const completedProject = page.locator('[data-testid="project-card"]:has-text("Zakończony")').first();
    if (await completedProject.count() > 0) {
      await completedProject.click();
      await page.waitForSelector('role=dialog');
      await expect(page.locator('text=→ Planowany')).not.toBeVisible();
    }
  });

  test('wyświetla badge statusu z prawidłowym kolorem', async ({ page }) => {
    await expect(page.locator('text=Planowany').first()).toBeVisible();
    const badge = page.locator('[style*="color"]').filter({ hasText: 'Planowany' }).first();
    await expect(badge).toBeVisible();
  });
});

// ============================================================
// BLOK 3: ETAPY (MILESTONES)
// ============================================================
test.describe('Etapy i harmonogram', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await openProjectsModule(page);
    await page.click('[data-testid="project-card"]');
    await page.waitForSelector('role=dialog');
    await page.click('text=Harmonogram');
  });

  test('dodaje nowy etap', async ({ page }) => {
    await page.click('text=+ Dodaj etap');
    await page.fill('[name="milestone-name"], [placeholder*="etap"]', 'Etap 1 – Przygotowanie');
    await page.fill('[name="milestone-start"]', '2026-03-01');
    await page.fill('[name="milestone-end"]',   '2026-03-31');
    await page.click('text=Zapisz');
    await expect(page.getByText('Etap 1 – Przygotowanie')).toBeVisible({ timeout: 6000 });
  });

  test('blokuje etap poza zakresem projektu', async ({ page }) => {
    await page.click('text=+ Dodaj etap');
    await page.fill('[name="milestone-name"]', 'Etap błędny');
    await page.fill('[name="milestone-start"]', '2020-01-01');  // przed startem projektu
    await page.fill('[name="milestone-end"]',   '2020-03-01');
    await page.click('text=Zapisz');
    await expect(page.getByText(/nie może zaczynać się przed/)).toBeVisible();
  });

  test('pokazuje oś czasu Gantt', async ({ page }) => {
    // Jeśli są etapy — oś czasu powinna być widoczna
    const gantt = page.locator('text=Oś czasu');
    if (await gantt.count() > 0) {
      await expect(gantt).toBeVisible();
    }
  });

  test('przesuwa harmonogram o 7 dni', async ({ page }) => {
    await page.click('text=Przesuń harmonogram');
    await page.fill('[placeholder*="Dni"]', '7');
    await page.click('text=Przesuń');
    await expect(page.getByText('Harmonogram przesunięty').or(page.locator('text=schedule_shifted'))).toBeVisible({ timeout: 6000 });
  });
});

// ============================================================
// BLOK 4: ZADANIA
// ============================================================
test.describe('Zadania', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await openProjectsModule(page);
    await page.click('[data-testid="project-card"]');
    await page.waitForSelector('role=dialog');
    await page.click('text=Zadania');
  });

  test('dodaje nowe zadanie', async ({ page }) => {
    await page.click('text=+ Dodaj zadanie');
    await page.fill('[placeholder*="Tytuł"], [name="task-title"]', 'Montaż płytek w kuchni');
    await page.selectOption('[name="status"]', 'todo');
    await page.fill('[name="due_date"]', '2026-04-15');
    await page.click('text=Zapisz');
    await expect(page.getByText('Montaż płytek w kuchni')).toBeVisible({ timeout: 6000 });
  });

  test('pokazuje błąd przy pustym tytule zadania', async ({ page }) => {
    await page.click('text=+ Dodaj zadanie');
    await page.click('text=Zapisz');
    await expect(page.getByText(/Tytuł zadania musi mieć/)).toBeVisible();
  });

  test('filtruje zadania wg statusu', async ({ page }) => {
    await page.selectOption('select[name="filter-status"], select >> nth=0', 'done');
    // Upewnij się że pokazują się tylko ukończone lub lista jest pusta
    const tasks = page.locator('[data-testid="task-card"]');
    const count = await tasks.count();
    for (let i = 0; i < count; i++) {
      await expect(tasks.nth(i).locator('text=Zrobione')).toBeVisible();
    }
  });

  test('zmienia postęp zadania suwakiem', async ({ page }) => {
    await page.click('text=+ Dodaj zadanie');
    await page.fill('[placeholder*="Tytuł"]', 'Zadanie testowe postęp');
    await page.locator('input[type="range"]').fill('75');
    await expect(page.locator('text=75%')).toBeVisible();
  });

  test('archiwizuje zadanie (nie usuwa)', async ({ page }) => {
    // Znajdź przycisk archiwizacji zadania
    const archiveBtn = page.locator('[data-testid="task-archive"]').first();
    if (await archiveBtn.count() > 0) {
      const taskName = await page.locator('[data-testid="task-title"]').first().textContent();
      await archiveBtn.click();
      // Zadanie znika z listy aktywnych
      await expect(page.getByText(taskName || '')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('auto-ustawia postęp 100% przy statusie Zrobione', async ({ page }) => {
    await page.click('text=+ Dodaj zadanie');
    await page.fill('[placeholder*="Tytuł"]', 'Auto-postęp test');
    await page.selectOption('[name="status"]', 'done');
    await expect(page.locator('input[type="range"]')).toHaveValue('100');
  });
});

// ============================================================
// BLOK 5: WALIDACJA I EDGECASE'Y
// ============================================================
test.describe('Walidacja i edge cases', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await openProjectsModule(page);
  });

  test('nie pozwala na duplikat kodu projektu', async ({ page }) => {
    // Utwórz projekt z kodem "DUP-01"
    await openNewProjectModal(page);
    await page.fill('[name="name"]', 'Duplikat test 1');
    await page.fill('[name="code"]', 'DUP-01');
    await page.fill('[name="start_date"]', '2026-03-01');
    await page.fill('[name="end_date"]', '2026-06-01');
    await page.click('text=Zapisz projekt');
    await page.waitForTimeout(1000);

    // Spróbuj zapisać ten sam kod
    await openNewProjectModal(page);
    await page.fill('[name="name"]', 'Duplikat test 2');
    await page.fill('[name="code"]', 'DUP-01');
    await page.fill('[name="start_date"]', '2026-04-01');
    await page.fill('[name="end_date"]', '2026-07-01');
    await page.click('text=Zapisz projekt');
    await expect(page.getByText(/Kod projektu.*zajęty|unique|duplikat/i)).toBeVisible({ timeout: 6000 });
  });

  test('archiwizacja projektu usuwa go z listy', async ({ page }) => {
    await page.click('[data-testid="project-card"]');
    await page.waitForSelector('role=dialog');
    const projectName = await page.locator('[role="dialog"] h2, [role="dialog"] .project-name').first().textContent();
    await page.click('text=Archiwizuj');
    await page.click('text=OK, text=Tak'); // confirm dialog
    await expect(page.locator(`text=${projectName}`)).not.toBeVisible({ timeout: 6000 });
  });

  test('zamknięcie modalem klawiszem Escape', async ({ page }) => {
    await openNewProjectModal(page);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('modal jest dostępny dla czytników ekranu (aria)', async ({ page }) => {
    await openNewProjectModal(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-label', /.+/);
  });

  test('historia aktywności rejestruje zmiany', async ({ page }) => {
    await page.click('[data-testid="project-card"]');
    await page.waitForSelector('role=dialog');
    // Zmień status
    await page.click('text=→ W realizacji').catch(() => {});
    // Sprawdź historię
    await page.click('text=Historia');
    await expect(page.getByText(/status|zmieniono|zaktualizowano/i)).toBeVisible({ timeout: 5000 });
  });

  test('lista projektów filtruje wg statusu', async ({ page }) => {
    await page.selectOption('[name="filter-status"]', 'in_progress');
    const cards = page.locator('[data-testid="project-card"]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('text=W realizacji')).toBeVisible();
    }
  });

  test('wyszukiwanie projektów po nazwie', async ({ page }) => {
    const term = 'Remont';
    await page.fill('[placeholder*="Szukaj"]', term);
    await page.waitForTimeout(500);
    const cards = page.locator('[data-testid="project-card"]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      expect(text?.toLowerCase()).toContain(term.toLowerCase());
    }
  });
});

// ============================================================
// BLOK 6: MOBILE / PWA (responsive)
// ============================================================
test.describe('Mobile / PWA', () => {

  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test.beforeEach(async ({ page }) => {
    await login(page);
    await openProjectsModule(page);
  });

  test('modal zajmuje pełny ekran na mobile', async ({ page }) => {
    await openNewProjectModal(page);
    const modal = page.getByRole('dialog');
    const box = await modal.boundingBox();
    expect(box?.width).toBeGreaterThan(350);
    await expect(modal).toBeVisible();
  });

  test('zakładki są poziomo przewijane na mobile', async ({ page }) => {
    await page.click('[data-testid="project-card"]');
    await page.waitForSelector('role=dialog');
    const tabs = page.locator('[style*="overflow-x: auto"]').first();
    await expect(tabs).toBeVisible();
  });
});