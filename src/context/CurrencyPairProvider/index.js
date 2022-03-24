import React, {useCallback, useContext, useEffect, useMemo, useState,} from "react";
import bs58 from "bs58";
import {useConnectionConfig} from "../GlobalProvider";
import {cache, useAccountByMint} from "../AccountsProvider";
import {convert, getTokenIcon, getTokenName} from "../../helper/token";
import {CurveType, DEFAULT_DENOMINATOR, PoolOperation} from "../../constants/app";
import {useConnection} from "@solana/wallet-adapter-react";
import {useLocation} from "react-router-dom";
import {calculateDependentAmount, usePoolForBasket} from "../../helper/crypto/Pools";

const CurrencyPairContext = React.createContext(null);

const convertAmount = (amount, mint) => {
    return parseFloat(amount) * Math.pow(10, mint?.decimals || 0);
};

export const useCurrencyLeg = (config, defaultMint) => {
    const {tokenMap} = useConnectionConfig();
    const [amount, setAmount] = useState("");
    const [mintAddress, setMintAddress] = useState(defaultMint || "");
    const account = useAccountByMint(mintAddress);
    const mint = cache.getMint(mintAddress);

    return useMemo(
        () => ({
            mintAddress: mintAddress,
            account: account,
            mint: mint,
            amount: amount,
            name: getTokenName(tokenMap, mintAddress),
            icon: getTokenIcon(tokenMap, mintAddress),
            setAmount: setAmount,
            setMint: setMintAddress,
            convertAmount: () => convertAmount(amount, mint),
            sufficientBalance: () =>
                account !== undefined &&
                (convert(account, mint) >= parseFloat(amount) ||
                    config.curveType === CurveType.ConstantProductWithOffset),
        }),
        [
            mintAddress,
            account,
            mint,
            amount,
            tokenMap,
            setAmount,
            setMintAddress,
            config,
        ]
    );
};

export function CurrencyPairProvider({children = null}) {
    const {connection} = useConnection();
    const {tokens} = useConnectionConfig();

    // const history = useHistory();
    const location = useLocation();
    const [lastTypedAccount, setLastTypedAccount] = useState("");
    const [poolOperation, setPoolOperation] = useState(
        PoolOperation.Add
    );

    const [options, setOptions] = useState({
        curveType: CurveType.ConstantProduct,
        fees: {
            tradeFeeNumerator: 25,
            tradeFeeDenominator: DEFAULT_DENOMINATOR,
            ownerTradeFeeNumerator: 5,
            ownerTradeFeeDenominator: DEFAULT_DENOMINATOR,
            ownerWithdrawFeeNumerator: 0,
            ownerWithdrawFeeDenominator: 0,
            hostFeeNumerator: 20,
            hostFeeDenominator: 100,
        },
    });

    const base = useCurrencyLeg(options);
    const mintAddressA = base.mintAddress;
    const setMintAddressA = base.setMint;
    const amountA = base.amount;
    const setAmountA = base.setAmount;

    const quote = useCurrencyLeg(options);
    const mintAddressB = quote.mintAddress;
    const setMintAddressB = quote.setMint;
    const amountB = quote.amount;
    const setAmountB = quote.setAmount;

    const pool = usePoolForBasket([base.mintAddress, quote.mintAddress]);

    useEffect(() => {
        const base =
            tokens.find((t) => t.address === mintAddressA)?.symbol || mintAddressA;
        const quote =
            tokens.find((t) => t.address === mintAddressB)?.symbol || mintAddressB;

        document.title = `Swap | Solax (${base}/${quote})`;
    }, [mintAddressA, mintAddressB, tokens, location]);

    // updates browser history on token changes
    useEffect(() => {
        // set history
        const base =
            tokens.find((t) => t.address === mintAddressA)?.symbol || mintAddressA;
        const quote =
            tokens.find((t) => t.address === mintAddressB)?.symbol || mintAddressB;

        if (base && quote && location.pathname.indexOf("info") < 0) {
            console.log("PRABACI NA STRANU", `?pair=${base}-${quote}`)
            // history.push({
            //     search: `?pair=${base}-${quote}`,
            // });
        } else {
            if (mintAddressA && mintAddressB) {
                console.log("PREBACI NA DRUGU STRANU")
                // history.push({
                //     search: ``,
                // });
            } else {
                return;
            }
        }
    }, [mintAddressA, mintAddressB, tokens, location.pathname]);

    // Updates tokens on location change
    useEffect(() => {
        if (!location.search && mintAddressA && mintAddressB) {
            return;
        }

        let {defaultBase, defaultQuote} = getDefaultTokens(
            tokens,
            location.search
        );
        if (!defaultBase || !defaultQuote) {
            return;
        }

        setMintAddressA(
            tokens.find((t) => t.symbol === defaultBase)?.address ||
            (isValidAddress(defaultBase) ? defaultBase : "") ||
            ""
        );
        setMintAddressB(
            tokens.find((t) => t.symbol === defaultQuote)?.address ||
            (isValidAddress(defaultQuote) ? defaultQuote : "") ||
            ""
        );
        // mintAddressA and mintAddressB are not included here to prevent infinite loop
        // eslint-disable-next-line
    }, [location, location.search, setMintAddressA, setMintAddressB, tokens]);

    const calculateDependent = useCallback(async () => {
        if (pool && mintAddressA && mintAddressB) {
            let setDependent;
            let amount;
            let independent;
            if (lastTypedAccount === mintAddressA) {
                independent = mintAddressA;
                setDependent = setAmountB;
                amount = parseFloat(amountA);
            } else {
                independent = mintAddressB;
                setDependent = setAmountA;
                amount = parseFloat(amountB);
            }

            const result = await calculateDependentAmount(
                connection,
                independent,
                amount,
                pool,
                poolOperation
            );
            if (typeof result === "string") {
                setDependent(result);
            } else if (result !== undefined && Number.isFinite(result)) {
                setDependent(result.toFixed(6));
            } else {
                setDependent("");
            }
        }
    }, [
        pool,
        mintAddressA,
        mintAddressB,
        setAmountA,
        setAmountB,
        amountA,
        amountB,
        connection,
        lastTypedAccount,
        poolOperation,
    ]);

    useEffect(() => {
        calculateDependent();
    }, [amountB, amountA, lastTypedAccount, calculateDependent]);

    return (
        <CurrencyPairContext.Provider
            value={{
                A: base,
                B: quote,
                lastTypedAccount,
                setLastTypedAccount,
                setPoolOperation,
                options,
                setOptions,
            }}
        >
            {children}
        </CurrencyPairContext.Provider>
    );
}

export const useCurrencyPairState = () => {
    return useContext(CurrencyPairContext);
};

const isValidAddress = (address) => {
    try {
        const decoded = bs58.decode(address);
        return decoded.length === 32;
    } catch {
        return false;
    }
};

function getDefaultTokens(tokens, search) {
    let defaultBase = "wSOL";
    let defaultQuote = "USDC";

    const nameToToken = tokens.reduce((map, item) => {
        map.set(item.symbol, item);
        return map;
    }, new Map());

    if (search) {
        const urlParams = new URLSearchParams(search);
        const pair = urlParams.get("pair");
        if (pair) {
            let items = pair.split("-");

            if (items.length > 1) {
                if (nameToToken.has(items[0]) || isValidAddress(items[0])) {
                    defaultBase = items[0];
                }

                if (nameToToken.has(items[1]) || isValidAddress(items[1])) {
                    defaultQuote = items[1];
                }
            }
        }
    }
    return {
        defaultBase,
        defaultQuote,
    };
}
