import React, {useMemo, useState} from "react";
import {CenteredCol, CenteredRow, FlexCol, PageContainer} from "../../components/Flex";
import CurrencyInput from "../../components/CurrencyInput";
import {
    Button,
    CircularProgress,
    FormControlLabel,
    Popover,
    Radio,
    RadioGroup,
    Select,
    Typography
} from "@mui/material";
import {
    ADD_LIQUIDITY_LABEL,
    CREATE_POOL_LABEL,
    generateActionLabel,
    generateExactOneLabel
} from "../../constants/labels";
import {formatPriceNumber, getPoolName} from "../../helper/token";
import {styled} from "@mui/material/styles";
import {useOutletContext} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {useCurrencyPairState} from "../../context/CurrencyPairProvider";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {addLiquidity, usePoolForBasket} from "../../helper/crypto/Pools";
import {useConnectionConfig} from "../../context/GlobalProvider";
import {programIds} from "../../helper/ids";
import {TokenSwapLayout} from "../../helper/crypto/models/TokenSwap";
import {useNotify} from "../../context/Notifications";
import {CurveType, PoolOperation} from "../../constants/app";
import {Text} from "../../components/Text";
import {LoadingButton} from "@mui/lab";
import {useEnrichedPools} from "../../context/MarketProvider";
import {useMint, useUserAccounts} from "../../context/AccountsProvider";
import {PoolIcon} from "../../components/TokenIcon";
import {SupplyOverview} from "./components/SupplyOverview";

const Row = styled('div')(() => ({
    display: "flex",
    flexDirection: "row"
}))

const Col = styled('div')(() => ({
    display: "flex",
    flexDirection: "column"
}))

const StyledPageContainer = styled(PageContainer)(() => ({
    position: "relative",
    minHeight: "50rem",
    backgroundColor: "#00D2C8",
    zIndex: 1,
}))

const BackgroundDarkBlue = styled('div')(() => ({
    marginTop: 150,
    width: "100%",
    minHeight: "55rem",
    height: "100%",
    position: "absolute",
    backgroundColor: "#192330",
    transform: "skewY(-8deg)"
}))

const SwapWrapper = styled(CenteredCol)(() => ({
    marginTop: 200,
    marginBottom: 200,
    zIndex: 1,
}))

const Title = styled(Typography)(({theme}) => ({
    fontSize: 30,
    color: theme.palette.common.white,
    fontWeight: "bold"
}))

const Card = styled(FlexCol)(({theme}) => ({
    padding: 50,
    border: "1px solid #00D2C8",
    boxShadow: "15px 15px 20px #00000029",
    borderRadius: 25,
}))

const WalletButton = styled(Button)(() => ({
    marginTop: 10,
    background: "linear-gradient(279deg, rgba(159,150,219,1) 0%, rgba(247,151,155,1) 53%, rgba(0,180,180,1) 100%);",
    cursor: "pointer",
    color: "white",
    border: "3px solid #FFFFFF",
}))


