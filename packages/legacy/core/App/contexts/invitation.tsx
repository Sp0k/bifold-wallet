import React, { createContext, useContext } from 'react'

export interface Invitation {
  url: string
}

export const InvitationContext = createContext<Invitation | undefined>(undefined)

export const useInvitation = () => {
  const context = useContext(InvitationContext)

  if (!context) {
    throw new Error('useInvitation must be used within InviationProvider')
  }

  return context
}

const InvitationProvider = ({ children }: React.PropsWithChildren) => {
  return <InvitationContext.Provider value={{ url: '' }}>{children}</InvitationContext.Provider>
}

export default InvitationProvider
