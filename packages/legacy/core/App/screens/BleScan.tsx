import { StackScreenProps } from '@react-navigation/stack';
import { BleCommunicationPrototypeParams, Screens, Stacks } from '../types/navigators';
import { useAgent } from '@credo-ts/react-hooks';
import QRScanner from '../components/misc/QRScanner';
import { Platform } from 'react-native';
import ScanBase from './ScanBase';
import { useNavigation } from '@react-navigation/core';

export type BleScanProps = StackScreenProps<BleCommunicationPrototypeParams>;

const BleScan: React.FC<BleScanProps> = ({ navigation, route }) => {
	const agent = useAgent();

	const handleCodeScan = async (value: string) => {
		try {
			const qrCodeData = JSON.parse(value);
			navigation.getParent()?.navigate(Stacks.CentralStack, { screen: Screens.CentralScanScreen, params: { qrCodeData: qrCodeData } });
		} catch (err) {
			console.log(err);
		}
	}

	return (
		<ScanBase>
			<QRScanner handleCodeScan={handleCodeScan} enableCameraOnError={true} />
		</ScanBase>
	)
}

export default BleScan;
