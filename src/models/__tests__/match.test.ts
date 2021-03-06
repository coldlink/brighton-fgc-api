import {
  DocumentType,
  isDocument,
  isDocumentArray,
} from '@typegoose/typegoose';
import { CreateQuery, Types } from 'mongoose';
import { default as moment } from 'moment';
import { MatchModel, Match } from '@models/match';
import { PlayerModel, Player } from '@models/player';
import {
  TournamentModel,
  Tournament,
  TOURNAMENT_TYPE,
} from '@models/tournament';

describe('Match model test', () => {
  let tournaments: Array<DocumentType<Tournament>>;
  let players: Array<DocumentType<Player>>;

  let matchFull: Match;
  let matchMin: Match;
  let matchTeam: Match;
  let match: DocumentType<Match>;

  beforeEach(async () => {
    // fake some tournaments
    tournaments = await TournamentModel.create([
      {
        name: 'Tournament #1',
        date_start: moment.utc().subtract(1, 'd').toDate(),
        date_end: moment.utc().subtract(1, 'd').add(4, 'h').toDate(),
        event: new Types.ObjectId(),
        games: [new Types.ObjectId()],
        type: TOURNAMENT_TYPE.DOUBLE_ELIMINATION,
        is_team_based: false,
        players: [new Types.ObjectId()],
      },
      {
        name: 'Tournament #2',
        date_start: moment.utc().add(1, 'd').toDate(),
        event: new Types.ObjectId(),
        games: [new Types.ObjectId()],
        type: TOURNAMENT_TYPE.ROUND_ROBIN,
        is_team_based: true,
      },
    ] as CreateQuery<Tournament>[]);

    // fake some players
    players = await PlayerModel.create([
      {
        handle: 'Player 0',
      },
      {
        handle: 'Player 1',
      },
      {
        handle: 'Player 2',
      },
      {
        handle: 'Player 3',
      },
    ] as Array<Player>);

    matchFull = {
      tournament: tournaments[0]._id,
      loser: [players[0]._id],
      winner: [players[1]._id],
      player1: [players[0]._id],
      player2: [players[1]._id],
      round: 1,
      round_name: 'Winners Round 1',
      score1: 0,
      score2: 1,
      date_end: moment.utc().add(5, 'minute').toDate(),
      date_start: moment.utc().toDate(),
    };

    // not sure you'd do this, but an active tournament might have blank matches
    matchMin = {
      tournament: tournaments[1]._id,
    };

    // support teams!
    matchTeam = {
      tournament: tournaments[0]._id,
      loser: [players[0]._id, players[1]._id],
      winner: [players[2]._id, players[3]._id],
      player1: [players[0]._id, players[1]._id],
      player2: [players[2]._id, players[3]._id],
    };

    // generate match to test populate
    [match] = await MatchModel.create([matchFull] as CreateQuery<Match>[]);
  });

  it('should create & save a match successfully', async () => {
    const input = new MatchModel(matchFull);
    const output = await input.save();

    expect(output._id).toBeDefined();

    // shouldnt populate virtuals
    expect(isDocument(output.tournament)).toBe(false);

    expect(output.tournament?.toString()).toBe(
      matchFull.tournament?.toString(),
    );
    expect(output.tournament?.toString()).toBe(tournaments[0].id);
    expect(output.loser).toHaveLength(1);
    expect(output.loser?.[0]?.toString()).toBe(
      matchFull.loser?.[0]?.toString(),
    );
    expect(output.loser?.[0]?.toString()).toBe(players[0].id);
    expect(output.winner).toHaveLength(1);
    expect(output.winner?.[0]?.toString()).toBe(
      matchFull.winner?.[0]?.toString(),
    );
    expect(output.winner?.[0]?.toString()).toBe(players[1].id);
    expect(output.player1).toHaveLength(1);
    expect(output.player1?.[0]?.toString()).toBe(
      matchFull.player1?.[0]?.toString(),
    );
    expect(output.player1?.[0]?.toString()).toBe(players[0].id);
    expect(output.player1).toHaveLength(1);
    expect(output.player1?.[0]?.toString()).toBe(
      matchFull.player1?.[0]?.toString(),
    );
    expect(output.player1?.[0]?.toString()).toBe(players[0].id);
    expect(output.player2).toHaveLength(1);
    expect(output.player2?.[0]?.toString()).toBe(
      matchFull.player2?.[0]?.toString(),
    );
    expect(output.player2?.[0]?.toString()).toBe(players[1].id);
    expect(output.round).toBe(matchFull.round);
    expect(output.round_name).toBe(matchFull.round_name);
    expect(output.score1).toBe(matchFull.score1);
    expect(output.score2).toBe(matchFull.score2);
    expect(output.date_end?.toISOString()).toBe(
      matchFull.date_end?.toISOString(),
    );
    expect(output.date_start?.toISOString()).toBe(
      matchFull.date_start?.toISOString(),
    );
  });

  it('should create & save min match successfully', async () => {
    const input = new MatchModel(matchMin);
    const output = await input.save();

    expect(output._id).toBeDefined();
    expect(output.tournament?.toString()).toBe(matchMin.tournament?.toString());
    expect(output.tournament?.toString()).toBe(tournaments[1].id);
    expect(output.loser).toHaveLength(0);
    expect(output.winner).toHaveLength(0);
    expect(output.player1).toHaveLength(0);
    expect(output.player2).toHaveLength(0);
    expect(output.round).toBeUndefined();
    expect(output.round_name).toBeUndefined();
    expect(output.score1).toBeUndefined();
    expect(output.score2).toBeUndefined();
    expect(output.date_end).toBeUndefined();
    expect(output.date_start).toBeUndefined();
  });

  it('should create & save a team match successfully', async () => {
    const input = new MatchModel(matchTeam);
    const output = await input.save();

    expect(output._id).toBeDefined();
    expect(output.tournament?.toString()).toBe(
      matchTeam.tournament?.toString(),
    );
    expect(output.tournament?.toString()).toBe(tournaments[0].id);

    expect(output.loser).toHaveLength(2);
    expect(output.loser?.[0]?.toString()).toBe(
      matchTeam.loser?.[0]?.toString(),
    );
    expect(output.loser?.[1]?.toString()).toBe(
      matchTeam.loser?.[1]?.toString(),
    );
    expect(output.loser?.[0]?.toString()).toBe(players[0].id);
    expect(output.loser?.[1]?.toString()).toBe(players[1].id);

    expect(output.winner).toHaveLength(2);
    expect(output.winner?.[0]?.toString()).toBe(
      matchTeam.winner?.[0]?.toString(),
    );
    expect(output.winner?.[1]?.toString()).toBe(
      matchTeam.winner?.[1]?.toString(),
    );
    expect(output.winner?.[0]?.toString()).toBe(players[2].id);
    expect(output.winner?.[1]?.toString()).toBe(players[3].id);

    expect(output.player1).toHaveLength(2);
    expect(output.player1?.[0]?.toString()).toBe(
      matchTeam.player1?.[0]?.toString(),
    );
    expect(output.player1?.[1]?.toString()).toBe(
      matchTeam.player1?.[1]?.toString(),
    );
    expect(output.player1?.[0]?.toString()).toBe(players[0].id);
    expect(output.player1?.[1]?.toString()).toBe(players[1].id);

    expect(output.player2).toHaveLength(2);
    expect(output.player2?.[0]?.toString()).toBe(
      matchTeam.player2?.[0]?.toString(),
    );
    expect(output.player2?.[1]?.toString()).toBe(
      matchTeam.player2?.[1]?.toString(),
    );
    expect(output.player2?.[0]?.toString()).toBe(players[2].id);
    expect(output.player2?.[1]?.toString()).toBe(players[3].id);

    expect(output.round).toBeUndefined();
    expect(output.round_name).toBeUndefined();
    expect(output.score1).toBeUndefined();
    expect(output.score2).toBeUndefined();
  });

  it('should populate tournament', async () => {
    const output = await MatchModel.findById(match.id).populate('tournament');

    if (output) {
      expect(isDocument(output?.tournament)).toBe(true);
      expect(output?.player1 && isDocumentArray(output?.player1)).toBe(false);
      expect(output?.player2 && isDocumentArray(output?.player2)).toBe(false);
      expect(output?.winner && isDocumentArray(output?.winner)).toBe(false);
      expect(output?.loser && isDocumentArray(output?.loser)).toBe(false);

      if (isDocument(output?.tournament)) {
        expect(output?.tournament?.id).toBe(tournaments[0].id);
      }
    }
  });

  it('should populate loser', async () => {
    const output = await MatchModel.findById(match.id).populate('loser');

    if (output) {
      expect(isDocument(output?.tournament)).toBe(false);
      expect(output?.player1 && isDocumentArray(output?.player1)).toBe(false);
      expect(output?.player2 && isDocumentArray(output?.player2)).toBe(false);
      expect(output?.winner && isDocumentArray(output?.winner)).toBe(false);
      expect(output?.loser && isDocumentArray(output?.loser)).toBe(true);

      if (output?.loser && isDocumentArray(output?.loser)) {
        expect(output?.loser).toHaveLength(1);
        expect(output?.loser?.[0].id).toBe(players[0].id);
      }
    }
  });

  it('should populate winner', async () => {
    const output = await MatchModel.findById(match.id).populate('winner');

    if (output) {
      expect(isDocument(output?.tournament)).toBe(false);
      expect(output?.player1 && isDocumentArray(output?.player1)).toBe(false);
      expect(output?.player2 && isDocumentArray(output?.player2)).toBe(false);
      expect(output?.winner && isDocumentArray(output?.winner)).toBe(true);
      expect(output?.loser && isDocumentArray(output?.loser)).toBe(false);

      if (output?.winner && isDocumentArray(output?.winner)) {
        expect(output?.winner).toHaveLength(1);
        expect(output?.winner?.[0].id).toBe(players[1].id);
      }
    }
  });

  it('should populate player 1', async () => {
    const output = await MatchModel.findById(match.id).populate('player1');

    if (output) {
      expect(isDocument(output?.tournament)).toBe(false);
      expect(output?.player1 && isDocumentArray(output?.player1)).toBe(true);
      expect(output?.player2 && isDocumentArray(output?.player2)).toBe(false);
      expect(output?.winner && isDocumentArray(output?.winner)).toBe(false);
      expect(output?.loser && isDocumentArray(output?.loser)).toBe(false);

      if (output?.player1 && isDocumentArray(output?.player1)) {
        expect(output?.player1).toHaveLength(1);
        expect(output?.player1?.[0].id).toBe(players[0].id);
      }
    }
  });

  it('should populate player 2', async () => {
    const output = await MatchModel.findById(match.id).populate('player2');

    if (output) {
      expect(isDocument(output?.tournament)).toBe(false);
      expect(output?.player1 && isDocumentArray(output?.player1)).toBe(false);
      expect(output?.player2 && isDocumentArray(output?.player2)).toBe(true);
      expect(output?.winner && isDocumentArray(output?.winner)).toBe(false);
      expect(output?.loser && isDocumentArray(output?.loser)).toBe(false);

      if (output?.player2 && isDocumentArray(output?.player2)) {
        expect(output?.player2).toHaveLength(1);
        expect(output?.player2?.[0].id).toBe(players[1].id);
      }
    }
  });

  it('should populate all fields', async () => {
    const output = await MatchModel.findById(match.id)
      .populate('tournament')
      .populate('loser')
      .populate('winner')
      .populate('player1')
      .populate('player2');

    if (output) {
      expect(isDocument(output?.tournament)).toBe(true);
      expect(output?.player1 && isDocumentArray(output?.player1)).toBe(true);
      expect(output?.player2 && isDocumentArray(output?.player2)).toBe(true);
      expect(output?.winner && isDocumentArray(output?.winner)).toBe(true);
      expect(output?.loser && isDocumentArray(output?.loser)).toBe(true);

      if (
        isDocument(output?.tournament) &&
        output?.player1 &&
        isDocumentArray(output?.player1) &&
        output?.player2 &&
        isDocumentArray(output?.player2) &&
        output?.winner &&
        isDocumentArray(output?.winner) &&
        output?.loser &&
        isDocumentArray(output?.loser)
      ) {
        expect(output?.tournament?.id).toBe(tournaments[0].id);

        expect(output?.loser).toHaveLength(1);
        expect(output?.loser?.[0].id).toBe(players[0].id);

        expect(output?.winner).toHaveLength(1);
        expect(output?.winner?.[0].id).toBe(players[1].id);

        expect(output?.player1).toHaveLength(1);
        expect(output?.player1?.[0].id).toBe(players[0].id);

        expect(output?.player2).toHaveLength(1);
        expect(output?.player2?.[0].id).toBe(players[1].id);
      }
    }
  });
});
