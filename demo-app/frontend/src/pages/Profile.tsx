import { useEffect, useState } from 'react'
import { fetchUser, type User } from '../api/user'

export default function Profile() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
      .then(setUser)
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) {
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

      <dl className="fields">
        <dt>Username</dt>
        <dd>{user.username}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
      </dl>
    </main>
  )
}
