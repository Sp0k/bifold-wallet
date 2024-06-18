import {
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  usePeripheral,
  usePeripheralOnReceivedMessage,
  Peripheral,
  usePeripheralShutdownOnUnmount,
} from '@animo-id/react-native-ble-didcomm'
import { useEffect, useState } from 'react'
import { parseRequestMessage, RequestMessage, sendRequestMessage } from '../request_message'
import { TouchableOpacity, Text, View, StyleSheet, FlatList, Button } from 'react-native'
import { CentralRequest, CentralRequestStatus, parseCentralMessage } from './central-screen'

export enum PeripheralRequestStatus {
  CONNECTION_ACCEPTED = 'connection_accepted', // Accept connection request from central
  CONNECTION_REJECTED = 'connection_rejected', // Reject connection request from central
  FINISHED = 'finished', // Finish connection with central
}

export interface PeripheralRequest extends RequestMessage<PeripheralRequestStatus> {}

export const parsePeripheralMessage = (message: string): PeripheralRequest => {
  return parseRequestMessage<PeripheralRequestStatus, PeripheralRequest>(message)
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#151818',
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  btn: {
    borderRadius: 125,
    borderColor: '#CCF6C5',
    width: 250,
    height: 250,
    borderStyle: 'solid',
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

const PeripheralScreen = () => {
  const { peripheral } = usePeripheral()
  const [showCentrals, setShowCentrals] = useState(false)
  const [centralRequests, setCentralRequests] = useState<CentralRequest[]>([])

  const sendRequest = async (request: PeripheralRequest) =>
    await sendRequestMessage<Peripheral, PeripheralRequestStatus, PeripheralRequest>(peripheral, request)

  const acceptConnectionRequest = async (request: CentralRequest) => {
    if (request.status === CentralRequestStatus.CONNECTION) {
      await sendRequest({
        status: PeripheralRequestStatus.CONNECTION_ACCEPTED,
        peripheral_identifier: request.peripheral_identifier,
      } as PeripheralRequest)

      console.log('Accepted connection request')
    } else {
      throw new Error('Invalid request')
    }
  }

  const rejectConnectionRequest = async (request: CentralRequest) => {
    if (request.status === CentralRequestStatus.CONNECTION) {
      await sendRequest({
        status: PeripheralRequestStatus.CONNECTION_REJECTED,
        peripheral_identifier: request.peripheral_identifier,
      } as PeripheralRequest)

      console.log('Rejected connection request')
    } else {
      throw new Error('Invalid request')
    }
  }

  const onAdvertise = async () => {
    await peripheral.advertise()
    console.log('Peripheral advertised')
  }

  const onClose = () => setShowCentrals(false)

  const renderItem = (request: CentralRequest) => (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly', flexDirection: 'row', marginBottom: 20 }}
    >
      <Text style={{ color: '#151818', fontSize: 30 }}>{request.peripheral_identifier}</Text>
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' }}>
        <TouchableOpacity
          style={{
            ...styles.btn,
            backgroundColor: '#BADFB9',
            borderRadius: 25,
            padding: 10,
            width: 60,
            height: 60,
          }}
          onPress={() => acceptConnectionRequest(request)}
        >
          <Text>✔</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.btn, backgroundColor: '#DFC0B9', borderRadius: 25, padding: 10, width: 60, height: 60 }}
          onPress={() => rejectConnectionRequest(request)}
        >
          <Text>❌</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  useEffect(() => {
    peripheral.start()
    peripheral.setService({
      serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
      messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
      indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
    })

    console.log('Peripheral started')
    // console.log('Peripheral advertised')
    // peripheral.advertise()

    return () => {
      setShowCentrals(false)
    }
  }, [])

  usePeripheralOnReceivedMessage((message) => {
    const centralRequest = parseCentralMessage(message)

    setShowCentrals(true)
    setCentralRequests((prev) => [...prev, centralRequest])

    console.log('Received message: ', centralRequest)
  })

  usePeripheralShutdownOnUnmount()

  return (
    <View style={styles.background}>
      <View style={{ flex: 1, marginTop: 150 }}>
        <TouchableOpacity onPress={onAdvertise} style={styles.btn}>
          <Text style={{ color: '#CCF6C5', fontSize: 40 }}>Advertise</Text>
        </TouchableOpacity>
      </View>
      {showCentrals && (
        <View
          style={{
            backgroundColor: '#CCF6C5',
            flex: 1,
            width: '100%',
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity
              style={{ ...styles.btn, backgroundColor: '#BADFB9', borderRadius: 30, width: 60, height: 60 }}
              onPress={onClose}
            >
              <Text>❌</Text>
            </TouchableOpacity>
          </View>
          <FlatList style={{ marginBottom: 80 }} data={centralRequests} renderItem={({ item }) => renderItem(item)} />
        </View>
      )}
    </View>
  )
}

export default PeripheralScreen
