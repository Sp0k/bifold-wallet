import { createStackNavigator } from "@react-navigation/stack";
import CentralScreen from "../screens/central-screen";
import { Screens } from "../types/navigators";
import BleScan from "../screens/BleScan";
import CentralScan from "../screens/CentralScan";

const CentralStack: React.FC = () => {
    const Stack = createStackNavigator();
    const options = {
        headerShown: false,
    };

    return (
        <Stack.Navigator>
            <Stack.Screen name={Screens.CentralScreen} component={CentralScreen} options={options} />
            <Stack.Screen name={Screens.BleScanScreen} component={BleScan} options={options} />
            <Stack.Screen name={Screens.CentralScanScreen} component={CentralScan} options={options} />
        </Stack.Navigator>
    );
}

export default CentralStack