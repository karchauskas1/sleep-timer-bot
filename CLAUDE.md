# CLAUDE.md - SHA (ЩА) Telegram Mini App

## Обзор проекта

**SHA (ЩА)** — Telegram Mini App для управления задачами, калькулятора сна и таймера.

- **Стек:** React 18 + TypeScript + Vite + Tailwind CSS
- **State:** Zustand + IndexedDB (Dexie)
- **Анимации:** Framer Motion
- **Деплой:** Vercel + PWA
- **Telegram:** @twa-dev/sdk

## Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка для продакшена
npm run build

# Просмотр собранной версии
npm run preview

# Линтинг
npm run lint

# Тесты
npm run test
```

## Структура проекта

```
src/
├── app/                    # Root компоненты
│   ├── App.tsx            # Main App с провайдерами
│   ├── Router.tsx         # State-based роутинг
│   └── providers/
│       ├── TelegramProvider.tsx
│       └── ThemeProvider.tsx
│
├── modules/               # Функциональные модули
│   ├── planner/          # Планировщик задач
│   ├── sleep/            # Калькулятор сна
│   └── timer/            # Таймер
│
├── shared/               # Общий код
│   ├── components/       # UI компоненты
│   ├── hooks/            # Custom hooks
│   └── utils/            # Утилиты
│
├── styles/               # CSS
│   ├── tokens.css        # Design tokens
│   ├── globals.css       # Базовые стили
│   └── animations.css    # Анимации
│
├── types/                # TypeScript типы
│   └── index.ts
│
└── main.tsx              # Entry point
```

## Модули

### Planner (Планировщик)

**Путь:** `src/modules/planner/`

Управление задачами с поддержкой рекуррентных задач.

**Компоненты:**
- `TaskInput` — ввод новой задачи
- `TaskList` — список задач
- `TaskItem` — элемент задачи (свайп-действия)
- `DatePicker` — выбор даты
- `RecurringList` / `RecurringItem` — повторяющиеся задачи

**Store:** `plannerStore.ts` (Zustand)
```ts
// Основные методы
addTask(input)
completeTask(id)
postponeTask(id, newDate)
deleteTask(id)
editTask(id, newText)
addRecurringTask(input)
deleteRecurringTask(id)
```

### Sleep (Калькулятор сна)

**Путь:** `src/modules/sleep/`

Расчёт оптимального времени сна на основе 90-минутных циклов.

**Режимы:**
- `bedtime` — "Ложусь сейчас" → когда просыпаться
- `waketime` — "Нужно встать в..." → когда ложиться

**Алгоритм:**
- Цикл сна = 90 минут
- Время засыпания = 15 минут
- Варианты: 3, 4, 5, 6 циклов (4.5–9 часов)

### Timer (Таймер)

**Путь:** `src/modules/timer/`

Простой таймер обратного отсчёта.

**Компоненты:**
- `TimerDisplay` — отображение времени
- `TimerPresets` — кнопки 5, 10, 25 мин
- `CustomTimeInput` — произвольное время

**Hook:** `useTimer.ts`
- Персистентность в localStorage
- Haptic feedback на завершение

## Shared компоненты

| Компонент | Описание |
|-----------|----------|
| `BottomNavigation` | iOS-style нижняя навигация |
| `SwipeableRow` | Свайп-действия (удалить/отложить) |
| `Onboarding` | Экран первого запуска |
| `EmptyState` | Пустое состояние |

## Hooks

| Hook | Описание |
|------|----------|
| `useTelegram()` | Доступ к Telegram SDK |
| `useHaptic()` | Haptic feedback |
| `useStoreHydration()` | Гидрация IndexedDB → Zustand |
| `useOnboarding()` | Управление onboarding |

## База данных (Dexie)

**Файл:** `src/shared/utils/storage.ts`

```ts
class ShaDatabase extends Dexie {
  tasks: Table<Task>
  recurringTasks: Table<RecurringTask>
  settings: Table<Setting>
}
```

**Индексы:**
- tasks: `id`, `date`, `completed`, `recurringId`
- recurringTasks: `id`, `active`
- settings: `key`

## Типы данных

```ts
// Задача
interface Task {
  id: string
  text: string
  date: string          // YYYY-MM-DD
  completed: boolean
  createdAt: string     // ISO 8601
  recurringId?: string
}

// Повторяющаяся задача
interface RecurringTask {
  id: string
  text: string
  schedule: {
    days: number[]      // 0=Sun, 1=Mon, ... 6=Sat
    time?: string       // HH:mm
    endDate?: string    // YYYY-MM-DD
  }
  active: boolean
  createdAt: string
}

// Модули навигации
type ModuleId = 'planner' | 'sleep' | 'timer'
```

## Design System

### CSS Variables (tokens.css)

**Цвета:**
```css
--color-bg: #FAFAFA
--color-text-primary: #1A1A1A
--color-text-secondary: #6B6B6B
--color-accent: #2D2D2D
--color-success: #3D3D3D
--color-error: #8B4B4B
```

**Spacing:**
```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
```

**Animation:**
```css
--duration-fast: 150ms
--duration-base: 200ms
--duration-slow: 300ms
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)
```

### Темы

Темы переключаются через `data-theme` атрибут на `<html>`:
- `light` (default)
- `dark`

Тема синхронизируется с Telegram colorScheme.

## Telegram интеграция

### Провайдер

```tsx
// TelegramProvider.tsx
<TelegramProvider>
  {children}
