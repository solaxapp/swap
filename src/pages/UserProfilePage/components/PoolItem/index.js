import React, {useEffect, useState} from "react";
import {useCurrencyPairState} from "../../../../context/CurrencyPairProvider";
import {useConnectionConfig} from "../../../../context/GlobalProvider";
import {useMint} from "../../../../context/AccountsProvider";
import {Tooltip, Typography} from "@mui/material";
import {getPoolName} from "../../../../helper/token";
import {Cell, Label, Pie, PieChart, ResponsiveContainer, Sector} from "recharts";
import {styled} from "@mui/material/styles";
import {CenteredCol, CenteredRow, FlexCol} from "../../../../components/Flex";
import {useTranslation} from "react-i18next";

const PoolCard = styled(FlexCol)(({theme}) => ({
    padding: 10,
    margin: 10,
    border: "1px solid #00D2C8",
    borderRadius: 25,
}))

const ChartWrapper = styled('div')(({theme}) => ({
    width: 430,
    height: 180,
}))

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value} = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/>
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#fff">{`PV ${value}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#fff">
                {`(Rate ${(percent * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};

export default function PoolItem({item}) {
    const {t} = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const {A, B} = useCurrencyPairState();
    const {tokenMap} = useConnectionConfig();
    const mint = useMint(item.account.info.mint.toBase58());
    const amount =
        item.account.info.amount.toNumber() / Math.pow(10, mint?.decimals || 0);

    useEffect(() => {
        A.setMint(item.pool.pubkeys.holdingMints[0].toBase58());
        B.setMint(item.pool.pubkeys.holdingMints[1].toBase58());
    }, [A, B, item]);

    const dataForChart = [
        {
            name: A.name,
            value: 90
        },
        {
            name: B.name,
            value: 30
        }
    ]

    const onPieEnter = (_, index) => {
        setActiveIndex(index)
    };

    if (item) {
        return (
            <PoolCard>
                <CenteredCol>
                    <Typography>{getPoolName(tokenMap, item.pool)}</Typography>
                    <CenteredRow>
                        <Typography>{amount?.toFixed(4)}</Typography>
                        <Tooltip title={t('common.feeAccount')}>
                            <Typography>
                                {item.isFeeAccount ? " (F) " : " "}
                            </Typography>
                        </Tooltip>
                    </CenteredRow>
                </CenteredCol>
                <ChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataForChart}
                                cx="50%"
                                cy="50%"
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                innerRadius={40}
                                fill="#BEAFFA"
                                onMouseEnter={onPieEnter}
                                dataKey="value">
                                <Label
                                    position="centerBottom" className='label-top'
                                    fontSize='27px'
                                />
                                {dataForChart.map((entry, index) =>
                                    <Cell
                                        cursor="pointer"
                                        fill={COLORS[index + 1 % COLORS.length]}
                                        key={`cell-${index}`}/>)
                                }
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartWrapper>
                {/*<RemoveLiquidity instance={item} slippage={slippage} />*/}
            </PoolCard>
        );
    }

    return null;
};