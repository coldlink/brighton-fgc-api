import { default as mongoose, Document, Schema } from 'mongoose';
import { Venue } from '@models/venue';

export interface Event extends Document {
  name: string;
  date_start?: Date;
  date_end?: Date;
  short?: string;
  venue?: Venue['_id'];
}

const EventSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  date_start: {
    type: Date,
    required: false,
  },
  date_end: {
    type: Date,
    required: false,
  },
  short: {
    type: String,
    required: false,
  },
  venue: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: 'Venue',
  },
});

export const Event = mongoose.model<Event>('Event', EventSchema, 'event');
