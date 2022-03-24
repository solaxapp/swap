import React from "react";
import {Identicon} from "../identicon";

export const TokenIcon = (props) => {
    const {icon, mintAddress} = props;
    if (icon && icon.length > 1) {
        return (
            <img
                alt="Token icon"
                key={mintAddress}
                width="20"
                height="20"
                src={icon}
                style={{
                    marginRight: "0.5rem",
                    marginTop: "0.11rem",
                    borderRadius: "1rem",
                    backgroundColor: "white",
                    backgroundClip: "padding-box",
                    objectFit: "cover",
                    ...props.style,
                }}
                onError={({ currentTarget }) => {
                    currentTarget.onerror = null; // prevents looping
                    currentTarget.src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png"
                }}
            />
        );
    }

    return (
        <Identicon
            address={mintAddress}
            style={{marginRight: "0.5rem", ...props.style}}
        />
    );
};

export const PoolIcon = (props) => {
    return (
        <div style={{display: "flex"}}>
            <TokenIcon
                mintAddress={props.mintA}
                style={{marginRight: "-0.5rem", ...props.style}}
            />
            <TokenIcon mintAddress={props.mintB}/>
        </div>
    );
};