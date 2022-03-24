import React from "react";
import {createTheme} from "@mui/material";
import {muiCustomTheme} from "./assets/theme";
import {ThemeProvider} from '@mui/material/styles';
import {Route, Routes} from "react-router-dom";
import {ROUTES} from "./constants/routes";
import SwapPage from "./pages/SwapPage";
import Layout from "./layout";
import WorkInProgress from "./pages/WorkInProgress";
import UserProfilePage from "./pages/UserProfilePage";
import LiquidityPage from "./pages/PoolsPage";

function App() {
    const theme = createTheme(muiCustomTheme("light"));
    return (
        <ThemeProvider theme={theme}>
            <Routes>
                <Route
                    path={ROUTES.HOME_ROUTE}
                    element={
                        <Layout/>
                    }>
                    <Route
                        index
                        path={ROUTES.APP_ROUTE}
                        element={
                            <SwapPage/>
                        }/>
                    <Route
                        path={ROUTES.LIQUIDITY_ROUTE}
                        element={
                            <LiquidityPage/>
                        }/>
                    <Route
                        path={ROUTES.USER_PROFILE}
                        element={
                            <UserProfilePage/>
                        }/>
                    <Route
                        path={ROUTES.FARMS_ROUTE}
                        element={
                            <WorkInProgress/>
                        }/>
                    <Route
                        path={ROUTES.STAKING_ROUTE}
                        element={
                            <WorkInProgress/>
                        }/>
                    <Route
                        path={ROUTES.POOLS_ROUTE}
                        element={
                            <WorkInProgress/>
                        }/>
                </Route>
            </Routes>
        </ThemeProvider>
    );
}

export default App;
