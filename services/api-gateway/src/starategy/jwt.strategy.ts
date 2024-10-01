import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, lastValueFrom, map, timeout } from 'rxjs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject('USER_SERVICE') private readonly client: ClientProxy,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    return lastValueFrom(
      this.client.send({ cmd: 'get_user' }, payload.id).pipe(
        timeout(5000),
        map((data) => {
          if (!data) {
            throw new UnauthorizedException();
          }

          const { id, username, email, role } = data;

          return { id, username, email, role };
        }),
        catchError((error) => {
          throw new HttpException(error.message, error.statusCode);
        }),
      ),
    );
  }
}
