/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUser, CreateUserGoogle } from './interfaces/createUser.interface';
import { CreateUserResponse, UserResponse } from './interfaces/userResponse.interface';
import { PrismaService } from 'src/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { LoginUser } from './interfaces/loginUser.interface';
import { UpdateUserDto } from './interfaces/updateUser.interface';
import { ResetPassword } from './interfaces/resetPassword.interface';
import { AuthTokens } from './types/authTokens.dto';
import { UserRepository } from './repositories/user.repository';
import { ResetPasswordRepository } from './repositories/resetPassword.repository';
import { RefreshSessionRepository } from './repositories/refreshSession.repository';
import { UserWithoutPassword } from './types/user.type';
import { ResetPasswordRequest } from './interfaces/resetPasswordRequest.interface';
import { catchError, timeout } from 'rxjs';
import { WinstonLoggerService } from 'src/logs/logger';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly resetPasswordRepository: ResetPasswordRepository,
    private readonly refreshSessionRepository: RefreshSessionRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly logger: WinstonLoggerService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
    @Inject('MEETING_EVENTS_SERVICE') private readonly meetingEventsService: ClientProxy,
  ) {}

  async createUser(createUserDto: CreateUser, fingerprint: string, logId: string): Promise<CreateUserResponse> {
    const { email, username } = createUserDto;

    if (createUserDto.confirmedPassword !== createUserDto.password) throw new HttpException("Password didn't match", HttpStatus.UNPROCESSABLE_ENTITY);

    const userByEmail = await this.userRepository.findByEmail(email);

    const userByName = await this.userRepository.findByUsername(username);

    if (userByEmail || userByName) throw new HttpException('Name and email are taken', HttpStatus.UNPROCESSABLE_ENTITY);

    const token = uuidv4();
    const hashedPassword = await hash(createUserDto.password, 10);

    delete createUserDto.password;
    delete createUserDto.confirmedPassword;

    const newUser = {
      ...createUserDto,
      confirmationToken: token,
      password: hashedPassword,
    };

    const user = await this.userRepository.create(newUser);
    const refreshToken = this.generateRefreshToken(user);

    await this.refreshSessionRepository.create({ userId: user.id, refreshToken, fingerprint });

    this.notificationClient.emit('user_create_verification_email', { token: user.confirmationToken, email: user.email, logId }).pipe(
      timeout(5000),
      catchError(async () => this.logger.error('Notification service is unavailable!')),
    );

    const { password, ...userWitoutPassword } = user;

    return { user: { ...userWitoutPassword }, refreshToken };
  }

  async loginUser(loginUserDto: LoginUser, fingerprint: string): Promise<CreateUserResponse> {
    const { email } = loginUserDto;

    const user = await this.userRepository.findByEmail(email);

    if (user.isConfirmed === false) throw new HttpException('User is not confirmed', HttpStatus.UNPROCESSABLE_ENTITY);

    if (!user) throw new HttpException('User not found', HttpStatus.UNPROCESSABLE_ENTITY);

    const isPassword = await compare(loginUserDto.password, user.password);

    if (!isPassword) throw new HttpException('User not found', HttpStatus.UNPROCESSABLE_ENTITY);

    const refreshToken = this.generateRefreshToken(user);

    await this.refreshSessionRepository.create({ userId: user.id, refreshToken, fingerprint });

    const { password, ...userWitoutPassword } = user;

    return { user: { ...userWitoutPassword }, refreshToken };
  }

  buildUserResponse(user: UserWithoutPassword): UserResponse {
    return {
      user: {
        ...user,
        token: this.generateAccessToken(user),
        tokenExpiration: this.configService.get<number>('ACCESS_TOKEN_EXPIRATION_30MINUTES'),
      },
    };
  }

  generateRefreshToken(user: UserWithoutPassword): string {
    return this.jwtService.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '15d',
      },
    );
  }

  generateAccessToken(user: UserWithoutPassword): string {
    return this.jwtService.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '30m',
      },
    );
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, logId: string): Promise<CreateUserResponse> {
    const user = await this.userRepository.findById(id);
    const token = uuidv4();

    if (updateUserDto.email) {
      const token = uuidv4();
      user.confirmationToken = token;

      await this.userRepository.create(user);

      this.notificationClient.emit('user_create_verification_email', { token: user.confirmationToken, email: user.email, logId }).pipe(
        timeout(5000),
        catchError(async () => this.logger.error('Notification service is unavailable!')),
      );

      return null;
    }

    if (updateUserDto.username) {
      const username = updateUserDto.username;
      const userByName = await this.userRepository.findByUsername(username);

      if (userByName) throw new HttpException('Username is taken', HttpStatus.UNPROCESSABLE_ENTITY);

      user.username = updateUserDto.username;

      const updatedUser = await this.userRepository.update(user.id, user);
      const refreshToken = this.generateRefreshToken(updatedUser);

      const { password, ...userWitoutPassword } = updatedUser;

      return { user: { ...userWitoutPassword }, refreshToken };
    }
  }

  async deleteUser(id: string, logId: string): Promise<void> {
    await this.userRepository.delete(id);
    this.meetingEventsService.emit('delete_meeting_user', { id, logId }).pipe(
      timeout(5000),
      catchError(async () => this.logger.error('Meeting service is unavailable!')),
    );
  }

  async confirmEmail(confirmationToken: string, fingerprint: string): Promise<CreateUserResponse> {
    const user = await this.userRepository.findByConfirmationToken(confirmationToken);

    const { refreshToken } = await this.refreshSessionRepository.findByFingerprint(fingerprint);

    if (!user && !refreshToken) throw new HttpException('Invalid confirmation token', HttpStatus.FORBIDDEN);

    user.isConfirmed = true;
    user.confirmationToken = null;
    const createdUser = await this.userRepository.update(user.id, user);

    const { password, ...userWitoutPassword } = createdUser;

    return { user: { ...userWitoutPassword }, refreshToken };
  }

  async getUser(id: string): Promise<UserWithoutPassword> {
    const user = await this.userRepository.findById(id);

    const { password: _password, ...userWitoutPassword } = user;

    return { ...userWitoutPassword };
  }

  async deleteRefreshSession(refreshToken: string) {
    await this.refreshSessionRepository.deleteByToken(refreshToken);
  }

  async refreshTokens(currentRefreshToken: string, fingerprint: string): Promise<AuthTokens> {
    if (!currentRefreshToken) throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);

    const refreshSession = await this.refreshSessionRepository.findByToken(currentRefreshToken);

    if (!refreshSession) throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);

    if (refreshSession.fingerprint !== fingerprint) throw new HttpException('Forbiden', HttpStatus.FORBIDDEN);

    let payload;

    try {
      payload = this.jwtService.verify(currentRefreshToken, { secret: this.configService.get<string>('JWT_REFRESH_SECRET') });
    } catch (err) {
      throw new HttpException('Forbiden', HttpStatus.FORBIDDEN);
    }

    await this.refreshSessionRepository.delete(refreshSession.id);

    const user = await this.userRepository.findByUsername(payload.username);

    const accessToken: string = this.generateAccessToken(user);
    const refreshToken: string = this.generateRefreshToken(user);

    await this.refreshSessionRepository.create({ userId: user.id, refreshToken, fingerprint });

    return {
      accessToken,
      refreshToken,
      tokenExpiration: +this.configService.get<string>('ACCESS_TOKEN_EXPIRATION_30MINUTES'),
    };
  }

  async resetPasswordRequest(resetPasswordRequestData: ResetPasswordRequest, logId: string) {
    const user = await this.userRepository.findByEmail(resetPasswordRequestData.email);

    if (!user) throw new HttpException('User not found', HttpStatus.UNPROCESSABLE_ENTITY);

    const token = uuidv4();

    await this.resetPasswordRepository.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 3600000),
    });

    this.notificationClient.emit('reset_password_verefication_email', { token: user.confirmationToken, email: user.email, logId }).pipe(
      timeout(5000),
      catchError(async () => this.logger.error('Notification service is unavailable!')),
    );
  }

  async resetPassword(token: string, resetPasswordData: ResetPassword) {
    const resetPasswordToken = await this.resetPasswordRepository.findByToken(token);

    if (!resetPasswordToken || resetPasswordToken.expiresAt < new Date()) throw new HttpException('User not found', HttpStatus.UNPROCESSABLE_ENTITY);

    const hashedPassword = await hash(resetPasswordData.newPassword, 10);
    resetPasswordToken.user.password = hashedPassword;

    await this.userRepository.update(resetPasswordToken.user.id, resetPasswordToken.user);

    await this.resetPasswordRepository.delete(resetPasswordToken.id);
  }

  async finishGoogleAuth(email: string, createUserGoogleData: CreateUserGoogle, fingerprint: string): Promise<CreateUserResponse> {
    const userByName = await this.userRepository.findByUsername(createUserGoogleData.username);
    const user = await this.userRepository.findByEmail(email);

    const { password, ...userWitoutPassword } = user;

    if (userByName?.username && user?.username && userByName.username === user.username) {
      const refreshToken = this.generateRefreshToken(user);

      await this.refreshSessionRepository.create({ userId: user.id, refreshToken, fingerprint });

      return { user: { ...userWitoutPassword }, refreshToken };
    }

    if (userByName) throw new HttpException('Name is taken', HttpStatus.UNPROCESSABLE_ENTITY);

    if (!user) {
      const userData = {
        username: createUserGoogleData.username,
        isConfirmed: true,
        email,
      };

      const user = await this.prismaService.user.create({ data: userData });

      const refreshToken = this.generateRefreshToken(user);

      await this.refreshSessionRepository.create({ userId: user.id, refreshToken, fingerprint });

      const { password, ...userWitoutPassword } = user;

      return { user: { ...userWitoutPassword }, refreshToken };
    }

    const refreshToken = this.generateRefreshToken(user);

    await this.refreshSessionRepository.create({ userId: user.id, refreshToken, fingerprint });

    return { user: { ...userWitoutPassword }, refreshToken };
  }
}
