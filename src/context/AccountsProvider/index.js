import React, {useCallback, useContext, useEffect, useState} from "react";
import {PublicKey} from "@solana/web3.js";
import {programIds, setProgramIds, SWAP_HOST_FEE_ADDRESS, WRAPPED_SOL_MINT} from "../../helper/ids";
import {AccountLayout, MintLayout, u64} from "@solana/spl-token";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {useNotify} from "../Notifications";
import {chunks} from "../../helper/token";
import {usePools} from "../../helper/crypto/Pools";

const AccountsContext = React.createContext(null);

class AccountUpdateEvent extends Event {
    static type = "AccountUpdate";
    id;

    constructor(id) {
        super(AccountUpdateEvent.type);
        this.id = id;
    }
}

class EventEmitter extends EventTarget {
    raiseAccountUpdated(id) {
        this.dispatchEvent(new AccountUpdateEvent(id));
    }
}

const accountEmitter = new EventEmitter();

const mintCache = new Map();
const pendingAccountCalls = new Map();
const accountsCache = new Map();
const genericCache = new Map();
export const keyToAccountParser = new Map();
const pendingMintCalls = new Map();
const pendingCalls = new Map();

const getAccountInfo = async ({connection}, pubKey) => {
    const info = await connection.getAccountInfo(pubKey);
    if (info === null) {
        throw new Error("Failed to find mint account");
    }

    const buffer = Buffer.from(info.data);

    const data = deserializeAccount(buffer);
    return {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: data,
    };
};

const getMintInfo = async ({connection}, pubKey) => {
    if (connection) {
        const info = await connection.getAccountInfo(pubKey);
        if (info === null) {
            throw new Error("Failed to find mint account");
        }

        const data = Buffer.from(info.data);

        return deserializeMint(data);
    }
};

export const cache = {
    query: async (connection, pubKey, parser) => {
        let id;
        if (typeof pubKey === "string") {
            id = new PublicKey(pubKey);
        } else {
            id = pubKey;
        }

        const address = id.toBase58();

        let account = genericCache.get(address);
        if (account) {
            return account;
        }

        let query = pendingCalls.get(address);
        if (query) {
            return query;
        }

        query = connection.getAccountInfo(id).then((data) => {
            if (!data) {
                throw new Error("Account not found");
            }

            return cache.add(id, data, parser);
        });
        pendingCalls.set(address, query);

        return query;
    },
    add: (id, obj, parser) => {
        const address = id.toBase58();
        const deserialize = parser ? parser : keyToAccountParser.get(address);
        if (!deserialize) {
            throw new Error(
                "Deserializer needs to be registered or passed as a parameter"
            );
        }

        cache.registerParser(id, deserialize);
        pendingCalls.delete(address);
        const account = deserialize(id, obj);
        genericCache.set(address, account);
        return account;
    },
    get: (pubKey) => {
        let key;
        if (typeof pubKey !== "string") {
            key = pubKey.toBase58();
        } else {
            key = pubKey;
        }

        return genericCache.get(key);
    },
    registerParser: (pubkey, parser) => {
        keyToAccountParser.set(pubkey.toBase58(), parser);
    },

    queryAccount: async (connection, pubKey) => {
        let id;
        if (typeof pubKey === "string") {
            id = new PublicKey(pubKey);
        } else {
            id = pubKey;
        }

        const address = id.toBase58();

        let account = accountsCache.get(address);
        if (account) {
            return account;
        }

        let query = pendingAccountCalls.get(address);
        if (query) {
            return query;
        }

        query = getAccountInfo(connection, id).then((data) => {
            pendingAccountCalls.delete(address);
            accountsCache.set(address, data);
            return data;
        });
        pendingAccountCalls.set(address, query);

        return query;
    },
    addAccount: (pubKey, obj) => {
        const account = tokenAccountFactory(pubKey, obj);
        accountsCache.set(account.pubkey.toBase58(), account);
        return account;
    },
    deleteAccount: (pubkey) => {
        const id = pubkey?.toBase58();
        accountsCache.delete(id);
        accountEmitter.raiseAccountUpdated(id);
    },
    getAccount: (pubKey) => {
        console.log("KEY",pubKey)
        let key;
        if (typeof pubKey !== "string") {
            key = pubKey.toBase58();
        } else {
            key = pubKey;
        }

        return accountsCache.get(key);
    },
    queryMint: async (connection, pubKey) => {
        let id;
        if (typeof pubKey === "string") {
            id = new PublicKey(pubKey);
        } else {
            id = pubKey;
        }

        const address = id.toBase58();
        let mint = mintCache.get(address);
        if (mint) {
            return mint;
        }

        let query = pendingMintCalls.get(address);
        if (query) {
            return query;
        }

        query = getMintInfo(connection, id).then((data) => {
            pendingAccountCalls.delete(address);

            mintCache.set(address, data);
            return data;
        });
        pendingAccountCalls.set(address, query);

        return query;
    },
    getMint: (pubKey) => {
        if (!pubKey || pubKey === '' || pubKey.length === 0) {
            return;
        }

        let key;
        if (typeof pubKey !== "string") {
            if (pubKey?.toBase58())
                key = pubKey.toBase58();
        } else {
            key = pubKey;
        }
        return mintCache.get(key);
    },
    addMint: (pubKey, obj) => {
        const mint = deserializeMint(obj.data);
        const id = pubKey.toBase58();
        mintCache.set(id, mint);
        return mint;
    },
};

