import AgentProvider from '@credo-ts/react-hooks'
import * as React from 'react'
import { useEffect, useMemo } from 'react'
import { PermissionsAndroid } from 'react-native'
import SplashScreen from 'react-native-splash-screen'

import { animatedComponents } from './animated-components'
import { credentialOfferTourSteps } from './components/tour/CredentialOfferTourSteps'
import { credentialsTourSteps } from './components/tour/CredentialsTourSteps'
import { homeTourSteps } from './components/tour/HomeTourSteps'
import { proofRequestTourSteps } from './components/tour/ProofRequestTourSteps'
import { Container } from './container-api'
import { AnimatedComponentsProvider } from './contexts/animated-components'
import { AuthProvider } from './contexts/auth'
import { ConfigurationProvider } from './contexts/configuration'
import { NetworkProvider } from './contexts/network'
import { ThemeProvider } from './contexts/theme'
import { TourProvider } from './contexts/tour/tour-provider'
import { defaultConfiguration } from './defaultConfiguration'
import { initLanguages, initStoredLanguage, translationResources } from './localization'
import { initStoredVerification } from './verification'
import { theme } from './theme'
import { Central, CentralProvider, PeripheralProvider, Peripheral } from '@animo-id/react-native-ble-didcomm'
import BleCommunicationPrototypeStack from './navigators/BleCommunicationPrototypeStack'
import InvitationProvider from './contexts/invitation'

initLanguages(translationResources)

function App(sytem: Container) {
  return () => {
    useMemo(() => {
      initStoredLanguage().then()
      initStoredVerification().then()
    }, [])

    useEffect(() => {
      // Hide the native splash / loading screen so that our
      // RN version can be displayed.
      SplashScreen.hide()
    }, [])

    useEffect(() => {
      PermissionsAndroid.requestMultiple([
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH_ADVERTISE',
        'android.permission.ACCESS_COARSE_LOCATION',
      ])
    }, [])

    return (
      <PeripheralProvider peripheral={new Peripheral()}>
        <CentralProvider central={new Central()}>
          <AgentProvider agent={undefined}>
            <InvitationProvider>
              <ThemeProvider value={theme}>
                <AnimatedComponentsProvider value={animatedComponents}>
                  <ConfigurationProvider value={defaultConfiguration}>
                    <AuthProvider>
                      <NetworkProvider>
                        <TourProvider
                          homeTourSteps={homeTourSteps}
                          credentialsTourSteps={credentialsTourSteps}
                          credentialOfferTourSteps={credentialOfferTourSteps}
                          proofRequestTourSteps={proofRequestTourSteps}
                          overlayColor={'gray'}
                          overlayOpacity={0.7}
                        >
                          <BleCommunicationPrototypeStack />
                        </TourProvider>
                      </NetworkProvider>
                    </AuthProvider>
                  </ConfigurationProvider>
                </AnimatedComponentsProvider>
              </ThemeProvider>
            </InvitationProvider>
          </AgentProvider>
        </CentralProvider>
      </PeripheralProvider>
    )
  }
}
export default App
