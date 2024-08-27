import { createStackNavigator } from '@react-navigation/stack'
import PeripheralScreen from '../screens/peripheral-screen'
import { PeripheralStackParams, Screens } from '../types/navigators'
import PeripheralConnectionStatus from '../screens/PeripheralConnectionStatus'

const PeripheralStack: React.FC = () => {
  const Stack = createStackNavigator<PeripheralStackParams>()
  const options = {
    headerShown: false,
  }

  return (
    <Stack.Navigator>
      <Stack.Screen name={Screens.PeripheralScreen} component={PeripheralScreen} options={options} />
      <Stack.Screen name={Screens.PeripheralConnectionStatus} component={PeripheralConnectionStatus} options={options} />
    </Stack.Navigator>
  )
}

export default PeripheralStack
