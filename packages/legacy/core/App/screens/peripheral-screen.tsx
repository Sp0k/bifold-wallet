import {
  usePeripheral,
  usePeripheralShutdownOnUnmount,
  Peripheral,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_SERVICE_UUID,
} from '@animo-id/react-native-ble-didcomm'
import { useEffect, useState, useRef } from 'react'
import { BifoldError } from '../types/error'
import { DeviceEventEmitter, Text, Button, View, FlatList } from 'react-native'
import { EventTypes } from '../constants'
import { Agent } from '@credo-ts/core'
import { WalletSecret } from '../types/security'
import { useStore } from '../contexts/store'
import { useTranslation } from 'react-i18next'
import { agentDependencies } from '@credo-ts/react-native'
import BasicMessageProvider from '@credo-ts/react-hooks'
import { BleOutboundTransport } from '@credo-ts/transport-ble'
import { useAuth } from '../contexts/auth'
import { didMigrateToAskar, migrateToAskar } from '../utils/migration'
import { DispatchAction } from '../contexts/reducers/store'
import { createLinkSecretIfRequired, getAgentModules } from '../utils/agent'
import { useAgent } from '@credo-ts/react-hooks'
import { useNavigation } from '@react-navigation/core'
import { CommonActions } from '@react-navigation/core'
import { Stacks } from '../types/navigators'
import ConnectionList, { Connection, newConnection } from './components/ConnectionList'
import { handlePeripheralStandardMessage } from './utils/StandardMessage'
import QRRenderer from '../components/misc/QRRenderer'

const PeripheralScreen = () => {
  const [store, dispatch] = useStore()
  const { peripheral } = usePeripheral()
  const { t } = useTranslation()
  const { getWalletCredentials } = useAuth()
  const { agent, setAgent } = useAgent()
  const navigation = useNavigation()
  const [connectionList, setConnectionList] = useState<Connection[]>([])

  const qrCodeValue = `{
  "@type": "https://didcomm.org/out-of-band/%VER/invitation",
  "@id": "<id used for context as pthid>",
  "label": "Faber College",
  "handshake_protocols": ["https://didcomm.org/didexchange/1.0"],
  "services": [
    {
      "id": "#inline",
      "type": "did-communication",
      "recipientKeys": ["did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"],
      "routingKeys": [],
      "serviceEndpoint": "https://example.com:5000"
    },
    "did:sov:LjgpST2rjsoxYegQDRm7EL"
  ]
  }`

  const onAdvertise = async () => {
    await peripheral.advertise()
    console.log('Peripheral advertised')
  }

  const registerOutboundTransport = (agent: Agent, peripheral: Peripheral) => {
    const bleOutboundTransport = new BleOutboundTransport(peripheral)

    agent.registerOutboundTransport(bleOutboundTransport)
  }

  useEffect(() => {
    const initAgentEmitError = (err: unknown) => {
      const error = new BifoldError(t('Error.Title1045'), t('Error.Message1045'), (err as Error)?.message ?? err, 1045)
      DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
    }

    const configureAgent = (credentials: WalletSecret): Agent | undefined => {
      try {
        const agent = new Agent({
          config: {
            label: store.preferences.walletName || 'Aries Bifold',
            walletConfig: {
              id: credentials.id,
              key: credentials.key ?? '',
            },
            autoUpdateStorageOnStartup: true,
          },
          dependencies: agentDependencies,
          modules: {},
        })

        registerOutboundTransport(agent, peripheral)

        return agent
      } catch (err: unknown) {
        initAgentEmitError(err)
      }
    }

    const initAgent = async (): Promise<void> => {
      try {
        const credentials = await getWalletCredentials()

        if (!credentials?.id || !credentials.key) {
          // Cannot find wallet id/secret
          return
        }

        const newAgent = configureAgent(credentials)

        if (!newAgent) {
          const error = new BifoldError(
            t('Error.Title1045'),
            t('Error.Message1045'),
            'Failed to initialize agent',
            1045
          )
          DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)

          return
        }

        if (!didMigrateToAskar(store.migration)) {
          newAgent.config.logger.debug('Agent not updated to Aries Askar, updating...')

          await migrateToAskar(credentials.id, credentials.key, newAgent)

          newAgent.config.logger.debug('Successfully finished updating agent to Aries Askar')
          dispatch({
            type: DispatchAction.DID_MIGRATE_TO_ASKAR,
          })
        }

        await newAgent.initialize()

        await createLinkSecretIfRequired(newAgent)

        setAgent(newAgent)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: Stacks.TabStack }],
          })
        )
      } catch (err: unknown) {
        const error = new BifoldError(
          t('Error.Title1045'),
          t('Error.Message1045'),
          (err as Error)?.message ?? err,
          1045
        )
        DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
      }
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

    return () => {
      if (agent) {
        agent.shutdown()
      }
    }
  }, [])

  usePeripheralShutdownOnUnmount()

  return (
    <View>
      <Button onPress={onAdvertise} title="Advertise" />
      <BasicMessageProvider agent={agent}>
        <Text>TODO: Setup chat</Text>
      </BasicMessageProvider>

      <Text>Connections List:</Text>
      <ConnectionList list={connectionList} />
      <QRRenderer value={qrCodeValue} />
    </View>
  )
}

export default PeripheralScreen
