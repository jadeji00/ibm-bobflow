export interface User {
  id: string
  username: string
  email: string
  avatarUrl: string | null
}

// Single in-memory record — this demo app has no database by design.
const users: Record<string, User> = {
  'user-1': {
    id: 'user-1',
    username: 'Alice',
    email: 'alice@example.com',
    avatarUrl: null,
  },
}

export function getUser(id: string): User | undefined {
  return users[id]
}

export function updateUserAvatar(id: string, avatarUrl: string): User | undefined {
  const user = users[id]
  if (!user) return undefined
  user.avatarUrl = avatarUrl
  return user
}
