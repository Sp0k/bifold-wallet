import { View, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { BleCommunicationPrototypeParams, Screens, Stacks } from '../types/navigators'

interface NavButtonProps {
  title: string
  onPress: () => void
  color: string
}

export const NavButton = ({ title, onPress, color }: NavButtonProps) => {
  return (
    <TouchableOpacity style={[styles.button, { borderColor: `${color}` }]} onPress={onPress}>
      <Text style={[styles.btnText, { color: `${color}` }]}>{title}</Text>
    </TouchableOpacity>
  )
}

const ChoiceScreen = () => {
  const navigation = useNavigation<StackNavigationProp<BleCommunicationPrototypeParams>>()
  const onPressCentralHandler = () => navigation.navigate(Stacks.CentralStack, { screen: Screens.CentralScreen })
  const onPressPeripheralHandler = () =>
    navigation.navigate(Stacks.PeripheralStack, { screen: Screens.PeripheralScreen })

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
    borderWidth: 5,
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 40,
    textAlign: 'center',
  },
})
