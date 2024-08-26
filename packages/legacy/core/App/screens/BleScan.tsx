import { StackScreenProps } from '@react-navigation/stack';
import { BleCommunicationPrototypeParams } from '../types/navigators';
import { useAgent } from '@credo-ts/react-hooks';
import QRScanner from '../components/misc/QRScanner';
import { Platform } from 'react-native';
import ScanBase from './ScanBase';

export type BleScanProps = StackScreenProps<BleCommunicationPrototypeParams>;

const BleScan: React.FC<BleScanProps> = ({ navigation, route }) => {
	const agent = useAgent();

	const handleCodeScan = async (value: string) => {
	}

	return (
		<ScanBase>
			<QRScanner handleCodeScan={handleCodeScan} enableCameraOnError={true} />
		</ScanBase>
	)
}

export default BleScan;
