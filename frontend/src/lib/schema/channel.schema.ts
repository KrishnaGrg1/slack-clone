import { z } from 'zod'

export const CreateChannelSchema = z.object({
  name: z.string().min(3),
})

export const GetChannelByIDSchema = z.object({
  id: z.string().min(16),
})

export const JoinChannelSchema = z.object({
  id: z.string().min(10),
})

export const LeaveChannelSchema = z.object({
  id: z.string().min(10),
})

export const GetChannelMessageSchema = z.object({
  id: z.string().min(10),
})