</TelegramProvider>

// Использование
const { colorScheme, haptic, close, expand, user } = useTelegramContext()
```

### Haptic Feedback

```tsx
const haptic = useHaptic()

haptic.light()      // Лёгкая вибрация
haptic.medium()     // Средняя
haptic.heavy()      // Сильная
haptic.success()    // Успех
haptic.error()      // Ошибка
haptic.selectionChanged()
```

## Роутинг

**State-based роутинг** (не URL-based):

```tsx
// Router.tsx
const [currentModule, setCurrentModule] = useState<ModuleId>('planner')

// Переключение через BottomNavigation
// Состояние сохраняется в localStorage (sha_last_module)
```

## Сборка и деплой

### Vite конфигурация

```ts
// vite.config.ts
- React plugin
- PWA plugin (vite-plugin-pwa)
- Path alias: '@' → './src'
- Manual chunks: framer-motion, vendor, date-fns, dexie
```

### PWA

Manifest генерируется автоматически через `vite-plugin-pwa`:
- Service Worker с Workbox
- Офлайн кэширование
- Иконки: 192x192, 512x512

### Vercel

```bash
# Деплой
vercel --prod

# URL
https://sleep-timer-lilac.vercel.app
```

## Telegram Bot

**Путь:** `/sleep-timer-bot/`

Простой Python бот на aiogram для запуска Mini App.

```python
# bot.py
BOT_TOKEN = "..."
WEB_APP_URL = "https://sleep-timer-lilac.vercel.app"

# /start → кнопка с ссылкой на Mini App
```

**Сервер:** 5.35.126.42
**Systemd:** `sleep-timer-bot.service`

```bash
# Управление
systemctl status sleep-timer-bot
systemctl restart sleep-timer-bot
journalctl -u sleep-timer-bot -f
```

## Принципы разработки

### Дизайн

1. **Минимализм** — нет нажима на продуктивность
2. **Спокойный интерфейс** — чистый UI для быстрых действий
3. **Быстрый ввод** — минимум кликов
4. **Много whitespace** — центрированные макеты
5. **Нейтральные цвета** — без ярких акцентов

### Код

1. **Модульная архитектура** — каждый модуль независим
2. **TypeScript strict mode** — строгая типизация
3. **Zustand + Dexie** — синхронизация state и persistence
4. **Framer Motion** — все анимации через одну библиотеку
5. **CSS Variables** — design tokens для консистентности

### Структура компонента

```tsx
// Импорты
import { ... }

// Константы
const ANIMATION_CONFIG = { ... }

// Типы
interface Props { ... }

// Компонент
export function Component({ ... }: Props) {
  // State
  // Effects
  // Handlers (useCallback)
  // Computed (useMemo)
  // Render
}
```

## Частые задачи

### Добавить новый модуль

1. Создать папку в `src/modules/`
2. Добавить компоненты, store, hooks
3. Добавить тип в `ModuleId`
4. Добавить в `Router.tsx`
5. Добавить в `BottomNavigation`

### Добавить новый тип данных

1. Добавить интерфейс в `src/types/index.ts`
2. Добавить таблицу в `storage.ts` (Dexie)
3. Создать Zustand store или добавить в существующий

### Изменить тему

1. Редактировать `src/styles/tokens.css`
2. Light тема — корневые переменные
3. Dark тема — `[data-theme="dark"]` селектор

### Деплой изменений

```bash
# 1. Коммит
git add -A && git commit -m "описание"

# 2. Push
git push

# 3. Деплой
vercel --prod
```

### Обновить бота

```bash
# 1. Редактировать bot.py
# 2. Скопировать на сервер
scp bot.py root@5.35.126.42:/opt/sleep-timer-bot/

# 3. Перезапустить
ssh root@5.35.126.42 "systemctl restart sleep-timer-bot"
```

## Зависимости

### Production

| Пакет | Версия | Назначение |
|-------|--------|------------|
| @twa-dev/sdk | ^7.10.1 | Telegram WebApp SDK |
| date-fns | ^3.6.0 | Работа с датами |
| dexie | ^4.0.8 | IndexedDB ORM |
| framer-motion | ^11.5.4 | Анимации |
| react | ^18.3.1 | UI библиотека |
| zustand | ^4.5.5 | State management |

### Dev

| Пакет | Версия | Назначение |
|-------|--------|------------|
| vite | ^5.4.1 | Сборка |
| typescript | ^5.5.3 | Типизация |
| tailwindcss | ^3.4.10 | CSS утилиты |
| vite-plugin-pwa | ^0.20.5 | PWA генерация |
| vitest | ^2.0.5 | Тестирование |
