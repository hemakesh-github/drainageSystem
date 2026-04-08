# Drainage System Monitoring & Reporting App — Agent Spec

## What you are building
A mobile app (React Native + Expo) where citizens of Namburu village report drainage issues (blockages, overflow, open drains, stagnant water) and track the status of their complaint. A simple admin screen lets an operator update complaint statuses.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Mobile | React Native + Expo (JavaScript, no TypeScript) |
| Backend | Python + FastAPI |
| Database | PostgreSQL (Render managed DB) |
| Image storage | Render local filesystem at `/uploads/` |
| Deployment | Render (backend as Web Service, DB as managed PostgreSQL) |

---

## Backend — FastAPI

### File structure
```
backend/
├── main.py
├── database.py
├── models.py
├── schemas.py
├── requirements.txt
└── uploads/        ← auto-create this directory on startup
```

### `requirements.txt`
```
fastapi
uvicorn
sqlalchemy
psycopg2-binary
python-multipart
pillow
python-dotenv
```

### `database.py`
- Read `DATABASE_URL` from environment variable
- Create SQLAlchemy engine and SessionLocal
- Expose a `get_db` dependency function

### `models.py`
Single table: `complaints`

| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key, auto-generated |
| complaint_id | String | human-readable e.g. `NMB-2026-0001`, auto-generated on insert |
| name | String | reporter's name |
| mobile | String | reporter's mobile number |
| location | String | text description of location |
| issue_type | String | one of: `blocked`, `overflow`, `open_drain`, `stagnant` |
| description | String | text description of the problem |
| image_path | String | nullable, path to uploaded image file |
| status | String | one of: `submitted`, `under_review`, `in_progress`, `resolved` — default `submitted` |
| created_at | DateTime | auto UTC now |
| updated_at | DateTime | auto UTC now, updates on every change |

### `schemas.py`
- `ComplaintCreate` — fields: name, mobile, location, issue_type, description
- `ComplaintOut` — all fields including id, complaint_id, status, created_at, updated_at
- `StatusUpdate` — field: status (string)

### `main.py` — Routes

```
POST   /complaints                        → create complaint, returns ComplaintOut
GET    /complaints                        → list all, ordered by created_at desc
GET    /complaints/{complaint_id}         → get single by complaint_id string (e.g. NMB-2026-0001)
PATCH  /complaints/{complaint_id}/status  → update status, body: StatusUpdate
POST   /complaints/{complaint_id}/upload  → upload image (multipart), save to /uploads/{uuid}.jpg
GET    /uploads/{filename}                → serve uploaded image (StaticFiles mount)
GET    /health                            → returns {"status": "ok"}
```

Additional requirements for `main.py`:
- On startup, create `uploads/` directory if it does not exist
- Mount `/uploads` as a StaticFiles directory
- Add CORS middleware allowing all origins (needed for mobile app)
- `complaint_id` generation: `NMB-{YEAR}-{4-digit-zero-padded-count}` e.g. `NMB-2026-0001`
- Image upload: save file to `uploads/{uuid4}.jpg`, store relative path in DB

---

## Mobile App — Expo + React Native (JavaScript only, no TypeScript)

### Setup command
```bash
npx create-expo-app mobile --template blank
cd mobile
npx expo install expo-image-picker
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
```

### File structure
```
mobile/
├── app.json
├── App.js                    ← navigation setup
├── constants/
│   └── api.js                ← BASE_URL constant pointing to Render backend
├── components/
│   ├── StatusBadge.js        ← colored badge for complaint status
│   └── ComplaintCard.js      ← reusable card showing complaint summary
└── screens/
    ├── HomeScreen.js
    ├── ReportScreen.js
    ├── TrackScreen.js
    ├── AllComplaintsScreen.js
    └── AdminScreen.js
```

### `constants/api.js`
```js
export const BASE_URL = 'https://your-service-name.onrender.com';
```

### Navigation (`App.js`)
- Bottom tab navigator with 4 tabs: Home, Report, Track, All Complaints
- Admin screen accessible via a button on Home (not a tab)
- Use `@react-navigation/bottom-tabs`

