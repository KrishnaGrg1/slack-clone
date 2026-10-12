import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Workspace } from '#/lib/types/workspace.type'
import { searchWorkspace } from '#/lib/services/workspace.service'

export type SearchWorkspacesResult = {
  workspaces: Workspace[]
  pagination: { page: number; limit: number }
}

type SearchParams = { search: string; page: number; limit: number }

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useSearchWorkspaces(params: SearchParams, enabled: boolean) {
  return useQuery({
    queryKey: ['workspaces', 'search', params],
    queryFn: () =>
      searchWorkspace({
        data: { search: params.search, page: params.page, limit: params.limit },
      }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
