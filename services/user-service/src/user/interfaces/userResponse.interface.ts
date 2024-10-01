import { User } from '@prisma/client';
import { UserWithoutPassword } from '../types/user.type';

export interface UserResponse {
  user: UserWithoutPassword & { token: string } & { tokenExpiration: number };
}

export interface CreateUserResponse {
  user: UserWithoutPassword;
  refreshToken: string;
}
