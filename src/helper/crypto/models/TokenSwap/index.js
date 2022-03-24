import {Numberu64} from "@solana/spl-token-swap";
import {TransactionInstruction} from "@solana/web3.js";
import * as BufferLayout from "buffer-layout";

export {TokenSwap} from "@solana/spl-token-swap";

/**
 * Layout for a public key
 */
export const publicKey = (property = "publicKey") => {
    return BufferLayout.blob(32, property);
};

/**
 * Layout for a 64bit unsigned value
 */
export const uint64 = (property = "uint64") => {
    return BufferLayout.blob(8, property);
};

export const TokenSwapLayoutLegacyV0 = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    BufferLayout.u8("nonce"),
    publicKey("tokenAccountA"),
    publicKey("tokenAccountB"),
    publicKey("tokenPool"),
    uint64("feesNumerator"),
    uint64("feesDenominator"),
]);

export const TokenSwapLayout = BufferLayout.struct(
    [
        BufferLayout.u8("isInitialized"),
        BufferLayout.u8("nonce"),
        publicKey("tokenProgramId"),
        publicKey("tokenAccountA"),
        publicKey("tokenAccountB"),
        publicKey("tokenPool"),
        publicKey("mintA"),
        publicKey("mintB"),
        publicKey("feeAccount"),
        BufferLayout.u8("curveType"),
        uint64("tradeFeeNumerator"),
        uint64("tradeFeeDenominator"),
        uint64("ownerTradeFeeNumerator"),
        uint64("ownerTradeFeeDenominator"),
        uint64("ownerWithdrawFeeNumerator"),
        uint64("ownerWithdrawFeeDenominator"),
        BufferLayout.blob(16, "padding"),
    ]
);

export const TokenSwapLayoutV1 = BufferLayout.struct(
    [
        BufferLayout.u8("isInitialized"),
        BufferLayout.u8("nonce"),
        publicKey("tokenProgramId"),
        publicKey("tokenAccountA"),
        publicKey("tokenAccountB"),
        publicKey("tokenPool"),
        publicKey("mintA"),
        publicKey("mintB"),
        publicKey("feeAccount"),
        BufferLayout.u8("curveType"),
        uint64("tradeFeeNumerator"),
        uint64("tradeFeeDenominator"),
        uint64("ownerTradeFeeNumerator"),
        uint64("ownerTradeFeeDenominator"),
        uint64("ownerWithdrawFeeNumerator"),
        uint64("ownerWithdrawFeeDenominator"),
        BufferLayout.blob(16, "padding"),
    ]
);


export const createInitSwapInstruction = (
    tokenSwapAccount,
    authority,
    tokenAccountA,
    tokenAccountB,
    tokenPool,
    feeAccount,
    tokenAccountPool,
    tokenProgramId,
    swapProgramId,
    nonce,
    curveType,
    tradeFeeNumerator,
    tradeFeeDenominator,
    ownerTradeFeeNumerator,
    ownerTradeFeeDenominator,
    ownerWithdrawFeeNumerator,
    ownerWithdrawFeeDenominator
) => {
    const keys = [
        {pubkey: tokenSwapAccount.publicKey, isSigner: false, isWritable: true},
        {pubkey: authority, isSigner: false, isWritable: false},
        {pubkey: tokenAccountA, isSigner: false, isWritable: false},
        {pubkey: tokenAccountB, isSigner: false, isWritable: false},
        {pubkey: tokenPool, isSigner: false, isWritable: true},
        {pubkey: feeAccount, isSigner: false, isWritable: false},
        {pubkey: tokenAccountPool, isSigner: false, isWritable: true},
        {pubkey: tokenProgramId, isSigner: false, isWritable: false},
    ];

    const commandDataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        BufferLayout.u8("nonce"),
        BufferLayout.u8("curveType"),
        BufferLayout.nu64("tradeFeeNumerator"),
        BufferLayout.nu64("tradeFeeDenominator"),
        BufferLayout.nu64("ownerTradeFeeNumerator"),
        BufferLayout.nu64("ownerTradeFeeDenominator"),
        BufferLayout.nu64("ownerWithdrawFeeNumerator"),
        BufferLayout.nu64("ownerWithdrawFeeDenominator"),
        BufferLayout.blob(16, "padding"),
    ]);
    let data = Buffer.alloc(1024);
    {
        const encodeLength = commandDataLayout.encode(
            {
                instruction: 0, // InitializeSwap instruction
                nonce,
                curveType,
                tradeFeeNumerator,
                tradeFeeDenominator,
                ownerTradeFeeNumerator,
                ownerTradeFeeDenominator,
                ownerWithdrawFeeNumerator,
                ownerWithdrawFeeDenominator,
            },
            data
        );
        data = data.slice(0, encodeLength);
    }
    return new TransactionInstruction({
        keys,
        programId: swapProgramId,
        data,
    });
};

