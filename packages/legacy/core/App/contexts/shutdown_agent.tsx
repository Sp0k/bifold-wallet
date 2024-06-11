import { Agent } from '@credo-ts/core'
import React, { createContext, useState, useContext, PropsWithChildren } from 'react'

export type ShutdownAgent = Agent | undefined

export interface ShutdownAgentContextProps {
  shutdownAgent: ShutdownAgent
  setShutdownAgent: React.Dispatch<React.SetStateAction<ShutdownAgent>>
}

const ShutdownAgentContext = createContext<ShutdownAgentContextProps | undefined>(undefined)

export const useShutdownAgent = () => {
  const shutdownAgentContext = useContext(ShutdownAgentContext)

  if (!shutdownAgentContext) {
    throw new Error('useAgent must be used within a AgentContextProvider')
  }

  return shutdownAgentContext
}

interface Props extends PropsWithChildren {
  shutdownAgent: ShutdownAgent
}

export const ShutdownAgentProvider: React.FC<React.PropsWithChildren<Props>> = ({ shutdownAgent, children }: Props) => {
  const [shutdownAgentState, setShutdownAgentState] = useState<ShutdownAgent>(shutdownAgent)

  return (
    <ShutdownAgentContext.Provider
      value={{
        shutdownAgent: shutdownAgentState,
        setShutdownAgent: setShutdownAgentState,
      }}
    >
      {children}
    </ShutdownAgentContext.Provider>
  )
}
