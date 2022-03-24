import {createTheme, StyledEngineProvider, ThemeProvider} from '@mui/material';

import {deepPurple, pink} from '@mui/material/colors';
import {ConnectionProvider, WalletProvider} from '@solana/wallet-adapter-react';
import {
    getLedgerWallet,
    getPhantomWallet,
    getSlopeWallet,
    getSolflareWallet,
    getSolletExtensionWallet,
    getSolletWallet,
    getTorusWallet,
} from '@solana/wallet-adapter-wallets';
import {clusterApiUrl} from '@solana/web3.js';
import {SnackbarProvider, useSnackbar} from 'notistack';
import {useCallback, useMemo} from 'react';
import {GlobalProvider} from "./GlobalProvider";
import {WalletModalProvider} from "@solana/wallet-adapter-react-ui";
import {AccountsProvider} from "./AccountsProvider";
import {MarketProvider} from "./MarketProvider";
import {CurrencyPairProvider} from "./CurrencyPairProvider";

const theme =(themeColor)=> createTheme({
    palette: {
        mode: themeColor,
        primary: {
            main: deepPurple[700],
        },
        secondary: {
            main: pink[700],
        },
    },
    components: {
        MuiButtonBase: {
            styleOverrides: {
                root: {
                    justifyContent: 'flex-start',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    padding: '12px 16px',
                },
                startIcon: {
                    marginRight: 8,
                },
                endIcon: {
                    marginLeft: 8,
                },
            },
        },
    },
});

const WalletContextProvider = ({children, network}) => {

    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallets = useMemo(() => [
        getPhantomWallet(),
        getSlopeWallet(),
        getSolflareWallet(),
        getTorusWallet({
            options: {clientId: 'Get a client ID @ https://developer.tor.us'}
        }),
        getLedgerWallet(),
        getSolletWallet({network}),
        getSolletExtensionWallet({network}),
    ], [network]);

    const {enqueueSnackbar} = useSnackbar();
    const onError = useCallback(
        (error) => {
            enqueueSnackbar(error.message ? `${error.name}: ${error.message}` : error.name, {variant: 'error'});
            console.error(error);
        },
        [enqueueSnackbar]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <GlobalProvider endpoint={endpoint} network={network}>
                <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
                    <WalletModalProvider>
                        <AccountsProvider env={network}>
                            <MarketProvider>
                                <CurrencyPairProvider>
                                    {children}
                                </CurrencyPairProvider>
                            </MarketProvider>
                        </AccountsProvider>
                    </WalletModalProvider>
                </WalletProvider>
            </GlobalProvider>
        </ConnectionProvider>
    );
};

export const ContextProvider = ({children, network, themeColor}) => {
    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme(themeColor)}>
                <SnackbarProvider>
                    <WalletContextProvider network={network}>
                        {children}
                    </WalletContextProvider>
                </SnackbarProvider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
};