export const depositInstruction = (
    tokenSwap,
    authority,
    sourceA,
    sourceB,
    intoA,
    intoB,
    poolToken,
    poolAccount,
    swapProgramId,
    tokenProgramId,
    poolTokenAmount,
    maximumTokenA,
    maximumTokenB
) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        uint64("poolTokenAmount"),
        uint64("maximumTokenA"),
        uint64("maximumTokenB"),
    ]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 2, // Deposit instruction
            poolTokenAmount: new Numberu64(poolTokenAmount).toBuffer(),
            maximumTokenA: new Numberu64(maximumTokenA).toBuffer(),
            maximumTokenB: new Numberu64(maximumTokenB).toBuffer(),
        },
        data
    );

    const keys = [
        {pubkey: tokenSwap, isSigner: false, isWritable: false},
        {pubkey: authority, isSigner: false, isWritable: false},
        {pubkey: sourceA, isSigner: false, isWritable: true},
        {pubkey: sourceB, isSigner: false, isWritable: true},
        {pubkey: intoA, isSigner: false, isWritable: true},
        {pubkey: intoB, isSigner: false, isWritable: true},
        {pubkey: poolToken, isSigner: false, isWritable: true},
        {pubkey: poolAccount, isSigner: false, isWritable: true},
        {pubkey: tokenProgramId, isSigner: false, isWritable: false},
    ];
    return new TransactionInstruction({
        keys,
        programId: swapProgramId,
        data,
    });
};

export const withdrawInstruction = (
    tokenSwap,
    authority,
    poolMint,
    feeAccount,
    sourcePoolAccount,
    fromA,
    fromB,
    userAccountA,
    userAccountB,
    swapProgramId,
    tokenProgramId,
    poolTokenAmount,
    minimumTokenA,
    minimumTokenB
) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        uint64("poolTokenAmount"),
        uint64("minimumTokenA"),
        uint64("minimumTokenB"),
    ]);

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 3, // Withdraw instruction
            poolTokenAmount: new Numberu64(poolTokenAmount).toBuffer(),
            minimumTokenA: new Numberu64(minimumTokenA).toBuffer(),
            minimumTokenB: new Numberu64(minimumTokenB).toBuffer(),
        },
        data
    );

    const keys = [
        {pubkey: tokenSwap, isSigner: false, isWritable: false},
        {pubkey: authority, isSigner: false, isWritable: false},
        {pubkey: poolMint, isSigner: false, isWritable: true},
        {pubkey: sourcePoolAccount, isSigner: false, isWritable: true},
        {pubkey: fromA, isSigner: false, isWritable: true},
        {pubkey: fromB, isSigner: false, isWritable: true},
        {pubkey: userAccountA, isSigner: false, isWritable: true},
        {pubkey: userAccountB, isSigner: false, isWritable: true},
    ];

    if (feeAccount) {
        keys.push({pubkey: feeAccount, isSigner: false, isWritable: true});
    }
    keys.push({pubkey: tokenProgramId, isSigner: false, isWritable: false});

    return new TransactionInstruction({
        keys,
        programId: swapProgramId,
        data,
    });
};

export const swapInstruction = (
    tokenSwap,
    authority,
    userSource,
    poolSource,
    poolDestination,
    userDestination,
    poolMint,
    feeAccount,
    swapProgramId,
    tokenProgramId,
    amountIn,
    minimumAmountOut,
    programOwner
) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8("instruction"),
        uint64("amountIn"),
        uint64("minimumAmountOut"),
    ]);

    const keys = [
        {pubkey: tokenSwap, isSigner: false, isWritable: false},
        {pubkey: authority, isSigner: false, isWritable: false},
        {pubkey: userSource, isSigner: false, isWritable: true},
        {pubkey: poolSource, isSigner: false, isWritable: true},
        {pubkey: poolDestination, isSigner: false, isWritable: true},
        {pubkey: userDestination, isSigner: false, isWritable: true},
        {pubkey: poolMint, isSigner: false, isWritable: true},
        {pubkey: feeAccount, isSigner: false, isWritable: true},
        {pubkey: tokenProgramId, isSigner: false, isWritable: false},
    ];

    // optional depending on the build of token-swap program
    if (programOwner) {
        keys.push({pubkey: programOwner, isSigner: false, isWritable: true});
    }

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 1, // Swap instruction
            amountIn: new Numberu64(amountIn).toBuffer(),
            minimumAmountOut: new Numberu64(minimumAmountOut).toBuffer(),
        },
        data
    );

    return new TransactionInstruction({
        keys,
        programId: swapProgramId,
        data,
    });
};
