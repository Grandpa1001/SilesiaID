"use client";

import { useEffect } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { sepolia } from "viem/chains";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    console.info("[SilesiaID] Frontend używa API pod:", url);
  }, []);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["email", "sms"],
        appearance: {
          theme: "light",
          accentColor: "#273E65",
          logo: "/SilesiaID_Logo-nobg.svg",
          landingHeader: "Zaloguj się lub zarejestruj",
          loginMessage: "Raz zweryfikowany — wszędzie rozpoznany.",
        },
        intl: {
          defaultCountry: "PL",
          textLocalization: {
            "connectWallet.connectYourWallet": "Połącz portfel",
            "connectWallet.selectYourWallet": "Wybierz portfel",
            "connectWallet.waitingForWallet": "Oczekiwanie na portfel…",
            "connectWallet.connectToAccount": "Połącz z kontem",
            "connectWallet.tryConnectingAgain": "Spróbuj ponownie",
            "connectWallet.retry": "Ponów",
            "connectWallet.searchPlaceholder": "Szukaj portfela…",
            "connectWallet.noWalletsFound": "Nie znaleziono portfeli",
            "connectWallet.lastUsed": "Ostatnio używany",
            "connectWallet.scanToConnect": "Zeskanuj, aby połączyć",
            "connectWallet.openOrInstall": "Otwórz lub zainstaluj",
            "connectWallet.copyLink": "Kopiuj link",
            "connectWallet.goToWallet": "Przejdź do portfela",
            "connectWallet.selectNetwork": "Wybierz sieć",
            "connectWallet.openInApp": "Otwórz w aplikacji",
            "connectWallet.installAndConnect": "Zainstaluj i połącz",
            "connectionStatus.successfullyConnected": "Połączono z {walletName}",
            "connectionStatus.errorTitle": "Błąd połączenia",
            "connectionStatus.connecting": "Łączenie…",
            "connectionStatus.checkOtherWindows": "Sprawdź inne okna",
            "connectionStatus.stillHere": "Nadal tutaj?",
            "connectionStatus.tryConnectingAgain": "Spróbuj połączyć ponownie",
            "connectionStatus.or": "lub",
            "connectionStatus.useDifferentLink": "Użyj innego linku",
          },
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
        },
        defaultChain: sepolia,
        supportedChains: [sepolia],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
