# Avatar Upload — Implementation Plan

## Overview

Add validated avatar upload to the user profile page.
A `POST /api/user/avatar` endpoint accepts multipart form-data, validates the
file server-side (type, size, magic bytes, filename safety), writes it to
`uploads/` under a generated name, updates the in-memory user record, and
returns the new `avatarUrl`.
The React `Profile` page gains an upload control that calls this endpoint and
re-renders the avatar on success.
New tests cover every row in the acceptance-criteria matrix.

---

## Acceptance Criteria (from docs/feature-request.md)

### Must accept
| Input | Expected |
|---|---|
| JPEG ≤ 5 MB | 200, avatarUrl set |
| PNG ≤ 5 MB | 200, avatarUrl set |

### Must reject
| Input | Expected |
|---|---|
| JPEG > 5 MB | 4xx |
| PNG > 5 MB | 4xx |
| TXT file | 4xx |
| PDF file | 4xx |
| Empty file (0 bytes) | 4xx |
| MIME type not in allow-list | 4xx |
| Filename containing path traversal (`../../…`) | 4xx |
| Spoofed extension (`.txt` renamed `.jpg`) | 4xx |

### Non-functional
- All validation is server-side; client `accept=` / `file.type` are UX only.
- Stored filename is `uuid + validated extension`; client filename never touches the filesystem.
- Storage is `demo-app/uploads/`. No cloud.
- Existing `GET /api/user` and `/api/health` behaviour must be unchanged (regression).

---

## Dependency

`formidable` is already present in `node_modules` (confirmed in directory listing).
It must be added to `package.json` `dependencies` so it is tracked.
No other new package is needed.

---

## Sub-Tasks

---

### Sub-Task 1 — Add formidable to package.json dependencies

**Status:** `[ ] pending`

**Intent**
`formidable` is physically present in `node_modules` (installed transitively) but
is not listed in `package.json`. It must be declared so the dependency is
explicit and reproducible.

**Expected Outcomes**
- `formidable` and `@types/formidable` appear in `dependencies` /
  `devDependencies` of `demo-app/package.json`.

**Todo List**
1. In `demo-app/package.json`, add `"formidable": "^3.5.1"` to `dependencies`.
2. Add `"@types/formidable": "^3.4.5"` to `devDependencies`.

**Relevant Context**
- `demo-app/package.json` — the only manifest that needs updating.

---

### Sub-Task 2 — Create upload validation service

**Status:** `[ ] pending`

**Intent**
All security controls live in one dedicated module so they can be tested and
reasoned about independently of the route.

