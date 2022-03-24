import React from "react";
import logoSolaX from "../../../assets/images/logoSolaX.svg";
import {useTranslation} from "react-i18next";
import {styled} from "@mui/material/styles";
import {Button} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "../../../constants/routes";

const AppButton = styled(Button)(({theme}) => ({
    position: "absolute",
    color: theme.palette.common.white,
    border: "none",
    zIndex: 1,
    top: 100,
    right: 150,
    backgroundColor: theme.palette.common.orange,
    ":hover": {
        backgroundColor: "#192337",
        border: "none"
    },
    [theme.breakpoints.down('md')]: {
        right: 20,
    },
    [theme.breakpoints.down('sm')]: {
        display: "none"
    },
}))

const AppButtonAppBar = styled(Button)(({theme}) => ({
    color: theme.palette.common.white,
    border: "none",
    display: "none",
    backgroundColor: theme.palette.common.orange,
    ":hover": {
        backgroundColor: "#192337",
        border: "none"
    },
    [theme.breakpoints.down('sm')]: {
        display: "flex"
    },
}))

export default function LaunchAppButton({isAppBar}) {
    const {t} = useTranslation();
    const navigate = useNavigate()

    const onButtonClick = () => {
        navigate(ROUTES.APP_ROUTE)
    }

    if (isAppBar) {
        return <AppButtonAppBar
            variant="outlined"
            onClick={onButtonClick}
            startIcon={<img src={logoSolaX} alt="solaX-logo"/>}>
            {t('appBar.launchApp')}
        </AppButtonAppBar>
    }

    return (
        <AppButton
            variant="outlined"
            onClick={onButtonClick}
            startIcon={<img src={logoSolaX} alt="solaX-logo"/>}>
            {t('appBar.launchApp')}
        </AppButton>
    )
}