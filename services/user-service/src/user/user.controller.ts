import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUser, CreateUserGoogle } from './interfaces/createUser.interface';
import { LoginUser } from './interfaces/loginUser.interface';
import { UpdateUserDto } from './interfaces/updateUser.interface';
import { ResetPassword } from './interfaces/resetPassword.interface';
import { ResetPasswordRequest } from './interfaces/resetPasswordRequest.interface';
import { WinstonLoggerService } from 'src/logs/logger';
import { exceptionType } from './utils/exceptionType';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @MessagePattern({ cmd: 'create_user' })
  async createUser(
    @Payload('createUserDto') createUserData: CreateUser, 
    @Payload('fingerprintId') fingerprint: string, 
    @Payload('logId') logId: string
    ) {
    try {
      await this.userService.createUser(createUserData, fingerprint, logId);
      this.logger.log(`User created successfully, logId: ${logId}, user data: ${JSON.stringify(createUserData)}`);

      return {
        message: 'User registered. Please check your email for the confirmation code.',
      };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error creating user, user data: ${JSON.stringify(createUserData)} ,logId: ${logId}, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'login_user' })
  async loginUser(@Payload('loginUserDto') loginUserData: LoginUser, @Payload('fingerprintId') fingerprint: string) {
    try {
      const { user, refreshToken } = await this.userService.loginUser(loginUserData, fingerprint);
      const userResponse = this.userService.buildUserResponse(user);
      this.logger.log(`User logged in successfully, user data: ${JSON.stringify(loginUserData)}`);

      return { userResponse, refreshToken };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error logging in user, user data: ${JSON.stringify(loginUserData)}, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'update_user' })
  async updateUser(
    @Payload('updateUserDto') updateUserData: UpdateUserDto, 
    @Payload('id') id: string, 
    @Payload('logId') logId: string) 
    {
    try {
      const data = await this.userService.updateUser(id, updateUserData, logId);

      if (!data) {
        this.logger.error(`User update failed, user data: ${JSON.stringify(updateUserData)}, logId: ${logId}`);

        return false;
      }

      const { user, refreshToken } = data;
      const userResponse = this.userService.buildUserResponse(user);

      this.logger.log(`User updated successfully,user data: ${JSON.stringify(updateUserData)}, logId: ${logId}`);

      return { userResponse, refreshToken };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error updating user, user data: ${JSON.stringify(updateUserData)}, logId: ${logId}, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'get_user' })
  async getUser(@Payload() id: string) {
    try {
      const user = await this.userService.getUser(id);
      this.logger.log(`Fetched user successfully,id:${id}`);

      return user;
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error fetching user,id:${id} ,error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'refresh_tokens' })
  async refresh(@Payload('refreshToken') refreshTokeN: string, @Payload('fingerprintId') fingerprint: string) {
    try {
      const { refreshToken, accessToken, tokenExpiration } = await this.userService.refreshTokens(refreshTokeN, fingerprint);
      this.logger.log(`Tokens refreshed successfully`);

      return { refreshToken, accessToken, tokenExpiration };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error refreshing tokens, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'confirm_email' })
  async confirmEmailForRegistration(@Payload('token') token: string, @Payload('fingerprintId') fingerprint: string) {
    try {
      const { user, refreshToken } = await this.userService.confirmEmail(token, fingerprint);
      const userResponse = this.userService.buildUserResponse(user);
      this.logger.log(`Email confirmed successfully`);

      return { userResponse, refreshToken };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error confirming email, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'reset_password_request' })
  async resetPasswordReset(@Payload('resetPasswordRequestDto') resetPasswordRequestData: ResetPasswordRequest, @Payload('logId') logId: string) {
    try {
      await this.userService.resetPasswordRequest(resetPasswordRequestData, logId);
      this.logger.log(`Password reset requested, user data:${JSON.stringify(resetPasswordRequestData)}, logId: ${logId}`);

      return { message: 'Password reset email sent.' };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error requesting password reset, user data:${JSON.stringify(resetPasswordRequestData)}, logId: ${logId}, error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'reset_password' })
  async resetPassword(@Payload('token') token: string, @Payload('resetPasswordDto') resetPasswordData: ResetPassword) {
    try {
      await this.userService.resetPassword(token, resetPasswordData);
      this.logger.log(`Password reset successfully`);

      return { message: 'Password has been reset.' };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error resetting password,  error: ${error.message}`);

      throw error;
    }
  }

  @MessagePattern({ cmd: 'success-google' })
  async successGoogle(
    @Payload('email') email: string, 
    @Payload('fingerprintId') fingerprint: string, 
    @Payload('createUserGoogleDto') createUserGoogleData: CreateUserGoogle) {
    try {
      const { refreshToken, user } = await this.userService.finishGoogleAuth(email, createUserGoogleData, fingerprint);
      this.logger.log(`Google authentication successful, email: ${email}`);

      return { refreshToken, user };
    } catch (error) {
      this.logger.error(`Error during Google authentication, email: ${email}, error: ${error.message}`);
      throw error;
    }
  }

  @EventPattern('logout_user')
  async logoutUser(@Payload() refreshToken: string) {
    try {
      await this.userService.deleteRefreshSession(refreshToken);
      this.logger.log(`User logged out successfully`);
    } catch (error) {
      this.logger.error(`Error logging out user, error: ${error.message}`);
      throw error;
    }
  }

  @MessagePattern('delete_user')
  async deleteUser(@Payload('id') id: string, @Payload('logId') logId: string) {
    try {
      await this.userService.deleteUser(id, logId);
      this.logger.log(`User deleted successfully, logId: ${logId}`);

      return { message: 'Your profile was deleted' };
    } catch (error) {
      if (exceptionType(error)) this.logger.error(`Error deleting user, logId: ${logId}, error: ${error.message}`);

      throw error;
    }
  }
}