export const getCachedAccount = (predicate) => {
    for (const account of accountsCache.values()) {
        if (predicate(account)) {
            return account;
        }
    }
};

function wrapNativeAccount(pubkey, account) {
    if (!account) {
        return undefined;
    }

    return {
        pubkey: pubkey,
        account,
        info: {
            mint: WRAPPED_SOL_MINT,
            owner: pubkey,
            amount: new u64(account.lamports),
            delegate: null,
            delegatedAmount: new u64(0),
            isInitialized: true,
            isFrozen: false,
            isNative: true,
            rentExemptReserve: null,
            closeAuthority: null,
        },
    };
}

const UseNativeAccount = () => {
    const {connection} = useConnection();
    const {wallet, publicKey} = useWallet();
    const [nativeAccount, setNativeAccount] = useState({
        executable: false,
        owner: "",
        lamports: "",
        data: "",
        rentEpoch: ""
    })
    useEffect(() => {
        if (!connection || !publicKey) {
            return;
        }

        connection.getAccountInfo(publicKey).then((acc) => {
            if (acc) {
                setNativeAccount(acc);
            }
        });
        connection.onAccountChange(publicKey, (acc) => {
            if (acc) {
                setNativeAccount(acc);
            }
        });
    }, [setNativeAccount, wallet, publicKey, connection]);

    return {nativeAccount};
};

const PRECACHED_OWNERS = new Set();
const precacheUserTokenAccounts = async (connection, owner) => {
    if (!owner) {
        return;
    }

    // used for filtering account updates over websocket
    PRECACHED_OWNERS.add(owner.toBase58());

    // user accounts are update via ws subscription
    const accounts = await connection.getTokenAccountsByOwner(owner, {
        programId: programIds().token,
    });
    accounts.value
        .map((info) => {
            const data = deserializeAccount(info.account.data);
            // need to query for mint to get decimals

            // TODO: move to web3.js for decoding on the client side... maybe with callback
            return {
                pubkey: info.pubkey,
                account: {
                    ...info.account,
                },
                info: data,
            };
        })
        .forEach((acc) => {
            accountsCache.set(acc.pubkey.toBase58(), acc);
        });
};

