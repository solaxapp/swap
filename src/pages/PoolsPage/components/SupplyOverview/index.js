import React, {useEffect, useMemo, useRef} from "react";
import {useEnrichedPools} from "../../../../context/MarketProvider";

export const SupplyOverview = ({ pool}) => {
    const pools = useMemo(() => (pool ? [pool] : []), [pool]);
    const enriched = useEnrichedPools(pools);
    const chartDiv = useRef(null);

    // dispose chart
    useEffect(() => {
        const div = chartDiv.current;
        return () => {
            let instance = div /*&& echarts.getInstanceByDom(div)*/;
            instance && instance.dispose();
        };
    }, []);

    useEffect(() => {
        if (!chartDiv.current || enriched.length === 0) {
            return;
        }

        let instance = ""/*echarts.getInstanceByDom(chartDiv.current)*/;
        if (!instance) {
            instance = ""/*echarts.init(chartDiv.current)*/;
        }

        const data = [
            {
                name: enriched[0].names[0],
                value: enriched[0].liquidityAinUsd,
                tokens: enriched[0].liquidityA,
            },
            {
                name: enriched[0].names[1],
                value: enriched[0].liquidityBinUsd,
                tokens: enriched[0].liquidityB,
            },
        ];
//TODO ADD CHART FOR LIQUIDITY
    //     instance.setOption({
    //         tooltip: {
    //             trigger: "item",
    //             formatter: function (params) {
    //                 var val = formatUSD.format(params.value);
    //                 var tokenAmount = formatNumber.format(params.data.tokens);
    //                 return `${params.name}: \n${val}\n(${tokenAmount})`;
    //             },
    //         },
    //         series: [
    //             {
    //                 name: "Liquidity",
    //                 type: "pie",
    //                 top: 0,
    //                 bottom: 0,
    //                 left: 0,
    //                 right: 0,
    //                 animation: false,
    //                 label: {
    //                     fontSize: 14,
    //                     show: true,
    //                     formatter: function (params) {
    //                         var val = formatUSD.format(params.value);
    //                         var tokenAmount = formatNumber.format(params.data.tokens);
    //                         return `{c|${params.name}}\n{r|${tokenAmount}}\n{r|${val}}`;
    //                     },
    //                     rich: {
    //                         c: {
    //                             color: "#999",
    //                             lineHeight: 22,
    //                             align: "center",
    //                         },
    //                         r: {
    //                             color: "#999",
    //                             align: "right",
    //                         },
    //                     },
    //                     color: "rgba(255, 255, 255, 0.5)",
    //                 },
    //                 itemStyle: {
    //                     normal: {
    //                         borderColor: "#000",
    //                     },
    //                 },
    //                 data,
    //             },
    //         ],
    //     });
    }, [enriched]);

    if (enriched.length === 0) {
        return null;
    }

    return <div ref={chartDiv} style={{ height: 150, width: "100%" }} />;
};
