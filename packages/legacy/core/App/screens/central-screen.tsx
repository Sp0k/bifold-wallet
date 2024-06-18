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
  const [scanList, setScanList] = useState<ScanResult[]>([])

  const sendRequest = async (request: CentralRequest) =>
    await sendRequestMessage<Central, CentralRequestStatus, CentralRequest>(central, request)

  const connect = (pid: string) => {
    if (peripheralId) {
      throw new Error('An other peripheral is already connected')
    } else {
      console.log('Peripheral connected: ', pid)

      setPeripheralId(pid)
      // TODO: Maybe create a custom hook...
      setIsConnected(true)
      central.connect(peripheralId as string)
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

  const requestConnectionRequest = (peripheralId: string) => {
    const request: CentralRequest = {
      status: CentralRequestStatus.CONNECTION,
      peripheral_identifier: peripheralId,
    }

    sendRequest(request)
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

  useCentralOnDiscovered((identifier: string) => {
    console.log('Peripheral discovered: ', identifier)

    // First connection, to be able to send a messasge to the peripheral
    connect(identifier)
    requestConnectionRequest(identifier)
  })

  useCentralOnReceivedMessage((message) => {
    const request = parsePeripheralMessage(message)

    handleReceivedMessage(request)
  })

  useCentralOnConnected((identifier) => {
    if (identifier == peripheralId) {
      console.log('Peripheral connected: ', identifier)
    } else {
      throw new Error('Unexpected error: peripheral connected is not the requested one')
    }
  })

  useCentralOnDisconnected((identifier) => {
    if (identifier == peripheralId) {
      disconnect()
    } else {
      throw new Error('Unexpected error: peripheral disconnected is not the connected one')
    }
  })

  useEffect(() => {
    central.start()
    central.setService({
      serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
      messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
      indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
    })

    console.log('Central started')
    console.log('Central scan...')

    central.scan()
  }, [])

  return (
    <SafeAreaView style={styles.background}>
      {scanList ? (
        <FlatList data={scanList} keyExtractor={uuid} renderItem={({ item }) => renderItem(item)} />
      ) : (
        <Text>No peripherals found</Text>
      )}
    </SafeAreaView>
  )
}

export default CentralScreen
