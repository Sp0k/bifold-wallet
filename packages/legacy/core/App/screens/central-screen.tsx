// Syntax of central message:
//
// <command_type> <peripheral_identifier>
//
// e.g.
//
// connection XXX:XXX:XXX
import { FlatList, Text, View, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native'
import { useEffect, useState } from 'react'
import style from '../../__mocks__/style'
import {
  Central,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  useCentral,
  useCentralOnReceivedMessage,
} from '@animo-id/react-native-ble-didcomm'
import { RequestMessage, parseRequestMessage, sendRequestMessage } from '../request_message'
import { parsePeripheralMessage, PeripheralRequest, PeripheralRequestStatus } from './peripheral-screen'

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

export const ConnectStatus = ({ item }) => {
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false)

  const onPressHandler = () => {
    connectionStatus ? setConnectionStatus(false) : setConnectionStatus(true)
  }

  return <TouchableOpacity onPress={onPressHandler}>{connectionStatus ? <Connected /> : <Failed />}</TouchableOpacity>
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
  const [scanList, setScanList] = useState([
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
  ])

  const sendRequest = async (request: CentralRequest) =>
    await sendRequestMessage<Central, CentralRequestStatus, CentralRequest>(central, request)

  const handleReceivedMessage = ({ status, peripheral_identifier }: PeripheralRequest) => {
    switch (status) {
      case PeripheralRequestStatus.CONNECTION_ACCEPTED:
        break
      case PeripheralRequestStatus.CONNECTION_REJECTED:
        break
      case PeripheralRequestStatus.FINISHED:
        break
      default:
        throw new Error('Invalid peripheral request status')
    }
  }

  useCentralOnReceivedMessage((message) => {
    const request = parsePeripheralMessage(message)

    handleReceivedMessage(request)
  })

  const renderItem = ({ item }) => (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 41 }}>
      <Text style={{ color: 'white', marginRight: 38, fontSize: 30 }}>{item}</Text>
      <ConnectStatus item={item} />
    </View>
  )

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
        <FlatList data={scanList} keyExtractor={(item) => item.id} renderItem={renderItem} />
      ) : (
        <Text>No peripherals found</Text>
      )}
    </SafeAreaView>
  )
}

export default CentralScreen
