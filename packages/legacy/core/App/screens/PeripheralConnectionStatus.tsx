import { StackScreenProps } from '@react-navigation/stack'
import { PeripheralStackParams } from '../types/navigators'
import { useAgent } from '@credo-ts/react-hooks'
import { useEffect, useState } from 'react'
import { Text, View, TouchableOpacity } from 'react-native'
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

  // useEffect(() => {
  //   let newInvite = JSON.parse(
  //     JSON.stringify({
  //       connectionRecord: {
  //         _tags: {},
  //         autoAcceptConnection: true,
  //         connectionTypes: [],
  //         createdAt: '2024-08-28T17:18:19.673Z',
  //         did: 'did:peer:1zQmdTcqsTCimfMjbvrszhXnb75wtd7Ew5gW7hgwzFfqVJij',
  //         id: 'b138be3a-d065-487a-969d-d735a601e034',
  //         invitationDid:
  //           'did:peer:2.Vz6MkoSRto5bgbZVEeahGcF3PPr9migqgZVDeXhiE7aATNiR9.Ez6LSgXkjMPDWUhZCERMkJzY9NBG9fsVVjJ2FWyr5G1E6h2yh.SeyJzIjoiZGlkY29tbTp0cmFuc3BvcnQvcXVldWUiLCJ0IjoiZGlkLWNvbW11bmljYXRpb24iLCJwcmlvcml0eSI6MCwicmVjaXBpZW50S2V5cyI6WyIja2V5LTEiXSwiciI6W119',
  //         metadata: {},
  //         outOfBandId: '7398ffc7-c73f-47de-8ab9-8750e42c3ac2',
  //         previousDids: [],
  //         previousTheirDids: [],
  //         protocol: 'https://didcomm.org/didexchange/1.x',
  //         role: 'requester',
  //         state: 'request-sent',
  //         theirLabel: 'My Wallet - 8554',
  //         threadId: '20ee7814-c1ff-4d82-a4f9-bc8c6efce12c',
  //         updatedAt: '2024-08-28T17:18:19.685Z',
  //       },
  //       outOfBandRecord: {
  //         _tags: {
  //           invitationId: 'c9cb6016-3894-4584-a0f4-8dcb5c8e2b7b',
  //           recipientKeyFingerprints: [Array],
  //           role: 'receiver',
  //           state: 'initial',
  //           threadId: 'c9cb6016-3894-4584-a0f4-8dcb5c8e2b7b',
  //         },
  //         autoAcceptConnection: true,
  //         createdAt: '2024-08-28T17:18:19.347Z',
  //         id: '7398ffc7-c73f-47de-8ab9-8750e42c3ac2',
  //         metadata: {},
  //         outOfBandInvitation: {
  //           '@id': 'c9cb6016-3894-4584-a0f4-8dcb5c8e2b7b',
  //           '@type': 'https://didcomm.org/out-of-band/1.1/invitation',
  //           accept: [Array],
  //           handshake_protocols: [Array],
  //           label: 'My Wallet - 8554',
  //           services: [Array],
  //         },
  //         reusable: false,
  //         role: 'receiver',
  //         state: 'prepare-response',
  //         updatedAt: '2024-08-28T17:18:19.514Z',
  //       },
  //     })
  //   )
  //   setInvitation({ payload: newInvite } as Invitation)
  // }, [])

  return (
    <View style={{ alignItems: 'center' }}>
      {invitation && <TouchableOpacity
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
      </TouchableOpacity>}
      <InvitationModal visibility={modalVisible} onPress={() => setModalVisible(!modalVisible)} />
    </View>
  )
}

export default PeripheralConnectionStatus
