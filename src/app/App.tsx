import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

/**
 * QueryClient is instantiated here (module scope) so it is a stable singleton
 * for the lifetime of the application, never re-created on re-renders.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Data is considered fresh for 5 minutes.
       * Individual queries can override this per feature.
       */
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

/**
 * Root application component.
 *
 * Provider order (outermost → innermost):
 *   QueryClientProvider → RouterProvider
 *
 * Rationale: React Router must be inside QueryClient so route components
 * can use TanStack Query hooks without additional nesting.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
