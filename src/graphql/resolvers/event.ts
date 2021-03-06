// GraphQL Resolver for Events

import {
  registerEnumType,
  Resolver,
  Ctx,
  Query,
  FieldResolver,
  Root,
  Args,
  ArgsType,
  Field,
} from 'type-graphql';
import {
  MapSort,
  generateMongooseQueryObject,
  MongooseQuery,
} from '@graphql/resolvers';
import { Event, EVENT_DESCRIPTIONS } from '@models/event';
import { ObjectIdScalar } from '@graphql/scalars/ObjectId';
import { ObjectId } from 'mongodb';
import { Context, CtxWithArgs } from '@lib/graphql';
import { orderBy } from 'lodash';
import { DocumentType } from '@typegoose/typegoose';
import { Venue } from '@models/venue';
import {
  EventSeriesResolverMethods,
  EventSeriesArgs,
} from '@graphql/resolvers/event_series';
import { EventSeries } from '@models/event_series';
import { EventSocialResolverMethods } from '@graphql/resolvers/event_social';
import { EventSocial } from '@models/event_social';
import {
  TournamentResolverMethods,
  TournamentsArgs,
} from '@graphql/resolvers/tournament';
import { Tournament } from '@models/tournament';
import { VenueResolverMethods } from '@graphql/resolvers/venue';

export enum EVENT_SORT {
  NAME_ASC,
  NAME_DESC,
  DATE_START_ASC,
  DATE_START_DESC,
  DATE_END_ASC,
  DATE_END_DESC,
  VENUE_ID,
  ID,
}

registerEnumType(EVENT_SORT, {
  name: 'EventSort',
  description: 'Sort events by this enum',
});

const mapSort = (sort: EVENT_SORT): MapSort => {
  switch (sort) {
    case EVENT_SORT.NAME_ASC:
      return ['name', 'asc'];
    case EVENT_SORT.NAME_DESC:
      return ['name', 'desc'];
    case EVENT_SORT.DATE_START_ASC:
      return ['date_start', 'asc'];
    case EVENT_SORT.DATE_START_DESC:
      return ['date_start', 'desc'];
    case EVENT_SORT.DATE_END_ASC:
      return ['date_end', 'asc'];
    case EVENT_SORT.DATE_END_DESC:
      return ['date_end', 'desc'];
    case EVENT_SORT.VENUE_ID:
      return ['venue', 'asc'];
    default:
      return ['_id', 'asc'];
  }
};

@ArgsType()
export class EventArgs {
  @Field(() => ObjectIdScalar, {
    description: EVENT_DESCRIPTIONS.ID,
  })
  id?: ObjectId;
}

@ArgsType()
export class EventsArgs {
  @Field(() => [ObjectIdScalar], {
    nullable: true,
    description: EVENT_DESCRIPTIONS.IDS,
  })
  ids?: Array<ObjectId>;

  @Field({
    nullable: true,
  })
  search?: string;

  @Field({
    nullable: true,
  })
  date_start_gte?: Date;

  @Field({
    nullable: true,
  })
  date_start_lte?: Date;

  @Field({
    nullable: true,
  })
  date_end_gte?: Date;

  @Field({
    nullable: true,
  })
  date_end_lte?: Date;

  @Field(() => ObjectIdScalar, {
    nullable: true,
    description: EVENT_DESCRIPTIONS.VENUE_ID,
  })
  venue?: ObjectId;

  @Field(() => EVENT_SORT, {
    nullable: true,
    defaultValue: EVENT_SORT.DATE_START_DESC,
  })
  sort!: EVENT_SORT;
}

export class EventResolverMethods {
  static event({
    args: { id },
    ctx,
  }: CtxWithArgs<EventArgs>): Promise<Event | null> {
    return ctx.loaders.EventLoader.load(id);
  }

