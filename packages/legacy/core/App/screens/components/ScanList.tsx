import React from 'react'
import { Button, View, Text, FlatList } from 'react-native'
import { useCentral } from '@animo-id/react-native-ble-didcomm'

let scanCount = 0;

export enum ScanStatus {
	ACCEPTED,
	REJECTED
}

export interface Scan {
	identifier: string,
	status: ScanStatus,
	count: number
}

export const newScan = (identifier: string,  status: ScanStatus): Scan => {
	return { identifier: identifier, status: status, count: scanCount++ }
}

interface Props {
	list: Scan[],
}

const ScanList: React.FC<Props> = ({ list }) => {
	const { central } = useCentral();

	const connect = (identifier: string) => {
		central.connect(identifier);
	}

	const renderItem = ({ identifier, status }: Scan) => {
		return (
			<View>
				<Text>{identifier}</Text>
				{status === ScanStatus.ACCEPTED && <Text>Accepted</Text>}
				{status === ScanStatus.REJECTED && <Text>Rejected</Text>}
				<Button onPress={() => connect(identifier)} title={"Connect"} disabled={status !== ScanStatus.ACCEPTED} />
			</View>
		);
	}

	return (
		<FlatList data={list} keyExtractor={item => item.count.toString()} renderItem={({ item }) => renderItem(item)}/>
	);
}

export default ScanList;
