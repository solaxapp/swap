export const muiCustomTheme = (mode) => {
    return ({
        palette: {
            mode: mode,
            primary: {
                main: "rgb(25,35,55)",
            },
            secondary: {
                light: "rgb(255, 255, 255, 0.5)",
                main: "#FFF",
                dark: "rgb(0,0,0,0.5)"
            },
            action: {
                disabled: "rgba(255, 255, 255, 0.3)"
            },
            common: {
                brown: "#744E77",
                pureWhite: "#FFF",
                white: "#F0EEF0",
                inputBg: "#F2F2F2",
                grey: "#5a5c5e",
                green: "#00b4b4",
                orange: "#f98787",
                purple: "#beaffa"
            },
        }
    })
};
