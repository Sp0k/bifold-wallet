import { StackScreenProps } from "@react-navigation/stack";
import { PeripheralStackParams } from "../types/navigators";
import { useAgent } from "@credo-ts/react-hooks";
import { useEffect } from "react";
import { agentEndpoint } from "../utils/init_agent";
import { usePeripheral } from "@animo-id/react-native-ble-didcomm";
import { ConnectionEventTypes, ConnectionStateChangedEvent, DidExchangeState, OutOfBandRecord } from "@credo-ts/core";

export type PeripheralConnectionStatusProps = StackScreenProps<PeripheralStackParams>;

const PeripheralConnectionStatus: React.FC<PeripheralConnectionStatusProps> = ({ navigation, route }) => {
    const { agent } = useAgent();
    const { peripheral } = usePeripheral();

    useEffect(() => {
        const createInvitation = async (): Promise<OutOfBandRecord | undefined> => {
            return agent?.oob.createInvitation();
        }

        const createInvitationURL = async (invitation: OutOfBandRecord): Promise<string> => {
            return invitation?.outOfBandInvitation.toUrl({ domain: agentEndpoint }) as string;
        }

		const setupConnectionListener = (invitation: OutOfBandRecord) => {
			agent?.events.on<ConnectionStateChangedEvent>(ConnectionEventTypes.ConnectionStateChanged, ({ payload }) => {
                if (payload.connectionRecord.outOfBandId !== invitation.id) return
                if (payload.connectionRecord.state === DidExchangeState.Completed) {
                    // the connection is now ready for usage in other protocols!
                    console.log(`Connection for out-of-band id ${invitation.id} completed`)     
                }
            })
        }

        const sendInvitation = async (invitation: OutOfBandRecord): Promise<void> => {
            const invitationURL = await createInvitationURL(invitation);
            const dataToSend = {
                invitationURL: invitationURL
            };

            console.log("Sending invitation to central: ", dataToSend);
            peripheral.sendMessage(JSON.stringify(dataToSend));
        }

        if (agent) {
            createInvitation().then(invitation => {
                if (invitation) {
                    setupConnectionListener(invitation);
                    sendInvitation(invitation);
                }
            }).catch(err => console.log(err));
        }
    }, [agent]);

    return <></>;
}

export default PeripheralConnectionStatus;
