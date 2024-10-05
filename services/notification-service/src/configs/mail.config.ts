import { ConfigService } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';

export const mailerConfig = async (configService: ConfigService): Promise<MailerOptions> => ({
  transport: {
    host: configService.get<string>('EMAIL_HOST'),
    port: 587,
    secure: false,
    auth: {
      user: configService.get<string>('EMAIL'),
      pass: configService.get<string>('PASSWORD'),
    },
  },
});
