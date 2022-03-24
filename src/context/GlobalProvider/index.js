import {Account, PublicKey, Transaction} from "@solana/web3.js";
import React, {useContext, useEffect, useState} from "react";
import {cache, getMultipleAccounts} from "../AccountsProvider";
import {useConnection} from "@solana/wallet-adapter-react";
import {TokenListProvider} from "@solana/spl-token-registry";
import {useLocalStorageState} from "../../helper/token";
import {setProgramIds} from "../../helper/ids";

const DEFAULT_SLIPPAGE = 0.25;

const GlobalContext = React.createContext({
    slippage: DEFAULT_SLIPPAGE,
    setSlippage: (val) => {
    },
    tokens: [],
    tokenMap: new Map(),
});

export function GlobalProvider({children = undefined, endpoint, network}) {
    const {connection} = useConnection();

    const [slippage, setSlippage] = useLocalStorageState(
        "slippage",
        DEFAULT_SLIPPAGE.toString()
    );
    const [tokens, setTokens] = useState([]);
    const [tokenMap, setTokenMap] = useState(new Map());
    useEffect(() => {
        (async () => {
            const res = await new TokenListProvider().resolve();
            const list = res
                .filterByClusterSlug(network)
                // .excludeByTag("nft")
                .getList();
            const knownMints = list.reduce((map, item) => {
                map.set(item.address, item);
                return map;
            }, new Map());

            const accounts = await getMultipleAccounts(connection, [...knownMints.keys()], 'single');
            accounts.keys.forEach((key, index) => {
                const account = accounts.array[index];
                if (!account) {
                    knownMints.delete(accounts.keys[index]);
                    return;
                }

                try {
                    cache.addMint(new PublicKey(key), account);
                } catch {
                    // ignore
                }
            });
            setTokenMap(knownMints);
            setTokens([...knownMints.values()]);
        })();
    }, [endpoint, network, connection]);

    setProgramIds(network);

    // The websocket library solana/web3.js uses closes its websocket connection when the subscription list
    // is empty after opening its first time, preventing subsequent subscriptions from receiving responses.
    // This is a hack to prevent the list from every getting empty
    useEffect(() => {
        const id = connection.onAccountChange(new Account().publicKey, () => {
        });
        return () => {
            connection.removeAccountChangeListener(id);
        };
    }, [connection]);

    useEffect(() => {
        const id = connection.onSlotChange(() => null);
        return () => {
            connection.removeSlotChangeListener(id);
        };
    }, [connection]);

    return (
        <GlobalContext.Provider
            value={{
                slippage: parseFloat(slippage),
                setSlippage: (val) => setSlippage(val.toString()),
                tokens,
                tokenMap,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}

export function useConnectionConfig() {
    const context = useContext(GlobalContext);
    return {
        endpoint: context.endpoint,
        setEndpoint: context.setEndpoint,
        env: context.env,
        tokens: context.tokens,
        tokenMap: context.tokenMap,
    };
}

export function useSlippageConfig() {
    const {slippage, setSlippage} = useContext(GlobalContext);
    return {slippage, setSlippage};
}

const getErrorForTransaction = async (connection, txid) => {
    // wait for all confirmation before geting transaction
    await connection.confirmTransaction(txid, "max");

    const tx = await connection.getParsedConfirmedTransaction(txid);

    const errors = [];
    if (tx?.meta && tx.meta.logMessages) {
        tx.meta.logMessages.forEach((log) => {
            const regex = /Error: (.*)/gm;
            let m;
            while ((m = regex.exec(log)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                if (m.length > 1) {
                    errors.push(m[1]);
                }
            }
        });
    }

    return errors;
};

export const sendTransaction = async (connection, wallet, instructions, signers, walletPublicKey, walletSendTransaction, notify, awaitConfirmation = true) => {
    let transaction = new Transaction();
    instructions.forEach((instruction) => transaction.add(instruction));
    transaction.recentBlockhash = (
        await connection.getRecentBlockhash("max")
    ).blockhash;
    transaction.setSigners(
        // fee payied by the wallet owner
        wallet.publicKey,
        ...signers.map((s) => s.publicKey)
    );
    if (signers.length > 0) {
        transaction.partialSign(...signers);
    }
    let signature = await walletSendTransaction(transaction, connection);
    notify('info', 'Transaction sent:', signature);

    if (awaitConfirmation) {
        const status = await connection.confirmTransaction(signature, 'processed');
        notify('success', 'Transaction successful!', signature);
    }

    /*transaction = await wallet.signTransaction(transaction);
    const rawTransaction = transaction.serialize();
    let options = {
        skipPreflight: true,
        commitment: "singleGossip",
    };

    const txid = await connection.sendRawTransaction(rawTransaction, options);

    if (awaitConfirmation) {
        const status = (
            await connection.confirmTransaction(
                txid,
                options && (options.commitment)
            )
        ).value;

        if (status?.err) {
            const errors = await getErrorForTransaction(connection, txid);
            notify({
                message: "Transaction failed...",
                description: (
                    <>
                        {errors.map((err) => (
                            <div>{err}</div>
                        ))}
                        <ExplorerLink address={txid} type="transaction"/>
                    </>
                ),
                type: "error",
            });

            throw new Error(
                `Raw transaction ${txid} failed (${JSON.stringify(status)})`
            );
        }
    }*/

    return signature;
};