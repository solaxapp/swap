import React from "react";
import {CenteredRow, FlexCol, FlexRow} from "../Flex";
import {styled} from "@mui/material/styles";
import FooterLogo from "./../../assets/images/footerLogo.svg"
import GithubIcon from "./../../assets/images/logoSolaX.svg"
import DiscordIcon from "./../../assets/images/discord.svg"
import TwitterIcon from "./../../assets/images/twiter.svg"
import FooterBg from "./../../assets/images/FooterBackground.svg"
import {Typography} from "@mui/material";
import {useTranslation} from "react-i18next";

const FooterWrapper = styled(FlexCol)(({theme}) => ({
    zIndex: 1,
}))

const FooterBackground = styled('img')(({theme}) => ({
    zIndex: 1,
    width: "100%",
    height: "auto"
}))

const Container = styled(FlexRow)(({theme}) => ({
    backgroundColor: "#192337",
    padding: "60px 0px",
    justifyContent: "space-around",
    zIndex: 1,
    [theme.breakpoints.down('md')]: {
        flexWrap: "wrap",
        justifyContent: "center"
    },
}))

const BreakpointsWrapper = styled(FlexRow)(({theme}) => ({
    [theme.breakpoints.down('md')]: {
        flexWrap: "wrap",
        justifyContent: "center"
    },
}))

const Logo = styled('img')(({theme}) => ({
    height: 60,
    width: "auto",
    margin: "0px 20px"
}))

const ResourcesTitle = styled(Typography)(() => ({
    fontSize: 30,
    color: "#BEAFFA",
    textTransform: "uppercase"
}))

const ContactTitle = styled(Typography)(() => ({
    fontSize: 30,
    color: "#FF9999",
    textTransform: "uppercase"
}))

const Wrapper = styled(FlexCol)(({theme}) => ({
    zIndex: 1,
    margin: "0px 20px",
    [theme.breakpoints.down('md')]: {
        flexWrap: "wrap",
        alignItems: "center"
    },
}))

const SocialWrapper = styled(FlexCol)(({theme}) => ({
    fontSize: 30,
    color: "#00D2C8",
    [theme.breakpoints.down('md')]: {
        flexWrap: "wrap",
        alignItems: "center"
    },
}))

const SocialTitle = styled(Typography)(() => ({
    fontSize: 30,
    color: "#00D2C8",
    textTransform: "uppercase"
}))

const ResourcesLink = styled('a')(({theme}) => ({
    textDecoration: "unset",
    fontSize: 12,
    color: theme.palette.common.white,
    cursor: "pointer",
    ":hover": {
        color: "#BEAFFA",
    }
}))

const ContactLink = styled('a')(({theme}) => ({
    textDecoration: "unset",
    fontSize: 12,
    color: theme.palette.common.white,
    cursor: "pointer",
    ":hover": {
        color: "#FF9999",
    }
}))

const SocialIcon = styled('img')(({theme}) => ({
    height: 30,
    width: "auto",
    cursor: "pointer",
    margin: 10,
}))

export default function Footer() {
    const {t} = useTranslation();
    return (
        <FooterWrapper>
            <Container>
                <BreakpointsWrapper>
                    <Logo src={FooterLogo} alt="Sola-x"/>
                    <Wrapper>
                        <ResourcesTitle>{t('common.resources')}</ResourcesTitle>
                        {t('footer.resources', {returnObjects: true}).map((value, index) => {
                            return (
                                <ResourcesLink
                                    key={`resourece-item-${index}`}
                                    href={value.link}
                                    target="_blank">
                                    {value.title}
                                </ResourcesLink>
                            );
                        })}
                    </Wrapper>
                    <Wrapper>
                        <ContactTitle>{t('common.contact')}</ContactTitle>
                        {t('footer.contact', {returnObjects: true}).map((value, index) => {
                            return (
                                <ContactLink
                                    key={`resourece-item-${index}`}
                                    href={value.link}
                                    rel='noopener noreferrer'
                                    target="_blank">
                                    {value.title}
                                </ContactLink>
                            );
                        })}
                    </Wrapper>
                </BreakpointsWrapper>
                <SocialWrapper>
                    <SocialTitle>{t('common.social')}</SocialTitle>
                    <CenteredRow>
                        <a href="www.google.com"
                           target="_blank">
                            <SocialIcon
                                src={GithubIcon}
                                alt="github-icon"/>
                        </a>
                        <a href="www.google.com"
                           target="_blank">
                            <SocialIcon
                                src={DiscordIcon}
                                alt="discord-icon"/>
                        </a>
                        <a href="www.google.com"
                           target="_blank">
                            <SocialIcon
                                src={TwitterIcon}
                                alt="twitter-icon"/>
                        </a>
                    </CenteredRow>
                </SocialWrapper>
            </Container>
            <FooterBackground
                src={FooterBg}
                alt="footer-background"
            />
        </FooterWrapper>
    );
}