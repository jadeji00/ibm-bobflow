export interface User {
  username: string
  email: string
  avatarUrl: string | null
}

export async function fetchUser(): Promise<User> {
  const response = await fetch('/api/user')
  if (!response.ok) {
    throw new Error(`Failed to load user: ${response.status}`)
  }
  return response.json() as Promise<User>
}

export async function uploadAvatar(file: File): Promise<User> {
  const body = new FormData()
  body.append('avatar', file)
  const response = await fetch('/api/user/avatar', { method: 'POST', body })
  const data = await response.json() as { avatarUrl?: string; error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? `Upload failed: ${response.status}`)
  }
  // Re-fetch the full user so the returned shape is always a complete User
  return fetchUser()
}
