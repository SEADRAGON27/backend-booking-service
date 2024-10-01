import { Body, Controller, Delete, Get, HttpCode, HttpException, Inject, Post, Put, Query, Req, Res, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, map, mergeMap, timeout } from 'rxjs/operators';
import { CreateUserGoogleDto, CreateUserDto } from './dto/createUser.dto';
import { Fingerprint, IFingerprint } from 'nestjs-fingerprint';
import { LoginUserDto } from './dto/loginUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { JwtAuthGuard } from '../guard/jwtAuth.guard';
import { GoogleGuard } from '../guard/google.guard';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { JwtPayload } from '../interfaces/jwtPayload.interface';
import { CurrentUser } from '../decorators/currentUser.decorator';
import { Cookie } from '../decorators/cookies.decorator';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ResetPasswordRequestDto } from './dto/resetPasswordRequest.dto';
import { v4 as uuidv4 } from 'uuid';
import { CreateMeetingDto } from 'src/meetings/dto/createMeeting.dto';

@Controller('users')
export class UserController {
  constructor(
    @Inject('USER_SERVICE') private readonly client: ClientProxy,
    private readonly httpService: HttpService,
    @Inject('MEETING_SERVICE') private readonly meetingClient: ClientProxy,
    private configService: ConfigService,
  ) {}

  @Post('/create')
  @UseGuards(new JwtAuthGuard())
  @UsePipes(new ValidationPipe())
  createMeeting(@Body() createMeetingDto: CreateMeetingDto, @CurrentUser() user: JwtPayload) {
    console.log(createMeetingDto);

    return this.meetingClient.send({ cmd: 'create_meeting' }, { createMeetingDto, user }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Post('/register')
  @UsePipes(new ValidationPipe())
  createUser(@Body() createUserDto: CreateUserDto, @Fingerprint() fingerprint: IFingerprint) {
    const fingerprintId = fingerprint.id;
    const logId = uuidv4();

    return this.client.send({ cmd: 'create_user' }, { createUserDto, fingerprintId, logId }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Post('/login')
  @UsePipes(new ValidationPipe())
  loginUser(@Body() loginUserDto: LoginUserDto, @Fingerprint() fingerprint: IFingerprint) {
    const fingerprintId = fingerprint.id;

    return this.client.send({ cmd: 'login_user' }, { loginUserDto, fingerprintId }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Put('/user')
  @UsePipes(new ValidationPipe())
  @UseGuards(new JwtAuthGuard())
  updateUser(@CurrentUser('id') id: JwtPayload, @Body() updateUserDto: UpdateUserDto, @Res() res: Response) {
    const logId = uuidv4();

    return this.client.send({ cmd: 'update_user' }, { updateUserDto, id, logId }).pipe(
      timeout(5000),
      map((data) => {
        if (!data) {
          return res.sendStatus(200);
        }

        const { refreshToken, userResponse } = data;
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          maxAge: this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_15DAYS'),
        });

        return userResponse;
      }),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Delete('/user')
  @UseGuards(new JwtAuthGuard())
  deleteUser(@CurrentUser('id') id: JwtPayload) {
    const logId = uuidv4();

    return this.client.send({ cmd: 'delete_user' }, { id, logId }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Get('/user')
  @UseGuards(new JwtAuthGuard())
  getUser(@CurrentUser('id') id: JwtPayload) {
    return this.client.send({ cmd: 'get_user' }, id).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Post('/refresh')
  refreshTokens(@Cookie('REFRESH_TOKEN') refrshToken: string, @Fingerprint() fingerprint: IFingerprint, @Res() res: Response) {
    const fingerprintId = fingerprint.id;

    return this.client.send({ cmd: 'refresh_tokens' }, { refrshToken, fingerprintId }).pipe(
      timeout(5000),
      map((data) => {
        const { refreshToken, accessToken, tokenExpiration } = data;

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          maxAge: this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_15DAYS'),
        });

        return { accessToken, tokenExpiration };
      }),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Post('/logout')
  @UseGuards(new JwtAuthGuard())
  logoutUser(@Cookie('REFRESH_TOKEN') refreshToken: string, @Res() res: Response) {
    this.client.emit('logout_user', refreshToken).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );

    res.status(200).clearCookie('REFRESH_TOKEN');
  }

  @Post('/reset-password')
  @UsePipes(new ValidationPipe())
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Query('token') token: string) {
    return this.client.send({ cmd: 'reset_password' }, { resetPasswordDto, token }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Post('/reset-paswword-request')
  @UsePipes(new ValidationPipe())
  resetPasswordRequest(@Body() resetPasswordRequestDto: ResetPasswordRequestDto) {
    return this.client.send({ cmd: 'reset_password_request' }, resetPasswordRequestDto).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Post('/confirm-email')
  confirmEmailForRegistration(@Query('token') token: string, @Fingerprint() fingerprint: IFingerprint) {
    const fingerprintId = fingerprint.id;

    return this.client.send({ cmd: 'confirm_email' }, { token, fingerprintId }).pipe(
      timeout(5000),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }

  @Get('google')
  @UseGuards(GoogleGuard)
  googleAuth(@Req() req: Request) {}

  @Get('google/callback')
  @UseGuards(GoogleGuard)
  googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const token = req.user['accessToken'];

    return res.redirect(`http://localhost:3000/users/confirm-google?token=${token}`);
  }

  @Get('confirm-google')
  confirmGoogle(@Query('token') token: string, @Res() res: Response) {
    return token;
  }

  @Get('success-google')
  @HttpCode(201)
  successGoogle(@Body() createUserGoogleDto: CreateUserGoogleDto, @Res() res: Response, @Fingerprint() fingerprint: IFingerprint) {
    return this.httpService.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${createUserGoogleDto.token}`).pipe(
      mergeMap(({ data: { email } }) => this.client.send({ cmd: 'success-google' }, { email, fingerprint, createUserGoogleDto })),
      map((userResponse) => userResponse),
      catchError((error) => {
        throw new HttpException(error.message, error.statusCode);
      }),
    );
  }
}
