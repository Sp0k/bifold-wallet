// Syntax of central message:
//
// <command_type> <peripheral_identifier>
//
// e.g.
//
// connection XXX:XXX:XXX
import { FlatList, Text, View, SafeAreaView, StyleSheet, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import style from '../../__mocks__/style'

export enum CentralRequestStatus {
  CONNECTION = 'connection',
}

export interface CentralRequest {
  request: CentralRequestStatus
  identifier: string
}

export const parseCentralMessage = (message: string): CentralRequest => {
  const [request, identifier] = message.split(' ')

  if (request.length + identifier.length !== message.length) {
    throw new Error('Invalid message format')
  }

  return {
    request: request as CentralRequestStatus,
    identifier,
  }
}

export const Connected = () => {
  return (
    <View style={[styles.connection, { backgroundColor: '#CCF6C5' }]}>
      <Text style={styles.text}>OK</Text>
    </View>
  )
}

export const Failed = () => {
  return (
    <View style={[styles.connection, { backgroundColor: '#F0ACAC' }]}>
      <Text style={styles.text}>FAILED</Text>
    </View>
  )
}

export const ConnectStatus = ({ item }) => {
  const [connectionStatus, setConnectionStatus] = useState<boolean>(false)

  const onPressHandler = () => {
    connectionStatus ? setConnectionStatus(false) : setConnectionStatus(true)
  }

  return <TouchableOpacity onPress={onPressHandler}>{connectionStatus ? <Connected /> : <Failed />}</TouchableOpacity>
}

const CentralScreen = () => {
  const [scanList, setScanList] = useState([
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
    'XXX:XXX',
  ])

  const renderItem = ({ item }) => (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 41 }}>
      <Text style={{ color: 'white', marginRight: 38, fontSize: 30 }}>{item}</Text>
      <ConnectStatus item={item} />
    </View>
  )

  return (
    <SafeAreaView style={styles.background}>
      {scanList ? (
        <FlatList data={scanList} keyExtractor={(item) => item.id} renderItem={renderItem} />
      ) : (
        <Text>No peripherals found</Text>
      )}
    </SafeAreaView>
  )
}

export default CentralScreen

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#151818',
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  connection: {
    width: 145,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
  },
  text: {
    color: '#151818',
    fontSize: 20,
    textAlign: 'center',
  },
})
