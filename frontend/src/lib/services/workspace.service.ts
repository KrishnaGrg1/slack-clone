import { createServerFn } from '@tanstack/react-start'
import axiosInstance from '../axios'

import type { CreatWorkspaceInput, CreatWorkspaceResponse, GetUserWorkspacesResponse } from '../types/workspace.type'
import { CreateWorkspaceSchema } from '../schema/workspace.schema'

export const GetUserWorkspaces = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const res = await axiosInstance<GetUserWorkspacesResponse>('/workspaces', {
      method: 'GET',
    })
    return res.data
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to fetch user',
    )
  }
})


export const createWorkspace = createServerFn({ method: 'POST' })
  .inputValidator((data) => CreateWorkspaceSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<CreatWorkspaceInput, CreatWorkspaceResponse>(
        '/auth/register',
        {
          data: data,
          method: 'POST',
        },
      )
      return res.data
    } catch (error: unknown) {
      const err = error as Error
      throw new Error(err.message || 'Failed to create workspace')
    }
  })