  static async events({
    args: {
      ids,
      search,
      date_start_gte,
      date_start_lte,
      date_end_gte,
      date_end_lte,
      venue,
      sort,
    },
    ctx,
  }: CtxWithArgs<EventsArgs>): Promise<Array<Event>> {
    const q = generateMongooseQueryObject();
    if (search) {
      q.name = {
        $regex: `${search}`,
        $options: 'i',
      } as MongooseQuery;
    }

    if (ids) {
      q._id = {
        $in: ids,
      } as MongooseQuery;
    }

    if (date_start_gte || date_start_lte) {
      q.date_start = {} as MongooseQuery;
      if (date_start_gte) {
        q.date_start.$gte = date_start_gte;
      }
      if (date_start_lte) {
        q.date_start.$lte = date_start_lte;
      }
    }

    if (date_end_gte || date_end_lte) {
      q.date_end = {} as MongooseQuery;
      if (date_end_gte) {
        q.date_end.$gte = date_end_gte;
      }
      if (date_end_lte) {
        q.date_end.$lte = date_end_lte;
      }
    }

    if (venue) {
      q.venue = venue;
    }

    const events = await ctx.loaders.EventsLoader.load(q);
    const [iteratee, orders] = mapSort(sort);
    return orderBy(events, iteratee, orders);
  }
}

@Resolver(() => Event)
export class EventResolver {
  // get single event
  @Query(() => Event, {
    nullable: true,
    description: EVENT_DESCRIPTIONS.FIND_ONE,
  })
  event(@Args() { id }: EventArgs, @Ctx() ctx: Context): Promise<Event | null> {
    return EventResolverMethods.event({ args: { id }, ctx });
  }

  // get multiple events
  @Query(() => [Event], {
    description: EVENT_DESCRIPTIONS.FIND,
  })
  events(
    @Args()
    {
      sort,
      date_end_gte,
      date_end_lte,
      date_start_gte,
      date_start_lte,
      ids,
      search,
      venue,
    }: EventsArgs,
    @Ctx() ctx: Context,
  ): Promise<Array<Event>> {
    return EventResolverMethods.events({
      ctx,
      args: {
        ids,
        sort,
        date_end_gte,
        date_end_lte,
        date_start_gte,
        date_start_lte,
        search,
        venue,
      },
    });
  }

  // add field onto event to return the venue id
  @FieldResolver(() => ObjectIdScalar, {
    description: EVENT_DESCRIPTIONS.VENUE_ID,
  })
  venue_id(@Root() event: DocumentType<Event>): ObjectId {
    return event.venue as ObjectId;
  }

  // populate venue
  @FieldResolver({
    description: EVENT_DESCRIPTIONS.VENUE,
  })
  venue(
    @Root() event: DocumentType<Event>,
    @Ctx() ctx: Context,
  ): Promise<Venue | null> {
    return VenueResolverMethods.venue({
      args: { id: event.venue as ObjectId },
      ctx,
    });
  }

  // populate event series
  @FieldResolver(() => EventSeries, {
    description: EVENT_DESCRIPTIONS.EVENT_SERIES,
    nullable: true,
  })
  async event_series(
    @Root() event: DocumentType<Event>,
    @Args() { sort, search, ids }: EventSeriesArgs,
    @Ctx() ctx: Context,
  ): Promise<EventSeries | null> {
    const [eventSeries = null] = await EventSeriesResolverMethods.event_series({
      args: { events: [event._id], sort, search, ids },
      ctx,
    });

    return eventSeries;
  }

  // populate event social
  @FieldResolver(() => EventSocial, {
    description: EVENT_DESCRIPTIONS.EVENT_SOCIAL,
    nullable: true,
  })
  event_social(
    @Root() event: DocumentType<Event>,
    @Ctx() ctx: Context,
  ): Promise<EventSocial | null> {
    return EventSocialResolverMethods.event_social({
      ctx,
      args: {
        event: event._id,
      },
    });
  }

  // populate tournaments
  @FieldResolver(() => [Tournament])
  tournaments(
    @Root() event: DocumentType<Event>,
    @Args(() => TournamentsArgs)
    {
      sort,
      date_end_gte,
      date_end_lte,
      date_start_gte,
      date_start_lte,
      games,
      ids,
      players,
      search,
      type,
    }: TournamentsArgs,
    @Ctx() ctx: Context,
  ): Promise<Array<Tournament>> {
    return TournamentResolverMethods.tournaments({
      args: {
        event: event._id,
        sort,
        date_end_gte,
        date_end_lte,
        date_start_gte,
        date_start_lte,
        games,
        ids,
        players,
        search,
        type,
      },
      ctx,
    });
  }
}