export function AccountsProvider({children = null, env}) {
    const {connection} = useConnection();
    const {wallet, connected, publicKey} = useWallet();
    const [tokenAccounts, setTokenAccounts] = useState([]);
    const [userAccounts, setUserAccounts] = useState([]);
    const {nativeAccount} = UseNativeAccount();
    const {pools} = usePools();

    const selectUserAccounts = useCallback(() => {
        return [...accountsCache.values()].filter(
            (a) => a.info.owner.toBase58() === publicKey.toBase58()
        );
    }, [publicKey]);

    useEffect(() => {
        setUserAccounts(
            [
                wrapNativeAccount(publicKey, nativeAccount),
                ...tokenAccounts,
            ].filter((a) => a !== undefined));
    }, [nativeAccount, publicKey, tokenAccounts]);

    useEffect(() => {
        if (!connection || !wallet || !publicKey) {
            setTokenAccounts([]);
        } else {
            // cache host accounts to avoid query during swap
            precacheUserTokenAccounts(connection, SWAP_HOST_FEE_ADDRESS);

            precacheUserTokenAccounts(connection, publicKey).then(() => {
                setTokenAccounts(selectUserAccounts());
            });

            // This can return different types of accounts: token-account, mint, multisig
            // TODO: web3.js expose ability to filter. discuss filter syntax
            const tokenSubID = connection.onProgramAccountChange(
                programIds().token,
                (info) => {
                    // TODO: fix type in web3.js
                    const id = (info.accountId);
                    // TODO: do we need a better way to identify layout (maybe a enum identifing type?)
                    if (info.accountInfo.data.length === AccountLayout.span) {
                        const data = deserializeAccount(info.accountInfo.data);
                        // TODO: move to web3.js for decoding on the client side... maybe with callback
                        const details = {
                            pubkey: new PublicKey((info.accountId)),
                            account: {
                                ...info.accountInfo,
                            },
                            info: data,
                        };

                        if (
                            PRECACHED_OWNERS.has(details.info.owner.toBase58()) ||
                            accountsCache.has(id)
                        ) {
                            accountsCache.set(id, details);
                            setTokenAccounts(selectUserAccounts());
                            accountEmitter.raiseAccountUpdated(id);
                        }
                    } else if (info.accountInfo.data.length === MintLayout.span) {
                        if (mintCache.has(id)) {
                            const data = Buffer.from(info.accountInfo.data);
                            const mint = deserializeMint(data);
                            mintCache.set(id, new Promise((resolve) => resolve(mint)));
                            accountEmitter.raiseAccountUpdated(id);
                        }

                        accountEmitter.raiseAccountUpdated(id);
                    }
                },
                "singleGossip"
            );

            return () => {
                connection.removeProgramAccountChangeListener(tokenSubID);
            };
        }
    }, [connection, connected, publicKey, wallet, selectUserAccounts]);

    setProgramIds(env)

    return (
        <AccountsContext.Provider
            value={{
                userAccounts,
                pools,
                nativeAccount,
            }}
        >
            {children}
        </AccountsContext.Provider>
    );
}

export function useNativeAccount() {
    const context = useContext(AccountsContext);
    return {
        account: context.nativeAccount,
    };
}

export function useMint(id) {
    const {connection} = useConnection();
    const [mint, setMint] = useState();
    const notify = useNotify();

    useEffect(() => {
        if (!id) {
            return;
        }

        cache
            .queryMint(connection, id)
            .then(setMint)
            .catch((err) =>
                notify("error", err.message))
        const onAccountEvent = (e) => {
            if (e.id === id) {
                cache.getMint(id).then(setMint);
            }
        };

        accountEmitter.addEventListener(AccountUpdateEvent.type, onAccountEvent);
        return () => {
            accountEmitter.removeEventListener(
                AccountUpdateEvent.type,
                onAccountEvent
            );
        };
    }, [connection, id]);

    return mint;
}

export function useUserAccounts() {
    const context = useContext(AccountsContext);
    return {
        userAccounts: context.userAccounts,
    };
}

export function useAccount(pubKey) {
    const {connection} = useConnection();
    const [account, setAccount] = useState();
    const notify = useNotify();

    const key = pubKey?.toBase58();
    useEffect(() => {
        const query = async () => {
            try {
                if (!key) {
                    return;
                }

                const acc = await cache.getAccount(connection, key).catch((err) =>
                    notify("error", err.message)
                );
                if (acc) {
                    setAccount(acc);
                }
            } catch (err) {
                console.error(err);
            }
        };

        query();

        const onAccountEvent = (e) => {
            if (e.id === key) {
                query();
            }
        };

        accountEmitter.addEventListener(AccountUpdateEvent.type, onAccountEvent);
        return () => {
            accountEmitter.removeEventListener(
                AccountUpdateEvent.type,
                onAccountEvent
            );
        };
    }, [connection, key]);

    return account;
}

