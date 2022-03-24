import React from "react";
import {styled} from "@mui/material/styles";
import solaX from "../../assets/images/solaX.png";
import {keyframes, Typography} from "@mui/material";
import {CenteredCol} from "../../components/Flex";

const Image = styled('img')(()=>({
    position: "relative",
    animation: `${moveSlideshow} 2s infinite`,
    animationDirection: "alternate"
}))

const moveSlideshow = keyframes`
    from { 
        top: 0px;
         -webkit-animation-timing-function: ease-in;
    }
    to { 
        top: 100px;
        -webkit-animation-timing-function: ease-out;
    }
`;

export default function WorkInProgress(){
    return(
        <CenteredCol>
            <Image src={solaX}/>
            <Typography style={{
                fontSize: 30,
                paddingBottom: 100
            }}>Work in progress</Typography>
        </CenteredCol>
    );
}