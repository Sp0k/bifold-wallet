import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import BouncyCheckbox from 'react-native-bouncy-checkbox'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useContainer } from '../container-api'
import { useNavigation } from '@react-navigation/core'

import { useConfiguration } from '../contexts/configuration'
import { useTheme } from '../contexts/theme'
import { VerificationID, storeVerification, currentVerification } from '../verification'
import { testIdWithKey } from '../utils/testable'
import { useStore } from '../contexts/store'
import { initAgent } from '../screens/Splash'

interface Verification {
  id: VerificationID
  value: string
}

const Verification = () => {
  useEffect(() => {
    console.log(store.preferences.verification)

    return () => {
      console.log(store.preferences.verification)
    }
  }, [])

  const { t } = useTranslation()
  const { ColorPallet, TextTheme, SettingsTheme } = useTheme()
  const { supportedVerifications } = useConfiguration()
  const [store, dispatch] = useStore()
  const container = useContainer();
  const navigation = useNavigation();
  const [verification, setVerification] = useState(store.preferences.verification)

  const verifications: Verification[] = supportedVerifications.map((v) => ({
    id: v,
    value: t(`Verification.${v}`),
  }))

  const styles = StyleSheet.create({
    container: {
      backgroundColor: ColorPallet.brand.primaryBackground,
      width: '100%',
    },
    section: {
      backgroundColor: SettingsTheme.groupBackground,
      paddingHorizontal: 25,
      paddingVertical: 16,
    },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemSeparator: {
      borderBottomWidth: 1,
      borderBottomColor: ColorPallet.brand.primaryBackground,
      marginHorizontal: 25,
    },
  })

  /**
   * Once user select the particular verification from the list,
   * store user preference into the AsyncStorage
   *
   * @param {BlockSelection} verification
   */
  const handleVerificationChange = async (verif: Verification) => {
    console.log('1. ' + verification)
    setVerification(verif.id)
    store.preferences.verification = verification
    console.log('2. ' + store.preferences.verification)
    console.log('3. ' + verification)
    await initAgent([store, dispatch], container, navigation, t)
    console.log('init agent')
  }

  // const updateStoredVerification = async () => {
  //   await storeVerification(verification)
  //   store.preferences.verification = verification
  // }

  return (
    <SafeAreaView style={[styles.container]}>
      <FlatList
        data={verifications}
        renderItem={({ item: verification }) => {
          const { id, value }: Verification = verification
          return (
            <View style={[styles.section, styles.sectionRow]}>
              <Text style={[TextTheme.title]}>{value}</Text>
              <BouncyCheckbox
                accessibilityLabel={value}
                disableText
                fillColor={ColorPallet.brand.secondaryBackground}
                unfillColor={ColorPallet.brand.secondaryBackground}
                size={36}
                innerIconStyle={{ borderColor: ColorPallet.brand.primary, borderWidth: 2 }}
                ImageComponent={() => <Icon name="circle" size={18} color={ColorPallet.brand.primary}></Icon>}
                onPress={() => handleVerificationChange(verification)}
                isChecked={id === currentVerification}
                disableBuiltInState
                testID={testIdWithKey(id)}
              />
            </View>
          )
        }}
        ItemSeparatorComponent={() => (
          <View style={{ backgroundColor: SettingsTheme.groupBackground }}>
            <View style={[styles.itemSeparator]}></View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

export default Verification
