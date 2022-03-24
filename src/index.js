import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {styled} from '@mui/material/styles';
import {CenteredRow} from "./components/Flex";
import {CircularProgress} from "@mui/material";
import {BrowserRouter} from "react-router-dom";
import {SnackbarProvider} from "notistack";
import "./store/i18n"

const Wrapper = styled(CenteredRow)(() => ({
        position: "absolute",
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
    }
))

ReactDOM.render(
    <React.StrictMode>
        <BrowserRouter>
            <Suspense fallback={<Wrapper><CircularProgress/></Wrapper>}>
                <SnackbarProvider maxSnack={3}>
                    <App/>
                </SnackbarProvider>
            </Suspense>
        </BrowserRouter>
    </React.StrictMode>,
    document.getElementById("root")
);
reportWebVitals();
