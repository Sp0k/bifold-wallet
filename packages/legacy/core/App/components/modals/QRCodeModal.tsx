import React from 'react'
import { Modal, TouchableWithoutFeedback, View } from 'react-native'
import QRRenderer from '../misc/QRRenderer'

import ConnectionIndicator from '../misc/ConnectionIndicator'

export interface QRCodeModalProps {
  qrCodeData: string
  visibility: boolean
  isConnected: boolean
  onPress: () => void
}

const QRCodeModal = ({ qrCodeData, visibility, isConnected, onPress }: QRCodeModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visibility}
      onRequestClose={onPress}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <TouchableWithoutFeedback onPress={onPress} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: '#151818',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              borderColor: 'black',
              borderWidth: 10,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 25,
              paddingVertical: 25,
              height: 350,
              marginBottom: 50,
            }}
          >
            <QRRenderer value={qrCodeData} size={300} />
          </View>
          <ConnectionIndicator connectionStatus={isConnected} color="#CCF6C5" />
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default QRCodeModal
