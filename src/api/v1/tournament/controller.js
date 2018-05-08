import axios from 'axios'
import { URL } from 'url'
import asyncNode from 'async'
import cloudinary from 'cloudinary'
import _, { map, find } from 'lodash'
import { Types } from 'mongoose'
import { challongeApiKey } from '../../../config'
import moment from 'moment-timezone'
import { success, notFound, badImplementation, badRequest } from '../../../services/response/'
import Tournament from '.'
import Result from '../result'
import Match from '../match'
import Game from '../game'
import Player from '../player'

const ObjectId = Types.ObjectId

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const getPlayers = tournament => new Promise((resolve, reject) => {
  const queue = map(tournament.meta.participants, p => async callback => {
    const participant = p.participant

    let player

    if (participant.email_hash) {
      try {
        player = await Player
          .findOne({
            emailHash: new RegExp(`^${participant.email_hash}$`, 'i')
          })
      } catch (error) {
        console.error(error)
        return callback(error)
      }
    } else {
      try {
        player = await Player
          .findOne({
            challongeName: new RegExp(`^${participant.display_name}$`, 'i')
          })
      } catch (error) {
        console.error(error)
        return callback(error)
      }
    }

    if (player) {
      if (player.challongeName.indexOf(participant.display_name) === -1) {
        player.challongeName.push(participant.display_name)
        player.markModified('challongeName')
      }

      if (player.emailHash !== participant.email_hash) {
        player.emailHash = participant.email_hash
        player.markModified('emailHash')
      }

      if (participant.attached_participatable_portrait_url && player.challongeImageUrl !== participant.attached_participatable_portrait_url) {
        let url
        if (participant.attached_participatable_portrait_url.startsWith('//')) {
          url = `https:${participant.attached_participatable_portrait_url}`
        } else {
          url = participant.attached_participatable_portrait_url
        }

        const result = await new Promise(resolve => cloudinary.uploader.upload(url, resolve))
        if (result.secure_url) {
          player.imageUrl = result.secure_url
          player.challongeImageUrl = participant.attached_participatable_portrait_url
          player.markModified('imageUrl')
          player.markModified('challongeImageUrl')
        }
      }
      try {
        await player.save()
        return callback(null, { player, id: participant.id, meta: participant })
      } catch (error) {
        console.error(error)
        return callback(error)
      }
    } else {
      const body = {}
      if (participant.email_hash) {
        if (participant.attached_participatable_portrait_url) {
          body.challongeImageUrl = participant.attached_participatable_portrait_url

          let url
          if (participant.attached_participatable_portrait_url.startsWith('//')) {
            url = `https:${participant.attached_participatable_portrait_url}`
          } else {
            url = participant.attached_participatable_portrait_url
          }

          const result = await new Promise(resolve => cloudinary.uploader.upload(url, resolve))
          if (result.secure_url) {
            body.imageUrl = result.secure_url
          }
        }

        body.challongeUsername = participant.challonge_username
        body.handle = participant.challonge_username
        body.emailHash = participant.email_hash
        body.challongeName = [participant.challonge_username]
      } else {
        body.handle = participant.display_name
        body.challongeName = [participant.display_name]
      }

      const np = new Player(body)
      try {
        await np.save()
        return callback(null, { player: np, id: participant.id, meta: participant })
      } catch (error) {
        console.error(error)
        return callback(error)
      }
    }
  })

  asyncNode.series(queue, (err, players) => {
    if (err) return reject(err)
    return resolve(players)
  })
})

const getMatches = (tournament, players) => new Promise((resolve, reject) => {
  const queue = map(tournament.meta.matches, m => async callback => {
    const match = m.match
    const matchObj = {
      _tournamentId: tournament._id,
      _player1Id: find(players, p => p.id === match.player1_id).player._id,
      _player2Id: find(players, p => p.id === match.player2_id).player._id,
      _winnerId: find(players, p => p.id === match.winner_id).player._id,
      _loserId: find(players, p => p.id === match.loser_id).player._id,
      score: getScore(match.scores_csv),
      round: match.round,
      endDate: match.round,
      challongeMatchObj: match
    }
    if (match.started_at) {
      matchObj.startDate = moment(match.started_at).toDate()
    }
    if (match.completed_at) {
      matchObj.endDate = moment(match.completed_at).toDate()
    }
    const nm = new Match(matchObj)
    try {
      await nm.save()
      return callback(null, nm)
    } catch (err) {
      console.error(err)
      return callback(err)
    }
  })

  asyncNode.series(queue, (err, matches) => {
    if (err) return reject(err)
    return resolve(matches)
  })
})

const getResults = (tournament, players) => new Promise((resolve, reject) => {
  const queue = map(players, p => async callback => {
    const nr = new Result({
      _tournamentId: tournament._id,
      _playerId: p.player._id,
      rank: p.meta.final_rank
    })
    try {
      await nr.save()
      return callback(null, nr)
    } catch (error) {
      console.error(error)
      return callback(error)
    }
  })

  asyncNode.series(queue, (err, results) => {
    if (err) return reject(err)
    return resolve(results)
  })
})

const getScore = scores => {
  return _
    .chain(scores)
    .split(',')
    .map(s => {
      const score = s.split('-')
      return {
        p1: score[0],
        p2: score[1]
      }
    })
    .value()
}

export const create = ({ bodymen: { body } }, res, next) =>
  Tournament.create(body)
    .then(tournament => tournament.view(true))
    .then(success(res, 201))
    .catch(badImplementation(res))

