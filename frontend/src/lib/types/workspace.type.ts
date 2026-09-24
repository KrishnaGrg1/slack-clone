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
  data: {
    workspaces: Workspace
  }
}
