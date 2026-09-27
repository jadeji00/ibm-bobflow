# Feature Request

> This is the single feature request that drives the BobFlow demo. It is handed
> to IBM Bob verbatim.

Add avatar upload functionality to the user profile page.

Users should be able to upload JPG and PNG images up to 5MB.

The system must validate file type and file size before accepting the upload.

Invalid files must be rejected safely.

The implementation should follow the existing project architecture and include
appropriate tests.

---

## Acceptance Criteria

### Accepted

| Input | Expected |
|---|---|
| JPEG, size ≤ 5MB | accepted |
| PNG, size ≤ 5MB | accepted |

### Rejected

| Input | Expected |
|---|---|
| JPEG, size > 5MB | rejected |
| PNG, size > 5MB | rejected |
| `TXT` file | rejected |
| `PDF` file | rejected |
| empty file | rejected |
| MIME type that does not match an allowed image type | rejected |
| filename containing path traversal (`../../…`) | rejected |
| filename with a spoofed extension | rejected |

### Non-functional

- Validation happens **server-side**. Client-side `accept="image/*"` and
  `file.type` are conveniences only and are never trusted.
- The stored filename is **generated server-side** (`uuid` + validated
  extension). The client-supplied filename is never used as a storage path.
- Storage is the local `uploads/` directory. No cloud storage.
- The existing profile functionality must keep working (regression).
