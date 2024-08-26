import { useNavigation } from '@react-navigation/core'
import { Screens } from '../types/navigators'

const CentralScreen = () => {
  const navigation = useNavigation()

  const onPressScanQrCodeHandler = () => {
    navigation.getParent()?.navigate(Screens.BleScanScreen);
  }

  return (
	  <View>
		  	<Button onPress={onScan} title="Scan with Bluetooth" />
		    <Text>Scan list:</Text>
		    <ScanList list={scanList} />
			<Text>Connections List:</Text>
			<ConnectionList list={connectionList} />
      <Button onPress={onPressScanQrCodeHandler} title="Scan QR code" />
	  </View>
  );
}

export default CentralScreen