**Expected Outcomes**
- New file `demo-app/backend/src/services/uploadService.ts` exists.
- Exports `validateUpload(file: formidable.File): UploadValidationResult` (named export).
- Enforces, in order:
  1. Zero-byte rejection (`file.size === 0`).
  2. Size limit: `file.size > 5 * 1024 * 1024` → reject.
  3. MIME allow-list: only `image/jpeg` and `image/png` accepted (from `file.mimetype`).
  4. Magic-byte check: read first 4 bytes of the temp file and verify the signature
     matches the declared type (JPEG: `FF D8 FF`; PNG: `89 50 4E 47`).
  5. Extension check: derive extension from `file.originalFilename`; ensure it is
     `.jpg`, `.jpeg`, or `.png` and matches the validated MIME type.
  6. Path-traversal guard: reject if `file.originalFilename` contains `..`, `/`,
     or `\`.
- Exports `generateStorageName(mimeType: string): string` — returns `<uuid>.<ext>`
  where `<ext>` is derived from the validated MIME type, never from the client.
- No file I/O beyond reading magic bytes; writing is the route's responsibility.

**Todo List**
1. Create `demo-app/backend/src/services/uploadService.ts`.
2. Implement `validateUpload` with the six checks above; return a discriminated-
   union result: `{ ok: true, mimeType, ext }` or `{ ok: false, reason: string }`.
3. Implement `generateStorageName`.
4. Export both functions as named exports.

**Relevant Context**
- `demo-app/backend/src/services/userService.ts` — pattern to follow for service
  module structure (named exports, explicit return types, TypeScript strict).
- `docs/design.md §Security` — authoritative list of required controls.
- `AGENTS.md §Code style` — no `any`, explicit return types.

---

### Sub-Task 3 — Add upload route to backend

**Status:** `[ ] pending`

**Intent**
Wire a `POST /api/user/avatar` endpoint that receives the file via multipart,
delegates all validation to `uploadService`, writes the accepted file to
`uploads/`, updates the in-memory user record, and returns the new `avatarUrl`.

**Expected Outcomes**
- `demo-app/backend/src/routes/user.ts` gains a `POST /user/avatar` handler.
- The handler uses `formidable` to parse the multipart body.
- On validation failure it returns `400` with `{ error: string }`.
- On success it:
  1. Calls `generateStorageName` to create the target filename.
  2. Moves/copies the temp file to `demo-app/uploads/<generated-name>`.
  3. Calls `updateUserAvatar(CURRENT_USER_ID, '/uploads/<generated-name>')` from
     `userService`.
  4. Returns `200` with `{ avatarUrl: '/uploads/<generated-name>' }`.
- `GET /api/user` still returns the updated `avatarUrl` after a successful upload
  (in-memory state is shared within a single `createApp()` call).

**Todo List**
1. Import `formidable`, `validateUpload`, and `generateStorageName` into
   `demo-app/backend/src/routes/user.ts`.
2. Add `router.post('/user/avatar', async (req, res) => { … })` handler.
3. Parse form with formidable (`maxFileSize: 5 * 1024 * 1024` as an additional
   guard — belt-and-suspenders alongside the service check).
4. Call `validateUpload`; on failure return `res.status(400).json({ error })`.
5. Move temp file → `uploads/<generated-name>` using `fs.promises.rename`.
6. Call `updateUserAvatar`; return `{ avatarUrl }`.

**Relevant Context**
- `demo-app/backend/src/routes/user.ts` — existing route file to extend.
- `demo-app/backend/src/services/userService.ts` — `updateUserAvatar` already
  exists and accepts `(id: string, avatarUrl: string)`.
- `CURRENT_USER_ID` is already exported from the same route file.
- `uploads/` directory already exists with a `.gitkeep`.

---

### Sub-Task 4 — Serve static uploads

**Status:** `[ ] pending`

**Intent**
The stored files must be retrievable by the browser so the `<img>` tag can
display them. Express must serve `uploads/` as static files under `/uploads/`.

**Expected Outcomes**
- `demo-app/backend/src/app.ts` adds `express.static('uploads')` middleware
  mounted at `/uploads`.
- A file written to `uploads/abc.jpg` is accessible at `GET /uploads/abc.jpg`.

**Todo List**
1. In `demo-app/backend/src/app.ts`, add:
   `app.use('/uploads', express.static('uploads'))` — place it before the API
   routes so it is resolved first for static assets.

**Relevant Context**
- `demo-app/backend/src/app.ts` — the only file to change.
- The Vite dev server already proxies `/api` to `:3001`; `/uploads` needs the
  same proxy. Update `demo-app/vite.config.ts` to also proxy `/uploads`.

---

### Sub-Task 5 — Update Vite dev proxy

**Status:** `[ ] pending`

**Intent**
In development, Vite runs on `:5173` and only proxies `/api`. The avatar images
are served from `uploads/` via Express at `:3001`, so `/uploads` must also be
proxied.

**Expected Outcomes**
- `demo-app/vite.config.ts` proxies both `/api` and `/uploads` to
  `http://localhost:3001`.

**Todo List**
1. In `demo-app/vite.config.ts`, extend the `proxy` object:
   ```
   proxy: {
     '/api': 'http://localhost:3001',
     '/uploads': 'http://localhost:3001',
   }
   ```

**Relevant Context**
- `demo-app/vite.config.ts` — the only file to change.

---

### Sub-Task 6 — Add upload API function to frontend

**Status:** `[ ] pending`

**Intent**
Keep API calls out of components. Add `uploadAvatar(file: File): Promise<User>`
to the existing `frontend/src/api/user.ts` module alongside `fetchUser`.

**Expected Outcomes**
- `demo-app/frontend/src/api/user.ts` exports `uploadAvatar`.
- The function sends a `FormData` POST to `/api/user/avatar`.
- On non-OK response, it throws an `Error` with the server's `error` field.
- On success it returns the updated `User` shape (with new `avatarUrl`).

**Todo List**
1. Add `uploadAvatar(file: File): Promise<User>` as a named export in
   `demo-app/frontend/src/api/user.ts`.
2. Build `FormData`, append the file under the field name `avatar`, `POST` to
   `/api/user/avatar`.
3. Parse response: on failure extract `body.error` and throw; on success return
   `body` as `User`.

**Relevant Context**
- `demo-app/frontend/src/api/user.ts` — existing module; follow `fetchUser` pattern.
- The `User` interface in this file does not need to change (`avatarUrl` is already
  `string | null`).

---

### Sub-Task 7 — Update Profile component with upload UI

**Status:** `[ ] pending`

**Intent**
Let the user select and upload an avatar directly from the profile page.
The UI follows the patterns already established in the component.

