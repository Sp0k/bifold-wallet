import { View, Button, StyleSheet } from 'react-native'

const ChoiceScreen = ({ navigation }) => {
  const onPressCentral = () => console.log('Central')
  const onPressPeripheral = () => console.log('Peripheral')

  return (
    <View style={styles.background}>
      <Button title="Central" color="#F0ACAC" onPress={onPressCentral} />
      <Button title="Peripheral" color="#CCF6C5" onPress={onPressPeripheral} />
    </View>
  )
}

export default ChoiceScreen

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#151818',
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 36,
    paddingHorizontal: 96,
    textAlign: 'center',
    borderRadius: 15,
    fontSize: 40,
    flex: 1,
  },
})
