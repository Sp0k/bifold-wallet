import AgentProvider from '@credo-ts/react-hooks'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Text, Button } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import Toast from 'react-native-toast-message'

import { animatedComponents } from './animated-components'
import ErrorModal from './components/modals/ErrorModal'
import NetInfo from './components/network/NetInfo'
import toastConfig from './components/toast/ToastConfig'
import { credentialOfferTourSteps } from './components/tour/CredentialOfferTourSteps'
import { credentialsTourSteps } from './components/tour/CredentialsTourSteps'
import { homeTourSteps } from './components/tour/HomeTourSteps'
import { proofRequestTourSteps } from './components/tour/ProofRequestTourSteps'
import { Container, ContainerProvider } from './container-api'
import { AnimatedComponentsProvider } from './contexts/animated-components'
import { AuthProvider } from './contexts/auth'
import { ConfigurationProvider } from './contexts/configuration'
import { NetworkProvider } from './contexts/network'
import { StoreProvider } from './contexts/store'
import { UnusedAgentProvider } from './contexts/unused_agent'
import { ThemeProvider } from './contexts/theme'
import { TourProvider } from './contexts/tour/tour-provider'
import { defaultConfiguration } from './defaultConfiguration'
import { initLanguages, initStoredLanguage, translationResources } from './localization'
import { initStoredVerification } from './verification'
import RootStack from './navigators/RootStack'
import { theme } from './theme'
import {
  Central,
  DEFAULT_DIDCOMM_SERVICE_UUID,
  DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
  DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
} from '@animo-id/react-native-ble-didcomm'
//import { credentialOfferTourSteps, credentialsTourSteps, proofRequestTourSteps } from './index'
import { BleOutboundTransport, BleInboundTransport } from '@credo-ts/transport-ble'

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

    const [central, setCentral] = useState<Central | undefined>(undefined)

    const startCentral = async () => {
      const c = new Central()

      await c.start()

      const uuid = '56847593-40ea-4a92-bd8c-e1514dca1c61'
      await c.setService({
        serviceUUID: uuid || DEFAULT_DIDCOMM_SERVICE_UUID,
        messagingUUID: DEFAULT_DIDCOMM_MESSAGE_CHARACTERISTIC_UUID,
        indicationUUID: DEFAULT_DIDCOMM_INDICATE_CHARACTERISTIC_UUID,
      })

      setCentral(c)
    }

    const scan = async () => {
      await central?.scan()
      console.log('Done Scanning')
    }

    return (
      <AgentProvider agent={undefined}>
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
                    <Text>Hello, World!</Text>
                    <Button title="Start Central" onPress={startCentral} />
                    <Text>central is {central ? 'started' : 'undefined'}</Text>
                    <Button title="Scan" onPress={scan} />
                  </TourProvider>
                </NetworkProvider>
              </AuthProvider>
            </ConfigurationProvider>
          </AnimatedComponentsProvider>
        </ThemeProvider>
      </AgentProvider>
    )
  }
}
export default App
