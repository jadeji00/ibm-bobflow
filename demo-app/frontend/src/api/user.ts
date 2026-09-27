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
