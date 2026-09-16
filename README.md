# ☁️ My Cloud Storage Pro — Auth-Free Edition

A polished cloud-drive style application built with **React + Vite + Supabase**.

This version intentionally has **no login, signup, password or Supabase Auth UI**.

## Features

- Drag & drop file upload
- Multiple file upload
- Create folders
- Browse folders
- Search files
- File size and storage usage
- Download files
- Delete files
- Share links with expiry
- Responsive desktop/mobile UI
- Supabase Storage for files
- Supabase Postgres for metadata
- Public share download Edge Function
- Vercel-ready frontend

## Important security warning

Because authentication is disabled, this edition is a **public/shared cloud workspace**.

Anyone who can access the deployed website may be able to:
- upload files
- view file metadata
- download files
- create share links
- delete files

Do **not** use this configuration for private personal documents or sensitive data.

Never put a Supabase `service_role` key in the React `.env` file.

## Project structure

```text
my-cloud-storage-v2/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileCard.jsx
│   │   │   ├── ShareModal.jsx
│   │   │   ├── SharePage.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── UploadBox.jsx
│   │   ├── lib/
│   │   │   ├── storage.js
│   │   │   ├── supabase.js
│   │   │   └── utils.js
│   │   ├── App.jsx
│   │   ├── config.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vercel.json
├── supabase/
│   ├── schema.sql
│   └── functions/
│       └── share-download/
│           ├── config.toml
│           └── index.ts
└── README.md
```

## 1. Create Supabase project

Create a Supabase project.

Your React `.env.local` should contain:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

For the project used during development, the URL has the form:

```text
https://yvewzbubbeftgpwipxrj.supabase.co
```

Use your actual project URL/key in `.env.local` and Vercel.

## 2. Configure database

Open:

**Supabase Dashboard → SQL Editor**

Run the complete contents of:

```text
supabase/schema.sql
```

This creates the auth-free `folders`, `files` and `share_links` tables and their anonymous RLS policies.

If you are converting an existing authenticated database, back up important data first. The auth-free schema removes the old per-user `owner_id` dependencies from the cloud tables.

## 3. Create Storage bucket

In:

**Supabase → Storage → New bucket**

Create:

```text
user-files
```

The bucket can remain private because the application creates short-lived signed URLs for downloads.

The SQL file adds anonymous Storage policies for this bucket.

## 4. Install frontend

```bash
cd client
npm install
npm run dev
```

Open the Vite development URL shown in the terminal.

## 5. Build

```bash
npm run build
```

The build output should be created successfully before deployment.

## 6. Deploy to Vercel

Import the project into Vercel.

Set the **Root Directory** to:

```text
client
```

Add these environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Then deploy.

The included `client/vercel.json` handles SPA routes such as:

```text
/share/<token>
```

## 7. Share-download Edge Function

The function is:

```text
supabase/functions/share-download/index.ts
```

Deploy it with the Supabase CLI:

```bash
supabase functions deploy share-download
```

The function uses the server-side service role key inside Supabase. Never expose that key to the browser.

## Authentication

Authentication-related frontend files and flows were removed from this edition.

There is no:

```text
Login
Signup
Password
Logout
Auth.jsx
AdminPanel.jsx
```

The application opens directly into the cloud dashboard.

## Storage layout

Files are stored using:

```text
public/<folder-id-or-root>/<file-id>-<safe-file-name>
```

## Quota

The starter UI quota is:

```text
5 GB
```

Change it in:

```text
client/src/config.js
```

The displayed usage is calculated from file metadata.

## Troubleshooting

### `Email signups are disabled`

This version does not call:

```javascript
supabase.auth.signUp()
```

If you still see `/auth/v1/signup` in the browser, you are running an old frontend build or another component still contains an Auth call.

### `row-level security policy violation`

Run the current:

```text
supabase/schema.sql
```

in the Supabase SQL Editor.

### `owner_id` error

The auth-free database does not use:

```text
owner_id
```

If your old tables still require `owner_id`, migrate the schema before testing this edition.

### Storage upload denied

Confirm:
1. bucket name is exactly `user-files`
2. the Storage policies from `schema.sql` were executed
3. `VITE_SUPABASE_URL` points to the actual project
4. the publishable/anon key belongs to that project

## Production recommendation

For a real private cloud, add authentication and per-user RLS before storing private documents. A public anonymous workspace is fundamentally different from a private cloud drive.
