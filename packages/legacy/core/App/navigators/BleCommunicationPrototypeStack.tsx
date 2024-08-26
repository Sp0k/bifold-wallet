/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ParamListBase, RouteConfig, StackNavigationState, useNavigation } from '@react-navigation/core'
import { StackNavigationOptions, StackNavigationProp, createStackNavigator } from '@react-navigation/stack'
import React from 'react'

import { DispatchAction } from '../contexts/reducers/store'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import { BleCommunicationPrototypeParams, Screens, Stacks } from '../types/navigators'

import { createDefaultStackOptions } from './defaultStackOptions'
import ChoiceScreen from '../screens/choice-screen'
import CentralStack from './CentralStack'
import PeripheralStack from './PeripheralStack'

const BleCommunicationPrototypeStack: React.FC = () => {
  const [, dispatch] = useStore()
  const Stack = createStackNavigator<BleCommunicationPrototypeParams>()
  const theme = useTheme()
  const defaultStackOptions = createDefaultStackOptions(theme)
  const navigation = useNavigation<StackNavigationProp<BleCommunicationPrototypeParams>>()
  // const { bleScan } = useConfiguration();

  const onAuthenticated = (status: boolean): void => {
    if (!status) {
      return
    }

    dispatch({
      type: DispatchAction.DID_AUTHENTICATE,
    })
  }

  return (
    <Stack.Navigator screenOptions={{ ...defaultStackOptions }}>
      <Stack.Screen name={Screens.ChoiceScreen} component={ChoiceScreen} options={{ headerShown: false }} />
      <Stack.Screen name={Stacks.CentralStack} component={CentralStack} options={{ headerShown: false }} />
      <Stack.Screen name={Stacks.PeripheralStack} component={PeripheralStack} />
    </Stack.Navigator>
  )
}

export default BleCommunicationPrototypeStack
