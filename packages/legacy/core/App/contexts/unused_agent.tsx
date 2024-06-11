import { Agent } from '@credo-ts/core'
import React, { createContext, useState, useContext, PropsWithChildren } from 'react'

export type UnusedAgent = Agent | undefined

export interface UnusedAgentContextProps {
  unusedAgent: UnusedAgent
  setUnusedAgent: React.Dispatch<React.SetStateAction<UnusedAgent>>
}

const UnusedAgentContext = createContext<UnusedAgentContextProps | undefined>(undefined)

export const useUnusedAgent = () => {
  const unusedAgentContext = useContext(UnusedAgentContext)

  if (!unusedAgentContext) {
    throw new Error('useAgent must be used within a AgentContextProvider')
  }

  return unusedAgentContext
}

interface Props extends PropsWithChildren {
  unusedAgent: UnusedAgent
}

export const UnusedAgentProvider: React.FC<React.PropsWithChildren<Props>> = ({ unusedAgent, children }: Props) => {
  const [unusedAgentState, setUnusedAgentState] = useState<UnusedAgent>(unusedAgent)

  return (
    <UnusedAgentContext.Provider
      value={{
        unusedAgent: unusedAgentState,
        setUnusedAgent: setUnusedAgentState,
      }}
    >
      {children}
    </UnusedAgentContext.Provider>
  )
}
