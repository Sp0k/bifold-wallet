import { StackScreenProps } from '@react-navigation/stack'
import { useEffect, useState } from 'react'
import { CentralStackParams } from '../types/navigators'
import { useAgent } from '@credo-ts/react-hooks'
import { useCentral } from '@animo-id/react-native-ble-didcomm'
import { Agent, ConnectionRecord, OutOfBandRecord } from '@credo-ts/core'
import { BleInboundTransport } from '@credo-ts/transport-ble'
import { useStore } from '../contexts/store'
import { WalletSecret } from '../types/security'
import { useAuth } from '../contexts/auth'
import { useTranslation } from 'react-i18next'
import * as InitAgent from '../utils/init_agent'
import { View, Text, ActivityIndicator } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { Button } from 'react-native'
import ConnectionIndicator from '../components/misc/ConnectionIndicator'
import { Invitation, InvitationContext, useInvitation } from '../contexts/invitation'

export type CentralScanProps = StackScreenProps<CentralStackParams>

const CentralScan: React.FC<CentralScanProps> = ({ navigation, route }) => {
  const { central } = useCentral()
  const { agent, setAgent } = useAgent()
  const [store, dispatch] = useStore()
  const { getWalletCredentials } = useAuth()
  const { t } = useTranslation()
  const qrCodeData: any | undefined = route?.params && route.params['qrCodeData']
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const  [invitationURL, setInvitationURL] = useState<string | undefined>(undefined)

  useEffect(() => {
    console.log(qrCodeData)

    const startCentral = async () => {
      const bluetoothSection: any | undefined = qrCodeData['bluetooth']

      if (!bluetoothSection) {
        return
      }

      const serviceUUID: string = bluetoothSection['serviceUUID']
      const messagingUUID: string = bluetoothSection['messagingUUID']
      const indicationUUID: string = bluetoothSection['indicationUUID']

      console.log(`[CENTRAL] Service UUID: ${serviceUUID}`)
      console.log(`[CENTRAL] Messaging UUID: ${messagingUUID}`)
      console.log(`[CENTRAL] Indication UUID: ${indicationUUID}`)

      await central.start()
      await central.setService({
        serviceUUID: serviceUUID,
        messagingUUID: messagingUUID,
        indicationUUID: indicationUUID,
      })
      central.registerMessageListener(({ message }: { message: string }) => {
        console.log(`[CENTRAL] Received message: ${message}`)

        const jsonData = JSON.parse(message);

        if (jsonData['invitationURL']) {
          setInvitationURL(jsonData['invitationURL'])
        }

        /* Parse the JSON or fetch the URL. */
      })
      central.registerOnConnectedListener(({ identifier }: { identifier: string }) => {
        setIsConnected(true)
        console.log(`[CENTRAL] Connected: ${identifier}`)
        /* ... */
      })
      central.registerOnDisconnectedListener(({ identifier }: { identifier: string }) => {
        setIsConnected(false)
        console.log(`[CENTRAL] Disconnected: ${identifier}`)
      })
      central.registerOnDiscoveredListener(({ identifier }: { identifier: string }) => {
        central.connect(identifier).catch((err) => console.log(err))
        console.log(`[CENTRAL] Discovered: ${identifier}`)
      })

      console.log('[CENTRAL] Starting')

      central.scan()

      console.log('[CENTRAL] Scanning')
    }

    startCentral()

    return () => {
      if (agent?.isInitialized) {
        agent?.shutdown()
        console.log('Shutting down central')
      }
    }
  }, [])

  useEffect(() => {
    const configureAgent = (credentials: WalletSecret | undefined): Agent | undefined => {
      return InitAgent.configureAgent(store, credentials, [new BleInboundTransport(central)])
    }

    const initAgent = async () => {
      const credentials = await getWalletCredentials()
      const newAgent = configureAgent(credentials)

      InitAgent.run(credentials, newAgent, setAgent, t)
    }

    if (isConnected) {
      initAgent()
    }
  }, [isConnected])

  useEffect(() => {
    const receiveInvitationFromUrl = async (invitationURL: string) => {
      const { outOfBandRecord, connectionRecord } = await agent?.oob.receiveInvitationFromUrl(invitationURL, { autoAcceptConnection: true }) as { outOfBandRecord: OutOfBandRecord, connectionRecord: ConnectionRecord  }

      console.log(`Out of band Record: ${outOfBandRecord.id}`);
      console.log(`Connection Record ID: ${connectionRecord.id}`);

      const invitationSuccess = {
        invitationSuccess: {
          outOfBandRecord: outOfBandRecord,
          connectionRecord: connectionRecord
        }
      }

      // For DEMO purpose, we send a message, via Central.
      central.sendMessage(JSON.stringify(invitationSuccess))
    }

    if (invitationURL && agent) {
      receiveInvitationFromUrl(invitationURL);
    }
  }, [invitationURL]);

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 200 }}>
      <ConnectionIndicator connectionStatus={isConnected} color="#F0ACAC" />
    </View>
  )
}

export default CentralScan

