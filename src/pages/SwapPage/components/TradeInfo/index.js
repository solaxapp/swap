import React, {useEffect, useMemo, useState} from "react";
import {useCurrencyPairState} from "../../../../context/CurrencyPairProvider";
import {useSlippageConfig} from "../../../../context/GlobalProvider";
import {useEnrichedPools} from "../../../../context/MarketProvider";
import {LIQUIDITY_PROVIDER_FEE} from "../../../../constants/app";
import {Text} from "../../../../components/Text";
import {Button, CircularProgress, Popover} from "@mui/material";
import {colorWarning} from "../../../../helper/other";
import {styled} from "@mui/material/styles";
import {CenteredCol, CenteredRow} from "../../../../components/Flex";

const Container = styled(CenteredCol)(() => ({}))
const PriceWrapper = styled(CenteredRow)(() => ({}))

export default function TradeInfo({pool}) {
    const {A, B} = useCurrencyPairState();
    const {slippage} = useSlippageConfig();
    const pools = useMemo(() => (pool ? [pool] : []), [pool]);
    const enriched = useEnrichedPools(pools);

    const [amountOut, setAmountOut] = useState(0);
    const [priceImpact, setPriceImpact] = useState(0);
    const [lpFee, setLpFee] = useState(0);
    const [exchangeRate, setExchangeRate] = useState(0);
    const [priceAccount, setPriceAccount] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true)
        if (!pool || enriched.length === 0) {
            return;
        }
        if (B.amount) {
            const minAmountOut = parseFloat(B?.amount) * (1 - slippage);
            setAmountOut(minAmountOut);
        }
        const liqA = enriched[0].liquidityA;
        const liqB = enriched[0].liquidityB;
        const supplyRatio = liqA / liqB;
        // We need to make sure the order matched the pool's accounts order
        const enrichedA = A.mintAddress === enriched[0].mints[0] ? A : B;
        const enrichedB = enrichedA.mintAddress === A.mintAddress ? B : A;
        const calculatedRatio =
            parseFloat(enrichedA.amount) / parseFloat(enrichedB.amount);
        // % difference between pool ratio and  calculated ratio
        setPriceImpact(Math.abs(100 - (calculatedRatio * 100) / supplyRatio));

        // 6 decimals without trailing zeros
        const lpFeeStr = (parseFloat(A.amount) * LIQUIDITY_PROVIDER_FEE).toFixed(6);
        setLpFee(parseFloat(lpFeeStr));

        if (priceAccount === B.mintAddress) {
            setExchangeRate(parseFloat(B.amount) / parseFloat(A.amount));
        } else {
            setExchangeRate(parseFloat(A.amount) / parseFloat(B.amount));
        }
        setLoading(false);
    }, [A, B, slippage, pool, enriched, priceAccount]);

    const handleSwapPriceInfo = () => {
        if (priceAccount !== B.mintAddress) {
            setPriceAccount(B.mintAddress);
        } else {
            setPriceAccount(A.mintAddress);
        }
    };

    if (loading) {
        return (
            <Container>
                <CircularProgress/>
            </Container>
        );
    }

    return !!parseFloat(B.amount) ? (
        <Container>
            <PriceWrapper>
                <Text>Price</Text>
                <div className="pool-card-cell " title={exchangeRate.toString()}>
                    <Button
                        shape="circle"
                        size="middle"
                        type="text"
                        // icon={<SwapOutlined />}
                        onClick={handleSwapPriceInfo}
                    >
                        {exchangeRate.toFixed(6)}&nbsp;
                        {priceAccount === B.mintAddress ? B.name : A.name} per&nbsp;
                        {priceAccount === B.mintAddress ? A.name : B.name}&nbsp;
                    </Button>
                </div>
            </PriceWrapper>
            <div className="pool-card-row">
                <Text className="pool-card-cell">
                    <Popover
                        trigger="hover"
                        content={
                            <div style={{width: 300}}>
                                You transaction will revert if there is a large, unfavorable
                                price movement before it is confirmed.
                            </div>
                        }
                    >
                        Minimum Received
                    </Popover>
                </Text>
                <div className="pool-card-cell " title={amountOut.toString()}>
                    {amountOut.toFixed(6)} {B.name}
                </div>
            </div>
            <div className="pool-card-row">
                <Text className="pool-card-cell">
                    <Popover
                        trigger="hover"
                        content={
                            <div style={{width: 300}}>
                                The difference between the market price and estimated price due
                                to trade size.
                            </div>
                        }
                    >
                        Price Impact
                    </Popover>
                </Text>
                <div
                    className="pool-card-cell "
                    title={priceImpact.toString()}
                    style={{color: colorWarning(priceImpact)}}
                >
                    {priceImpact < 0.01 ? "< 0.01%" : priceImpact.toFixed(3) + "%"}
                </div>
            </div>
            <div className="pool-card-row">
                <Text className="pool-card-cell">
                    <Popover
                        trigger="hover"
                        content={
                            <div style={{width: 300}}>
                                A portion of each trade ({LIQUIDITY_PROVIDER_FEE * 100}%) goes
                                to liquidity providers as a protocol incentive.
                            </div>
                        }
                    >
                        Liquidity Provider Fee
                    </Popover>
                </Text>
                <div className="pool-card-cell " title={lpFee.toString()}>
                    {lpFee} {A.name}
                </div>
            </div>
        </Container>
    ) : null;
};