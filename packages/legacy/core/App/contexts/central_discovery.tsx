import { useState } from 'react'
import { Text, Button, View } from 'react-native'
import {
  useCentralOnDiscovered,
  Central,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  useCentral,
  useCentralOnConnected,
} from '@animo-id/react-native-ble-didcomm'

const CentralDiscovery = () => {
  const { central } = useCentral()
  const [centralState, setCentralState] = useState<Central>(central)
  const [connectState, setConnectState] = useState<boolean>(false)

  const startCentral = async () => {
    const c = new Central()

    await c.start()

    setConnectState(true)

    const uuid = '56847593-40ea-4a92-bd8c-e1514dca1c61'
    await c.setService({
      serviceUUID: uuid || DEFAULT_DIDCOMM_SERVICE_UUID,
      messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
      indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
    })

    setCentralState(c)
  }

  const scan = async () => {
    await centralState?.scan()
    console.log('Done Scanning')
  }

  const [idList, setIdList] = useState<string[]>([])

  useCentralOnDiscovered((identifier) => {
    setIdList([...idList, identifier])
    console.log(identifier)
    console.log('Scan')
  })

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Start Central" onPress={startCentral} />
      <Text>central is {connectState ? 'started' : 'undefined'}</Text>
      <Button title="Scan" onPress={scan} />
      {idList.length === 0 ? <Text>No peripherals found</Text> : idList.map((id) => <Text>{id}</Text>)}
    </View>
  )
}

export default CentralDiscovery
