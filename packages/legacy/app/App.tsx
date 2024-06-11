import {
  AgentProvider,
  AnimatedComponentsProvider,
  AuthProvider,
  CommonUtilProvider,
  ConfigurationProvider,
  ErrorModal,
  NetInfo,
  NetworkProvider,
  RootStack,
  StoreProvider,
  ThemeProvider,
  TourProvider,
  animatedComponents,
  credentialOfferTourSteps,
  credentialsTourSteps,
  defaultConfiguration,
  homeTourSteps,
  initLanguages,
  initStoredLanguage,
  proofRequestTourSteps,
  theme,
  toastConfig,
  translationResources,
} from '@hyperledger/aries-bifold-core'
import * as React from 'react'
import { useEffect, useMemo } from 'react'
import { StatusBar } from 'react-native'
import { isTablet } from 'react-native-device-info'
import Orientation from 'react-native-orientation-locker'
import SplashScreen from 'react-native-splash-screen'
import Toast from 'react-native-toast-message'
import { Text } from 'react-native'

initLanguages(translationResources)

const App = () => {
  useMemo(() => {
    initStoredLanguage().then()
  }, [])

  useEffect(() => {
    // Hide the native splash / loading screen so that our
    // RN version can be displayed.
    SplashScreen.hide()
  }, [])

  if (!isTablet()) {
    Orientation.lockToPortrait()
  }

  return (
    <AgentProvider agent={undefined}>
      <ConfigurationProvider value={defaultConfiguration}>
        <CommonUtilProvider>
          <AuthProvider>
            <NetworkProvider>
              <Text>Hello, World!</Text>
              <Toast topOffset={15} config={toastConfig} />
            </NetworkProvider>
          </AuthProvider>
        </CommonUtilProvider>
      </ConfigurationProvider>
    </AgentProvider>
  )
}

export default App
