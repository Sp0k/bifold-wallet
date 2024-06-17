// Central message handler for the application syntax:
//
// <command_type> <central_identifier>
//
// e.g.
//
// connection XXX:XXX:XXX

export enum CentralRequestStatus {
  CONNECTION = 'connection',
}

export interface CentralRequest {
  request: CentralRequestStatus
  identifier: string
}

export const parseCentralMessage = (message: string): CentralRequest => {
  const [request, identifier] = message.split(' ')

  if (request.length + identifier.length !== message.length) {
    throw new Error('Invalid message format')
  }

  return {
    request: request as CentralRequestStatus,
    identifier,
  }
}
