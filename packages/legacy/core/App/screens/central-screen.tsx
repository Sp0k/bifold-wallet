import { FlatList, Text, View, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native'
import { useEffect, useState } from 'react'
import style from '../../__mocks__/style'
import {
  Central,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  useCentral,
  useCentralOnConnected,
  useCentralOnDisconnected,
  useCentralOnDiscovered,
  useCentralOnReceivedMessage,
  useCentralShutdownOnUnmount,
} from '@animo-id/react-native-ble-didcomm'
import { RequestMessage, parseRequestMessage, sendRequestMessage } from '../request_message'
import { parsePeripheralMessage, PeripheralRequest, PeripheralRequestStatus } from './peripheral-screen'
import { uuid } from '@credo-ts/core/build/utils/uuid'
import { Connection } from '@credo-ts/core'

export enum CentralRequestStatus {
  CONNECTION = 'connection',
}

export interface CentralRequest extends RequestMessage<CentralRequestStatus> {}

export const parseCentralMessage = (message: string): CentralRequest => {
  return parseRequestMessage<CentralRequestStatus, CentralRequest>(message)
}

export const Connected = () => {
  return (
    <View style={[styles.connection, { backgroundColor: '#CCF6C5' }]}>
      <Text style={styles.text}>OK</Text>
    </View>
  )
}

export const Failed = () => {
  return (
    <View style={[styles.connection, { backgroundColor: '#F0ACAC' }]}>
      <Text style={styles.text}>FAILED</Text>
    </View>
  )
}

enum ScanResultStatus {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

interface ScanResult {
  peripheral_id: string
  status: ScanResultStatus
}

interface ConnectStatusProps {
  status: ScanResultStatus
}

export const ConnectStatus = ({ status }: ConnectStatusProps) => {
  return <TouchableOpacity>{status === ScanResultStatus.ACCEPTED ? <Connected /> : <Failed />}</TouchableOpacity>
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#151818',
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  connection: {
    width: 145,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
  },
  text: {
    color: '#151818',
    fontSize: 20,
    textAlign: 'center',
  },
})

const CentralScreen = () => {
  const { central } = useCentral()
  const [peripheralId, setPeripheralId] = useState<string | undefined>(undefined)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isStarted, setIsStarted] = useState<boolean>(false)
  const [scanList, setScanList] = useState<ScanResult[]>([])

  const sendRequest = async (request: CentralRequest) =>
    await sendRequestMessage<Central, CentralRequestStatus, CentralRequest>(central, request)

  const connect = async (pid: string) => {
    if (peripheralId) {
      throw new Error('An other peripheral is already connected')
    } else {
      console.log('Peripheral connected: ', pid)

      setPeripheralId(pid)
      // TODO: Maybe create a custom hook...
      await central.connect(pid)
      setIsConnected(true)
    }
  }

  const disconnect = () => {
    if (peripheralId) {
      console.log('Peripheral disconnected: ', peripheralId)

      setIsConnected(false)
      setPeripheralId(undefined)
    } else {
      throw new Error('Peripheral ID is not defined')
    }
  }

  const sendRequestConnectionRequest = async (peripheralId: string) => {
    const request: CentralRequest = {
      status: CentralRequestStatus.CONNECTION,
      peripheral_identifier: peripheralId,
    }

    await sendRequest(request)
  }

  const acceptConnection = (request: PeripheralRequest) => {
    setScanList((prev) => [
      ...prev,
      { peripheral_id: request.peripheral_identifier, status: ScanResultStatus.ACCEPTED } as ScanResult,
    ])

    console.log('Connection accepted: ', request)
  }

  const rejectConnection = (request: PeripheralRequest) => {
    setScanList((prev) => [
      ...prev,
      { peripheral_id: request.peripheral_identifier, status: ScanResultStatus.REJECTED } as ScanResult,
    ])
    disconnect()

    console.log('Connection rejected: ', request)
  }

  const finishConnection = (request: PeripheralRequest) => {
    disconnect()
    console.log('Connection finished: ', request)
  }

  const handleReceivedMessage = (request: PeripheralRequest) => {
    switch (request.status) {
      case PeripheralRequestStatus.CONNECTION_ACCEPTED:
        acceptConnection(request)

        break
      case PeripheralRequestStatus.CONNECTION_REJECTED:
        rejectConnection(request)

        break
      case PeripheralRequestStatus.FINISHED:
        finishConnection(request)

        break
      default:
        throw new Error('Invalid peripheral request status')
    }
  }

  const renderItem = ({ peripheral_id, status }: ScanResult) => (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 41 }}>
      <Text style={{ color: 'white', marginRight: 38, fontSize: 30 }}>{peripheral_id}</Text>
      <ConnectStatus status={status} />
    </View>
  )

  useEffect(() => {
    const onDiscoverPeripheralListener = central.registerOnDiscoveredListener(
      ({ identifier }: { identifier: string }) => {
        const attemptFirstConnection = async () => {
          await connect(identifier)
          await sendRequestConnectionRequest(identifier)
        }

        console.log('Peripheral discovered: ', identifier)

        attemptFirstConnection()
      }
    )

    const onReceivedMessageListener = central.registerMessageListener(({ message }: { message: string }) => {
      const request = parsePeripheralMessage(message)

      handleReceivedMessage(request)
    })

    const onConnectedCentralListener = central.registerOnConnectedListener(({ identifier }: { identifier: string }) => {
      console.log('Peripheral connected: ', identifier)
    })

    const onDisconnectedCentralListener = central.registerOnDisconnectedListener(
      ({ identifier }: { identifier: string }) => {
        disconnect()
        console.log('Peripheral disconnected: ', identifier)
      }
    )

    return () => {
      onDiscoverPeripheralListener.remove()
      onReceivedMessageListener.remove()
      onConnectedCentralListener.remove()
      onDisconnectedCentralListener.remove()
    }
  }, [])

  useEffect(() => {
    const start = async () => {
      if (!isStarted) {
        await central.start()
        setIsStarted(true)

        console.log('Central started')

        await central.setService({
          serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
          messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
          indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
        })

        console.log('Central scan...')
        await central.scan()
      }
    }

    start()
  }, [])

  useCentralShutdownOnUnmount()

  return (
    <SafeAreaView style={styles.background}>
      {scanList ? (
        <FlatList data={scanList} keyExtractor={() => uuid()} renderItem={({ item }) => renderItem(item)} />
      ) : (
        <Text>No peripherals found</Text>
      )}
    </SafeAreaView>
  )
}

export default CentralScreen
