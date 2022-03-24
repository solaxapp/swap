import React, {useEffect, useState} from "react";
import {
    Dialog,
    DialogContent,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    styled,
    TextField
} from "@mui/material";
import {CenteredRow, FlexCol, FlexRow} from "../Flex";
import {useCachedPool, useMint, useUserAccounts} from "../../context/AccountsProvider";
import {useConnectionConfig} from "../../context/GlobalProvider";
import {PoolIcon, TokenIcon} from "../TokenIcon";
import {getPoolName, getTokenIcon, getTokenName, isKnownMint} from "../../helper/token";
import {Text} from "../Text";
import SearchIcon from '@mui/icons-material/Search';

const InputWrapper = styled(FlexCol)(() => ({}))

const CurrencyWrapper = styled(CenteredRow)(() => ({
    minWidth: 80,
    padding: "16px 14px",
    minHeight: 58,
    width: "100%",
    cursor: "pointer",
    border: "0.5px solid #00D2C8",
    borderRadius: 4,
    ":hover": {
        border: "1px solid white",
    }
}))

const StyledInput = styled(TextField)(() => ({
    border: "0.5px solid #00D2C8",
    borderRadius: 4,
    ":hover": {
        border: "1px solid white",
    }
}))

const FilterInput = styled(TextField)(() => ({
    border: "0.5px solid #00D2C8",
    width: "100%",
    borderRadius: 4,
    ":hover": {
        border: "1px solid white",
    }
}))

const StyledList = styled(List)(() => ({
    marginTop: 10,
    minHeight: 300,
    overflow: "auto",
    height: 300,
}))

export default function CurrencyInput({
                                          mint,
                                          amount,
                                          title,
                                          onInputChange,
                                          onMintChange,
                                          network,
                                          handleOpen,
                                          handleClose,
                                          open
                                      }) {
    const {tokens, tokenMap} = useConnectionConfig();
    const {userAccounts} = useUserAccounts();
    const {pools} = useCachedPool();
    const localeMint = useMint(mint);
    let selected = {
        mint: "",
        icon: "",
        name: ""
    }

    const renderPopularTokens = tokens.map((item) => {
        if (item.address === mint) {
            selected = {
                mint: item.address,
                icon: <TokenIcon mintAddress={item.address} icon={item.logoURI}/>,
                name: item.symbol
            }
        }
        return ({
            mint: item.address,
            icon: <TokenIcon mintAddress={item.address} icon={item.logoURI}/>,
            name: item.symbol
        })
    });

    // TODO: expand nested pool names ...?

    const grouppedUserAccounts = userAccounts.sort((a, b) => {
        return b.info.amount.toNumber() - a.info.amount.toNumber();
    }).reduce((map, acc) => {
        const mint = acc.info.mint.toBase58();
        if (isKnownMint(network, mint)) {
            return map;
        }
        const pool = pools.find((p) => p && p.pubkeys.mint.toBase58() === mint);
        map.set(mint, (map.get(mint) || []).concat([{account: acc, pool}]));
        return map;
    }, new Map());

    // TODO: group multple accounts of same time and select one with max amount
    const renderAdditionalTokens = [...grouppedUserAccounts.keys()].map((localMint) => {
            const list = grouppedUserAccounts.get(localMint);
            if (!list || list.length <= 0) {
                return undefined;
            }

            const account = list[0];

            if (account.account.info.amount.total === 0) {
                return undefined;
            }

            let name;
            let icon;

            if (account.pool) {
                name = getPoolName(tokenMap, account.pool);
                const sorted = account.pool.pubkeys.holdingMints
                    .map((a) => a.toBase58())
                    .sort();
                icon = <PoolIcon mintA={sorted[0]} mintB={sorted[1]} env={network}/>;
            } else {
                name = getTokenName(tokenMap, localMint);
                icon = <TokenIcon mintAddress={localMint} icon={getTokenIcon(tokenMap, localMint)}/>;
            }
            if (localMint === mint) {
                selected = {
                    mint: localMint,
                    icon: icon,
                    name: name
                }
            }
            return ({
                mint: localMint,
                icon: icon,
                name: name
            })
        }
    );

    const userUiBalance = () => {
        const currentAccount = userAccounts.find((a) => a.info.mint.toBase58() === mint)
        if (currentAccount && localeMint) {
            return (
                currentAccount.info.amount.toNumber() / Math.pow(10, localeMint.decimals)
            );
        }
        return 0;
    };

    const allTokens = [...renderPopularTokens, ...renderAdditionalTokens]

    const handleInputChange = (event) => {
        const {value} = event.target
        if (userUiBalance()) {
            if (value > userUiBalance()) {
                onInputChange(userUiBalance())
                return;
            }
            onInputChange(value)
        } else {
            onInputChange(value)
        }
    }

    return (
        <FlexRow>
            <InputWrapper>
                <Text>
                    {title}
                </Text>
                <StyledInput
                    type="number"
                    value={amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                />
            </InputWrapper>
            <FlexCol>
                <Text
                    onClick={(_) => onInputChange(userUiBalance())}>
                    Balance: {userUiBalance().toFixed(6)}
                </Text>
                <CurrencyWrapper onClick={handleOpen}>
                    {selected.icon}
                    {selected.name}
                </CurrencyWrapper>
                {open && <TokenDialog
                    open={open}
                    onMintChange={onMintChange}
                    handleClose={handleClose}
                    tokens={allTokens}/>
                }
            </FlexCol>
        </FlexRow>
    );
};

const TokenDialog = ({tokens, open, handleClose, onMintChange}) => {
    const [filteredTokens, setFilteredTokens] = useState(tokens);

    const handleFilterChange = (event) => {
        const {value} = event.target;
        setFilteredTokens(tokens.filter(token =>
            token.name.toLowerCase().includes(value.toLowerCase())
            || token.mint.toLowerCase().includes(value.toLowerCase())))
    }

    useEffect(() => {
        setFilteredTokens(tokens)
    }, [tokens]);

    const onClick = (token) => {
        onMintChange(token.mint);
        handleClose();
    }

    return (
        <Dialog
            fullWidth={true}
            onClose={handleClose}
            open={open}>
            <DialogContent>
                <FilterInput
                    onChange={handleFilterChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon/>
                            </InputAdornment>
                        ),
                    }}/>
                <StyledList>
                    {filteredTokens.map((token, index) => (
                        <ListItem button key={`token-list-${index}`} onClick={() => onClick(token)}>
                            <ListItemAvatar>
                                {token.icon}
                            </ListItemAvatar>
                            <ListItemText primary={token.name}/>
                        </ListItem>
                    ))}
                </StyledList>
            </DialogContent>
        </Dialog>
    );
}
