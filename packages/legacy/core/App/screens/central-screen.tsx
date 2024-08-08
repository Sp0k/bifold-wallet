import { Button, FlatList, Text, View, SafeAreaView, StyleSheet, TouchableOpacity, DeviceEventEmitter } from 'react-native'
import { useEffect, useState } from 'react'
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
  useCentralShutdownOnUnmount,
} from '@animo-id/react-native-ble-didcomm'
import { RequestMessage, parseRequestMessage, sendRequestMessage } from '../request_message'
import { parsePeripheralMessage, PeripheralRequest, PeripheralRequestStatus } from './peripheral-screen'
import { uuid } from '@credo-ts/core/build/utils/uuid'
import { BleInboundTransport } from '@credo-ts/transport-ble'
import { Agent } from '@credo-ts/core'
import { useAgent } from '@credo-ts/react-hooks'
import { useTranslation } from 'react-i18next'
import { useStore } from '../contexts/store'
import { useNavigation } from '@react-navigation/core'
import { useAuth } from '../contexts/auth'
import { TOKENS, useContainer } from '../container-api'
import Onboarding from './Onboarding'
import { BifoldError } from '../types/error'
import { EventTypes } from '../constants'
import { WalletSecret } from '../types/security'
import { agentDependencies } from '@credo-ts/react-native'
import { createLinkSecretIfRequired, getAgentModules } from '../utils/agent'
import { Config } from 'react-native-config'
import { didMigrateToAskar, migrateToAskar } from '../utils/migration'
import { DispatchAction } from '../contexts/reducers/store'
import { Stacks } from '../types/navigators'
import { CommonActions } from '@react-navigation/core'

export enum CentralRequestStatus {
  CONNECTION = 'connection',
}

export interface CentralRequest extends RequestMessage<CentralRequestStatus> {}

export const parseCentralMessage = (message: string): CentralRequest => {
  return parseRequestMessage<CentralRequestStatus, CentralRequest>(message)
}

export const registerInboundTransport = async (agent: Agent, central: Central) => {
  const bleInboundTransport = new BleInboundTransport(central)

  agent.registerInboundTransport(bleInboundTransport)
}

export const Connected = () => {
  return (
    <View style={[styles.connection, { backgroundColor: '#CCF6C5' }]}>
      <Text style={styles.text}>OK</Text>
    </View>
  )
}

export const Loading = () => {
	return (
		<View style={[styles.connection, { backgroundColor: '#A6A39C' }]}>
			<Text style={styles.text}>LOADING</Text>
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
  LOADING = 'Loading',
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
  switch (status) {
	  case ScanResultStatus.ACCEPTED:
		  return <TouchableOpacity><Connected /></TouchableOpacity>
	  case ScanResultStatus.REJECTED:
		  return <TouchableOpacity><Failed /></TouchableOpacity>
	  case ScanResultStatus.LOADING:
		  return <TouchableOpacity><Loading /></TouchableOpacity>
  }
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
  const [isStarted, setIsStarted] = useState<boolean>(false)
  const [scanList, setScanList] = useState<ScanResult[]>([])
  const { setAgent, agent } = useAgent()
  const { t } = useTranslation()
  const [store, dispatch] = useStore()
  const navigation = useNavigation()
  const { getWalletCredentials } = useAuth()
  const container = useContainer()
  const [mounted, setMounted] = useState(false)
  const [readyToConnect, setReadyToConnect] = useState<string | undefined>(undefined);

  const sendRequest = async (request: CentralRequest) =>
    await sendRequestMessage<Central, CentralRequestStatus, CentralRequest>(central, request)

  const disconnect = () => {
    if (peripheralId) {
      console.log('Peripheral disconnected: ', peripheralId)

      setIsConnected(false)
      setPeripheralId(undefined)
    } else {
      throw new Error('Peripheral ID is not defined')
    }
  }

  const sendRequestConnectionRequest = async (peripheralId: string) => {
    const request: CentralRequest = {
      status: CentralRequestStatus.CONNECTION,
      peripheral_identifier: peripheralId,
    }

    await sendRequest(request)
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

        registerInboundTransport(agent, central)

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

        // If we haven't migrated to Aries Askar yet, we need to do this before we initialize the agent.
        if (!didMigrateToAskar(store.migration)) {
          newAgent.config.logger.debug('Agent not updated to Aries Askar, updating...')

          await migrateToAskar(credentials.id, credentials.key, newAgent)

          newAgent.config.logger.debug('Successfully finished updating agent to Aries Askar')
          // Store that we migrated to askar.
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

	const startCentral = async () => {
		await central.start()
		central.registerOnDiscoveredListener(async ({ identifier } : { identifier: string }) => {
			console.log(`Discovered: ${identifier}`);

			if (scanList.filter((scan) => scan.peripheral_id === identifier).length === 0) {
				setScanList([...scanList, { peripheral_id: identifier, status: ScanResultStatus.LOADING } as ScanResult]);
				setReadyToConnect(identifier);
			}
	  	})
		central.registerOnConnectedListener(async ({ identifier } : { identifier: string}) => {
			console.log(`Connect to ${identifier}`);
			central.sendMessage("Hello, World")
				.then(() => console.log("Success to send a message"))
				.catch(() => console.log("error, message sending"));
		});
        await central.setService({
          serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
          messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
          indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
        })
	}

    initAgent()
	startCentral()

	return () => {
		if (agent) {
			agent.shutdown()
		}
	}
  }, [])

    const startScan = async () => {	
		await central.scan()
		console.log('Central Scanning...')
    }

  const connect = async () => {
    if (peripheralId) {
      throw new Error('An other peripheral is already connected')
    } else {
		if (readyToConnect) {
		  setPeripheralId(readyToConnect)
		  await central.connect(readyToConnect)
		  setIsConnected(true)
		  setReadyToConnect(undefined);
		} else {
			throw new Error('Was not ready to connect');
		}
    }
  }

  return (
    <SafeAreaView style={styles.background}>
	  <Button onPress={startScan} title="Scan" color="#CCF6C5" />
	  {readyToConnect ? (
		  <Button onPress={connect} title="Connect" color="#CCFCC5" />
	  ) : (
		<Text>Not Ready to connect</Text>
	  )}
	  {peripheralId ? (
			<Text>Connected to {peripheralId}</Text>
		) : (
			<Text>Not yet connected</Text>
		)}
      {scanList ? (
        <FlatList data={scanList} keyExtractor={() => uuid()} renderItem={({ item }) => renderItem(item)} />
      ) : (
        <Text>No peripherals found</Text>
      )}
    </SafeAreaView>
  )
}

export default CentralScreen
