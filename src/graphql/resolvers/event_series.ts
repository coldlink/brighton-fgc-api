import { ObjectId } from 'mongodb';
import { Context } from '@lib/graphql';
import {
  registerEnumType,
  Resolver,
  Query,
  Arg,
  Ctx,
  Root,
  FieldResolver,
} from 'type-graphql';
import {
  MapSort,
  generateMongooseQueryObject,
  MongooseQuery,
} from '@graphql/resolvers';
import { orderBy } from 'lodash';
import { EventSeries, EVENT_SERIES_DESCRIPTIONS } from '@models/event_series';
import { ObjectIdScalar } from '@graphql/scalars/ObjectId';
import { DocumentType } from '@typegoose/typegoose';
import {
  EventResolverMethodsClass,
  EVENT_SORT,
} from '@graphql/resolvers/event';

export enum EVENT_SERIES_SORT {
  NAME_ASC,
  NAME_DESC,
  ID,
}

registerEnumType(EVENT_SERIES_SORT, {
  name: 'EventSeriesSort',
  description: 'Sort event series by this enum',
});

export const mapSort = (sort: EVENT_SERIES_SORT): MapSort => {
  switch (sort) {
    case EVENT_SERIES_SORT.NAME_ASC:
      return ['name', 'asc'];
    case EVENT_SERIES_SORT.NAME_DESC:
      return ['name', 'desc'];
    default:
      return ['_id', 'asc'];
  }
};

export class EventSeriesResolverMethods {
  static async event_series({
    ctx,
    events,
    ids,
    search,
    sort = EVENT_SERIES_SORT.NAME_ASC,
  }: {
    ids?: Array<ObjectId>;
    events?: Array<ObjectId>;
    search?: string;
    sort?: EVENT_SERIES_SORT;
    ctx: Context;
  }) {
    const q = generateMongooseQueryObject();

    if (ids) {
      q._id = {
        $in: ids,
      } as MongooseQuery;
    }

    if (events) {
      q.events = {
        $in: events,
      };
    }

    if (search) {
      q.name = {
        $regex: `${search}`,
        $options: 'i',
      } as MongooseQuery;
    }

    const series = await ctx.loaders.EventSeriesMultiLoader.load(q);
    const [iteratee, orders] = mapSort(sort);
    return orderBy(series, iteratee, orders);
  }
}

@Resolver(() => EventSeries)
export class EventSeriesResolver {
  @Query(() => [EventSeries], {
    description: EVENT_SERIES_DESCRIPTIONS.FIND,
  })
  event_series(
    @Arg('ids', () => [ObjectIdScalar], {
      nullable: true,
      description: EVENT_SERIES_DESCRIPTIONS.IDS,
    })
    ids: Array<ObjectId>,
    @Arg('events', () => [ObjectIdScalar], {
      nullable: true,
      description: EVENT_SERIES_DESCRIPTIONS.IDS,
    })
    events: Array<ObjectId>,
    @Arg('search', {
      nullable: true,
    })
    search: string,
    @Arg('sort', () => EVENT_SERIES_SORT, {
      nullable: true,
      defaultValue: EVENT_SERIES_SORT.NAME_ASC,
    })
    sort: EVENT_SERIES_SORT,
    @Ctx() ctx: Context,
  ) {
    return EventSeriesResolverMethods.event_series({
      ids,
      search,
      events,
      sort,
      ctx,
    });
  }

  // event ids
  @FieldResolver(() => [ObjectIdScalar], {
    description: EVENT_SERIES_DESCRIPTIONS.EVENT_IDS,
  })
  event_ids(@Root() event_series: DocumentType<EventSeries>) {
    return event_series.events;
  }

  // populate events
  @FieldResolver(() => [Event], {
    description: EVENT_SERIES_DESCRIPTIONS.EVENTS,
  })
  events(
    @Root() event_series: DocumentType<EventSeries>,
    @Arg('date_start_gte', {
      nullable: true,
    })
    date_start_gte: Date,
    @Arg('date_start_lte', {
      nullable: true,
    })
    date_start_lte: Date,
    @Arg('date_end_gte', {
      nullable: true,
    })
    date_end_gte: Date,
    @Arg('date_end_lte', {
      nullable: true,
    })
    date_end_lte: Date,
    @Arg('sort', () => EVENT_SORT, {
      nullable: true,
    })
    sort: EVENT_SORT,
    @Ctx() ctx: Context,
  ) {
    return EventResolverMethodsClass.events({
      ids: event_series.events as Array<ObjectId>,
      date_end_gte,
      date_end_lte,
      date_start_gte,
      date_start_lte,
      sort,
      ctx,
    });
  }
}
