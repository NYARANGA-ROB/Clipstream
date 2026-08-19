# Clipstream

TikTok-style video sharing app built from the previous Instagram clone. Consumers watch, search, comment, and rate. Creators are enrolled privately and are the only users who can upload.

## Run locally

Postgres is required. Redis and MinIO are optional but recommended.

```bash
# infrastructure
docker compose up -d postgres redis minio minio-init

# backend
cd chhavi-anvaya-backend
cp .env.sample .env   # already created for local demo
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm start             # http://localhost:8000

# frontend (new terminal)
cd chhavi-anvaya-frontend
npm install
npm start             # http://localhost:3000
```

Full stack behind nginx (static hosting + API routing):

```bash
docker compose up --build
```

## Accounts

Public signup creates a **consumer** only. Consumers cannot upload.

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Creator | creator@clipstream.local | Creator123 |
| Consumer | viewer@clipstream.local | Viewer123 |
| Creator | chhavi_anvaya@example.com | password123 |

Enrol another creator with no public UI:

```bash
cd chhavi-anvaya-backend
npm run create-creator -- newcreator@clipstream.local newcreator Creator123 "Studio Name"
```

Or `POST /api/auth/creators` with header `x-creator-invite-secret`.

## What maps to a cloud platform

| Requirement | This app | Typical AWS / Azure |
| --- | --- | --- |
| Static HTML web app + REST | React build served by nginx, calls `/api` | S3 + CloudFront / Azure Blob + Front Door |
| REST + storage | Express API, Postgres, S3-compatible MinIO | ECS/App Service, RDS, S3/Blob |
| Identities and roles | JWT + `consumer` / `creator` | Cognito / Entra ID |
| Caching + DNS routing | Redis cache, nginx path routing | ElastiCache + Route 53 / Azure Cache + DNS |
| Media conversion | Optional ffmpeg transcode + thumbnail | MediaConvert / Media Services (not free) |
| Cognitive checks | Local keyword moderation on metadata | Rekognition / Video Indexer (paid after free tier) |

MediaConvert, Azure Media Services, Rekognition, and Video Indexer have limited or no true free production tiers. This stack keeps conversion and moderation local so a student/demo deploy stays on Postgres + object storage + a small VM.

## API

- `POST /api/auth/signup` consumer enrolment
- `POST /api/auth/signin`
- `POST /api/auth/creators` private creator enrolment
- `GET /api/videos` latest / search dashboard (`q`, `genre`, `age_rating`)
- `POST /api/videos` creator upload (`title`, `publisher`, `producer`, `genre`, `age_rating`, `video`)
- `GET /api/videos/:id` play payload, comments, ratings
- `POST /api/videos/:id/comments`
- `PUT /api/videos/:id/rating` score 1–5
- `GET /health`
