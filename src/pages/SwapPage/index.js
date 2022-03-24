import React, {useState} from "react";
import {styled} from "@mui/material/styles";
import {CenteredCol, FlexCol, PageContainer} from "../../components/Flex";
import {Button, CircularProgress, IconButton, Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import "../../assets/css/swap.css"
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {useCurrencyPairState} from "../../context/CurrencyPairProvider";
import {useConnectionConfig} from "../../context/GlobalProvider";
import {swap, usePoolForBasket} from "../../helper/crypto/Pools";
import {PoolOperation} from "../../constants/app";
import {useNotify} from "../../context/Notifications";
import CurrencyInput from "../../components/CurrencyInput";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PendingOutlinedIcon from "@mui/icons-material/PendingOutlined";
import {generateActionLabel, POOL_NOT_AVAILABLE} from "../../constants/labels";
import {getTokenName} from "../../helper/token";
import {useOutletContext} from "react-router-dom";
import {AddressesPopover} from "./components/PoolAddress";

const antIcon = <PendingOutlinedIcon style={{fontSize: 24}} spin/>;

const SwapIcon = styled(SwapHorizIcon)(() => ({
    transform: "rotate(90deg)"
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

export default function SwapPage() {
    const {network, slippage} = useOutletContext();
    const {t} = useTranslation();
    const {wallet, connected} = useWallet();
    const {connection} = useConnection();
    const [pendingTx, setPendingTx] = useState(false);
    const [openCurrencyInput, setOpenCurrencyInput] = useState({
        first: false,
        second: false
    });
    const {A, B, setLastTypedAccount, setPoolOperation} = useCurrencyPairState();
    const pool = usePoolForBasket([A?.mintAddress, B?.mintAddress]);
    const {tokenMap} = useConnectionConfig();
    const notify = useNotify();

    const swapAccounts = () => {
        const tempMint = A.mintAddress;
        const tempAmount = A.amount;
        A.setMint(B.mintAddress);
        A.setAmount(B.amount);
        B.setMint(tempMint);
        B.setAmount(tempAmount);
        setPoolOperation((op) => {
            switch (+op) {
                case PoolOperation.SwapGivenInput:
                    return PoolOperation.SwapGivenProceeds;
                case PoolOperation.SwapGivenProceeds:
                    return PoolOperation.SwapGivenInput;
                case PoolOperation.Add:
                    return PoolOperation.SwapGivenInput;
            }
        });
    };

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

    const handleSwap = async () => {
        if (A.account && B.mintAddress) {
            try {
                setPendingTx(true);

                const components = [
                    {
                        account: A.account,
                        mintAddress: A.mintAddress,
                        amount: A.convertAmount(),
                    },
                    {
                        mintAddress: B.mintAddress,
                        amount: B.convertAmount(),
                    },
                ];

                await swap(connection, wallet, components, slippage, pool);
            } catch (e) {
                console.log("SWAP ERROR", e)
                notify("error", "Please try again and approve transactions from your wallet. Swap trade cancelled.");
            } finally {
                setPendingTx(false);
            }
        }
    };

    return (
        <StyledPageContainer>
            <BackgroundDarkBlue/>
            <SwapWrapper>
                <Title>{t('swapPage.title')}</Title>
                <Card>
                    <CenteredCol>
                        <AddressesPopover pool={pool}/>
                        <CurrencyInput
                            open={openCurrencyInput.first}
                            handleOpen={handleOpenCurrencyInput(1)}
                            handleClose={handleCloseCurrencyInput}
                            network={network}
                            title="Input"
                            amount={A.amount}
                            mint={A.mintAddress}
                            onInputChange={(value) => {
                                if (A.amount !== value) {
                                    setLastTypedAccount(A.mintAddress);
                                }
                                A.setAmount(value);
                            }}
                            onMintChange={(item) => {
                                console.log("onMintChange A", item)
                                A.setMint(item);
                            }}
                        />
                        <IconButton onClick={swapAccounts}>
                            <SwapIcon/>
                        </IconButton>
                        <CurrencyInput
                            open={openCurrencyInput.second}
                            handleOpen={handleOpenCurrencyInput(2)}
                            handleClose={handleCloseCurrencyInput}
                            network={network}
                            title="To (Estimate)"
                            amount={B.amount}
                            mint={B.mintAddress}
                            onInputChange={(val) => {
                                if (B.amount !== val) {
                                    setLastTypedAccount(B.mintAddress);
                                }

                                B.setAmount(val);
                            }}
                            onMintChange={(item) => {
                                console.log("onMintChange B", item)
                                B.setMint(item);
                            }}
                        />
                        <WalletButton
                            size="large"
                            onClick={handleSwap}
                            disabled={
                                !connected || (connected &&
                                    (pendingTx ||
                                        !A.account ||
                                        !B.mintAddress ||
                                        A.account === B.account ||
                                        !A.sufficientBalance() ||
                                        !pool))
                            }>
                            {generateActionLabel(
                                !pool
                                    ? POOL_NOT_AVAILABLE(
                                        getTokenName(tokenMap, A.mintAddress),
                                        getTokenName(tokenMap, B.mintAddress)
                                    )
                                    : t('common.swap'),
                                connected,
                                tokenMap,
                                A,
                                B,
                                true
                            )}
                            {pendingTx && <CircularProgress indicator={antIcon} className="trade-spinner"/>}
                        </WalletButton>
                        {/*<TradeInfo pool={pool}/>*/}
                    </CenteredCol>
                </Card>
            </SwapWrapper>
        </StyledPageContainer>
    );
}