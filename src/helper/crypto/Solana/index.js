import {LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";

export async function requestAirdrop(connection, walletPublicKey) {
    return await connection.requestAirdrop(
        walletPublicKey,
        LAMPORTS_PER_SOL,
    );
}

export async function confirmTransaction(connection, signature) {
    connection.confirmTransaction(signature)
}

export function solanaAirdrop(connection, wallet) {
    console.log("REQUESTED airdrop")
    if (connection && wallet) {
        let {publicKey} = wallet;
        if (publicKey) {
            let signature = requestAirdrop(connection, wallet.publicKey);
            confirmTransaction(connection, signature).then(value => {
                console.log("USPESNO")
            }).catch(reason => {
                console.log("AIRDROP FAILD", reason)
            })
        } else {
            console.log("publicKey not exist")
        }
    } else {
        console.log("Connection or wallet not exist")
    }
}

export function getAllTokens(connection, wallet) {
    if (connection && wallet) {
        let {publicKey} = wallet;
        if (publicKey) {
        } else {
            console.log("publicKey not exist")
        }
    } else {
        console.log("Connection or wallet not exist")
    }
}

export function getBalance(connection, wallet) {
    if (connection && wallet) {
        let {publicKey} = wallet;
        if (publicKey) {
            connection.getBalance(new PublicKey("CpMah17kQEL2wqyMKt3mZBdTnZbkbfx4nqmQMFDP5vwp")).then(response => {
                console.log("getBalance", response)
            }).catch(reason => {
                console.log("getBalance", reason)
            })
        } else {
            console.log("publicKey not exist")
        }
    } else {
        console.log("Connection or wallet not exist")
    }
}

export function solanaTokenInfo(connection, wallet) {
    console.log("REQUESTED solanaTokenInfo")
    if (connection && wallet) {
        let {publicKey} = wallet;
        if (publicKey) {
            connection.getTokenAccountsByOwner(publicKey).then(value => {
                console.log("getTokenAccountsByOwner", value)
            }).catch(reason => {
                console.log("solanaTokenInfo", reason)
            })
        } else {
            console.log("publicKey not exist")
        }
    } else {
        console.log("Connection or wallet not exist")
    }
}