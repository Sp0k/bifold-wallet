import { TouchableOpacity, Text, View, StyleSheet, FlatList } from 'react-native'
import { useState } from 'react'

const PeripheralScreen = () => {
  const onPress = () => console.log('Advertise')
  const [centralsList, setCentralsList] = useState(['Test1', 'Test2'])

  const renderItem = (c) => <Text style={{ color: '#151818' }}>c</Text>

  return (
    <View style={styles.background}>
      <View style={{ flex: 1, marginTop: 250 }}>
        <TouchableOpacity onPress={onPress} style={styles.btn}>
          <Text style={{ color: '#CCF6C5', fontSize: 40 }}>Advertise</Text>
        </TouchableOpacity>
      </View>
      {centralsList ? (
        <FlatList data={centralsList} renderItem={renderItem} style={{ backgroundColor: '#CCF6C5', flex: 1 }} />
      ) : (
        <></>
      )}
    </View>
  )
}

export default PeripheralScreen

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#151818',
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  btn: {
    borderRadius: 125,
    borderColor: '#CCF6C5',
    width: 250,
    height: 250,
    borderStyle: 'solid',
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
