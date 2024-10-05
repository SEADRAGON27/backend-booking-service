import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeserializedFiles } from 'src/interface/deserializedFile.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly awsBucketName: string;
  private readonly awsRegion: string;

  constructor(private readonly configService: ConfigService) {
    this.awsBucketName = this.configService.get<string>('AWS_BUCKET_NAME');
    this.awsRegion = this.configService.get<string>('AWS_REGION');

    this.s3 = new S3Client({
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
      region: this.awsRegion,
    });
  }

  async uploadImages(files: DeserializedFiles[]) {
    const uuid = uuidv4();
    const uploadPromises = files.map(async (file) => {
      const uploadParams = {
        Bucket: this.awsBucketName,
        Key: file.originalname + uuid,
        Body: file.buffer,
      };

      const command = new PutObjectCommand(uploadParams);

      await this.s3.send(command);

      return { link: `https://s3.${this.awsRegion}.amazonaws.com/${this.awsBucketName}/${file.originalname + uuid}` };
    });

    const imageLinks = await Promise.all(uploadPromises);

    return imageLinks;
  }

  async deleteImages(imageLinks: { imageLink: { link: string } }[]) {
    const deleteImages = imageLinks.map(async ({ imageLink: { link } }) => {
      const deleteParams = {
        Bucket: this.awsBucketName,
        Key: link.split('/').pop(),
      };

      const command = new DeleteObjectCommand(deleteParams);
      await this.s3.send(command);
    });
    await Promise.all(deleteImages);
  }
}
