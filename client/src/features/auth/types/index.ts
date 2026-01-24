export interface LoginDto {
  identifier: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  username: string;
  userId: string;
  message: string;
}
