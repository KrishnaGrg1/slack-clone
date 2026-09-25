import { z } from 'zod'

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  is_private: z.boolean(),
})

export const EditWorkspaceSchema = z.object({
  id: z.string().min(10),
  name: z.string().min(3),
  slug: z.string().min(3),
  is_private: z.boolean(),
})

export const JoinWorkspaceSchema = z.object({
  id: z.string().min(10),
})

export const SearchWorkspaceSchema = z.object({
  search: z.string(),
  page: z.number().positive(),
  limit: z.number().positive(),
})

export const InviteWorkspaceSchema = z.object({
  id: z.string().min(10),
})

export const DeleteWorkspaceSchema = z.object({
  id: z.string().min(10),
})

export const GetWorkspaceBySlugSchema = z.object({
  slug: z.string(),
})
