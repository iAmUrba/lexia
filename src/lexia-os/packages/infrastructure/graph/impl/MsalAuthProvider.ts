import { PublicClientApplication, Configuration, DeviceCodeRequest, AuthenticationResult, ICachePlugin, LogLevel } from '@azure/msal-node';
import { IGraphAuthProvider, GraphConfiguration } from '../contracts/GraphContracts.js';
import { GraphAuthenticationError } from '../errors.js';
import * as fs from 'fs';

export class MsalAuthProvider implements IGraphAuthProvider {
    private pca: PublicClientApplication;
    private config: GraphConfiguration;
    private account: any = null;

    constructor(config: GraphConfiguration, cachePlugin?: ICachePlugin) {
        this.config = config;

        const msalConfig: Configuration = {
            auth: {
                clientId: config.clientId,
                authority: config.authority,
            },
            cache: {
                cachePlugin
            },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message, containsPii) {
                        // console.log(message);
                    },
                    piiLoggingEnabled: false,
                    logLevel: LogLevel.Warning,
                }
            }
        };

        this.pca = new PublicClientApplication(msalConfig);
    }

    public async getAccessToken(): Promise<string> {
        // Attempt Silent Refresh first
        try {
            const cache = this.pca.getTokenCache();
            const accounts = await cache.getAllAccounts();
            if (accounts.length > 0) {
                this.account = accounts[0];
                const silentRequest = {
                    account: this.account,
                    scopes: this.config.scopes,
                };
                const authResult = await this.pca.acquireTokenSilent(silentRequest);
                if (authResult?.accessToken) {
                    return authResult.accessToken;
                }
            }
        } catch (error) {
            // Token silent acquisition failed, fallback to interactive / device code
        }

        // Fallback to Device Code Flow
        return this.acquireTokenByDeviceCode();
    }

    private async acquireTokenByDeviceCode(): Promise<string> {
        const deviceCodeRequest: DeviceCodeRequest = {
            scopes: this.config.scopes,
            deviceCodeCallback: (response) => {
                console.log('\n======================================================');
                console.log(response.message);
                console.log('======================================================\n');
            },
        };

        try {
            const authResult: AuthenticationResult | null = await this.pca.acquireTokenByDeviceCode(deviceCodeRequest);
            if (authResult && authResult.accessToken) {
                this.account = authResult.account;
                return authResult.accessToken;
            }
            throw new GraphAuthenticationError('No access token returned from MSAL');
        } catch (error: any) {
            throw new GraphAuthenticationError(`Authentication failed: ${error.message || error}`);
        }
    }

    public invalidateToken(): void {
        // For MSAL, you can remove the account from cache
        if (this.account) {
            const cache = this.pca.getTokenCache();
            cache.removeAccount(this.account).catch(console.error);
            this.account = null;
        }
    }
}