**Expected Outcomes**
- `demo-app/frontend/src/pages/Profile.tsx` renders a file input inside the
  avatar section.
- Selecting a file triggers an upload; the component shows an uploading state,
  then updates the avatar image on success.
- Upload errors are surfaced in the existing `error` state (same rendering path
  as fetch errors).
- Client-side `<input accept="image/jpeg,image/png">` is present as a UX hint
  only; no client-side type/size enforcement.

**Todo List**
1. Import `uploadAvatar` from `../api/user`.
2. Add `uploading: boolean` state (controls the disabled state of the input).
3. Add `handleFileChange(e: React.ChangeEvent<HTMLInputElement>)`:
   - Guard: if no file selected, return.
   - Set `uploading = true`, clear `error`.
   - Call `uploadAvatar(file)`.
   - On success: `setUser(updatedUser)`, `setUploading(false)`.
   - On failure: `setError(err.message)`, `setUploading(false)`.
4. Below the avatar `<div>`, add:
   ```
   <input type="file" accept="image/jpeg,image/png"
          disabled={uploading} onChange={handleFileChange} />
   ```
5. No CSS changes required — the existing `.error` and `.muted` classes cover
   all new states.

**Relevant Context**
- `demo-app/frontend/src/pages/Profile.tsx` — the only component file to change.
- `demo-app/frontend/src/index.css` — existing styles; no additions needed.

---

### Sub-Task 8 — Write tests

**Status:** `[ ] pending`

**Intent**
Cover every acceptance-criteria row with a real HTTP test against `createApp()`.
All tests go in `demo-app/tests/user.test.ts` alongside the existing tests to
keep the single-file convention and ensure the vitest config picks them up.

**Expected Outcomes**
- A `describe('POST /api/user/avatar')` block is added to `tests/user.test.ts`.
- Every row in the acceptance-criteria matrix maps to at least one `it(...)`.
- The existing `GET /api/user` and `/api/health` tests still pass (regression).
- Tests use `supertest` + `createApp()` — no mocks.

**Test cases to implement**

| Class | Case | Assertion |
|---|---|---|
| positive | JPEG ≤ 5 MB | `status 200`, `avatarUrl` set |
| positive | PNG ≤ 5 MB | `status 200`, `avatarUrl` set |
| negative | JPEG > 5 MB | `status 400` |
| negative | PNG > 5 MB | `status 400` |
| negative | TXT file | `status 400` |
| negative | PDF file | `status 400` |
| negative | Empty file | `status 400` |
| negative | MIME not in allow-list | `status 400` |
| security | Path traversal in filename | `status 400` |
| security | Spoofed extension | `status 400` |
| regression | `GET /api/user` after upload returns updated avatarUrl | `status 200`, `avatarUrl` matches |

**Implementation notes**
- Construct minimal in-memory `Buffer` fixtures for each file type (JPEG magic:
  `FF D8 FF E0`, PNG magic: `89 50 4E 47 0D 0A 1A 0A`); no disk fixtures needed.
- Use supertest's `.attach('avatar', buffer, { filename, contentType })` to send
  multipart data.
- After each upload test that writes to `uploads/`, clean up with `afterEach` /
  `afterAll` using `fs.promises.readdir` + `unlink` (skip `.gitkeep`).
- The in-memory user store persists across tests within one `createApp()` call;
  create a fresh `createApp()` per describe block or reset state between tests.

**Relevant Context**
- `demo-app/tests/user.test.ts` — existing test file to extend.
- `demo-app/vitest.config.ts` — `include: ['tests/**/*.test.ts']`, node env.
- `docs/design.md §Testing` — canonical test matrix.

---

## File Change Summary

| File | Action | Reason |
|---|---|---|
| `demo-app/package.json` | Modify | Add `formidable` to dependencies |
| `demo-app/backend/src/services/uploadService.ts` | **Create** | All upload security controls in one place |
| `demo-app/backend/src/routes/user.ts` | Modify | Add `POST /user/avatar` route |
| `demo-app/backend/src/app.ts` | Modify | Mount `express.static('uploads')` at `/uploads` |
| `demo-app/vite.config.ts` | Modify | Proxy `/uploads` to Express in dev |
| `demo-app/frontend/src/api/user.ts` | Modify | Add `uploadAvatar` function |
| `demo-app/frontend/src/pages/Profile.tsx` | Modify | Add file input and upload handling |
| `demo-app/tests/user.test.ts` | Modify | Add upload test suite |

**Not touched:** `server.ts`, `App.tsx`, `main.tsx`, `index.css`,
`vitest.config.ts`, all `bobflow/` files, all repo-root files.
