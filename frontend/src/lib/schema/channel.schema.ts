import { z } from 'zod'

export const CreateChannelSchema = z.object({
  workspace_id: z.string().min(10),
  name: z.string().trim().min(3),
  channel_type: z.enum(['public', 'private']),
})

export const GetChannelByIDSchema = z.object({
  workspace_id: z.string().min(10),
  channel_id: z.string().min(10),
})

export const JoinChannelSchema = z.object({
  workspace_id: z.string().min(10),
  channel_id: z.string().min(10),
})

export const LeaveChannelSchema = z.object({
  workspace_id: z.string().min(10),
  channel_id: z.string().min(10),
})

export const GetChannelMessageSchema = z.object({
  workspace_id: z.string().min(10),
  channel_id: z.string().min(10),
  before: z.string().datetime({ offset: true }).optional(),
})

export const GetThreadSchema = z.object({
  workspace_id: z.string().min(10),
  id: z.string().min(10),
})

export const GetAllChannelSchema = z.object({
  workspace_id: z.string().min(10),
})
