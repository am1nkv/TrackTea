const mockAuth = {
  getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  }),
  signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
  signUp: jest.fn().mockResolvedValue({ error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
}

const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue({ data: [], error: null }),
})

const mockStorage = {
  from: jest.fn().mockReturnValue({
    upload: jest.fn().mockResolvedValue({ error: null }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
  }),
}

export const createClient = jest.fn().mockReturnValue({
  auth: mockAuth,
  from: mockFrom,
  storage: mockStorage,
})
