import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../backend/src/app'

const app = createApp()

describe('GET /api/health', () => {
  it('reports the service as available', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })
})

describe('GET /api/user', () => {
  it('returns the current user profile', async () => {
    const response = await request(app).get('/api/user')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      username: 'Alice',
      email: 'alice@example.com',
      avatarUrl: null,
    })
  })

  it('reports no avatar until one is uploaded', async () => {
    const response = await request(app).get('/api/user')
    expect(response.body.avatarUrl).toBeNull()
  })
})
