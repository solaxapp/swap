import * as React from 'react';
import {useEffect, useState} from 'react';
import {default as MuiAppBar} from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CssBaseline from '@mui/material/CssBaseline';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import {styled} from "@mui/material/styles";
import {FlexRow} from "../Flex";
import {Avatar, IconButton, ListItemIcon, Menu, MenuItem} from "@mui/material";
import {useTranslation} from "react-i18next";
import SolaxImg from "../../assets/images/mini-solax.png"
import {useLocation, useNavigate} from "react-router-dom";
import {ROUTES, SOLAX_HOME_PAGE} from "../../constants/routes";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import {LAMPORTS_PER_SOL} from "@solana/web3.js";
import {Text} from "../Text";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Settings} from "../../helper/crypto/Slippage";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import {useSnackbar} from "notistack";
import PermIdentityIcon from '@mui/icons-material/PermIdentity';
import BlockIcon from '@mui/icons-material/Block';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

function ElevationScroll(props) {
    const {children, window} = props;
    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0,
        target: window ? window() : undefined,
    });
    return React.cloneElement(children, {
        elevation: trigger ? 4 : 0,
    });
}

const StyledToolbar = styled(Toolbar)(({theme}) => ({
    justifyContent: "space-between",
    padding: `${theme.spacing(0)} ${theme.spacing(2)}`
}))

const LogoWrapper = styled(FlexRow)(() => ({
    cursor: "pointer"
}))
const MenuItemsWrapper = styled(FlexRow)(() => ({}))
const RightWrapper = styled(FlexRow)(() => ({
    alignItems: "center"
}))

const StyledMuiAppBar = styled(MuiAppBar)(({theme}) => ({
    backgroundColor: "#192337"
}))

const Logo = styled('img')(() => ({
    height: 30,
    width: "auto"
}))

const StyledMenuItem = styled(MenuItem)(({theme, active}) => ({
    backgroundColor: active === "true" ? "#BEAFFA" : "none",
    ":hover": {
        backgroundColor: "#BEAFFA",
        border: "none"
    }
}))


export default function AppBar({slippage, network, changeNetwork, changeSlippage, activeTheme, changeTheme}) {
    const {t} = useTranslation();
    const {enqueueSnackbar} = useSnackbar();
    const location = useLocation();
    const navigate = useNavigate();
    const wallet = useWallet();
    const {publicKey} = wallet;
    const {connection} = useConnection();
    const [lamports, setLamports] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    useEffect(() => {
        if (publicKey)
            connection.getAccountInfo(publicKey).then(value => {
                setLamports(value?.lamports)
            })
    }, [connection, publicKey]);

    const onMenuItemClick = (page) => {
        navigate(page);
    }

    const goToProfile = () => {
        navigate(ROUTES.USER_PROFILE);
    }

    const onHomeClicked = () => {
        const newWindow = window.open(SOLAX_HOME_PAGE, '_blank', 'noopener,noreferrer')
        if (newWindow) newWindow.opener = null
    }

    const disconnectWallet = () => {
        wallet.disconnect().then(_ => {

        })
    }

    const copyWalletAddress = () => {
        navigator.clipboard.writeText(publicKey.toBase58())
        enqueueSnackbar(t('messages.successCopyWalletAddress'), {variant: "success"})
    }

    return (
        <React.Fragment>
            <CssBaseline/>
            <ElevationScroll>
                <StyledMuiAppBar>
                    <StyledToolbar>
                        <LogoWrapper onClick={onHomeClicked}>
                            <Logo src={SolaxImg} alt="logo"/>
                        </LogoWrapper>
                        <MenuItemsWrapper>
                            <StyledMenuItem
                                active={(ROUTES.APP_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.HOME_ROUTE)}>
                                {t('swapAppBar.swap')}
                            </StyledMenuItem>
                            <StyledMenuItem
                                active={(ROUTES.LIQUIDITY_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.LIQUIDITY_ROUTE)}>
                                {t('swapAppBar.liquidity')}
                            </StyledMenuItem>
                            <StyledMenuItem
                                active={(ROUTES.POOLS_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.POOLS_ROUTE)}>
                                {t('swapAppBar.pools')}
                            </StyledMenuItem>
                            <StyledMenuItem
                                active={(ROUTES.FARMS_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.FARMS_ROUTE)}>
                                {t('swapAppBar.farms')}
                            </StyledMenuItem>
                            <StyledMenuItem
                                active={(ROUTES.STAKING_ROUTE === location.pathname).toString()}
                                onClick={() => onMenuItemClick(ROUTES.STAKING_ROUTE)}>
                                {t('swapAppBar.staking')}
                            </StyledMenuItem>
                        </MenuItemsWrapper>
                        <RightWrapper>
                            {wallet.connected && (
                                <>
                                    <Text>{((lamports || 0) / LAMPORTS_PER_SOL).toFixed(6)} SOL</Text>
                                    <IconButton
                                        onClick={handleClick}
                                        size="small"
                                        sx={{ml: 2}}
                                        aria-controls={open ? 'account-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={open ? 'true' : undefined}>
                                        <Avatar sx={{width: 32, height: 32}} src={PermIdentityIcon}/>
                                    </IconButton>
                                    <Menu
                                        anchorEl={anchorEl}
                                        id="account-menu"
                                        open={open}
                                        onClose={handleClose}
                                        onClick={handleClose}
                                        transformOrigin={{horizontal: 'right', vertical: 'top'}}
                                        anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}>
                                        <Settings
                                            slippage={slippage}
                                            network={network}
                                            changeNetwork={changeNetwork}
                                            changeSlippage={changeSlippage}
                                        />
                                        <MenuItem onClick={goToProfile}>
                                            <ListItemIcon>
                                                <PermIdentityIcon/>
                                            </ListItemIcon>
                                            {t('swapAppBar.profile')}
                                        </MenuItem>
                                        <MenuItem onClick={copyWalletAddress}>
                                            <ListItemIcon>
                                                <AccountBalanceWalletIcon/>
                                            </ListItemIcon>
                                            {publicKey.toBase58().substring(0, 15)}...
                                        </MenuItem>
                                        <MenuItem onClick={changeTheme}>
                                            <ListItemIcon>
                                                {activeTheme === 'dark' ? <Brightness7Icon/> : <Brightness4Icon/>}
                                            </ListItemIcon>
                                            {t('swapAppBar.theme')}
                                        </MenuItem>
                                        <MenuItem onClick={disconnectWallet}>
                                            <ListItemIcon>
                                                <BlockIcon/>
                                            </ListItemIcon>
                                            {t('common.disconnectWallet')}
                                        </MenuItem>
                                    </Menu>
                                </>)}
                            {!wallet.connected && (
                                <WalletMultiButton/>
                            )}
                        </RightWrapper>
                    </StyledToolbar>
                </StyledMuiAppBar>
            </ElevationScroll>
        </React.Fragment>
    );
}