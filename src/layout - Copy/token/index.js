import {useCallback, useState} from "react";
import {cache as AddressToToken} from "../../context/AccountsProvider";

export function useLocalStorageState(key, defaultState) {
    const [state, setState] = useState(() => {
        // NOTE: Not sure if this is ok
        const storedState = localStorage.getItem(key);
        if (storedState) {
            return JSON.parse(storedState);
        }
        return defaultState;
    });

    const setLocalStorageState = useCallback(
        (newState) => {
            const changed = state !== newState;
            if (!changed) {
                return;
            }
            setState(newState);
            if (newState === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(newState));
            }
        },
        [state, key]
    );

    return [state, setLocalStorageState];
}

export function isKnownMint(network, mintAddress) {
    return !!AddressToToken.get(network)?.get(mintAddress);
}

export function getPoolName(tokenMap, pool) {
    const sorted = pool.pubkeys.holdingMints?.map((a) => a.toBase58()).sort();
    return sorted?.map((item) => getTokenName(tokenMap, item)).join("/");
}

export function shortenAddress(address, chars = 4) {
    if (!address || address.size === 0)
        return ""
    return `0x${address.substring(0, chars)}...${address.substring(44 - chars)}`;
}

export function chunks(array, size) {
    return Array.apply(
        0,
        new Array(Math.ceil(array.length / size))
    ).map((_, index) => array.slice(index * size, (index + 1) * size));
}

export function getTokenIcon(map, mintAddress) {
    return map.get(mintAddress)?.logoURI;
}

export function getTokenName(map, mintAddress, shorten = true, length = 5) {
    if (!map)
        return shortenAddress(mintAddress).substring(10).toUpperCase();
    const knownSymbol = map.get(mintAddress)?.symbol;
    if (knownSymbol) {
        return knownSymbol;
    }

    return shorten ? `${mintAddress.substring(0, length)}...` : mintAddress;
}

export function convert(account, mint, rate = 1.0) {
    if (!account) {
        return 0;
    }
    const precision = Math.pow(10, mint?.decimals || 0);
    return (account.info.amount.toNumber() / precision) * rate;
}

export const formatPriceNumber = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
});

export const formatUSD = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});

export const formatNumber = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});