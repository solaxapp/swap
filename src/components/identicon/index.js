import React, {useEffect, useRef} from "react";
import Jazzicon from "jazzicon";
import styled from "@emotion/styled";
import {Flex} from "../Flex";

const Wrapper = styled(Flex)(() => ({
    height: "1rem",
    width: "1rem",
    borderRadius: "1.125rem",
    margin: "0.2rem 0.2rem 0.2rem 0.1rem",
}))

export const Identicon = (props) => {
    const {address} = props;
    const ref = useRef();

    useEffect(() => {
        if (address && ref.current) {
            ref.current.innerHTML = "";
            ref.current.appendChild(Jazzicon(16, parseInt(address.slice(0, 10), 16)));
        }
    }, [address]);

    return (
        <Wrapper ref={ref} style={props.style}/>
    );
};