export const index = ({ query }, res, next) => {
  const cursor = {
    sort: {
      dateStart: -1
    }
  }
  if (query.limit) {
    cursor.limit = parseInt(query.limit)
  }
  Tournament.find({}, {}, cursor)
    .populate({
      path: '_gameId',
      select: 'name id'
    })
    .then(tournaments => tournaments.map(tournament => tournament.view()))
    .then(success(res))
    .catch(badImplementation(res))
}

export const indexNoGame = ({ query }, res, next) =>
  Tournament.find(query)
    .then(tournaments => tournaments.map(tournament => tournament.view()))
    .then(success(res))
    .catch(badImplementation(res))

export const show = ({ params }, res, next) =>
  Tournament.findById(params.id)
    .populate({
      path: '_gameId'
    })
    .populate({
      path: 'event'
    })
    .populate({
      path: 'series'
    })
    .populate({
      path: 'players',
      select: '-challongeName'
    })
    .then(notFound(res))
    .then(tournament => tournament ? tournament.view() : null)
    .then(success(res))
    .catch(badImplementation(res))

export const update = ({ bodymen: { body }, params }, res, next) =>
  Tournament.findById(params.id)
    .then(notFound(res))
    .then(tournament => tournament ? Object.assign(tournament, body).save() : null)
    .then(tournament => tournament ? tournament.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  Tournament
    .findById(params.id)
    .then(notFound(res))
    .then(tournament => tournament ? tournament.remove() : null)
    .then(new Promise((resolve, reject) => {
      const proms = []
      // remove matches
      proms.push(new Promise((resolve, reject) => Match
        .remove({
          _tournamentId: ObjectId(params.id)
        })
        .then(resolve)
        .catch(reject)
      ))

      // remove result
      proms.push(new Promise((resolve, reject) => Result
        .remove({
          _tournamentId: ObjectId(params.id)
        })
        .then(resolve)
        .catch(reject)
      ))

      Promise
        .all(proms)
        .then(resolve)
        .catch(reject)
    }))
    .then(success(res, 204))
    .catch(next)

export const getStandings = async ({ params }, res, next) => {
  try {
    ObjectId(params.id)
  } catch (e) {
    return badRequest(res)('Bad ID Parameter')
  }

  await Tournament.findById(params.id).then(notFound(res))

  Result
    .find({
      _tournamentId: ObjectId(params.id)
    }, {}, {
      sort: {
        rank: 1
      }
    })
    .populate({
      path: '_playerId',
      select: 'id handle emailHash imageUrl'
    })
    .then(success(res))
    .catch(next)
}

export const challongeUpdate = async ({ bodymen: { body }, params }, res, next) => {
  const API_URL = `https://api.challonge.com/v1`

  if (process.env.NODE_ENV === 'test') {
    return success(res, 201)(body)
  }

  if (!body.bracket) {
    return res.sendStatus(404)
  }

  const bracket = new URL(body.bracket)

  const subdomain = bracket.hostname.split('.')[0]
  const path = bracket.pathname.replace('/', '')
  const url = `${API_URL}/tournaments/${subdomain === 'challonge' ? '' : `${subdomain}-`}${path}.json?include_participants=1&include_matches=1&api_key=${challongeApiKey}`

  let response

  try {
    response = await axios(url)
  } catch (error) {
    console.error(error)
    return next(error)
  }

  const tournament = response.data

  const query = {}
  if (body._gameId) {
    query._id = ObjectId(body._gameId)
  } else {
    query.name = tournament.tournament.game_name
  }

  let game

  try {
    game = await Game.findOne(query)
  } catch (error) {
    console.error(error)
    return next(error)
  }

  const updated = {
    name: tournament.tournament.name,
    type: tournament.tournament.tournament_type,
    _gameId: game._id || null,
    dateStart: moment(tournament.tournament.started_at || tournament.tournament.start_at || null).toDate(),
    dateEnd: tournament.tournament.completed_at && moment(tournament.tournament.completed_at).toDate(),
    bracket: tournament.tournament.full_challonge_url,
    bracketImage: tournament.tournament.live_image_url,
    signUpUrl: tournament.tournament.sign_up_url,
    challongeId: tournament.tournament.id,
    meta: tournament.tournament
  }

  if (!updated.dateEnd) {
    delete updated.dateEnd
  }

  let dbTournament
  try {
    dbTournament = await Tournament.findById(params.id).catch(next)
    if (!dbTournament) {
      return res.sendStatus(404)
    }
    dbTournament = dbTournament ? await Object.assign(dbTournament, updated).save().catch(next) : null
    dbTournament = dbTournament ? dbTournament.view(true) : null
    if (dbTournament) {
    // remove matches and results so they can me updated
      const proms = []
      // remove matches
      proms.push(new Promise((resolve, reject) => Match
        .remove({
          _tournamentId: ObjectId(params.id)
        })
        .then(resolve)
        .catch(reject)
      ))

      // remove result
      proms.push(new Promise((resolve, reject) => Result
        .remove({
          _tournamentId: ObjectId(params.id)
        })
        .then(resolve)
        .catch(reject)
      ))

      await Promise
        .all(proms)

      const players = await getPlayers(dbTournament)
      dbTournament = await Tournament
        .findByIdAndUpdate(params.id, {
          $set: {
            players: _.map(players, p => p.player._id)
          }
        })

      await getMatches(dbTournament, players)
      await getResults(dbTournament, players)

      return success(res)(dbTournament)
    }
  } catch (error) {
    console.error(error)
    return next(error)
  }
}

export const count = (req, res, next) =>
  Tournament
    .count()
    .then(success(res))
    .catch(next)