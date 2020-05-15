import { default as mongoose, Document, Schema } from 'mongoose';

export interface Venue extends Document {
  name: string;
  address?: string;
  google_maps?: string;
  website?: string;
}

const VenueSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: false,
  },
  google_maps: {
    type: String,
    required: false,
  },
  website: {
    type: String,
    required: false,
  },
});

export const Venue = mongoose.model<Venue>('Venue', VenueSchema, 'venue');