import { StackScreenProps } from '@react-navigation/stack'
import { PeripheralStackParams } from '../types/navigators'
import { useAgent } from '@credo-ts/react-hooks'
import { useEffect, useState } from 'react'
import { Text, View, TouchableOpacity, ActivityIndicator } from 'react-native'
import { agentEndpoint } from '../utils/init_agent'
import { usePeripheral } from '@animo-id/react-native-ble-didcomm'
import { OutOfBandRecord } from '@credo-ts/core'

import InvitationModal from '../components/modals/InvitationModal'
import { Invitation, useInvitation } from '../contexts/invitation'

export type PeripheralConnectionStatusProps = StackScreenProps<PeripheralStackParams>

const PeripheralConnectionStatus: React.FC<PeripheralConnectionStatusProps> = ({ navigation, route }) => {
  const { agent } = useAgent()
  const { peripheral } = usePeripheral()
  const { invitation, setInvitation } = useInvitation()
  const [modalVisible, setModalVisible] = useState<boolean>(false)

  useEffect(() => {
    const createInvitation = async (): Promise<OutOfBandRecord | undefined> => {
      return agent?.oob.createInvitation({ autoAcceptConnection: true })
    }

    const createInvitationURL = async (invitation: OutOfBandRecord): Promise<string> => {
      return invitation.outOfBandInvitation.toUrl({ domain: agentEndpoint }) as string
    }

    const sendInvitation = async (invitation: OutOfBandRecord): Promise<void> => {
      const invitationURL = await createInvitationURL(invitation)
      const dataToSend = {
        invitationURL: invitationURL,
      }

      console.log('Sending invitation to central: ', dataToSend)
      peripheral.sendMessage(JSON.stringify(dataToSend))
    }

    if (agent) {
      createInvitation()
        .then((invitation) => {
          if (invitation) {
            sendInvitation(invitation)
          }
        })
        .catch((err) => console.log(err))
    }
  }, [agent])

  useEffect(() => {
    if (invitation) setModalVisible(true)
  }, [invitation])

  return (
    <View style={{ alignItems: 'center' }}>
      {invitation ? (
        <TouchableOpacity
          style={{
            width: 250,
            height: 250,
            borderWidth: 10,
            borderRadius: 125,
            borderColor: '#CCF6C5',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 100,
          }}
          onPress={() => {
            setModalVisible(!modalVisible)
          }}
        >
          <Text style={{ color: '#CCF6C5', fontSize: 25 }}>Show Invitation</Text>
        </TouchableOpacity>
      ) : (
        <ActivityIndicator size={200} color="#CCF6C5" />
      )}
      <InvitationModal visibility={modalVisible} onPress={() => setModalVisible(!modalVisible)} />
    </View>
  )
}

export default PeripheralConnectionStatus
