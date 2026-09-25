import { z } from 'zod'

export const CreateChannelSchema = z.object({
  workspace_id: z.string().min(10),
  name: z.string().min(3),
  channel_type: z.string(),
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
  id: z.string().min(10),
})

export const GetAllChannelSchema = z.object({
  workspace_id: z.string().min(10),
})
