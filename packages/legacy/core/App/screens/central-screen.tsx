import { Button, DeviceEventEmitter, View, Text } from 'react-native'
import { Central, useCentral, useCentralShutdownOnUnmount, DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID, DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID, DEFAULT_DIDCOMM_SERVICE_UUID, } from '@animo-id/react-native-ble-didcomm'
import { useEffect, useState, useRef, useCallback } from 'react'
import { BifoldError } from '../types/error'
import { EventTypes } from '../constants'
import { useTranslation } from 'react-i18next'
import { Agent, ConsoleLogger } from '@credo-ts/core'
import { useStore } from '../contexts/store'
import { WalletSecret } from '../types/security'
import { agentDependencies } from '@credo-ts/react-native'
import { BleInboundTransport } from '@credo-ts/transport-ble'
import { useAuth } from '../contexts/auth'
import { didMigrateToAskar, migrateToAskar } from '../utils/migration'
import { DispatchAction } from '../contexts/reducers/store'
import { createLinkSecretIfRequired, getAgentModules } from '../utils/agent'
import { useAgent } from '@credo-ts/react-hooks'
import { useNavigation } from '@react-navigation/core'
import { CommonActions } from '@react-navigation/core'
import { Stacks } from '../types/navigators'
import ConnectionList, { Connection, newConnection } from './components/ConnectionList'
import ScanList, { ScanStatus, Scan, newScan } from './components/ScanList'
import { sendInvitation, handleCentralStandardMessage, isAcceptInvitation } from './utils/StandardMessage'
import { Screens } from '../types/navigators'

const CentralScreen = () => {
  const [scanList, setScanList] = useState<Scan[]>([]);
  const { central } = useCentral()
  const { t } = useTranslation()
  const [store, dispatch] = useStore()
  const { getWalletCredentials } = useAuth()
  const { setAgent, agent } = useAgent()
  const navigation = useNavigation()
  const [connectionList, setConnectionList] = useState<Connection[]>([]);
  const currentConnectedId = useRef<string | undefined>(undefined);
  const scheduleInvitation = useRef<boolean>(false);
  // const qrCodeData = useRef<string | undefined>(undefined);

  const registerInboundTransport = async (agent: Agent, central: Central) => {
    const bleInboundTransport = new BleInboundTransport(central)

    agent.registerInboundTransport(bleInboundTransport)
  }

  const handleCodeScan = useCallback(async (value: string): Promise<void> => {
    console.log("Hello, World");
  }, []);

  const onPressScanQrCodeHandler = () => {
    navigation.getParent()?.navigate(Screens.BleScanScreen);
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
            1045,
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
          }),
        )
      } catch (err: unknown) {
        const error = new BifoldError(
          t('Error.Title1045'),
          t('Error.Message1045'),
          (err as Error)?.message ?? err,
          1045,
        )
        DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
      }
    }

    const startCentral = async () => {
      await central.start()
	  await central.setService({
		  serviceUUID: DEFAULT_DIDCOMM_SERVICE_UUID,
		  messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
		  indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID
	  })
	  console.log("[CENTRAL] Services was configured");
      central.registerOnDiscoveredListener(async ({ identifier }: { identifier: string }) => {
        console.log(`Discovered: ${identifier}`)

        if (scanList.filter((scan) => scan.identifier === identifier).length === 0) {
			await central.connect(identifier);
			scheduleInvitation.current = true;
			setScanList([...scanList, newScan(identifier, ScanStatus.REJECTED)]);
        }
      })
	  central.registerMessageListener(({ message }: { message: string }) => {
		  console.log(`Central got message: ${message}`);

		  if (isAcceptInvitation(message)) {
			  console.log("Invitation is accepted");
			  const currentIdentifier = currentConnectedId.current ?? (() => { throw new Error("expected current identifier") })();

			  setScanList([...(scanList.filter(scan => scan.identifier !== currentIdentifier)), newScan(currentIdentifier, ScanStatus.ACCEPTED)]);
		  }

		  handleCentralStandardMessage(central, message);
	  });
      central.registerOnConnectedListener(({ identifier }: { identifier: string }) => {
		  setConnectionList([...connectionList, newConnection(identifier)]);
		  currentConnectedId.current = identifier;

		  if (scheduleInvitation.current) {
			  console.log("Invitation has been scheduled");
			  sendInvitation(central);
			  scheduleInvitation.current = false;
		  }
      })
	  central.registerOnDisconnectedListener(({ identifier }: { identifier: string }) => {
		  setConnectionList(connectionList.filter(item => item.identifier !== identifier));
	  }); 
    }

    initAgent()
    startCentral()

    return () => {
      if (agent) {
        agent.shutdown()
      }
    }
  }, [])

  const onScan = () => {
	  console.log("Central scan");
	  central.scan()
  }

  useCentralShutdownOnUnmount();

  return (
	  <View>
		  	<Button onPress={onScan} title="Scan with Bluetooth" />
		    <Text>Scan list:</Text>
		    <ScanList list={scanList} />
			<Text>Connections List:</Text>
			<ConnectionList list={connectionList} />
      <Button onPress={onPressScanQrCodeHandler} title="Scan QR code" />
	  </View>
  );
}

export default CentralScreen
