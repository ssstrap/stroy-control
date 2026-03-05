# СтройКонтроль

SaaS-приложение для контроля строительных объектов. Dark theme, Emerald accent.

## Стек

React 18 (Vite) · Tailwind CSS · Framer Motion · Supabase · Lucide Icons

---

## Локальный запуск

```bash
git clone <repo-url> && cd stroy-control
cp .env.example .env
# Заполнить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Требования: Node.js ≥ 18.

---

## Настройка Supabase

1. Создать проект на [supabase.com](https://supabase.com).
2. Открыть **SQL Editor** → выполнить `migration.sql` (создаёт таблицы `profiles`, `projects`, `project_members`, bucket `project-files`, RLS-политики, триггеры).
3. Скопировать **Project URL** и **anon public key** из Settings → API → вставить в `.env`.

### Checklist безопасности

- [ ] RLS включён на `profiles`, `projects`, `project_members`.
- [ ] Storage bucket `project-files` — private, политики `storage_select` / `storage_insert` / `storage_delete` созданы миграцией.
- [ ] Authentication → URL Configuration → **Redirect URLs**: добавить `https://<your-app>.vercel.app/**` (и `http://localhost:5173/**` для локальной разработки).

---

## Деплой на Vercel

1. Импортировать репозиторий на [vercel.com](https://vercel.com).
2. Framework Preset: **Vite**.
3. Environment Variables — добавить:
   | Переменная | Значение |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` |
4. Deploy. Vercel автоматически выполнит `vite build` и подхватит `vercel.json` для SPA-rewrites.
5. После первого деплоя — добавить домен Vercel в Supabase Redirect URLs (см. выше).

---

## Переменные окружения

| Переменная | Обязательная | Описание |
|---|---|---|
| `VITE_SUPABASE_URL` | Да | URL проекта Supabase |
| `VITE_SUPABASE_ANON_KEY` | Да | Публичный anon-ключ Supabase |

---

## Структура проекта

```
src/
├── components/     # AuthForm, Layout, ProtectedRoute, PageTransition, Skeleton
├── context/        # AuthContext, ToastContext
├── lib/            # supabase.js
├── pages/          # Dashboard, ProjectDetail
└── App.jsx
```

## Лицензия

Private.
