export function setSessionLanguage(language) {
    localStorage.setItem("language", language)
}

export function getSavedLanguage() {
    return localStorage.getItem("language")
        ? localStorage.getItem("language")
        : "lat";
}

export function getSavedNetwork(){
    return localStorage.getItem("saved_network") || "testnet"
}

export function setSavedNetwork(network){
    localStorage.setItem("saved_network", network)
}

export function getSavedTheme(){
    return localStorage.getItem("theme") || "dark"
}

export function setSavedTheme(theme){
    localStorage.setItem("theme", theme)
}