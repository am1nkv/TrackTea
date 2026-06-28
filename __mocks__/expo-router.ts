export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
})

export const useSegments = () => []

export const useFocusEffect = (cb: () => void) => cb()

export const Link = ({ children }: { children: React.ReactNode }) => children

export const Stack = Object.assign(
  ({ children }: { children: React.ReactNode }) => children,
  { Screen: () => null },
)

export const Tabs = Object.assign(
  ({ children }: { children: React.ReactNode }) => children,
  { Screen: () => null },
)
