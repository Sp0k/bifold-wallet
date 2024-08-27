import { Agent, ConnectionsModule, InboundTransport, KeyDerivationMethod, OutboundTransport, OutOfBandApi, WalletConfig } from "@credo-ts/core";
import { EventTypes } from "../constants";
import { DeviceEventEmitter } from "react-native";
import { BifoldError } from "../types/error";
import { WalletSecret } from "../types/security";
import { State } from "../types/state";
import { agentDependencies } from "@credo-ts/react-native";
import { ariesAskar } from "@hyperledger/aries-askar-react-native";
import { AskarModule } from "@credo-ts/askar";

export const registerInboundTransport = <I extends InboundTransport>(agent: Agent, inboundMessenger: I) => {
    agent.registerInboundTransport(inboundMessenger);
}

export const rergisterOutboundTransport = <O extends OutboundTransport>(agent: Agent, outboundTransport: O) => {
    agent.registerOutboundTransport(outboundTransport);
}

/// This is a demo, in real situation we will pass the _credentials.
const getWalletConfig = (_credentials: WalletSecret): WalletConfig => {
    return {
        id: 'foo',
        key: 'testkey000000000000000000000',
        keyDerivationMethod: KeyDerivationMethod.Argon2IMod
    }
}

export const agentEndpoint = "http://localhost:3000";

export const configureAgent = <I extends InboundTransport, O extends OutboundTransport>(store: State, credentials: WalletSecret | undefined, inboundTransports?: I[], outboundTransports?: O[]): Agent | undefined => {
    if (!credentials) {
        return undefined;
    }

    try {
        const agent = new Agent({
            config: {
                label: store.preferences.walletName || 'Aries Bifold',
                walletConfig: getWalletConfig(credentials), 
                autoUpdateStorageOnStartup: true,
                endpoints: [
                    agentEndpoint
                ]
            },
            dependencies: agentDependencies,
            modules: {
                connections: new ConnectionsModule({ autoAcceptConnections: true }),
                askar: new AskarModule({
                    ariesAskar
                }),
            },
        })

        for (const inboundTransport of inboundTransports ?? []) {
            registerInboundTransport(agent, inboundTransport);
        }

        for (const outboundTransport of outboundTransports ?? []) {
            rergisterOutboundTransport(agent, outboundTransport);
        }
        
        return agent
    } catch (err) {
        console.log(err);
    }
}

export const run = async (credentials: WalletSecret | undefined, newAgent: Agent | undefined, setAgent: (agent: Agent<any>) => void, t: any): Promise<void> => {
    try {
        if (!credentials) {
            return;
        }

        if (!newAgent) {
            const error = new BifoldError(
                t('Error.Title1045'),
                t('Error.Message1045'),
                'Failed to initialize agent',
                1045
            )
            DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
                    
            return
        } 
                
        await newAgent.initialize()

        console.log("Initialized agent");

        setAgent(newAgent);
    } catch (err) {
        const error = new BifoldError(
            t('Error.Title1045'),
            t('Error.Message1045'),
            (err as Error)?.message ?? err,
            1045,
        )
        DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
        console.log(err);
    }
}