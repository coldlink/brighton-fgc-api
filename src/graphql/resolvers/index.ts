import { MongooseFilterQuery } from 'mongoose';
import { Many } from 'lodash';

import { BracketPlatformResolver } from '@graphql/resolvers/bracket_platform';
import { GameResolver } from '@graphql/resolvers/game';
import { CharacterResolver } from '@graphql/resolvers/character';
import { PlayerResolver } from '@graphql/resolvers/player';
import { GameEloResolver } from '@graphql/resolvers/game_elo';
import { PlayerSocialResolver } from '@graphql/resolvers/player_social';
import { VenueResolver } from '@graphql/resolvers/venue';
import { EventResolver } from '@graphql/resolvers/event';

// Mongoose query helper type
export type MongooseQuery = MongooseFilterQuery<
  Pick<any, string | number | symbol>
>;

// map sort helper return type
export type MapSort = [string, Many<boolean | 'asc' | 'desc'>];

// resolver query helper object generation
export const generateMongooseQueryObject = (): MongooseQuery => ({});

// add all resolvers here
export const resolvers: [Function, ...Function[]] = [
  BracketPlatformResolver,
  GameResolver,
  CharacterResolver,
  PlayerResolver,
  GameEloResolver,
  PlayerSocialResolver,
  VenueResolver,
  EventResolver,
];
