import { createServerFn } from '@tanstack/react-start'
import axiosInstance from '../axios'
import {
  CreateChannelSchema,
  GetChannelByIDSchema,
  GetChannelMessageSchema,
  JoinChannelSchema,
  LeaveChannelSchema,
} from '../schema/channel.schema'
import type {
  CreateChannelInput,
  CreateChannelResponse,
  GetAllChannelResponse,
  GetChannelByIDInput,
  GetChannelMessageResponse,
  GetChannelResponse,
  JoinChannelInput,
  JoinChannelResponse,
  LeaveChannelInput,
  LeaveChannelResponse,
} from '../types/channel.type'

// create channel
export const createChannel = createServerFn({ method: 'POST' })
  .inputValidator((data) => CreateChannelSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<
        CreateChannelInput,
        CreateChannelResponse
      >('/channels', {
        data: data,
        method: 'POST',
      })
      return res
    } catch (error: unknown) {
      const err = error as Error
      throw new Error(err.message || 'Failed to create channel')
    }
  })

// get all Channel
export const getAllChannel = createServerFn({ method: 'GET' }).handler(
  async ({}) => {
    try {
      const res = await axiosInstance<null, GetAllChannelResponse>(
        '/channels',
        {
          method: 'GET',
        },
      )
      return res.data
    } catch (error: unknown) {
      const err = error as Error
      throw new Error(err.message || 'Failed to get all channel')
    }
  },
)

// get channel by channel_id
export const getChannelByID = createServerFn({ method: 'GET' })
  .inputValidator((data) => GetChannelByIDSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<GetChannelByIDInput, GetChannelResponse>(
        `/channels/${data.id}`,
        {
          method: 'GET',
        },
      )
      return res.data
    } catch (error: unknown) {
      const err = error as Error
      throw new Error(err.message || 'Failed to get channel')
    }
  })

// join channel
export const joinChannel = createServerFn({ method: 'POST' })
  .inputValidator((data) => JoinChannelSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<JoinChannelInput, JoinChannelResponse>(
        `/channels/${data.id}/join`,
        {
          method: 'POST',
        },
      )
      return res.data
    } catch (error: unknown) {
      const err = error as Error
      throw new Error(err.message || 'Failed to get channel')
    }
  })

// leave channel
export const leaveChannel = createServerFn({ method: 'POST' })
  .inputValidator((data) => LeaveChannelSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<LeaveChannelInput, LeaveChannelResponse>(
        `/channels/${data.id}/leave`,
        {
          method: 'POST',
        },
      )
      return res
    } catch (error: unknown) {
      const err = error as Error
      throw new Error(err.message || 'Failed to get channel')
    }
  })

// get channel messages
export const getChannelMessage = createServerFn({ method: 'GET' })
  .inputValidator((data) => GetChannelMessageSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const res = await axiosInstance<null, GetChannelMessageResponse>(
        `/channels/${data.id}/messages`,
        {
          method: 'GET',
        },
      )
      return res.data
    } catch (error: unknown) {
      const err = error as Error
      throw new Error(err.message || 'Failed to get channel')
    }
  })
