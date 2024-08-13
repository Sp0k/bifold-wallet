import React from 'react'
import { Text, FlatList } from 'react-native'

let connectionCount = 0;

export interface Connection {
	identifier: string,
	count: number
}

export const newConnection = (identifier: string): Connection => {
	return { identifier: identifier, count: connectionCount++ };
}

interface Props {
	list: Connection[]
}

const ConnectionList: React.FC<Props> = ({ list }) => {
	const renderItem = ({ identifier }: Connection) => {
		return (
			<Text>{identifier}</Text>
		);
	}

	return (
		<FlatList data={list} keyExtractor={item => item.count.toString()} renderItem={({ item }) => renderItem(item)}/>
	);
}

export default ConnectionList;
