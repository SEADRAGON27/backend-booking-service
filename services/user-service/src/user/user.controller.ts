import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUser, CreateUserGoogle } from './interfaces/createUser.interface';
import { LoginUser } from './interfaces/loginUser.interface';
import { UpdateUserDto } from './interfaces/updateUser.interface';
import { ResetPassword } from './interfaces/resetPassword.interface';
import { ResetPasswordRequest } from './interfaces/resetPasswordRequest.interface';
import { Log } from './decorators/log.decorator';
import { WinstonLoggerService } from 'src/logs/logger';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @MessagePattern({ cmd: 'create_user' })
  @Log()
  async createUser(@Payload('createUserDto') createUserData: CreateUser, @Payload('fingerprintId') fingerprint: string, @Payload('logId') logId: string) {
    await this.userService.createUser(createUserData, fingerprint, logId);

    return {
      message: 'User registered. Please check your email for the confirmation code.',
    };
  }

  @MessagePattern({ cmd: 'login_user' })
  @Log()
  async loginUser(@Payload('loginUserDto') loginUserData: LoginUser, @Payload('fingerprintId') fingerprint: string) {
    const { user, refreshToken } = await this.userService.loginUser(loginUserData, fingerprint);
    const userResponse = this.userService.buildUserResponse(user);

    return { userResponse, refreshToken };
  }

  @MessagePattern({ cmd: 'update_user' })
  @Log()
  async updateUser(@Payload('updateUserDto') updateUserData: UpdateUserDto, @Payload('id') id: string, @Payload('logId') logId: string) {
    const data = await this.userService.updateUser(id, updateUserData, logId);

    if (!data) return false;

    const { user, refreshToken } = data;
    const userResponse = this.userService.buildUserResponse(user);

    return { userResponse, refreshToken };
  }

  @MessagePattern({ cmd: 'get_user' })
  @Log()
  async getUser(@Payload() id: string) {
    const user = await this.userService.getUser(id);

    return user;
  }

  @MessagePattern({ cmd: 'refresh_tokens' })
  @Log()
  async refresh(@Payload('refreshToken') refreshTokeN: string, @Payload('fingerprintId') fingerprint: string) {
    const { refreshToken, accessToken, tokenExpiration } = await this.userService.refreshTokens(refreshTokeN, fingerprint);

    return { refreshToken, accessToken, tokenExpiration };
  }

  @MessagePattern({ cmd: 'confirm_email' })
  @Log()
  async confirmEmailForRegistration(@Payload('token') token: string, @Payload('fingerprintId') fingerprint: string) {
    const { user, refreshToken } = await this.userService.confirmEmail(token, fingerprint);
    const userResponse = this.userService.buildUserResponse(user);

    return { userResponse, refreshToken };
  }

  @MessagePattern({ cmd: 'reset_password_request' })
  @Log()
  async resetPasswordReset(@Payload('resetPasswordRequestDto') resetPasswordRequestData: ResetPasswordRequest, @Payload('logId') logId: string) {
    await this.userService.resetPasswordRequest(resetPasswordRequestData, logId);

    return { message: 'Password reset email sent.' };
  }

  @MessagePattern({ cmd: 'reset_password' })
  @Log()
  async resetPassword(@Payload('token') token: string, @Payload('resetPasswordDto') resetPasswordData: ResetPassword) {
    await this.userService.resetPassword(token, resetPasswordData);

    return { message: 'Password has been reset.' };
  }

  @MessagePattern({ cmd: 'success-google' })
  @Log()
  async successGoogle(@Payload('email') email: string, @Payload('fingerprintId') fingerprint: string, @Payload('createUserGoogleDto') createUserGoogleData: CreateUserGoogle) {
    const { refreshToken, user } = await this.userService.finishGoogleAuth(email, createUserGoogleData, fingerprint);

    return { refreshToken, user };
  }

  @EventPattern('logout_user')
  @Log()
  async logoutUser(@Payload() refreshToken: string) {
    await this.userService.deleteRefreshSession(refreshToken);
  }

  @MessagePattern('delete_user')
  @Log()
  async deleteUser(@Payload('id') id: string, @Payload('logId') logId: string) {
    await this.userService.deleteUser(id, logId);

    return { message: 'Your profile was deleted' };
  }
}
