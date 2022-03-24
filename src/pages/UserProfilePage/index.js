import React, {useEffect, useState} from "react";
import {styled} from "@mui/material/styles";
import {CenteredCol, CenteredRow, FlexCol, PageContainer} from "../../components/Flex";
import {Typography} from "@mui/material";
import {useTranslation} from "react-i18next";
import {useOwnedPools} from "../../helper/crypto/Pools";
import PoolItem from "./components/PoolItem";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {getParsedProgramAccounts} from "../../helper/solana";
import NoContents from "../../components/NoContents";
import {ROUTES} from "../../constants/routes";
import TokenItems from "./components/TokenItems";

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


const Wrapper = styled(CenteredCol)(() => ({
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
    width: "100%"
}))

const PoolsWrapper = styled(CenteredRow)(({theme}) => ({
    flexWrap: "wrap"
}))

export default function UserProfilePage() {
    const {publicKey} = useWallet();
    const {connection} = useConnection();
    const {t} = useTranslation();
    const pools = useOwnedPools();
    const [walletTokens, setWalletTokens] = useState([]);
    const [loadingTokens, setLoadingTokens] = useState(true);

    useEffect(() => {
        setLoadingTokens(true);
        getParsedProgramAccounts(connection, publicKey).then(value => {
            setWalletTokens(value)
            setLoadingTokens(false);
        })
    }, [publicKey, connection]);

    return (
        <StyledPageContainer>
            <BackgroundDarkBlue/>
            <Wrapper>
                <Title>{t('userProfilePage.title')}</Title>
                <Card>
                    <Title>Pools</Title>
                    <PoolsWrapper>
                        {pools && pools.length > 0 ?
                            (pools.map((pool, index) => {
                                    return (
                                        <PoolItem
                                            key={`pool-${index}`}
                                            item={pool}
                                        />
                                    )
                                }
                            ))
                            : <NoContents
                                link={ROUTES.POOLS_ROUTE}
                                linkText={t('userProfilePage.poolLinkText')}
                                text={t('userProfilePage.noPools')}/>
                        }
                    </PoolsWrapper>
                </Card>
                <Card>
                    <Title>Tokens</Title>
                    {walletTokens && walletTokens.length > 0 ?
                        <TokenItems
                            tokens={walletTokens}
                            loading={loadingTokens}/>
                        : <NoContents
                            text={t('userProfilePage.noTokens')}/>
                    }
                </Card>
            </Wrapper>
        </StyledPageContainer>
    );
}