import {styled} from '@mui/material/styles';

export const Flex = styled('div')(() => ({
    display: 'flex'
}));

export const FlexRow = styled(Flex)(() => ({
    display: 'flex',
    flexDirection: "row"
}));

export const SpaceBFlexRow = styled(FlexRow)(() => ({
    justifyContent: "space-between"
}));


export const FlexCol = styled(Flex)(() => ({
    display: 'flex',
    flexDirection: "column"
}));

export const CenteredRow = styled(FlexRow)(() => ({
    justifyContent: "center",
    alignItems: "center"
}));

export const CenteredCol = styled(FlexCol)(() => ({
    justifyContent: "center",
    alignItems: "center"
}));

export const Grow1 = styled(FlexRow)(() => ({
    flexGrow: 1
}))

export const SpaceBFlexCol = styled(FlexCol)(() => ({
    alignItems: "space-between"
}));

export const PageContainer = styled(FlexCol)(()=>({
    width: "100%"
}))