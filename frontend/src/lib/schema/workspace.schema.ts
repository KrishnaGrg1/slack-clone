import { z } from 'zod'

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  is_private:z.boolean(),
})