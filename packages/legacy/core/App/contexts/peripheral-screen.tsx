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

  const onPress = () => console.log('Advertise')
  const renderItem = ({ identifier }: CentralRequest) => (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <Text style={{ color: '#151818', fontSize: 30 }}>{identifier}</Text>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' }}>
        <TouchableOpacity title="Accept" onPress={() => console.log('Accept')}></TouchableOpacity>
        <TouchableOpacity title="Reject" onPress={() => console.log('Reject')}></TouchableOpacity>
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
        <FlatList
          data={centralRequests}
          renderItem={({ item }) => renderItem(item)}
          style={{
            backgroundColor: '#CCF6C5',
            flex: 1,
            width: '100%',
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            paddingHorizontal: 40,
            paddingVertical: 10,
          }}
        />
      )}
    </View>
  )
}

export default PeripheralScreen

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
