import Boom from 'boom'

// 200
export const success = (res, status) => entity => {
  if (entity) res.status(status || 200).json(entity)
  return null
}

// 401
export const unauthorized = res => message => {
  res.status(401).json(Boom.unauthorized(message)).end()
  return null
}

// 403
export const forbidden = res => message => {
  res.status(403).json(Boom.forbidden(message)).end()
  return null
}

// 404
export const notFound = res => entity => {
  if (entity) return entity
  res.status(404).json(Boom.notFound()).end()
  return null
}

// 500
export const badImplementation = res => err => {
  const error = Boom.boomify(err)
  res.status(500).json(error).end()
  return null
}
