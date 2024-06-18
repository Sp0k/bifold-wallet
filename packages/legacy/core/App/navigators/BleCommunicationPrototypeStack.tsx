/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ParamListBase, RouteConfig, StackNavigationState, useNavigation } from '@react-navigation/core'
import { StackNavigationOptions, StackNavigationProp, createStackNavigator } from '@react-navigation/stack'
import { StackNavigationEventMap } from '@react-navigation/stack/lib/typescript/src/types'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { TOKENS, useContainer } from '../container-api'
import { useConfiguration } from '../contexts/configuration'
import { DispatchAction } from '../contexts/reducers/store'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import AttemptLockout from '../screens/AttemptLockout'
import NameWallet from '../screens/NameWallet'
import { createCarouselStyle } from '../screens/OnboardingPages'
import PINCreate from '../screens/PINCreate'
import PINEnter from '../screens/PINEnter'
import PushNotification from '../screens/PushNotification'
import { AuthenticateStackParams, Screens } from '../types/navigators'

import { createDefaultStackOptions } from './defaultStackOptions'
import CentralScreen from 'screens/central-screen'
import ChoiceScreen from 'screens/choice-screen'
import PeripheralScreen from 'screens/peripheral-screen'

type ScreenOptions = RouteConfig<
  ParamListBase,
  Screens,
  StackNavigationState<ParamListBase>,
  StackNavigationOptions,
  StackNavigationEventMap
>

const OnboardingStack: React.FC = () => {
  const [, dispatch] = useStore()
  const { t } = useTranslation()
  const container = useContainer()
  const Stack = createStackNavigator()
  const theme = useTheme()
  const OnboardingTheme = theme.OnboardingTheme
  const carousel = createCarouselStyle(OnboardingTheme)
  const Onboarding = container.resolve(TOKENS.SCREEN_ONBOARDING)
  const { pages, splash, useBiometry } = useConfiguration()
  const defaultStackOptions = createDefaultStackOptions(theme)
  const navigation = useNavigation<StackNavigationProp<AuthenticateStackParams>>()
  const onTutorialCompleted = container.resolve(TOKENS.FN_ONBOARDING_DONE)(dispatch, navigation)
  const { screen: Terms } = container.resolve(TOKENS.SCREEN_TERMS)
  const Developer = container.resolve(TOKENS.SCREEN_DEVELOPER)
  const ScreenOptionsDictionary = container.resolve(TOKENS.OBJECT_ONBOARDINGCONFIG)
  const Preface = container.resolve(TOKENS.SCREEN_PREFACE)

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
