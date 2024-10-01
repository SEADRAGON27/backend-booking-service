import { ResetPassword, User } from '@prisma/client';

export type ResetPasswordWithUser = ResetPassword & {
  user: User;
};
