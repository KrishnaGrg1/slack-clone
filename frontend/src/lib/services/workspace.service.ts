import { createServerFn } from '@tanstack/react-start'
import axiosInstance, { getApiErrorMessage } from '../axios'

import type {
  CreatWorkspaceInput,
  CreatWorkspaceResponse,
  DeleteWorkspaceResponse,
  editWorkspaceInput,
  EditWorkspaceResponse,
  GetUserWorkspacesResponse,
  GetWorkspaceBySlugResponse,
  InviteWorkspaceMemberResponse,
  JoinWorkspaceResponse,
  SearchWorkspaceInput,
  SearchWorkspaceResponse,
} from '../types/workspace.type'
import {
  CreateWorkspaceSchema,
  DeleteWorkspaceSchema,
  EditWorkspaceSchema,
  GetWorkspaceBySlugSchema,
  InviteWorkspaceSchema,
  JoinWorkspaceSchema,
  SearchWorkspaceSchema,
} from '../schema/workspace.schema'

import { getAuthHeader } from './helper'

export const GetUserWorkspaces = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const headers = await getAuthHeader()
      const res = await axiosInstance<GetUserWorkspacesResponse>(
        '/workspaces',
        {
          method: 'GET',
          headers,
        },
      )
      return res.data.data
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to fetch user workspaces'),
      )
    }
  },
)

export const createWorkspace = createServerFn({ method: 'POST' })
  .validator((data) => CreateWorkspaceSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const headers = await getAuthHeader()
      const res = await axiosInstance<
        CreatWorkspaceInput,
        CreatWorkspaceResponse
      >('/workspaces', {
        data,
        method: 'POST',
        headers,
      })
      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to create workspace'))
    }
  })

export const editWorkspace = createServerFn({ method: 'POST' })
  .validator((data) => EditWorkspaceSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const headers = await getAuthHeader()
      const { id, ...editData } = data

      const res = await axiosInstance<EditWorkspaceResponse>(
        `/workspaces/${id}`,
        {
          data: editData,
          method: 'PUT',
          headers,
        },
      )
      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to edit workspace'))
    }
  })

export const joinWorkspace = createServerFn({ method: 'POST' })
  .validator((data) => JoinWorkspaceSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const headers = await getAuthHeader()
      const res = await axiosInstance<JoinWorkspaceResponse>(
        `/workspaces/${data.id}/join`,
        {
          method: 'POST',
          headers,
        },
      )
      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to join workspace'))
    }
  })

export const searchWorkspace = createServerFn({ method: 'GET' })
  .validator((data) => SearchWorkspaceSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const headers = await getAuthHeader()
      const res = await axiosInstance<SearchWorkspaceResponse>(
        '/workspaces/search',
        {
          method: 'GET',
          params: {
            search: data.search,
            page: data.page,
            limit: data.limit,
          },
          headers,
        },
      )

      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to search workspaces'))
    }
  })

export const inviteWorkspace = createServerFn({ method: 'POST' })
  .validator((data) => InviteWorkspaceSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const headers = await getAuthHeader()
      const res = await axiosInstance<InviteWorkspaceMemberResponse>(
        `/workspaces/${data.id}/invite`,
        {
          method: 'POST',
          headers,
        },
      )

      return res.data
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to create invite link of workspace'),
      )
    }
  })

export const deleteWorkspace = createServerFn({ method: 'POST' })
  .validator((data) => DeleteWorkspaceSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const headers = await getAuthHeader()
      const res = await axiosInstance<DeleteWorkspaceResponse>(
        `/workspaces/${data.id}`,
        {
          method: 'DELETE',
          headers,
        },
      )
      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete workspace'))
    }
  })

export const getWorkspaceBySlug = createServerFn({ method: 'GET' })
  .validator((data) => GetWorkspaceBySlugSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const headers = await getAuthHeader()
      const res = await axiosInstance<GetWorkspaceBySlugResponse>(
        `/workspaces/slug/${data.slug}`,
        {
          method: 'GET',
          headers,
        },
      )
      return res.data
    } catch (error: unknown) {
      throw new Error(
        getApiErrorMessage(error, 'Failed to get workspace by slug'),
      )
    }
  })
