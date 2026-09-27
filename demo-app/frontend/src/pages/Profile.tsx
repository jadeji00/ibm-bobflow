import { useEffect, useRef, useState } from 'react'
import { fetchUser, uploadAvatar, type User } from '../api/user'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUser()
      .then(setUser)
      .catch((err: Error) => setError(err.message))
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const updated = await uploadAvatar(file)
      setUser(updated)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      // Reset the input so the same file can be re-selected after an error
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (error && !user) {
    return <main className="card"><p className="error">{error}</p></main>
  }

  if (!user) {
    return <main className="card"><p className="muted">Loading…</p></main>
  }

  return (
    <main className="card">
      <h1>User Profile</h1>

      <div className="avatar">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={`${user.username}'s avatar`} />
        ) : (
          <span className="avatar-placeholder">No Avatar</span>
        )}
      </div>

      <div className="avatar-upload">
        <label htmlFor="avatar-input" className={uploading ? 'muted' : undefined}>
          {uploading ? 'Uploading…' : 'Choose avatar'}
        </label>
        <input
          id="avatar-input"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          disabled={uploading}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && <p className="error">{error}</p>}

      <dl className="fields">
        <dt>Username</dt>
        <dd>{user.username}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
      </dl>
    </main>
  )
}
