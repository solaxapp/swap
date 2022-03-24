import React from "react";
import {shortenAddress} from "../../helper/token";
import {Typography} from "@mui/material";
import {styled} from "@mui/material/styles";

const Link = styled('a')(({theme})=>({
    paddingLeft: 5,
    paddingRight: 5,
    color: theme.palette.common.white,
    textDecoration: "none"
}))

export const ExplorerLink = ({address, type, code,length = 9}) => {
    const localAddress =
        typeof address === "string"
            ? address
            : address?.toBase58();

    if (!localAddress) {
        return null;
    }

    return (
        <Link
            href={`https://explorer.solana.com/${type}/${localAddress}`}
            target="_blank"
            title={localAddress}>
            {code ? (
                <Typography>
                    {shortenAddress(localAddress, length)}
                </Typography>
            ) : (
                shortenAddress(localAddress, length)
            )}
        </Link>
    );
};
