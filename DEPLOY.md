# Running and publishing Flyer Studio

Everything below assumes you are in the project folder.

---

## 1. Run it on this machine

### Development (hot reload)

```bash
npm install
npm run dev
```

- Front-end → http://localhost:5173
- API → http://localhost:4010 (Vite proxies `/api` and `/media` to it)

### Production (what the preview panel shows)

```bash
npm run build     # bundles the client into dist/client
npm start         # Express serves the API *and* the built client on :4010
```

Open http://localhost:4010.

### Sign in

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `frontlearn` |
| Staff | `staff` | `staff123` |

**Change these before the app goes anywhere public.** Copy `.env.example` to `.env`
and edit:

```bash
cp .env.example .env
```

```ini
ADMIN_USERNAME=your-admin
ADMIN_PASSWORD=a-long-password
STAFF_PASSWORD=another-long-password
```

The server reads `.env` automatically at start-up. Everything in it is optional — the
app runs with sensible defaults if the file is absent.

### Useful commands

```bash
npm test                       # engine unit tests
npm run typecheck              # client + server type check
npm run structure              # print the file map
npx tsx scripts/smoke.ts       # screenshot every screen, assert no console errors
npx tsx scripts/e2e.ts         # upload a picture → export PNG/JPG/PDF
npx tsx scripts/e2e-admin.ts   # assist, brand and template admin flows
```

The three script checks need a browser once: `npx playwright install chromium`.

---

## 2. Push it to GitHub

The repository is already initialised and has one commit. You need three things:
a GitHub repository, your identity in git, and a way to authenticate.

### Step 1 — tell git who you are

```bash
git config user.name  "Your Name"
git config user.email "you@example.com"
```

(Without this, commits fail with *"Please tell me who you are"*.)

### Step 2 — create the GitHub repository

On github.com → **New repository** → name it `flyer-studio` → set visibility → **Create
repository**. Do **not** tick "Add a README" — this project already has one.

### Step 3 — connect and push

Replace `YOUR_USERNAME` with your GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/flyer-studio.git
git push -u origin main
```

Git will ask for a **Personal Access Token**, not your password:

- github.com → Settings → Developer settings → Personal access tokens → **Tokens
  (classic)** → Generate new token → scope **repo** → copy it.
- Paste it into the password prompt. The username is your GitHub username.

#### Option A — SSH (no token needed on every push)

```bash
ssh-keygen -t ed25519 -C "you@example.com"     # press Enter for the path
cat ~/.ssh/id_ed25519.pub                       # copy the output
```

Add the key under github.com → Settings → SSH and GPG keys → New SSH key. Then:

```bash
git remote set-url origin git@github.com:YOUR_USERNAME/flyer-studio.git
ssh -T git@github.com                           # first time: "Are you sure?" → yes
git push -u origin main
```

#### Option B — the GitHub CLI

```bash
# macOS
brew install gh
# Windows: winget install GitHub.cli
# Debian/Ubuntu
sudo apt install gh

gh auth login                                  # choose GitHub.com → HTTPS → browser
gh repo create flyer-studio --private --source=. --push
```

`gh repo create … --push` creates the remote *and* pushes in one step.

### What is **not** pushed

`.gitignore` keeps these out of the repository:

| Excluded | Why |
| --- | --- |
| `node_modules/` | recreated by `npm install` |
| `dist/` | recreated by `npm run build` |
| `data/` | the JSON store and uploads — seeded fresh on first run |
| `shots/`, `uploads/`, `.cache/` | scratch folders |
| `.env` | secrets |

`public/logo.png` **is** committed — it is the school logo the app ships with.

### After you push

```bash
git clone https://github.com/YOUR_USERNAME/flyer-studio.git
cd flyer-studio
npm install
npm run build
npm start
```

---

## 3. Put it online

### Render / Railway / Fly.io (easiest)

These read the Dockerfile automatically.

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Health check path:** `/api/health`
- **Environment variables:** `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `STAFF_PASSWORD`,
  `PORT=4010`
- **Persistent disk:** mount at `/app/data` — that is where flyers, templates and
  uploaded images live. Without it, everything resets on every deploy.

### Docker anywhere

```bash
docker build -t flyer-studio .
docker run -d -p 4010:4010 \
  -v flyer-data:/app/data \
  -e ADMIN_PASSWORD='a-long-password' \
  --name flyer-studio flyer-studio
```

### A school server (Ubuntu)

```bash
sudo apt install -y nodejs npm nginx
```

Build and run it as a service with `systemd`:

```ini
# /etc/systemd/system/flyer-studio.service
[Unit]
Description=Flyer Studio
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/flyer-studio
ExecStart=/usr/bin/npm start
Environment=NODE_ENV=production
Environment=PORT=4010
Environment=ADMIN_PASSWORD=change-me
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now flyer-studio
```

Put nginx in front for HTTPS:

```nginx
server {
  listen 443 ssl;
  server_name flyers.yourschool.ac.ke;

  ssl_certificate     /etc/letsencrypt/live/flyers.yourschool.ac.ke/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/flyers.yourschool.ac.ke/privkey.pem;

  client_max_body_size 12M;      # logo and photo uploads

  location / {
    proxy_pass http://127.0.0.1:4010;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

> **Cookies and HTTPS.** In production mode the session cookie is marked `secure`, so it
> is only sent over HTTPS. Behind plain HTTP on a local network, set
> `INSECURE_COOKIES=1` instead of `NODE_ENV=production`.

---

## 4. A quick checklist before you share it

- [ ] `cp .env.example .env` and set a strong `ADMIN_PASSWORD` and `STAFF_PASSWORD`
- [ ] Run it on HTTPS (the session cookie needs it)
- [ ] Mount `/app/data` on a persistent volume
- [ ] `npm test` and `npm run typecheck` pass
- [ ] Upload the real school logo in **Brand → School logo** and press **Save brand**
- [ ] Change the palette in **Brand** if the school colours differ from navy and gold
