import React, { createContext, useState, useContext } from 'react'
import { Agent } from '@credo-ts/core'

export type ShutdownAgent = Agent | undefined

const ShutdownAgentContext = createContext<ShutdownAgent>(undefined)

export const useShutdownAgent = () => {
	const shutdownAgentContext = useContext(ShutdownAgentContext);

	if (!shutdownAgentContext) {
	  throw new Error('useAgent must be used within a AgentContextProvider')
	}

	return shutdownAgentContext as ShutdownAgent
}

interface Props extends React.PropsWithChildren {
  shutdownAgent?: undefined
}

export const ShutdownAgentProvider: React.FC<React.PropsWithChildren<Props>> = ( { shutdownAgent, children }) => {
	const [shutdownAgentState] = useState<ShutdownAgent>(shutdownAgent);

	return <ShutdownAgentContext.Provider value={shutdownAgentState}>{children}</ShutdownAgentContext.Provider>
}
