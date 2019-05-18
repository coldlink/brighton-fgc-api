import { makeExecutableSchema } from 'graphql-tools'
import typeDef from './typeDef'
import query from './query'
import gqlProjection from 'graphql-advanced-projection'
import { merge } from 'lodash'
import Tournament from '../../../common/tournament/model'

const { project, resolvers } = gqlProjection({
  Tournament: {
    proj: {
      id: '_id',
      name: 'name',
      type: 'type',
      dateTimeStart: 'dateStart',
      dateTimeEnd: 'dateEnd',
      bracket: 'bracker',
      bracketImage: 'bracketImage',
      signUpUrl: 'signUpUrl',
      challongeId: 'challongeId',
      youtube: 'youtube',
      gameId: '_gameId',
      playerIds: 'players',
      eventId: 'event'
    }
  }
})

export default makeExecutableSchema({
  typeDefs: [typeDef, query],
  resolvers: merge(resolvers, {
    Query: {
      tournaments (parent, { search }, context, info) {
        const proj = project(info)
        const q = {}
        if (search) {
          q.$text = {
            $search: search
          }
        }
        return Tournament.find(q, proj)
      },
      tournament (parent, { id }, context, info) {
        const proj = project(info)
        return Tournament.findById(id, proj)
      }
    }
  })
})