export default function LiquidityPage() {
    const {network, slippage} = useOutletContext();
    const {t} = useTranslation();
    const allWallets = useWallet();
    const {wallet, connected, publicKey, sendTransaction} = allWallets;
    const {connection} = useConnection();
    const [pendingTx, setPendingTx] = useState(false);
    const [depositType, setDepositType] = useState("both");
    const {
        A,
        B,
        setLastTypedAccount,
        setPoolOperation,
        options,
        setOptions,
    } = useCurrencyPairState();
    const [depositToken, setDepositToken] = useState(A.mintAddress);
    const pool = usePoolForBasket([A?.mintAddress, B?.mintAddress]);
    const {tokenMap} = useConnectionConfig();
    const isLatestLayout = programIds().swapLayout === TokenSwapLayout;
    const [liquidityDescAnchor, setLiquidityDescAnchor] = React.useState(null);
    const notify = useNotify();
    const [openCurrencyInput, setOpenCurrencyInput] = useState({
        first: false,
        second: false
    });

    const executeAction = !connected
        ? connected
        : async (instance) => {
            const currentDepositToken = getDepositToken();
            if (
                isLatestLayout &&
                depositType === "one" &&
                currentDepositToken?.account &&
                currentDepositToken.mint
            ) {
                setPendingTx(true);
                const components = [
                    {
                        account: currentDepositToken.account,
                        mintAddress: currentDepositToken.mintAddress,
                        amount: currentDepositToken.convertAmount(),
                    },
                ];
                addLiquidity(connection, wallet, components, slippage, instance, options, depositType, notify, sendTransaction)
                    .then(() => {
                        setPendingTx(false);
                    })
                    .catch((e) => {
                        console.log("Transaction failed", e);
                        notify("error", "Please try again and approve transactions from your wallet. Adding liquidity cancelled.");
                        setPendingTx(false);
                    });
            } else if (A.account && B.account && A.mint && B.mint) {
                setPendingTx(true);
                const components = [
                    {
                        account: A.account,
                        mintAddress: A.mintAddress,
                        amount: A.convertAmount(),
                    },
                    {
                        account: B.account,
                        mintAddress: B.mintAddress,
                        amount: B.convertAmount(),
                    },
                ];

                // use input from B as offset during pool init for curve with offset
                if (
                    options.curveType === CurveType.ConstantProductWithOffset &&
                    !instance
                ) {
                    options.token_b_offset = components[1].amount;
                    components[1].amount = 0;
                }

                addLiquidity(connection, wallet, components, slippage, instance, options, publicKey, notify, sendTransaction)
                    .then(() => {
                        setPendingTx(false);
                    })
                    .catch((e) => {
                        console.log("Transaction failed", e);
                        notify("error", "Please try again and approve transactions from your wallet. Adding liquidity cancelled.")
                        setPendingTx(false);
                    });
            }
        };

    const hasSufficientBalance = A.sufficientBalance() && B.sufficientBalance();

    const getDepositToken = () => {
        if (!depositToken) {
            return undefined;
        }
        return depositToken === A.mintAddress ? A : B;
    };

    const handleToggleDepositType = (item) => {
        if (item === pool?.pubkeys.mint.toBase58()) {
            setDepositType("both");
        } else if (item === A.mintAddress) {
            if (depositType !== "one") {
                setDepositType("one");
            }
            setDepositToken(A.mintAddress);
        } else if (item === B.mintAddress) {
            if (depositType !== "one") {
                setDepositType("one");
            }
            setDepositToken(B.mintAddress);
        }
    };

    const createPoolButton = pool && (
        <LoadingButton
            className="add-button"
            type="primary"
            size="large"
            onClick={() => executeAction()}
            loading={pendingTx}
            disabled={
                connected &&
                (pendingTx ||
                    !A.account ||
                    !B.account ||
                    A.account === B.account ||
                    !hasSufficientBalance)
            }
        >
            {generateActionLabel(CREATE_POOL_LABEL, connected, tokenMap, A, B)}
        </LoadingButton>
    );

    const addLiquidityButton = (
        <WalletButton
            size="large"
            onClick={() => executeAction(pool)}
            trigger={["click"]}
            disabled={
                !connected || (connected && connected &&
                    (depositType === "both"
                        ? pendingTx ||
                        !A.account ||
                        !B.account ||
                        A.account === B.account ||
                        !hasSufficientBalance
                        : !getDepositToken()?.account ||
                        !getDepositToken()?.sufficientBalance()))
            }
            overlay={
                <PoolConfigCard
                    options={options}
                    setOptions={setOptions}
                    action={createPoolButton}
                />
            }>
            {depositType === "both"
                ? generateActionLabel(
                    pool ? ADD_LIQUIDITY_LABEL : CREATE_POOL_LABEL,
                    connected,
                    tokenMap,
                    A,
                    B
                )
                : generateExactOneLabel(connected, tokenMap, getDepositToken())}
            {pendingTx && <CircularProgress className="add-spinner"/>}
        </WalletButton>
    );

    const getTokenOptions = (t) => {
        let name = "";
        let mint = "";
        if (pool) {
            name = getPoolName(tokenMap, pool);
            mint = pool.pubkeys.mint.toBase58();
        }
        return (
            <>
                {pool && (
                    <FormControlLabel
                        key={`pool-${mint}`}
                        value={mint}
                        control={<Radio/>}
                        name={name}
                        label={`${t('common.add')} ${name}`}/>
                )}
                {[A, B].map((item) => {
                    return (
                        <FormControlLabel
                            key={item.mintAddress}
                            value={item.mintAddress}
                            control={<Radio/>}
                            name={item.name}
                            label={`${t('common.add')} ${item.name}`}/>
                    );
                })}
            </>
        );
    };

    const handleDescOpen = (event) => {
        setLiquidityDescAnchor(event.currentTarget)
    }

    const handleCloseAnchors = () => {
        setLiquidityDescAnchor(null)
    }

    const handleOpenCurrencyInput = (number) => () => {
        if (number === 1) {
            setOpenCurrencyInput({
                first: true,
                second: false
            })
        } else {
            setOpenCurrencyInput({
                first: false,
                second: true
            })
        }
    }

    const handleCloseCurrencyInput = () => {
        setOpenCurrencyInput({
            first: false,
            second: false
        })
    }

    return (
        <StyledPageContainer>
            <BackgroundDarkBlue/>
            <SwapWrapper>
                <Title>{t('liquidityPage.title')}</Title>
                <Card>
                    <Button
                        type="text"
                        onClick={handleDescOpen}>
                        Read more about providing liquidity.
                    </Button>
                    <Popover
                        open={Boolean(liquidityDescAnchor)}
                        anchorEl={liquidityDescAnchor}
                        onClose={handleCloseAnchors}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}>
                        <Text>
                            Liquidity providers earn a fixed percentage fee on all trades
                            proportional to their share of the pool. Fees are added to the pool,
                            accrue in real time and can be claimed by withdrawing your
                            liquidity.
                        </Text>
                    </Popover>
                    {isLatestLayout && pool && (
                        <CenteredRow>
                            <RadioGroup
                                row
                                onChange={(item) => handleToggleDepositType(item.target.value)}
                                value={
                                    depositType === "both"
                                        ? pool?.pubkeys.mint.toBase58()
                                        : getDepositToken()?.mintAddress
                                }>
                                {getTokenOptions(t)}
                            </RadioGroup>
                        </CenteredRow>
                    )}
                    {depositType === "both" && (
                        <>
                            <CurrencyInput
                                open={openCurrencyInput.first}
                                handleOpen={handleOpenCurrencyInput(1)}
                                handleClose={handleCloseCurrencyInput}
                                network={network}
                                title="Input"
                                onInputChange={(val) => {
                                    setPoolOperation(PoolOperation.Add);
                                    if (A.amount !== val) {
                                        setLastTypedAccount(A.mintAddress);
                                    }
                                    A.setAmount(val);
                                }}
                                amount={A.amount}
                                mint={A.mintAddress}
                                onMintChange={(item) => {
                                    A.setMint(item);
                                }}
                            />
                            <div>+</div>
                            <CurrencyInput
                                open={openCurrencyInput.second}
                                handleOpen={handleOpenCurrencyInput(2)}
                                handleClose={handleCloseCurrencyInput}
                                network={network}
                                title={
                                    options.curveType === CurveType.ConstantProductWithOffset
                                        ? "Offset"
                                        : "Input"
                                }
                                onInputChange={(val) => {
                                    setPoolOperation(PoolOperation.Add);
                                    if (B.amount !== val) {
                                        setLastTypedAccount(B.mintAddress);
                                    }
                                    B.setAmount(val);
                                }}
                                amount={B.amount}
                                mint={B.mintAddress}
                                onMintChange={(item) => {
                                    B.setMint(item);
                                }}
                            />
                        </>
                    )}
                    {depositType === "one" && depositToken && (
                        <CurrencyInput
                            network={network}
                            title="Input"
                            onInputChange={(val) => {
                                setPoolOperation(PoolOperation.Add);
                                const dToken = getDepositToken();
                                if (dToken && dToken.amount !== val) {
                                    setLastTypedAccount(dToken.mintAddress);
                                }
                                getDepositToken()?.setAmount(val);
                            }}
                            amount={getDepositToken()?.amount}
                            mint={getDepositToken()?.mintAddress}
                            hideSelect={true}
                        />
                    )}
                    {addLiquidityButton}
                    {pool && <PoolPrice pool={pool}/>}
                    <SupplyOverview pool={pool}/>
                    <YourPosition pool={pool}/>
                </Card>
            </SwapWrapper>
        </StyledPageContainer>
    );
}


