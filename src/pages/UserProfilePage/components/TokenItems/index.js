import React from "react";
import {getTokenIcon, getTokenName} from "../../../../helper/token";
import {TokenIcon} from "../../../../components/TokenIcon";
import {useConnectionConfig} from "../../../../context/GlobalProvider";
import {CircularProgress, Table, TableBody, TableCell, TableHead, TableRow} from "@mui/material";
import {useTranslation} from "react-i18next";

const TokenRow = ({token, tokenMap}) => {
    const mint = token.account.data.parsed.info.mint
    let name = getTokenName(tokenMap, mint, false);
    let iconExist = getTokenIcon(tokenMap, mint)
    let amount = token.account.data.parsed.info.tokenAmount.uiAmountString
    if (iconExist) {
        return (
            <TableRow>
                <TableCell>
                    <TokenIcon
                        style={{
                            width: 50,
                            height: "auto",
                            borderRadius: 50,
                            objectFit: "cover"
                        }}
                        mintAddress={mint}
                        icon={getTokenIcon(tokenMap, token.account.data.parsed.info.mint)}/>
                </TableCell>
                <TableCell align="right">{name}</TableCell>
                <TableCell align="right">{mint}</TableCell>
                <TableCell align="right">{amount}</TableCell>
            </TableRow>
        )
    }
    return null;
}

export default function TokenItems({tokens, loading}) {
    const {t} = useTranslation();
    const {tokenMap} = useConnectionConfig();
    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>{t('userProfilePage.tokenIcon')}</TableCell>
                    <TableCell align="right">{t('userProfilePage.tokenName')}</TableCell>
                    <TableCell align="right">{t('userProfilePage.tokenAddress')}</TableCell>
                    <TableCell align="right">{t('userProfilePage.tokenAmount')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {loading ? <TableRow>
                        <CircularProgress/>
                    </TableRow> :
                    tokens.map((token, index) => <TokenRow
                        key={`token-item-${index}`}
                        token={token}
                        tokenMap={tokenMap}/>)}
            </TableBody>
        </Table>
    );
}