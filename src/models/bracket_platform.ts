import { default as mongoose, Document, Schema } from 'mongoose';

export interface IBracketPlatform {
  name: string;
  url: string;
  misc?: string;
  api_url?: string;
  api_docs?: string;
}

export interface BracketPlatform extends IBracketPlatform, Document {}

const BracketPlatformSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  api_url: {
    type: String,
    required: false,
  },
  api_docs: {
    type: String,
    required: false,
  },
  misc: {
    type: String,
    required: false,
  },
});

export const BracketPlatform = mongoose.model<BracketPlatform>(
  'BracketPlatform',
  BracketPlatformSchema,
  'bracket_platform',
);
