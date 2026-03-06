# Контроль

Мониторинг строительных объектов. Dark theme, Emerald accent. Mobile-first.

## Стек

React 18 (Vite) · Tailwind CSS · Framer Motion · Supabase · Lucide Icons · jsPDF

## Роли

- **Владелец** — только просмотр (прогресс, категории, подкатегории, PDF-отчёт)
- **Менеджер** — полный CRUD (категории, подкатегории, настройки проекта)

## Локальный запуск

```bash
git clone <repo-url> && cd stroy-control
cp .env.example .env
# Заполнить VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Структура

```
src/
├── components/
│   ├── AdminPanel.jsx         # Настройки проекта (менеджер)
│   ├── CategoryAdminPanel.jsx # Управление подкатегориями (менеджер)
│   ├── AuthForm.jsx
│   ├── Layout.jsx
│   ├── PageTransition.jsx
│   ├── ProtectedRoute.jsx
│   └── Skeleton.jsx
├── context/
│   ├── AuthContext.jsx
│   └── ToastContext.jsx
├── lib/
│   ├── supabase.js
│   └── pdf.js
├── pages/
│   ├── Dashboard.jsx          # Карточка проекта + список категорий
│   └── CategoryDetail.jsx     # Подкатегории внутри категории
└── App.jsx
```

## Лицензия

Private.
