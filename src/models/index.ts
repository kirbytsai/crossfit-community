// src/models/index.ts
// 這個檔案確保所有 models 都被正確載入
import './User';
import './Wod';
import './Score';

export { default as UserModel } from './User';
export { default as WodModel } from './Wod';
export { default as ScoreModel } from './Score';