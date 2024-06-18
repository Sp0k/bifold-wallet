/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ParamListBase, RouteConfig, StackNavigationState, useNavigation } from '@react-navigation/core'
import { StackNavigationOptions, StackNavigationProp, createStackNavigator } from '@react-navigation/stack'
import { StackNavigationEventMap } from '@react-navigation/stack/lib/typescript/src/types'
import React from 'react'

import { TOKENS, useContainer } from '../container-api'
import { DispatchAction } from '../contexts/reducers/store'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import { BleCommunicationPrototypeParams, Screens } from '../types/navigators'

import { createDefaultStackOptions } from './defaultStackOptions'
import CentralScreen from '../screens/central-screen'
import ChoiceScreen from '../screens/choice-screen'
import PeripheralScreen from '../screens/peripheral-screen'

type ScreenOptions = RouteConfig<
  ParamListBase,
  Screens,
  StackNavigationState<ParamListBase>,
  StackNavigationOptions,
  StackNavigationEventMap
>

const OnboardingStack: React.FC = () => {
  const [, dispatch] = useStore()
  const Stack = createStackNavigator()
  const theme = useTheme()
  const defaultStackOptions = createDefaultStackOptions(theme)
  const navigation = useNavigation<StackNavigationProp<BleCommunicationPrototypeParams>>()

  const onAuthenticated = (status: boolean): void => {
    if (!status) {
      return
    }

    dispatch({
      type: DispatchAction.DID_AUTHENTICATE,
    })
  }

  const screens: ScreenOptions[] = [
    {
      name: Screens.ChoiceScreen,
      component: ChoiceScreen,
      options: () => ({
        headerShown: false,
      }),
    },
    {
      name: Screens.CentralScreen,
      component: CentralScreen,
    },
    {
      name: Screens.PeripheralScreen,
      component: PeripheralScreen,
    },
  ]

  return (
    <Stack.Navigator initialRouteName={Screens.Splash} screenOptions={{ ...defaultStackOptions }}>
      {screens.map((item) => {
        return <Stack.Screen key={item.name} {...item} />
      })}
    </Stack.Navigator>
  )
}

export default OnboardingStack
