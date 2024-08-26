import {
  usePeripheral,
  usePeripheralShutdownOnUnmount,
  Peripheral,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_SERVICE_UUID,
} from '@animo-id/react-native-ble-didcomm'
import { useEffect, useState } from 'react'
import { BifoldError } from '../types/error'
import {
  DeviceEventEmitter,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native'
import { EventTypes } from '../constants'
import { Agent } from '@credo-ts/core'
import { WalletSecret } from '../types/security'
import { useStore } from '../contexts/store'
import { useTranslation } from 'react-i18next'
import { BleOutboundTransport } from '@credo-ts/transport-ble'
import { useAuth } from '../contexts/auth'
import { useAgent } from '@credo-ts/react-hooks'
import { useNavigation } from '@react-navigation/core'
import ConnectionList, { Connection, newConnection } from './components/ConnectionList'
import { handlePeripheralStandardMessage } from './utils/StandardMessage'
import QRCodeModal from '../components/modals/QRCodeModal'
import * as InitAgent from '../utils/init_agent'
import uuid from 'react-native-uuid';

const PeripheralScreen = () => {
  const [store, dispatch] = useStore()
  const { peripheral } = usePeripheral()
  const { t } = useTranslation()
  const { getWalletCredentials } = useAuth()
  const { agent, setAgent } = useAgent()
  const navigation = useNavigation()
  const [connectionList, setConnectionList] = useState<Connection[]>([])
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [qrCodeValue, setQrCodeValue] = useState<string | undefined>(undefined)

  const registerOutboundTransport = (agent: Agent, peripheral: Peripheral) => {
    const bleOutboundTransport = new BleOutboundTransport(peripheral)

    agent.registerOutboundTransport(bleOutboundTransport)
  }

  useEffect(() => {
    if (modalVisible === false) {
      if (agent && agent.isInitialized) {
        console.log("Shutdown old agent")
        agent.shutdown();
      }

      return;
    } 

    const qrCodeData = {
      bluetooth: {
        serviceUUID: uuid.v4(),
        messagingUUID: uuid.v4(),
        indicationUUID: uuid.v4(),
      },
    };

    setQrCodeValue(JSON.stringify(qrCodeData))

    const initAgentEmitError = (err: unknown) => {
      const error = new BifoldError(t('Error.Title1045'), t('Error.Message1045'), (err as Error)?.message ?? err, 1045)
      DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
    }

    const configureAgent = (credentials: WalletSecret | undefined): Agent | undefined => {
      return InitAgent.configureAgent(store, credentials, undefined, [new BleOutboundTransport(peripheral)])
    }

    const initAgent = async (): Promise<void> => {
      const credentials = await getWalletCredentials();
      const newAgent = configureAgent(credentials);

      InitAgent.run(credentials, newAgent, setAgent, t);
    }

    const startPeripheral = async () => {
      await peripheral.start()
      await peripheral.setService({
        serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
        messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
        indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
      })
      console.log('[CENTRAL] Services was configured')
      peripheral.registerOnConnectedListener(({ identifier }: { identifier: string }) => {
        setConnectionList([...connectionList, newConnection(identifier)])
      })
      peripheral.registerMessageListener(({ message }: { message: string }) => {
        console.log(`Peripheral got message: ${message}`)
        handlePeripheralStandardMessage(peripheral, message)
      })
      peripheral.registerOnDisconnectedListener(({ identifier }: { identifier: string }) => {
        setConnectionList(connectionList.filter((item) => item.identifier !== identifier))
      })
    }

    initAgent()
    startPeripheral()

    // return () => {
    //   if (agent) {
    //     agent.shutdown()
    //   }
    // }
  }, [modalVisible])

  usePeripheralShutdownOnUnmount()

  return (
    <View style={{ flex: 1 }}>
      <View style={{ alignItems: 'center', flex: 1 }}>
        <TouchableOpacity
          style={{
            width: 250,
            height: 250,
            borderWidth: 10,
            borderRadius: 125,
            borderColor: '#CCF6C5',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 100,
          }}
          onPress={() => {
            setModalVisible(!modalVisible)
          }}
        >
          <Text style={{ color: '#CCF6C5', fontSize: 25 }}>Display QR Code</Text>
        </TouchableOpacity>
        <QRCodeModal
          qrCodeData={qrCodeValue ?? '{}'}
          visibility={modalVisible}
          onPress={() => setModalVisible(!modalVisible)}
        />
      </View>
    </View>
  )
}

export default PeripheralScreen
