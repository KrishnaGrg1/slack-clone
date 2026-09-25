import { createServerFn } from '@tanstack/react-start'
import axiosInstance, { getApiErrorMessage } from '../axios'
import {
  CreateChannelSchema,
  GetAllChannelSchema,
  GetChannelByIDSchema,
  GetChannelMessageSchema,
  JoinChannelSchema,
  LeaveChannelSchema,
} from '../schema/channel.schema'
import type {
  CreateChannelResponse,
  GetAllChannelResponse,
  GetChannelMessageResponse,
  GetChannelResponse,
  JoinChannelResponse,
  LeaveChannelResponse,
} from '../types/channel.type'
import { getAuthHeader } from './helper'

// create channel
export const createChannel = createServerFn({ method: 'POST' })
  .validator((data) => CreateChannelSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { workspace_id, ...createData } = data
      const res = await axiosInstance<CreateChannelResponse>(
        `workspaces/${workspace_id}/channels`,
        {
          data: createData,
          method: 'POST',
        },
      )
      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to create channel'))
    }
  })

// get all Channel
export const getAllChannel = createServerFn({ method: 'GET' })
  .validator((data) => GetAllChannelSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const headers = await getAuthHeader()
      const res = await axiosInstance<GetAllChannelResponse>(
        `/workspaces/${data.workspace_id}/channels`,
        {
          method: 'GET',
          headers,
        },
      )
      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to get all channel'))
    }
  })

// get channel by channel_id
export const getChannelByID = createServerFn({ method: 'GET' })
  .validator((data) => GetChannelByIDSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const headers = await getAuthHeader()
      const res = await axiosInstance<GetChannelResponse>(
        `/workspaces/${data.workspace_id}/channels/${data.channel_id}`,
        {
          method: 'GET',
          headers,
        },
      )
      console.log('blah blah', res.data)
      return res.data
    } catch (error: unknown) {
      console.log('blah blah', error)
      throw new Error(getApiErrorMessage(error, 'Failed to get channel'))
    }
  })

// join channel
export const joinChannel = createServerFn({ method: 'POST' })
  .validator((data) => JoinChannelSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<JoinChannelResponse>(
        `/workspaces/${data.workspace_id}/channels/${data.channel_id}/join`,
        {
          method: 'POST',
        },
      )
      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to get channel'))
    }
  })

// leave channel
export const leaveChannel = createServerFn({ method: 'POST' })
  .validator((data) => LeaveChannelSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<LeaveChannelResponse>(
        `/workspaces/${data.workspace_id}/channels/${data.channel_id}/leave`,
        {
          method: 'POST',
        },
      )
      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to get channel'))
    }
  })

// get channel messages
export const getChannelMessage = createServerFn({ method: 'GET' })
  .inputValidator((data) => GetChannelMessageSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<GetChannelMessageResponse>(
        `/channels/${data.id}/messages`,
        {
          method: 'GET',
        },
      )
      return res.data
    } catch (error: unknown) {
      throw new Error(getApiErrorMessage(error, 'Failed to get channel'))
    }
  })
