import { StackScreenProps } from '@react-navigation/stack'

import { ConnectStackParams } from '../types/navigators'
import { Button, View, FlatList, Text } from 'react-native'
import { useEffect } from 'react'
import { uuid } from '@credo-ts/core/build/utils/uuid'
import {
  useCentral,
  useCentralOnConnected,
  useCentralOnDisconnected,
  useCentralOnDiscovered,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  useCentralShutdownOnUnmount,
} from '@animo-id/react-native-ble-didcomm'
import { useState } from 'react'
import { PermissionsAndroid } from 'react-native'

export type BluetoothProps = StackScreenProps<ConnectStackParams>

const Bluetooth: React.FC<BluetoothProps> = () => {
  enum DeviceStatus {
    CONNECTED,
    DISCONNECTED,
    DISCOVERED,
  }

  interface Device {
    id: string
    status: DeviceStatus
  }

  const { central } = useCentral()
  const [discoveredDevices, setDiscoveredDevices] = useState<Device[]>([])

  useEffect(() => {
    const askPermissions = async () => {
      await PermissionsAndroid.requestMultiple([
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH_ADVERTISE',
        'android.permission.ACCESS_COARSE_LOCATION',
      ])
    }

    const init = async () => {
      await central.start()
      await central.setService({
        serviceUUID: uuid() || DEFAULT_DIDCOMM_SERVICE_UUID,
        messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
        indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
      })
      await central.scan()

      console.log("Scan...")
    }

    const deinit = async () => {
      await central.shutdown()
    }

    askPermissions()
    init()

    return () => {
      deinit()
    }
  })

  useCentralOnDiscovered((identifier) => {
    setDiscoveredDevices((prev) => [...prev, { id: identifier, status: DeviceStatus.DISCOVERED } as Device])
    console.log(`Discovered device: ${identifier}`)
  })

  useCentralOnConnected((identifier) => {
    console.log(`Connected to device: ${identifier}`)
  })

  useCentralShutdownOnUnmount()

  const renderDiscoveredDevices = (device: Device) => {
    const onConnect = () => {
      central.connect(device.id)
      device.status = DeviceStatus.CONNECTED
    }

    const onDisconnect = () => {
      device.status = DeviceStatus.DISCONNECTED
    }

    return (
      <View>
        <Text>{device.id}</Text>
        <Button title="Connect" color="#9de384" onPress={onConnect} />
        <Button title="Disconnect" color="#e384a1" onPress={onDisconnect} />
      </View>
    )
  }

  return (
    <View>
      {discoveredDevices ? (
        <FlatList
          data={discoveredDevices}
          numColumns={1}
          renderItem={({ item }) => renderDiscoveredDevices(item)}
          keyExtractor={(device: Device) => device.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text>Seems like there is no devices around</Text>
      )}
    </View>
  )
}

// useCentralOnDiscover https://github.com/animo/react-native-ble-didcomm/blob/main/src/central/hooks/useCentralOnDiscovered.ts

export default Bluetooth
