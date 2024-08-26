import { useNavigation } from '@react-navigation/core'
import { Text, TouchableOpacity, View } from 'react-native'
import { Screens } from '../types/navigators'

const CentralScreen = () => {
  const navigation = useNavigation()

  const onPressScanQrCodeHandler = () => {
    navigation.getParent()?.navigate(Screens.BleScanScreen)
  }

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity
        style={{
          width: 250,
          height: 250,
          borderWidth: 10,
          borderRadius: 125,
          borderColor: '#F0ACAC',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 100,
        }}
        onPress={onPressScanQrCodeHandler}
      >
        <Text style={{ color: '#F0ACAC', fontSize: 25 }}>Scan QR Code</Text>
      </TouchableOpacity>
    </View>
  )
}

export default CentralScreen
