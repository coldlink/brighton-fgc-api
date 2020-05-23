import { prop as Property, getModelForClass, Ref } from '@typegoose/typegoose';
import { isDate } from 'moment';
import { EventClass } from '@models/event';
import { GameClass } from '@models/game';
import { PlayerClass } from '@models/player';
import {
  VALIDATION_MESSAGES,
  generateValidationMessage,
} from '@lib/validation';

export enum TOURNAMENT_TYPE {
  DOUBLE_ELIMINATION,
  SINGLE_ELIMINATION,
  ROUND_ROBIN,
}

export class TournamentClass {
  @Property({ required: true })
  name!: string;

  @Property({
    required: true,
    validate: {
      validator: function (this: TournamentClass) {
        if (!isDate(this.date_start)) {
          return false;
        }

        // since date end can be undefined, check for existence and then check if not valid
        if (
          isDate(this.date_end) &&
          this.date_end.getTime() < this.date_start.getTime()
        ) {
          return false;
        }
        return true;
      },
      message: generateValidationMessage(
        'date_start',
        VALIDATION_MESSAGES.DATE_VALIDATION_ERROR,
      ),
    },
  })
  date_start!: Date;

  @Property({
    validate: {
      validator: function (this: TournamentClass) {
        // undefined is a valid end date
        if (this.date_end === undefined) {
          return true;
        }

        if (!isDate(this.date_end)) {
          return false;
        }

        if (
          !isDate(this.date_start) ||
          this.date_start.getTime() > this.date_end.getTime()
        ) {
          return false;
        }
        return true;
      },
      message: generateValidationMessage(
        'date_end',
        VALIDATION_MESSAGES.DATE_VALIDATION_ERROR,
      ),
    },
  })
  date_end?: Date;

  @Property({ required: true })
  type!: number;

  @Property({
    required: true,
    ref: () => EventClass,
  })
  event!: Ref<EventClass>;

  @Property({
    required: true,
    ref: () => GameClass,
    default: [],
  })
  games!: Array<Ref<GameClass>>;

  @Property({
    required: true,
    ref: () => PlayerClass,
    default: [],
  })
  players?: Array<Ref<PlayerClass>>;

  @Property()
  is_team_based?: boolean;
}

export const Tournament = getModelForClass(TournamentClass, {
  options: {
    customName: 'Tournament',
  },
  schemaOptions: {
    collection: 'tournament',
  },
});
