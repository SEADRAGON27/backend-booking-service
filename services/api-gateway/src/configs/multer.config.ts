import { memoryStorage } from 'multer';

export const multerConfig = {
  storage: memoryStorage(),
};
