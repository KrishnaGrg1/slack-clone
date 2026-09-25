export interface Workspace {
  id: string
  name: string
  slug: string
  created_by: string
  created_at: string
  is_private: boolean
  invite_code: string
  invite_expires_at: string
}

export interface GetUserWorkspacesResponse {
  success: boolean
  message: string
  data: {
    workspaces: Workspace[]
  }
}

export interface CreatWorkspaceInput {
  name: string
  slug: string
  is_private: boolean
}

export interface CreatWorkspaceResponse {
  success: boolean
  message: string
  data: Workspace
}

export interface editWorkspaceInput {
  name: string
  slug: string
  is_private: boolean
}

export interface EditWorkspaceResponse {
  success: boolean
  message: string
  data: Workspace
}

export interface WorkspaceMember {
  id: string
  username: string
  email: string
  avatar_url: string
}
export interface JoinWorkspaceResponse {
  success: boolean
  message: string
  data: {
    workspace: Workspace
    workspaceMembers: WorkspaceMember[]
  }
}

export interface Pagination {
  limit: number
  page: number
}

export interface SearchWorkspaceInput {
  limit: number
  page: number
  search: string
}

export interface SearchWorkspaceResponse {
  success: boolean
  message: string
  data: {
    pagination: Pagination
    workspace: Workspace[]
  }
}

export interface InviteWorkspaceMemberResponse {
  success: boolean
  message: string
  data: {
    invite_code: string
    invite_expires_at: string
    invite_link: string
  }
}

export interface DeleteWorkspaceResponse {
  success: boolean
  message: string
  data: null
}

export interface GetWorkspaceBySlugResponse {
  success: boolean
  message: string
  data: {
    workspace: Workspace
    members: WorkspaceMember[]
  }
}
