import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

export interface ConnectionIndicatorProps {
  connectionStatus: boolean
  color: string
}

const ConnectionIndicator = ({ connectionStatus, color }: ConnectionIndicatorProps) => {
  return (
    <View>
      {connectionStatus ? (
        <Icon name="check-circle-outline" style={{ color: `${color}` }} size={200} />
      ) : (
        <ActivityIndicator size={200} color={color} />
      )}
    </View>
  )
}

export default ConnectionIndicator
