import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import {PublicKey} from "@solana/web3.js";

export async function getParsedProgramAccounts(connection, publicKey) {
    if (connection && publicKey) {
        return await connection.getParsedProgramAccounts(
            TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
            {
                filters: [
                    {
                        dataSize: 165, // number of bytes
                    },
                    {
                        memcmp: {
                            offset: 32, // number of bytes
                            bytes: publicKey, // base58 encoded string
                        },
                    },
                ],
            }
        );
    } else {
        console.log("Connection or wallet not exist")
        return [];
    }
}

export async function getTokenAccountsByOwner(connection, wallet) {
    if (connection && wallet) {
        let {publicKey} = wallet;
        if (publicKey) {
            return await connection.getTokenAccountsByOwner(new PublicKey(publicKey));
        } else {
            console.log("publicKey not exist")
            throw new Error("publicKey not exist");
        }
    } else {
        console.log("Connection or wallet not exist")
        throw new Error("Connection or wallet not exist");
    }
}