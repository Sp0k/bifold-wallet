import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { BleCommunicationPrototypeParams, Screens } from '../types/navigators'

interface NavButtonProps {
  title: string
  onPress: () => void
  color: string
}

export const NavButton = ({ title, onPress, color }: NavButtonProps) => {
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: `${color}` }]} onPress={onPress}>
      <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
  )
}

const ChoiceScreen = () => {
  const navigation = useNavigation<StackNavigationProp<BleCommunicationPrototypeParams>>()
  const onPressCentralHandler = () => navigation.navigate(Screens.CentralScreen)
  const onPressPeripheralHandler = () => navigation.navigate(Screens.PeripheralScreen)

  // const onPressCentralHandler = () => console.log('Central')
  // const onPressPeripheralHandler = () => console.log('Peripheral')

  return (
    <View style={styles.background}>
      <NavButton title="Central" onPress={onPressCentralHandler} color="#F0ACAC" />
      <NavButton title="Peripheral" onPress={onPressPeripheralHandler} color="#CCF6C5" />
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
    height: 119,
    width: 338,
    textAlign: 'center',
    borderRadius: 15,
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 40,
    color: '#151818',
    textAlign: 'center',
  },
})
