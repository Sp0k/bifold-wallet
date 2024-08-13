import { Peripheral, Central } from '@animo-id/react-native-ble-didcomm';

enum StandardMessage {
	INVITATION = "<STD>0",
	ACCEPT_INVITATION = "<STD>1",
}

interface Messenger {
	sendMessage: (message: string) => Promise<void>
}

export const sendInvitation = <M extends Messenger>(messenger: M) => {
	messenger.sendMessage(StandardMessage.INVITATION).catch((err) => console.log(`Error sending invitation: ${err}, pass to next`));
}

const sendAcceptInvitation = <M extends Messenger>(messenger: M) => {
	messenger.sendMessage(StandardMessage.ACCEPT_INVITATION);
}

const isStandardMessage = (message: string): boolean => message[0] === '<' && message[1] === 'S' && message[2] === 'T' && message[3] === 'D' && message[4] === '>'

export const isAcceptInvitation = (message: string): boolean => message === StandardMessage.ACCEPT_INVITATION;

export const handlePeripheralStandardMessage = (peripheral: Peripheral, message: string) => {
	if (isStandardMessage(message)) {
		switch (message) {
			case StandardMessage.INVITATION:
				sendAcceptInvitation(peripheral);

				break;
			default:
				throw new Error(`Not a valid or standard message for Peripheral: ${message}`);
		}
	}
}

export const handleCentralStandardMessage = (central: Central, message: string) => {
	if (isStandardMessage(message)) {
		switch (message) {
			case StandardMessage.ACCEPT_INVITATION:
				break;
			default:
				throw new Error(`Not a valid or standard message for Central: ${message}`);
		}
	}
}
