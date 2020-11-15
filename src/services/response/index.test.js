import * as response from '.'

let res

beforeEach(() => {
  res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    end: jest.fn(() => res)
  }
})

describe('success', () => {
  it('responds with passed object and status 200', () => {
    expect(response.success(res)({ prop: 'value' })).toBeNull()
    expect(res.status).toBeCalledWith(200)
    expect(res.json).toBeCalledWith({ prop: 'value' })
  })

  it('responds with passed object and status 201', () => {
    expect(response.success(res, 201)({ prop: 'value' })).toBeNull()
    expect(res.status).toBeCalledWith(201)
    expect(res.json).toBeCalledWith({ prop: 'value' })
  })

  it('does not send any response when object has not been passed', () => {
    expect(response.success(res, 201)()).toBeNull()
    expect(res.status).not.toBeCalled()
  })
})

describe('notFound', () => {
  it('responds with status 404 when object has not been passed', () => {
    expect(response.notFound(res)()).toBeNull()
    expect(res.status).toBeCalledWith(404)
    expect(res.end).toHaveBeenCalledTimes(1)
  })

  it('returns the passed object and does not send any response', () => {
    expect(response.notFound(res)({ prop: 'value' })).toEqual({ prop: 'value' })
    expect(res.status).not.toBeCalled()
    expect(res.end).not.toBeCalled()
  })
})

describe('badRequest', () => {
  it('responds with status 403', () => {
    expect(response.badRequest(res)('Unauthorized')).toBeNull()
    expect(res.status).toBeCalledWith(400)
    expect(res.end).toHaveBeenCalledTimes(1)
  })
})

describe('unauthorized', () => {
  it('responds with status 403', () => {
    expect(response.unauthorized(res)('Unauthorized')).toBeNull()
    expect(res.status).toBeCalledWith(403)
    expect(res.end).toHaveBeenCalledTimes(1)
  })
})

describe('forbidden', () => {
  it('responds with status 401', () => {
    expect(response.forbidden(res)('Forbidden')).toBeNull()
    expect(res.status).toBeCalledWith(401)
    expect(res.end).toHaveBeenCalledTimes(1)
  })
})

describe('badImplementation', () => {
  it('responds with status 500', () => {
    expect(response.badImplementation(res)('Error')).toBeNull()
    expect(res.status).toBeCalledWith(500)
    expect(res.end).toHaveBeenCalledTimes(1)
  })
})

describe('badRequest', () => {
  it('responds with status 400', () => {
    expect(response.badRequest(res)('Bad Request')).toBeNull()
    expect(res.status).toBeCalledWith(400)
    expect(res.end).toHaveBeenCalledTimes(1)
  })
})

describe('badData', () => {
  it('responds with status 422', () => {
    expect(response.badData(res)('Bad Data')).toBeNull()
    expect(res.status).toBeCalledWith(422)
    expect(res.end).toHaveBeenCalledTimes(1)
  })
})