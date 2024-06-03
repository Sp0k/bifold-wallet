import AsyncStorage from '@react-native-async-storage/async-storage'
import * as RNLocalize from 'react-native-localize'

enum VerificationID {
  QRCode = 'QRCode',
  Bluetooth = 'Bluetooth',
}

export type VerificationResources = {
  [key: string]: any
}

export const verificationResources: VerificationResources = {
  Bluetooth: {
    verification: VerificationID.Bluetooth,
  },
  QRCode: {
    verification: VerificationID.QRCode,
  },
}

let currentVerification = VerificationID.QRCode

//** Store language into the AsyncStorage  */
const storeVerification = async (id: string) => {
  await AsyncStorage.setItem('verification', id)
  currentVerification = id as VerificationID
}

//** Fetch user preference language from the AsyncStorage and set if require  */
const initStoredVerification = async () => {
  console.log('Hello')
  const verificationId = await AsyncStorage.getItem('verification')
  if (verificationId && verificationId !== currentVerification) {
    currentVerification = verificationId as VerificationID
  }
}

export { VerificationID, initStoredVerification, storeVerification, currentVerification }
