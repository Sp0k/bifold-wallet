import {
  usePeripheral,
  usePeripheralOnReceivedMessage,
  Peripheral,
  usePeripheralShutdownOnUnmount,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_SERVICE_UUID,
} from '@animo-id/react-native-ble-didcomm'
import { useEffect, useState } from 'react'
import { parseRequestMessage, RequestMessage, sendRequestMessage } from '../request_message'
import { TouchableOpacity, Text, View, StyleSheet, FlatList, Button, DeviceEventEmitter } from 'react-native'
import { CentralRequest, CentralRequestStatus, parseCentralMessage } from './central-screen'
import { useAgent } from '@credo-ts/react-hooks'
import { WalletSecret } from '../types/security'
import { Agent } from '@credo-ts/core'
import { createLinkSecretIfRequired, getAgentModules } from '../utils/agent'
import { BifoldError } from '../types/error'
import { EventTypes } from '../constants'
import { didMigrateToAskar, migrateToAskar } from '../utils/migration'
import { CommonActions } from '@react-navigation/core'
import { useStore } from '../contexts/store'
import { TOKENS, useContainer } from '../container-api'
import { Config } from 'react-native-config'
import { BleOutboundTransport } from '@credo-ts/transport-ble'
import { agentDependencies } from '@credo-ts/react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/auth'
import { DispatchAction } from '../contexts/reducers/store'
import { useNavigation } from '@react-navigation/core'
import { Stacks } from '../types/navigators'
import { uuid } from '@credo-ts/core/build/utils/uuid'

export enum PeripheralRequestStatus {
  CONNECTION_ACCEPTED = 'connection_accepted', // Accept connection request from central
  CONNECTION_REJECTED = 'connection_rejected', // Reject connection request from central
  FINISHED = 'finished', // Finish connection with central
}

export interface PeripheralRequest extends RequestMessage<PeripheralRequestStatus> {}

export const parsePeripheralMessage = (message: string): PeripheralRequest => {
  return parseRequestMessage<PeripheralRequestStatus, PeripheralRequest>(message)
}

export const registerOutboundTransport = (agent: Agent, peripheral: Peripheral) => {
  const bleOutboundTransport = new BleOutboundTransport(peripheral)

  agent.registerOutboundTransport(bleOutboundTransport)
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

interface ReceivedMessage {
	content: string
}

const PeripheralScreen = () => {
  const { peripheral } = usePeripheral()
  const [isStarted, setIsStarted] = useState<boolean>(false)
  const [showCentrals, setShowCentrals] = useState<boolean>(false)
  const [centralRequests, setCentralRequests] = useState<CentralRequest[]>([])
  const { agent, setAgent } = useAgent()
  const [store, dispatch] = useStore()
  const container = useContainer()
  const [mounted, setMounted] = useState(false)
  const { t } = useTranslation()
  const { getWalletCredentials } = useAuth()
  const [receivedMessages, setReceivedMessages] = useState<ReceivedMessage[]>([]);
  const navigation = useNavigation()

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

  const renderMessage = (receivedMessage: ReceivedMessage) => (
	  <View>
		  <Text>{receivedMessage.content}</Text>
	  </View>
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // if (!mounted || !store.authentication.didAuthenticate || !store.onboarding.didConsiderBiometry) {
    //   return
    // }

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

    const startAdvertise = async () => {
		await peripheral.start()
		peripheral.registerMessageListener(({ message }: { message: string }) => {
			setReceivedMessages([...receivedMessages, { content: message } as ReceivedMessage])
			console.log(receivedMessages.length);
			console.log(`Peripheral got message: ${message}`);
		});
        await peripheral.setService({
          serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
          messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
          indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
        })
		await peripheral.advertise()
		console.log('Peripheral Advertised')
    }

    initAgent()
    startAdvertise()

    return () => {
      if (agent) {
        agent.shutdown()
      }
    }
  }, [])

  usePeripheralShutdownOnUnmount()

  return (
    <View style={styles.background}>
      <View style={{ flex: 1, marginTop: 150 }}>
		<Button onPress={onAdvertise} title="Advertise" color="#CCF6C5"/>
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
		  <FlatList style={{ marginTop: 80 }} data={receivedMessages} renderItem={({ item }) => renderMessage(item)} />
        </View>
      )}
    </View>
  )
}

export default PeripheralScreen
