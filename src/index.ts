import {randomBytes} from "crypto";
import multer from 'multer';
import {Storage} from '@google-cloud/storage';
import e from 'express';

  import {extname} from 'path';

type MulterGoogleCloudStorageOptions = {
  bucket: string;
  projectId: string,
  keyFilename: string,
};

export class MulterGoogleStorage implements multer.StorageEngine {

  private readonly bucketName;
  private readonly keyFilename;
  private readonly projectId;

  constructor(options: MulterGoogleCloudStorageOptions) {
    this.bucketName = options.bucket;
    this.projectId = options.projectId;
    this.keyFilename = options.keyFilename;
  }


  getFilename(req: e.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void,) {
    const extension: string = extname(file.originalname);
    const hash = `${randomBytes(24).toString('hex')}${extension}`;
    cb(null, hash);
  }

  _handleFile(req: e.Request, file: Express.Multer.File, cb: (error?: any, info?: Partial<Express.Multer.File>) => void): void {
    this.getFilename(req, file, (err, filename: string) => {
      if (err) {
        return cb(err);
      }
      const storage = new Storage({
        projectId: this.projectId,
        keyFilename: this.keyFilename
      });

      const bucket = storage.bucket(this.bucketName);

      const blob = bucket.file(filename);

      file.stream.pipe(blob.createWriteStream()
        .on('error', (err) => cb(err))
        .on('finish', () => cb(null, {
          path: `https://${this.bucketName}.storage.googleapis.com/${filename}`,
          filename
        }))
      );
    });
  }
  _removeFile(req: e.Request, file: Express.Multer.File, callback: (error: (Error | null)) => void): void {
  }
}