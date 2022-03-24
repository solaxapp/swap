import React from "react";
import {Card, CardContent, CardHeader, MenuItem, Select, styled, ToggleButton, ToggleButtonGroup} from "@mui/material";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
import {CenteredCol} from "../../../components/Flex";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({theme}) => ({
    "& .Mui-selected": {
        color: theme.palette.common.white,
        border: `1px solid ${theme.palette.common.white}`,
        borderLeft: `1px solid ${theme.palette.common.white} !important`
    }
}))

const StyledCard = styled(Card)(() => ({
    width: "100%"
}))

const StyledSelect = styled(Select)(({theme}) => ({
    width: "100%"
}))

const Slippage = (props) => {
    const {slippage, changeSlippage} = props
    return (
        <StyledToggleButtonGroup
            color="primary"
            value={slippage}
            exclusive
            onChange={changeSlippage}>
            {[0.1, 0.5, 1.0, 2.0].map((item) => {
                return (
                    <ToggleButton
                        key={item.toString()}
                        value={item / 100.0}>
                        {item}%
                    </ToggleButton>
                );
            })}
        </StyledToggleButtonGroup>
    );
};

export const Settings = ({slippage, changeSlippage, network, changeNetwork}) => {
    const networks = [WalletAdapterNetwork.Testnet, WalletAdapterNetwork.Devnet, WalletAdapterNetwork.Mainnet]
    return (
        <CenteredCol>
            <Card>
                <CardHeader title="Slippage:"/>
                <CardContent>
                    <Slippage
                        slippage={slippage}
                        changeSlippage={changeSlippage}/>
                </CardContent>
            </Card>
            <StyledCard>
                <CardHeader title="Network"/>
                <CardContent>
                    <StyledSelect
                        value={network}
                        onChange={changeNetwork}>
                        {networks.map((value, index) => (
                            <MenuItem key={index} value={value}>{value}</MenuItem>
                        ))}
                    </StyledSelect>
                </CardContent>
            </StyledCard>
        </CenteredCol>
    );
};
