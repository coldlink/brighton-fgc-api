import { default as mongoose, Document, Schema } from 'mongoose';
import { Event } from '@models/event';

export interface IEventSeries {
  name: string;
  events: Array<Event['_id']>;
  info?: string;
}

export interface EventSeries extends IEventSeries, Document {}

const EventSeriesSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  events: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Event',
    default: [],
  },
  info: {
    type: String,
    required: false,
  },
});

export const EventSeries = mongoose.model<EventSeries>(
  'EventSeries',
  EventSeriesSchema,
  'event_series',
);
