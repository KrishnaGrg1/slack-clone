export interface User {
  id: string
  username: string
  email: string
  password: string
  avatar_url: string
  created_at: string
}
export interface UserRegisterInput {
  username: string
  email: string
  password: string
}

export interface UserLoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: {
      id: string
      username: string
      email: string
    }
  }
}
