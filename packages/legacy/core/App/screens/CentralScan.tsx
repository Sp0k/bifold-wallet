import { StackScreenProps } from "@react-navigation/stack";
import { useEffect, useState } from "react";
import { CentralStackParams } from "../types/navigators";
import { useAgent } from "@credo-ts/react-hooks";
import { useCentral } from "@animo-id/react-native-ble-didcomm";
import { Agent } from "@credo-ts/core";
import { BleInboundTransport } from "@credo-ts/transport-ble";
import { useStore } from "../contexts/store";
import { WalletSecret } from "../types/security";
import { useAuth } from "../contexts/auth";
import { useTranslation } from "react-i18next";
import * as InitAgent from "../utils/init_agent";

export type CentralScanProps = StackScreenProps<CentralStackParams>;

const CentralScan: React.FC<CentralScanProps> = ({ navigation, route }) => {
    const { central } = useCentral();
    const { agent, setAgent } = useAgent();
    const [store, dispatch] = useStore();
    const { getWalletCredentials } = useAuth()
    const { t } = useTranslation()
    const qrCodeData: any | undefined = route?.params && route.params['qrCodeData'];
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        console.log(qrCodeData);  

        const startCentral = async () => {
            const bluetoothSection: any | undefined = qrCodeData['bluetooth'];

            if (!bluetoothSection) {
                return;
            }

            const serviceUUID: string = bluetoothSection['serviceUUID']
            const messagingUUID: string = bluetoothSection['messagingUUID']
            const indicationUUID: string = bluetoothSection['indicationUUID']

            console.log(`[CENTRAL] Service UUID: ${serviceUUID}`);
            console.log(`[CENTRAL] Messaging UUID: ${messagingUUID}`);
            console.log(`[CENTRAL] Indication UUID: ${indicationUUID}`);

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
                setIsConnected(true);
                console.log(`[CENTRAL] Connected: ${identifier}`);
                /* ... */
            });
            central.registerOnDisconnectedListener(({ identifier }: { identifier: string }) => {
                setIsConnected(false);
                console.log(`[CENTRAL] Disconnected: ${identifier}`);
            })
            central.registerOnDiscoveredListener(({ identifier }: { identifier: string }) => {
                central.connect(identifier).catch(err => console.log(err));
                console.log(`[CENTRAL] Discovered: ${identifier}`);
            })

            console.log("[CENTRAL] Starting");

            central.scan();

            console.log("[CENTRAL] Scanning")
        }

        startCentral();

        return () => {
            if (agent?.isInitialized) {
                agent?.shutdown();
                console.log("Shutting down central");
            }
        }
    }, []);

    useEffect(() => {
        const configureAgent = (credentials: WalletSecret | undefined): Agent | undefined => {
            return InitAgent.configureAgent(store, credentials, [new BleInboundTransport(central)]);
        }

        const initAgent = async () => {
            const credentials = await getWalletCredentials();
            const newAgent = configureAgent(credentials);

            InitAgent.run(credentials, newAgent, setAgent, t);
        }

        if (isConnected) {
            initAgent();
        }
    }, [isConnected]);

    return (
        <></>
    );
}

export default CentralScan;