export const PoolPrice = (props) => {
    const pool = props.pool;
    const pools = useMemo(() => [props.pool].filter((p) => p), [
        props.pool,
    ]);
    const enriched = useEnrichedPools(pools)[0];

    const {userAccounts} = useUserAccounts();
    const lpMint = useMint(pool.pubkeys.mint);

    const ratio =
        userAccounts
            .filter((f) => pool.pubkeys.mint.equals(f.info.mint))
            .reduce((acc, item) => item.info.amount.toNumber() + acc, 0) /
        (lpMint?.supply.toNumber() || 0);

    if (!enriched) {
        return null;
    }
    return (
        <Card
            style={{borderRadius: 20, width: "100%"}}
            bodyStyle={{padding: "7px"}}
            size="small"
            title="Prices and pool share"
        >
            <Row style={{width: "100%"}}>
                <Col span={8}>
                    {formatPriceNumber.format(
                        parseFloat(enriched.liquidityA) / parseFloat(enriched.liquidityB)
                    )}
                </Col>
                <Col span={8}>
                    {formatPriceNumber.format(
                        parseFloat(enriched.liquidityB) / parseFloat(enriched.liquidityA)
                    )}
                </Col>
                <Col span={8}>
                    {ratio * 100 < 0.001 && ratio > 0 ? "<" : ""}
                    &nbsp;{formatPriceNumber.format(ratio * 100)}%
                </Col>
            </Row>
            <Row style={{width: "100%"}}>
                <Col span={8}>
                    {enriched.names[0]} per {enriched.names[1]}
                </Col>
                <Col span={8}>
                    {enriched.names[1]} per {enriched.names[0]}
                </Col>
                <Col span={8}>Share of pool</Col>
            </Row>
        </Card>
    );
};

