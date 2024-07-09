import EmptyList from './components/misc/EmptyList'
import Record from './components/record/Record'
import HomeFooterView from './components/views/HomeFooterView'
import HomeHeaderView from './components/views/HomeHeaderView'
import { PINRules } from './constants'
import { ConfigurationContext } from './contexts/configuration'
import { useNotifications } from './hooks/notifications'
import { Locales, translationResources } from './localization'
import { VerificationID, verificationResources } from './verification'
import Bluetooth from './screens/Bluetooth'
import Developer from './screens/Developer'
import OnboardingPages from './screens/OnboardingPages'
import Preface from './screens/Preface'
import Scan from './screens/Scan'
import Splash from './screens/Splash'
import Terms from './screens/Terms'
import UseBiometry from './screens/UseBiometry'
import Verification from './screens/Verification'

export const defaultConfiguration: ConfigurationContext = {
  pages: OnboardingPages,
  splash: Splash,
  terms: Terms,
  preface: Preface,
  developer: Developer,
  homeHeaderView: HomeHeaderView,
  homeFooterView: HomeFooterView,
  credentialListHeaderRight: () => null,
  credentialListOptions: () => null,
  credentialEmptyList: EmptyList,
  scan: Scan,
  bluetooth: Bluetooth,
  record: Record,
  PINSecurity: { rules: PINRules, displayHelper: false },
  settings: [],
  customNotification: {
    component: () => null,
    onCloseAction: () => null,
    title: '',
    description: '',
    buttonTitle: '',
    pageTitle: '',
  },
  enableTours: false,
  supportedLanguages: Object.keys(translationResources) as Locales[],
  supportedVerifications: Object.keys(verificationResources) as VerificationID[],
  showPreface: false,
  disableOnboardingSkip: false,
  useCustomNotifications: useNotifications,
  useBiometry: UseBiometry,
  verification: Verification,
  whereToUseWalletUrl: 'https://example.com',
  showScanHelp: true,
  showScanButton: true,
  showDetailsInfo: true,
}
