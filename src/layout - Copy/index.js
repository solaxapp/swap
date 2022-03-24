import {Outlet} from "react-router-dom";
import AppBar from "../components/AppBar";
import * as React from "react";
import Footer from "../components/Footer";
import {getSavedNetwork, getSavedTheme, setSavedNetwork, setSavedTheme} from "../helper/session";
import {useLocalStorageState} from "../helper/token";
import {DEFAULT_SLIPPAGE} from "../constants/app";
import {ContextProvider} from "../context";
import {useMemo, useState} from "react";
import {clusterApiUrl} from "@solana/web3.js";
// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

export default function Layout() {
    const [network, setNetwork] = useState(getSavedNetwork())
    const [theme, setTheme] = useState(getSavedTheme())
    const [slippage, setSlippage] = useLocalStorageState(
        "slippage",
        DEFAULT_SLIPPAGE.toString()
    );
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const changeSlippage = (event, value) => {
        setSlippage(value);
    }

    const changeNetwork = (event) => {
        const {value} = event.target
        setNetwork(value);
        setSavedNetwork(value);
        window.location.reload();
    }

    const changeTheme = () => {
        if (theme === "light") {
            setSavedTheme("dark")
            setTheme('dark')
        } else {
            setSavedTheme("light")
            setTheme('light')
        }
    }

    return (
        <ContextProvider network={network} themeColor={theme}>
            <AppBar
                network={network}
                activeTheme={theme}
                changeSlippage={changeSlippage}
                changeNetwork={changeNetwork}
                changeTheme={changeTheme}
                slippage={slippage} />
            <>
                <Outlet context={{network, endpoint, slippage}}/>
            </>
            <Footer/>
        </ContextProvider>
    );
}