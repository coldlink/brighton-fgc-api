import { Types } from 'mongoose'

import Event from '.'
import Tournament from '../tournament'
import { success, notFound, badImplementation } from '../../../services/response/'

const ObjectId = Types.ObjectId

export const index = ({ query }, res, next) => {
  const cursor = {
    sort: {
      date: -1
    }
  }
  if (query.limit) {
    cursor.limit = parseInt(query.limit)
  }
  Event.find({}, {}, cursor)
    .then((events) => events.map((event) => event.view()))
    .then(success(res))
    .catch(badImplementation(res))
}

export const show = ({ params }, res, next) =>
  Event.findById(params.id)
    .then(notFound(res))
    .then((event) => event ? event.view() : null)
    .then(success(res))
    .catch(badImplementation(res))

export const tournaments = ({ params }, res, next) =>
  Tournament.find({ event: ObjectId(params.id) })
    .populate({
      path: '_gameId',
      select: 'name id'
    })
    .then(tournaments => tournaments.map(tournament => tournament.view()))
    .then(success(res))
    .catch(badImplementation(res))

export const create = ({ bodymen: { body } }, res, next) =>
  Event.create(body)
    .then((event) => event.view(true))
    .then(success(res, 201))
    .catch(next)

export const update = ({ bodymen: { body }, params }, res, next) =>
  Event.findById(params.id)
    .then(notFound(res))
    .then((event) => event ? Object.assign(event, body).save() : null)
    .then((event) => event ? event.view(true) : null)
    .then(success(res))
    .catch(next)

export const destroy = ({ params }, res, next) =>
  Event.findById(params.id)
    .then(notFound(res))
    .then((event) => event ? Event.deleteOne({ _id: event.id }) : null)
    .then(success(res, 204))
    .catch(next)

export const count = (req, res, next) =>
  Event
    .estimatedDocumentCount()
    .then(success(res))
    .catch(next)
