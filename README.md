# VisiomED AI — Radiological Diagnostic Platform

An AI-assisted radiology platform that helps clinical teams upload medical scans, run automated diagnostic inference, collaborate through role-based workflows, and generate structured diagnostic reports.

Built as a full-stack system with a Django REST API backend and an Angular frontend, using deep learning models (DenseNet-121) for image-based diagnosis across three modalities: MRI, X-Ray, and CT.

## Features

- **Role-based access** — three user roles (Admin, Radiologist, Doctor), each with dedicated dashboards and permissions
- **Patient management** — create and track patient records
- **Medical image upload** — upload MRI, X-Ray, and CT scans for a patient
- **AI-powered inference** — automated classification via modality-specific DenseNet-121 models:
  - MRI → brain tumor detection
  - X-Ray → COVID-19 detection
  - CT → lung cancer detection
- **Diagnosis workflow** — radiologists review and validate AI predictions before sign-off
- **Report generation** — structured, exportable diagnostic reports (PDF via ReportLab)
- **Real-time chat** — in-app messaging between doctors and radiologists (Django Channels + Redis, WebSockets)
- **Data visualization** — charts and stats summaries on the radiology dashboard (ECharts)
- **JWT authentication** — secured API access via `djangorestframework-simplejwt`
- **Email notifications** — via Resend (account invites, password resets, etc.)

## Tech Stack

**Backend**
- Django 6 + Django REST Framework
- MongoDB (via MongoEngine) for domain data, SQLite for Django auth
- Django Channels + Daphne + Redis for WebSocket-based chat
- TensorFlow / Keras for model inference (DenseNet-121)
- Cloudinary for image storage
- JWT auth (`djangorestframework-simplejwt`)
- Resend for transactional email

**Frontend**
- Angular 21
- TanStack Query (Angular) for data fetching/caching
- Tailwind CSS 4
- ECharts (via ngx-echarts) for data visualization
- Vitest for unit testing

## Project Structure

```
radiological-platform/
├── backend/
│   ├── accounts/       # Auth, users, roles (admin/radiologist/doctor)
│   ├── patients/       # Patient records
│   ├── images/         # Medical image upload & storage
│   ├── inference/      # DenseNet-121 models + inference logic
│   ├── diagnosis/      # Diagnosis review/validation workflow
│   ├── reports/        # PDF report generation
│   ├── chat/           # Real-time chat (Channels/WebSockets)
│   ├── config/         # Django project settings, URLs, ASGI/WSGI
│   └── manage.py
├── frontend/
│   └── src/app/
│       ├── pages/          # Route-level views (login, upload, patients, chat, reports, admin, etc.)
│       ├── components/     # Reusable UI components
│       ├── services/       # API clients / shared logic
│       ├── guards/         # Route guards (role-based access)
│       ├── interceptors/   # HTTP interceptors (e.g. JWT attach)
│       └── layout/
└── requirements.txt
```

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- MongoDB instance (local or Atlas)
- Redis (for chat/WebSocket support)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/MahdiLcoder/radiological-platform.git
cd radiological-platform
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
```

Create a `.env` file inside `backend/` based on `.env.exemple`:

```env
MONGO_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_API_KEY=your_cloudinary_api_key
SECRET_KEY=your_django_secret_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

Run migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

> Real-time chat requires a running Redis instance on `127.0.0.1:6379` (default config in `settings.py`).

### 3. Frontend setup

```bash
cd frontend
npm install
ng serve
```

The app will be available at `http://localhost:4200/`.

By default, the frontend points to `http://localhost:8000/api` (see `src/environments/environment.ts`). Update this for production in `environment.prod.ts`.

## API Overview

| Endpoint            | Purpose                          |
|----------------------|-----------------------------------|
| `/api/auth/`         | Authentication & user management |
| `/api/patients/`     | Patient records                  |
| `/api/images/`       | Medical image upload             |
| `/api/inference/`    | AI diagnostic inference          |
| `/api/diagnosis/`    | Diagnosis review workflow        |
| `/api/reports/`      | Report generation                |
| `/api/chat/`         | Real-time chat                   |

## Testing

**Backend**
```bash
cd backend
python manage.py test
```

**Frontend**
```bash
cd frontend
ng test
```

## Notes

- AI predictions are decision-support only and must be reviewed and validated by a qualified radiologist before informing any clinical decision.
- Trained model files (`.keras`) are included under `backend/inference/models/` and are loaded lazily per modality at inference time.

## License

This project was developed as part of an academic PFE (Projet de Fin d'Études) internship.
