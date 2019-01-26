import { Router } from 'express'
import { middleware as body } from 'bodymen'
import Match, { schema } from './model'
import { create, index, show, update, destroy, count, countGames, googleSheetsMatches, getMatchesWithYoutube } from './controller'
import { isAdmin } from '../../../services/auth'

const MatchRouter = new Router()
const { _tournamentId, _player1Id, _player2Id, _winnerId, _loserId, score, round, challongeMatchObj, startDate, endDate, _player1EloBefore, _player1EloAfter, _player2EloBefore, _player2EloAfter, roundName, youtubeId, characters, youtubeTimestamp, youtubeSeconds } = schema.tree

MatchRouter.post('/', isAdmin, body({ _tournamentId, _player1Id, _player2Id, _winnerId, _loserId, score, round, challongeMatchObj, startDate, endDate, _player1EloBefore, _player1EloAfter, _player2EloBefore, _player2EloAfter, roundName, youtubeId, characters, youtubeTimestamp, youtubeSeconds }), create)

MatchRouter.get('/', index)

MatchRouter.get('/count', count)

MatchRouter.get('/count/games', countGames)

MatchRouter.get('/youtube', getMatchesWithYoutube)

MatchRouter.get('/:id', show)

MatchRouter.put('/youtube', googleSheetsMatches)

MatchRouter.put('/:id', isAdmin, body({ _tournamentId, _player1Id, _player2Id, _winnerId, _loserId, score, round, challongeMatchObj, startDate, endDate, _player1EloBefore, _player1EloAfter, _player2EloBefore, _player2EloAfter, roundName, youtubeId, characters, youtubeTimestamp, youtubeSeconds }), update)

MatchRouter.delete('/:id', isAdmin, destroy)

export default Match
export { MatchRouter }
