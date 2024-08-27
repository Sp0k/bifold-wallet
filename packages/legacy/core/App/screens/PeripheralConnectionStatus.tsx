import { StackScreenProps } from "@react-navigation/stack";
import { PeripheralStackParams } from "../types/navigators";
import { useAgent } from "@credo-ts/react-hooks";
import { useEffect } from "react";
import { agentEndpoint } from "../utils/init_agent";
import { usePeripheral } from "@animo-id/react-native-ble-didcomm";

export type PeripheralConnectionStatusProps = StackScreenProps<PeripheralStackParams>;

const PeripheralConnectionStatus: React.FC<PeripheralConnectionStatusProps> = ({ navigation, route }) => {
    const { agent } = useAgent();
    const { peripheral } = usePeripheral();

    useEffect(() => {
        const createInvitation = async (): Promise<string> => {
            const invitation = await agent?.oob.createInvitation();

            return invitation?.outOfBandInvitation.toUrl({ domain: agentEndpoint }) as string;
        }

        const sendInvitation = async (): Promise<void> => {
            const invitationURL = await createInvitation();
            const dataToSend = {
                invitationURL: invitationURL
            };

            console.log("Sending invitation to central: ", dataToSend);
            peripheral.sendMessage(JSON.stringify(dataToSend));
        }

        if (agent) {
            sendInvitation();
        }
    }, [agent]);

    return <></>;
}

export default PeripheralConnectionStatus;