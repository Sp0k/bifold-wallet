import {
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  usePeripheral,
  usePeripheralOnReceivedMessage,
} from '@animo-id/react-native-ble-didcomm'
import { useEffect, useState } from 'react'
import { TouchableOpacity, Text, View, StyleSheet, FlatList, Button } from 'react-native'
import { CentralRequest, CentralRequestStatus, parseCentralMessage } from './central-screen'

// Peripheral message handler for the application syntax:
//
// <command_type> <peripheral_identifier>
//
// e.g.
//
// connection_accepted XXX:XXX:XXX
export enum PeripheralRequestStatus {
  CONNECTION_ACCEPTED = 'connection_accepted',
  CONNECTION_REJECTED = 'connection_rejected',
}

export interface PeripheralRequest {
  request: PeripheralRequestStatus
  identifier: string
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
  const [centralRequests, setCentralRequests] = useState<CentralRequest[]>([
    { request: CentralRequestStatus.CONNECTION, identifier: 'XXX:XXX:XXX' },
  ])

  useEffect(() => {
    peripheral.start()
    peripheral.setService({
      serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
      messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
      indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
    })

    console.log('Peripheral started')
  })

  usePeripheralOnReceivedMessage((message) => {
    const centralRequest = parseCentralMessage(message)

    setShowCentrals(true)
    setCentralRequests((prev) => [...prev, centralRequest])

    console.log(centralRequest)
  })

  const formatRequest = (request: PeripheralRequest) => `${request.request} ${request.identifier}`

  const sendRequest = (request: PeripheralRequest) => {
    const message = formatRequest(request)

    console.log(`Send: ${message}`)

    peripheral.sendMessage(message)
  }

  const acceptRequest = (identifier: string, request: CentralRequestStatus) => {
    if (request === CentralRequestStatus.CONNECTION) {
      sendRequest({ request: PeripheralRequestStatus.CONNECTION_ACCEPTED, identifier } as PeripheralRequest)
      console.log('Accepted connection request')
    } else {
      throw new Error('Invalid request')
    }
  }

  const onPress = () => console.log('Advertise')
  const renderItem = ({ identifier, request }: CentralRequest) => (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'space-evenly', flexDirection: 'row', marginBottom: 20 }}
    >
      <Text style={{ color: '#151818', fontSize: 30 }}>{identifier}</Text>
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
          onPress={() => acceptRequest(identifier, request)}
        >
          <Text>✔</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.btn, backgroundColor: '#DFC0B9', borderRadius: 25, padding: 10, width: 60, height: 60 }}
          onPress={() => console.log('Reject')}
        >
          <Text>❌</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.background}>
      <View style={{ flex: 1, marginTop: 250 }}>
        <TouchableOpacity onPress={onPress} style={styles.btn}>
          <Text style={{ color: '#CCF6C5', fontSize: 40 }}>Advertise</Text>
        </TouchableOpacity>
      </View>
      {true && (
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
              onPress={() => setShowCentrals(false)}
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
