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
import { ObjectId } from 'mongodb';
import { orderBy } from 'lodash';
import { DocumentType } from '@typegoose/typegoose';
import { GameElo, GAME_ELO_DESCRIPTIONS } from '@models/game_elo';
import { Context, CtxWithArgs } from '@lib/graphql';
import {
  generateMongooseQueryObject,
  MapSort,
  MongooseQuery,
} from '@graphql/resolvers';
import { ObjectIdScalar } from '@graphql/scalars/ObjectId';
import { GameResolverMethods } from '@graphql/resolvers/game';
import { PlayerResolverMethods } from '@graphql/resolvers/player';
import { Player } from '@models/player';
import { Game } from '@models/game';

export enum GAME_ELO_SORT {
  GAME_ID,
  PLAYER_ID,
  SCORE_ASC,
  SCORE_DESC,
  ID,
}

registerEnumType(GAME_ELO_SORT, {
  name: 'GameEloSort',
  description: 'Sort game elo ratings by this enum',
});

export const mapSort = (sort: GAME_ELO_SORT): MapSort => {
  switch (sort) {
    case GAME_ELO_SORT.GAME_ID:
      return ['game', 'asc'];
    case GAME_ELO_SORT.PLAYER_ID:
      return ['player', 'asc'];
    case GAME_ELO_SORT.SCORE_ASC:
      return ['score', 'asc'];
    case GAME_ELO_SORT.SCORE_DESC:
      return ['score', 'desc'];
    default:
      return ['_id', 'asc'];
  }
};

@ArgsType()
export class GameEloArgs {
  @Field(() => ObjectIdScalar, {
    description: GAME_ELO_DESCRIPTIONS.GAME,
  })
  game!: ObjectId;
  @Field(() => ObjectIdScalar, {
    description: GAME_ELO_DESCRIPTIONS.PLAYER,
  })
  player!: ObjectId;
}

@ArgsType()
export class GameElosArgs {
  @Field(() => [ObjectIdScalar], {
    nullable: true,
    description: GAME_ELO_DESCRIPTIONS.GAME_IDS,
  })
  games?: Array<ObjectId>;

  @Field(() => [ObjectIdScalar], {
    nullable: true,
    description: GAME_ELO_DESCRIPTIONS.GAME_IDS,
  })
  players?: Array<ObjectId>;

  @Field(() => GAME_ELO_SORT, {
    nullable: true,
    defaultValue: GAME_ELO_SORT.SCORE_DESC,
  })
  sort!: GAME_ELO_SORT;
}

// class used to share methods to other resolvers, use static methods
export class GameEloResolverMethods {
  // get a single game elo by game and player
  static async game_elo({
    args: { game, player },
    ctx,
  }: CtxWithArgs<GameEloArgs>): Promise<GameElo | null> {
    const q = generateMongooseQueryObject();
    q.game = game;
    q.player = player;

    // find a result, so return the first one
    // nothing found, return null
    const [results = null] = await ctx.loaders.GameElosLoader.load(q);
    return results;
  }

  // get multiple game elos based on a list of games or players
  static async game_elos({
    args: { games, players, sort = GAME_ELO_SORT.SCORE_DESC },
    ctx,
  }: CtxWithArgs<GameElosArgs>): Promise<Array<GameElo>> {
    const q = generateMongooseQueryObject();

    if (games) {
      q.game = {
        $in: games,
      } as MongooseQuery;
    }

    if (players) {
      q.player = {
        $in: players,
      } as MongooseQuery;
    }

    const elos = await ctx.loaders.GameElosLoader.load(q);
    const [iteratee, orders] = mapSort(sort);
    return orderBy(elos, iteratee, orders);
  }
}

@Resolver(() => GameElo)
export class GameEloResolver {
  // get a single game elo by game and player
  @Query(() => GameElo, {
    nullable: true,
    description: GAME_ELO_DESCRIPTIONS.FIND_ONE,
  })
  game_elo(
    @Args() { game, player }: GameEloArgs,
    @Ctx() ctx: Context,
  ): Promise<GameElo | null> {
    return GameEloResolverMethods.game_elo({ args: { game, player }, ctx });
  }

  // get multiple game elos based on a list of games or players
  @Query(() => [GameElo], {
    description: GAME_ELO_DESCRIPTIONS.FIND,
  })
  game_elos(
    @Args() { sort, games, players }: GameElosArgs,
    @Ctx() ctx: Context,
  ): Promise<Array<GameElo>> {
    return GameEloResolverMethods.game_elos({
      args: { games, players, sort },
      ctx,
    });
  }

  // populate player
  @FieldResolver(() => ObjectIdScalar, {
    description: GAME_ELO_DESCRIPTIONS.PLAYER,
  })
  player_id(@Root() game_elo: DocumentType<GameElo>): ObjectId {
    return game_elo.player as ObjectId;
  }

  @FieldResolver()
  player(
    @Root() game_elo: DocumentType<GameElo>,
    @Ctx() ctx: Context,
  ): Promise<Player | null> {
    return PlayerResolverMethods.player({
      args: { id: game_elo.player as ObjectId },
      ctx,
    });
  }

  // populate game
  @FieldResolver(() => ObjectIdScalar, {
    description: GAME_ELO_DESCRIPTIONS.GAME,
  })
  game_id(@Root() game_elo: DocumentType<GameElo>): ObjectId {
    return game_elo.game as ObjectId;
  }

  @FieldResolver(() => Game, {
    description: GAME_ELO_DESCRIPTIONS.GAME,
  })
  game(
    @Root() game_elo: DocumentType<GameElo>,
    @Ctx() ctx: Context,
  ): Promise<Game | null> {
    return GameResolverMethods.game({
      args: { id: game_elo.game as ObjectId },
      ctx,
    });
  }
}
