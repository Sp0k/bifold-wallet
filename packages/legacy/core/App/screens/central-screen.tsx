import { Button, View } from 'react-native'
import { useNavigation } from '@react-navigation/core'
import { Screens } from '../types/navigators'

const CentralScreen = () => {
  const navigation = useNavigation()

  const onPressScanQrCodeHandler = () => {
    navigation.getParent()?.navigate(Screens.BleScanScreen);
  }

  return (
	  <View>
      <Button onPress={onPressScanQrCodeHandler} title="Scan QR code" />
	  </View>
  );
}

export default CentralScreen
