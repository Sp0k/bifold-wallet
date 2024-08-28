import React, { createContext, useContext, useState } from 'react'

export interface Invitation {
  payload: any
}

export interface InvitationContextProps {
  invitation: Invitation | undefined
  setInvitation: (invitation: Invitation) => void
}

export const InvitationContext = createContext<InvitationContextProps | undefined>(undefined)

export const useInvitation = () => {
  const context = useContext(InvitationContext)

  if (!context) {
    throw new Error('useInvitation must be used within InviationProvider')
  }

  return context
}

interface InvitationProviderProps extends React.PropsWithChildren {
  invitation: Invitation | undefined
}

const InvitationProvider = ({ children, invitation }: InvitationProviderProps) => {
  const [currentInvitation, setCurrentInvitation] = useState<Invitation | undefined>(invitation)

  return (
    <InvitationContext.Provider value={{ invitation: currentInvitation, setInvitation: setCurrentInvitation }}>
      {children}
    </InvitationContext.Provider>
  )
}

export default InvitationProvider
