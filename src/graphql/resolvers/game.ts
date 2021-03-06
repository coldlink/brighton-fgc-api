// GraphQL Resolver for Games

import {
  Resolver,
  Query,
  Ctx,
  registerEnumType,
  FieldResolver,
  Root,
  Args,
  ArgsType,
  Field,
} from 'type-graphql';
import { DocumentType } from '@typegoose/typegoose';
import { Game, GAME_DESCRIPTIONS } from '@models/game';
import { ObjectIdScalar } from '@graphql/scalars/ObjectId';
import { ObjectId } from 'mongodb';
import { Context, CtxWithArgs } from '@lib/graphql';
import { orderBy } from 'lodash';
import {
  generateMongooseQueryObject,
  MapSort,
  MongooseQuery,
} from '@graphql/resolvers';
import { Character } from '@models/character';
import { GameElo } from '@models/game_elo';
import {
  GameEloResolverMethods,
  GameElosArgs,
} from '@graphql/resolvers/game_elo';
import {
  CharacterResolverMethods,
  CharactersArgs,
} from '@graphql/resolvers/character';
import { Tournament } from '@models/tournament';
import {
  TournamentResolverMethods,
  TournamentsArgs,
} from '@graphql/resolvers/tournament';
import {
  TournamentSeries,
  TOURNAMENT_SERIES_DESCRIPTIONS,
} from '@models/tournament_series';
import {
  TournamentSeriesResolverMethods,
  TournamentSeriesArgs,
} from '@graphql/resolvers/tournament_series';

// sorting stuff for game
export enum GAME_SORT {
  NAME_ASC,
  NAME_DESC,
  ID,
}

// register the enum with graphql
registerEnumType(GAME_SORT, {
  name: 'GameSort',
  description: 'Sort games by this enum',
});

// turn sort into an array usable by lodash
const mapSort = (sort: GAME_SORT): MapSort => {
  switch (sort) {
    case GAME_SORT.NAME_ASC:
      return ['name', 'asc'];
    case GAME_SORT.NAME_DESC:
      return ['name', 'desc'];
    default:
      return ['_id', 'asc'];
  }
};

@ArgsType()
export class GameArgs {
  @Field(() => ObjectIdScalar, {
    description: GAME_DESCRIPTIONS.ID,
  })
  id!: ObjectId;
}

@ArgsType()
export class GamesArgs {
  @Field(() => [ObjectIdScalar], {
    nullable: true,
    description: GAME_DESCRIPTIONS.IDS,
  })
  ids?: Array<ObjectId>;

  @Field({
    nullable: true,
  })
  search?: string;

  @Field(() => GAME_SORT, {
    nullable: true,
    defaultValue: GAME_SORT.NAME_ASC,
  })
  sort!: GAME_SORT;
}

export class GameResolverMethods {
  static game({
    args: { id },
    ctx,
  }: CtxWithArgs<GameArgs>): Promise<Game | null> {
    return ctx.loaders.GameLoader.load(id);
  }

  static async games({
    args: { search, ids, sort },
    ctx,
  }: CtxWithArgs<GamesArgs>): Promise<Array<Game>> {
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

    const games = await ctx.loaders.GamesLoader.load(q);
    const [iteratee, orders] = mapSort(sort);
    return orderBy(games, iteratee, orders);
  }
}

@Resolver(() => Game)
export class GameResolver {
  // get a single game
  @Query(() => Game, {
    nullable: true,
    description: GAME_DESCRIPTIONS.FIND_ONE,
  })
  game(@Args() { id }: GameArgs, @Ctx() ctx: Context): Promise<Game | null> {
    return GameResolverMethods.game({ args: { id }, ctx });
  }

  // get multiple games
  @Query(() => [Game], {
    description: GAME_DESCRIPTIONS.FIND,
  })
  async games(
    @Args() { sort, ids, search }: GamesArgs,
    @Ctx() ctx: Context,
  ): Promise<Array<Game>> {
    return GameResolverMethods.games({
      ctx,
      args: { ids, search, sort },
    });
  }

  // characters field to game
  @FieldResolver(() => [Character], {
    description: GAME_DESCRIPTIONS.CHARACTERS,
    nullable: true,
  })
  characters(
    @Root() game: DocumentType<Game>,
    @Args() { sort, ids, search }: CharactersArgs,
    @Ctx() ctx: Context,
  ): Promise<Array<Character>> {
    return CharacterResolverMethods.characters({
      ctx,
      args: {
        sort,
        search,
        ids,
        game: game._id,
      },
    });
  }

  // tournaments that feature this game
  @FieldResolver(() => [Tournament])
  tournaments(
    @Root() game: DocumentType<Game>,
    @Args(() => TournamentsArgs)
    {
      sort,
      date_end_gte,
      date_end_lte,
      date_start_gte,
      date_start_lte,
      ids,
      players,
      event,
      search,
      type,
    }: TournamentsArgs,
    @Ctx() ctx: Context,
  ): Promise<Array<Tournament>> {
    return TournamentResolverMethods.tournaments({
      args: {
        games: [game._id],
        ids,
        date_end_gte,
        date_end_lte,
        date_start_gte,
        date_start_lte,
        event,
        players,
        search,
        type,
        sort,
      },
      ctx,
    });
  }

  // tournament series that feature this game
  @FieldResolver(() => [TournamentSeries], {
    description: TOURNAMENT_SERIES_DESCRIPTIONS.DESCRIPTION,
    nullable: true,
  })
  tournament_series(
    @Root() game: DocumentType<Game>,
    @Args(() => TournamentSeriesArgs)
    { sort, ids, search, tournaments }: TournamentSeriesArgs,
    @Ctx() ctx: Context,
  ): Promise<Array<TournamentSeries>> {
    return TournamentSeriesResolverMethods.tournament_series({
      ctx,
      args: {
        sort,
        games: [game._id],
        ids,
        search,
        tournaments,
      },
    });
  }

  // game elo, also search and sort
  @FieldResolver(() => [GameElo], {
    description: GAME_DESCRIPTIONS.GAME_ELO,
    nullable: true,
  })
  game_elos(
    @Root() game: DocumentType<Game>,
    @Args(() => GameElosArgs)
    { sort, players, score_gte, score_lte }: GameElosArgs,
    @Ctx() ctx: Context,
  ): Promise<Array<GameElo>> {
    return GameEloResolverMethods.game_elos({
      args: { games: [game._id], players, sort, score_gte, score_lte },
      ctx,
    });
  }

  // TODO: add tournament series elo
}