export const YourPosition = (props) => {
    const {pool} = props;
    const pools = useMemo(() => [props.pool].filter((p) => p), [
        props.pool,
    ]);
    const enriched = useEnrichedPools(pools)[0];
    const {userAccounts} = useUserAccounts();
    const lpMint = useMint(pool?.pubkeys.mint);

    if (!pool || !enriched) {
        return null;
    }
    const baseMintAddress = pool.pubkeys.holdingMints[0].toBase58();
    const quoteMintAddress = pool.pubkeys.holdingMints[1].toBase58();

    const ratio =
        userAccounts
            .filter((f) => pool.pubkeys.mint.equals(f.info.mint))
            .reduce((acc, item) => item.info.amount.toNumber() + acc, 0) /
        (lpMint?.supply.toNumber() || 0);

    return (
        <Card
            className="ccy-input"
            style={{borderRadius: 20, width: "100%"}}
            bodyStyle={{padding: "7px"}}
            size="small"
            title="Your Position"
        >
            <div className="pool-card" style={{width: "initial"}}>
                <div className="pool-card-row">
                    <div className="pool-card-cell">
                        <div style={{display: "flex", alignItems: "center"}}>
                            <PoolIcon mintA={baseMintAddress} mintB={quoteMintAddress}/>
                            <h3 style={{margin: 0}}>{enriched?.name}</h3>
                        </div>
                    </div>
                    <div className="pool-card-cell">
                        <h3 style={{margin: 0}}>
                            {formatPriceNumber.format(ratio * enriched.supply)}
                        </h3>
                    </div>
                </div>
                <div className="pool-card-row" style={{margin: 0}}>
                    <div className="pool-card-cell">Your Share:</div>
                    <div className="pool-card-cell">
                        {ratio * 100 < 0.001 && ratio > 0 ? "<" : ""}
                        {formatPriceNumber.format(ratio * 100)}%
                    </div>
                </div>
                <div className="pool-card-row" style={{margin: 0}}>
                    <div className="pool-card-cell">{enriched.names[0]}:</div>
                    <div className="pool-card-cell">
                        {formatPriceNumber.format(ratio * enriched.liquidityA)}
                    </div>
                </div>
                <div className="pool-card-row" style={{margin: 0}}>
                    <div className="pool-card-cell">{enriched.names[1]}:</div>
                    <div className="pool-card-cell">
                        {formatPriceNumber.format(ratio * enriched.liquidityB)}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export const DEFAULT_DENOMINATOR = 10_000;

const FeeInput = (props) => {
    const [value, setValue] = useState(
        ((props.numerator / props.denominator) * 100).toString()
    );

    return (
        <div style={{padding: "3px 10px 3px 3px", border: "1px solid #434343"}}>
            <input
                className="slippage-input"
                size="small"
                value={value}
                style={{
                    width: 50,
                    fontSize: 14,
                    boxShadow: "none",
                    borderColor: "transparent",
                    outline: "transpaernt",
                }}
                onChange={(x) => {
                    setValue(x);

                    const val = parseFloat(x);
                    if (Number.isFinite(val)) {
                        const numerator = (val * DEFAULT_DENOMINATOR) / 100;
                        props.set(numerator, DEFAULT_DENOMINATOR);
                    }
                }}
            />
            %
        </div>
    );
};

export const PoolConfigCard = (props) => {
    const {
        tradeFeeNumerator,
        tradeFeeDenominator,
        ownerTradeFeeNumerator,
        ownerTradeFeeDenominator,
        ownerWithdrawFeeNumerator,
        ownerWithdrawFeeDenominator,
    } = props.options;

    return (
        <Card title="Pool configuration">
            <div className="pool-settings-grid">
                <>
                    <span>LPs Trading Fee:</span>
                    <FeeInput
                        numerator={tradeFeeNumerator}
                        denominator={tradeFeeDenominator}
                        set={(numerator, denominator) =>
                            props.setOptions({
                                ...props.options,
                                tradeFeeNumerator: numerator,
                                tradeFeeDenominator: denominator,
                            })
                        }
                    />
                </>
                <>
                    <span>Owner Trading Fee:</span>
                    <FeeInput
                        numerator={ownerTradeFeeNumerator}
                        denominator={ownerTradeFeeDenominator}
                        set={(numerator, denominator) =>
                            props.setOptions({
                                ...props.options,
                                ownerTradeFeeNumerator: numerator,
                                ownerTradeFeeDenominator: denominator,
                            })
                        }
                    />
                </>
                <>
                    <span>Withdraw Fee:</span>
                    <FeeInput
                        numerator={ownerWithdrawFeeNumerator}
                        denominator={ownerWithdrawFeeDenominator}
                        set={(numerator, denominator) =>
                            props.setOptions({
                                ...props.options,
                                ownerWithdrawFeeNumerator: numerator,
                                ownerWithdrawFeeDenominator: denominator,
                            })
                        }
                    />
                </>
                <>
                    <span>Curve Type:</span>
                    <Select
                        defaultValue="0"
                        style={{width: 200}}
                        onChange={(val) =>
                            props.setOptions({
                                ...props.options,
                                curveType: parseInt(val),
                            })
                        }
                    >
                        <option value="0">Constant Product</option>
                        <option value="1">Flat</option>
                    </Select>
                </>
            </div>
        </Card>
    );
};
