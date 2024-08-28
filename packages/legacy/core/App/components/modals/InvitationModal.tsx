import { useInvitation } from '../../contexts/invitation'
import React from 'react'
import { Modal, Text, TouchableWithoutFeedback, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

export interface InvitationModalProps {
  visibility: boolean
  onPress: () => void
}

const InvitationModal = ({ visibility, onPress }: InvitationModalProps) => {
  const { invitation } = useInvitation()

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visibility}
      onRequestClose={() => (visibility = false)}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <TouchableWithoutFeedback onPress={onPress} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: -120,
            backgroundColor: '#151818',
          }}
        >
          <Icon name="email-newsletter" size={180} color="#CCF6C5" />
          <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold', marginBottom: 10 }}>
            You received an invitation!
          </Text>
          <Text style={{ color: 'white', fontSize: 16 }}>
            Connect ID: {invitation?.payload['connectionRecord']['id']}
          </Text>
          <Text style={{ color: 'white', fontSize: 16 }}>
            Invitation ID: {invitation?.payload['outOfBandRecord']['id']}
          </Text>
          <Text style={{ color: 'white', fontSize: 16 }}>
            Created at: {invitation?.payload['outOfBandRecord']['createdAt']}
          </Text>
          <Text style={{ color: 'white', fontSize: 16 }}>
            Label: {invitation?.payload['outOfBandRecord']['outOfBandInvitation']['label']}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default InvitationModal
