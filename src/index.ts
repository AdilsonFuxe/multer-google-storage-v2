import crypto from "crypto";
import multer from 'multer';
import {Storage} from '@google-cloud/storage';

type MulterGoogleCloudStorageOptions = {
  bucket: string;
  filename?: any;
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

    if (options?.filename) {
      this.getFilename = options.filename;
    }
  }

  getFilename(req, file, cb) {
    const extension: string = file.originalname.split('.').pop();
    const filename = `${crypto.randomBytes(24).toString('hex')}.${extension}`;
    cb(null, filename);
  }

  _handleFile(req, file: Express.Multer.File, cb: (error?: any, info?: Partial<Express.Multer.File>) => void): void {
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
        .on('finish', file => cb(null, {
          path: `https://${this.bucketName}.storage.googleapis.com/${filename}`,
          filename
        }))
      );
    });
  }

  _removeFile(req: Request, file: Express.Multer.File, callback: (error: (Error | null)) => void): void {
  }
}