export function useCachedPool() {
    const context = useContext(AccountsContext);
    return {
        pools: context.pools,
    };
}

export const useSelectedAccount = (account) => {
    const {userAccounts} = useUserAccounts();
    const index = userAccounts.findIndex(
        (acc) => acc.pubkey.toBase58() === account
    );

    if (index !== -1) {
        return userAccounts[index];
    }

    return;
};

export const useAccountByMint = (mint) => {
    const {userAccounts} = useUserAccounts();
    const index = userAccounts.findIndex(
        (acc) => acc.info.mint.toBase58() === mint
    );

    if (index !== -1) {
        return userAccounts[index];
    }


    return;
};

// TODO: expose in spl package
const deserializeAccount = (data) => {
    const accountInfo = AccountLayout.decode(data);
    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = u64.fromBuffer(accountInfo.amount);

    if (accountInfo.delegateOption === 0) {
        accountInfo.delegate = null;
        accountInfo.delegatedAmount = new u64(0);
    } else {
        accountInfo.delegate = new PublicKey(accountInfo.delegate);
        accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
    }

    accountInfo.isInitialized = accountInfo.state !== 0;
    accountInfo.isFrozen = accountInfo.state === 2;

    if (accountInfo.isNativeOption === 1) {
        accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
        accountInfo.isNative = true;
    } else {
        accountInfo.rentExemptReserve = null;
        accountInfo.isNative = false;
    }

    if (accountInfo.closeAuthorityOption === 0) {
        accountInfo.closeAuthority = null;
    } else {
        accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
    }

    return accountInfo;
};

// TODO: expose in spl package
const deserializeMint = (data) => {
    if (data.length !== MintLayout.span) {
        throw new Error("Not a valid Mint");
    }

    const mintInfo = MintLayout.decode(data);

    if (mintInfo.mintAuthorityOption === 0) {
        mintInfo.mintAuthority = null;
    } else {
        mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority);
    }

    mintInfo.supply = u64.fromBuffer(mintInfo.supply);
    mintInfo.isInitialized = mintInfo.isInitialized !== 0;

    if (mintInfo.freezeAuthorityOption === 0) {
        mintInfo.freezeAuthority = null;
    } else {
        mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority);
    }

    return mintInfo;
};

export const getMultipleAccounts = async (connection, keys, commitment) => {
    const result = await Promise.all(
        chunks(keys, 99).map((chunk) =>
            getMultipleAccountsCore(connection, chunk, commitment)
        )
    );

    const array = result
        .map(
            (a) =>
                a.array
                    .map((acc) => {
                        if (!acc) {
                            return undefined;
                        }

                        const {data, ...rest} = acc;
                        return {
                            ...rest,
                            data: Buffer.from(data[0], "base64"),
                        };
                    })).flat();
    return {keys, array};
};

const getMultipleAccountsCore = async (connection, keys, commitment) => {
    const args = connection._buildArgs([keys], commitment, "base64");

    const unsafeRes = await connection._rpcRequest("getMultipleAccounts", args);
    if (unsafeRes.error) {
        throw new Error(
            "failed to get info about account " + unsafeRes.error.message
        );
    }

    if (unsafeRes.result.value) {
        const array = unsafeRes.result.value;
        return {keys, array};
    }

    // TODO: fix
    throw new Error();
};

function tokenAccountFactory(pubKey, info) {
    const buffer = Buffer.from(info.data);

    const data = deserializeAccount(buffer);

    return {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: data,
    };
}

export const MintParser = (pubKey, info) => {
    const buffer = Buffer.from(info.data);

    const data = deserializeMint(buffer);

    return {
        pubkey: pubKey,
        account: {
            ...info,
        },
        info: data,
    };
};