import { StackScreenProps } from "@react-navigation/stack";
import { useEffect } from "react";
import { CentralStackParams, Stacks } from "../types/navigators";
import { useAgent } from "@credo-ts/react-hooks";
import { Central, useCentral } from "@animo-id/react-native-ble-didcomm";
import { Agent, ConnectionsModule, KeyDerivationMethod, WalletConfig } from "@credo-ts/core";
import { BleInboundTransport } from "@credo-ts/transport-ble";
import { useStore } from "../contexts/store";
import { WalletSecret } from "../types/security";
import { agentDependencies } from '@credo-ts/react-native'
import { useAuth } from "../contexts/auth";
import { BifoldError } from "../types/error";
import { useTranslation } from "react-i18next";
import { DeviceEventEmitter } from "react-native";
import { EventTypes } from "../constants";
import { didMigrateToAskar, migrateToAskar } from "../utils/migration";
import { DispatchAction } from "../contexts/reducers/store";
import { createLinkSecretIfRequired } from "../utils/agent";
import { CommonActions } from "@react-navigation/core";
import { ariesAskar } from '@hyperledger/aries-askar-react-native'
import { AskarModule } from "@credo-ts/askar";

export type CentralScanProps = StackScreenProps<CentralStackParams>;

const CentralScan: React.FC<CentralScanProps> = ({ navigation, route }) => {
    const { central } = useCentral();
    const { agent, setAgent } = useAgent();
    const [store, dispatch] = useStore();
    const { getWalletCredentials } = useAuth()
    const { t } = useTranslation()
    const qrCodeData: any | undefined = route?.params && route.params['qrCodeData'];

    useEffect(() => {
        console.log(qrCodeData);
        
        const initAgentEmitError = (err: unknown) => {
            const error = new BifoldError(t('Error.Title1045'), t('Error.Message1045'), (err as Error)?.message ?? err, 1045)
            DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
        }

        const startCentral = async () => {
            const bluetoothSection: any | undefined = qrCodeData['bluetooth'];

            if (!bluetoothSection) {
                return;
            }

            const serviceUUID: string = bluetoothSection['serviceUUID']
            const messagingUUID: string = bluetoothSection['messagingUUID']
            const indicationUUID: string = bluetoothSection['indicationUUID']

            console.log(`Service UUID: ${serviceUUID}`);
            console.log(`Messaging UUID: ${messagingUUID}`);
            console.log(`Indication UUID: ${indicationUUID}`);

            await central.start();
            await central.setService({
                serviceUUID: serviceUUID,
                messagingUUID: messagingUUID,
                indicationUUID: indicationUUID 
            })
            central.registerMessageListener(({ message }: { message: string }) => {
                console.log(`[CENTRAL] Received message: ${message}`);
                /* Parse the JSON or fetch the URL. */
            });
            central.registerOnConnectedListener(({ identifier }: { identifier: string }) => {
                console.log(`[CENTRAL] Connected: ${identifier}`);
                /* ... */
            });
            central.registerOnDisconnectedListener(({ identifier }: { identifier: string }) => {
                console.log(`[CENTRAL] Disconnected: ${identifier}`);
            })

            console.log("Starting central");
        }

        const registerInboundTransport = (agent: Agent, central: Central) => {
            const bleInboundTransport = new BleInboundTransport(central);

            agent.registerInboundTransport(bleInboundTransport);
        }

        const walletConfig: WalletConfig = {
            id: 'foo',
            key: 'testkey000000000000000000000',
            keyDerivationMethod: KeyDerivationMethod.Argon2IMod
        }

        const configureAgent = (credentials: WalletSecret): Agent | undefined => {
            try {
                const agent = new Agent({
                    config: {
                        label: store.preferences.walletName || 'Aries Bifold',
                        walletConfig: walletConfig, 
                        autoUpdateStorageOnStartup: true,
                    },
                    dependencies: agentDependencies,
                    modules: {
                        connections: new ConnectionsModule({ autoAcceptConnections: true }),
                        askar: new AskarModule({
                            ariesAskar,
                        }),
                    },
                })

                registerInboundTransport(agent, central);
  
                return agent
            } catch (err) {
                console.log(err);
                initAgentEmitError(err)
            }
        }

        const initAgent = async () => {
            try {
                const credentials = await getWalletCredentials();
                
                // if (!credentials?.id || !credentials.key) {
                //     // Cannot find wallet id/secret
                //     return
                // }
                
                if (!credentials) {
                    return;
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
                
                await newAgent.initialize()
                // await createLinkSecretIfRequired(newAgent)

                console.log("Initialized agent");
                
                setAgent(newAgent) 
            } catch (err) {
                const error = new BifoldError(
                    t('Error.Title1045'),
                    t('Error.Message1045'),
                    (err as Error)?.message ?? err,
                    1045,
                )
                DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
                console.log(err);
            }
        }

        startCentral();
        initAgent();

        return () => {
            agent?.shutdown();
            console.log("Shutting down central");
        }
    }, []);

    return (
        <></>
    );
}

export default CentralScan;