import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import BouncyCheckbox from 'react-native-bouncy-checkbox'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { useConfiguration } from '../contexts/configuration'
import { useTheme } from '../contexts/theme'
import { VerificationID, storeVerification, currentVerification } from '../verification'
import { testIdWithKey } from '../utils/testable'
import { useStore } from '../contexts/store'
import { unregisterAllOutboundTransports, registerOutboundTransport } from './Splash'
import { Agent } from '@credo-ts/core'
import { DispatchAction } from '../contexts/reducers/store'

interface Verification {
  id: VerificationID
  value: string
}

const Verification = () => {
  const { t } = useTranslation()
  const { ColorPallet, TextTheme, SettingsTheme } = useTheme()
  const { supportedVerifications } = useConfiguration()
  const [store, dispatch] = useStore()
  const [_, setStoreVerification] = useState(store.preferences.verification)

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
   * Toggle the agent based on the selected verification method.
   * @param {Verification} v
   */
  const handleVerificationChange = async (v: Verification) => {
    setStoreVerification(v.id)
    dispatch({ type: DispatchAction.VERIFICATION, payload: [v.id] })
  }

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
                isChecked={id === store.preferences.verification}
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
