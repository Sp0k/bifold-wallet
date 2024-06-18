export interface RequestMessage<S> {
  status: S
  peripheral_identifier: string
}

interface Transport {
  sendMessage(message: string): Promise<void>
}

const formatRequestMessage = <S, R extends RequestMessage<S>>(request: R): string =>
  `${request.status} ${request.peripheral_identifier}`

export const sendRequestMessage = async <T extends Transport, S, R extends RequestMessage<S>>(
  transport: T,
  request: R
): Promise<void> => {
  const message = formatRequestMessage<S, R>(request)

  console.log(`Sending request message: ${message}`)

  await transport.sendMessage(message)
}

export const parseRequestMessage = <S, R extends RequestMessage<S>>(message: string): R => {
  const [status, peripheral_identifier] = message.split(' ')

  if (status.length + peripheral_identifier.length + 1 !== message.length) {
    throw new Error('Invalid message format')
  }

  return { status: status as S, peripheral_identifier } as R
}