### Color scheme
Use these colors consistently:
- Primary: `#0F6E56` (teal green)
- Background: `#F5F5F5`
- Card background: `#FFFFFF`
- Status colors:
  - submitted: `#378ADD` (blue)
  - under_review: `#BA7517` (amber)
  - in_progress: `#3B6D11` (green)
  - resolved: `#5F5E5A` (gray)

### Screen specs

#### `HomeScreen.js`
- App name: "Namburu Drainage"
- Subtitle: "Report and track drainage issues in your village"
- Three large buttons: Report Issue, Track Complaint, View All
- Small "Admin" text link at bottom
- Show a simple stats row: total complaints count fetched from `GET /complaints`

#### `ReportScreen.js`
Form fields:
- Full Name (TextInput)
- Mobile Number (TextInput, numeric keyboard)
- Village / Area (TextInput)
- Issue Type (picker: Blocked Drain, Overflow, Open Drain, Stagnant Water)
- Description (TextInput, multiline, 4 lines)
- Photo (optional): button to open image picker, show thumbnail preview if selected

On submit:
1. POST to `/complaints` with form data
2. If photo selected, POST to `/complaints/{complaint_id}/upload` with the image as multipart
3. On success: show the generated `complaint_id` in an Alert, clear the form
4. On error: show error message in an Alert

Validation: name, mobile, location, issue_type, description are all required before submit.

#### `TrackScreen.js`
- Single text input: "Enter Complaint ID (e.g. NMB-2026-0001)"
- Search button
- On result: show a card with all complaint details
- Show status as a colored `StatusBadge`
- Show a vertical timeline: Submitted → Under Review → In Progress → Resolved
  - Completed steps shown in primary color, pending steps grayed out

#### `AllComplaintsScreen.js`
- Fetch all complaints from `GET /complaints`
- FlatList of `ComplaintCard` components
- Each card shows: complaint_id, issue_type, location, status badge, created date
- Filter buttons at top: All, Submitted, In Progress, Resolved
- Pull to refresh

#### `AdminScreen.js`
- Password gate: hardcode password as `"admin123"` — show a password input on first open, store in component state (not persisted)
- After login: show FlatList of all complaints
- Each item: complaint details + buttons to change status to each of the 4 values
- On status change: call `PATCH /complaints/{complaint_id}/status`
- Show success/error feedback via Alert

### `components/StatusBadge.js`
- Takes `status` prop (string)
- Renders a small pill with background color and label text
- Use the status colors defined above

### `components/ComplaintCard.js`
- Takes `complaint` prop (object)
- Shows: complaint_id (bold), issue_type, location, StatusBadge, formatted date

---

## Deployment — Render

### PostgreSQL
1. Create a new Render PostgreSQL instance (free tier)
2. Copy the **Internal Database URL** for use in the Web Service

### Backend Web Service
- Runtime: Python
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables:
  - `DATABASE_URL` = internal postgres URL from above
- The `/uploads` directory will be created automatically on startup

### After deploy
- Update `mobile/constants/api.js` with the Render backend URL

---

## Key constraints for the agent

1. **JavaScript only** — no TypeScript, no `.ts` or `.tsx` files anywhere in the mobile app.
2. **Keep it simple** — no auth, no user accounts, no complex state management. Demo app for 1-2 users.
3. **Image handling** — Render filesystem is ephemeral (resets on redeploy). Acceptable for demo. Store images at `uploads/{uuid}.jpg`.
4. **Error handling** — wrap all API calls in try/catch, show user-friendly Alerts. Never crash silently.
5. **complaint_id** is the human-readable ID used throughout the app (e.g. `NMB-2026-0001`), not the UUID. Use this in all routes and UI.
6. **Admin password** `"admin123"` is hardcoded — intentional for demo simplicity.
7. **CORS** — backend must allow all origins so the Expo app can reach it.
8. **Database tables** — use `Base.metadata.create_all(bind=engine)` in `main.py` startup so tables are auto-created on first deploy.
9. **Do not add** TypeScript, Redux, auth middleware, email notifications, or any complexity not listed here.
