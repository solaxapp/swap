import React from "react";
import {styled} from "@mui/material/styles";
import {CenteredRow} from "../Flex";
import logoSolaX from "../../assets/images/logoSolaX.svg"
import {Typography} from "@mui/material";

const Wrapper = styled(CenteredRow)(() => ({
    padding: 20,
    width: "100%"
}))

const Image = styled('img')(() => ({
    maxWidth: 400,
    width: 150
}))

const Text = styled(Typography)(() => ({
    paddingLeft: 20,
    paddingRight: 5,
    fontSize: 20
}))

const Link = styled('a')(({theme}) => ({
    fontSize: 20,
    color: theme.palette.common.white
}))

export default function NoContents({link, linkText, text}) {
    return (
        <Wrapper>
            <Image src={logoSolaX} alt="solaX-image"/>
            <Text>{text}!</Text>
            {link && linkText && <Link href={link}>{linkText}</Link>}
        </Wrapper>
    );
}