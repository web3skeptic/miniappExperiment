import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useWalletClient } from "wagmi";
// import Safe from "@safe-global/protocol-kit";
// import { getConnectorClient } from "@wagmi/core";

// import { fetchUserSafes } from "./safeService";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <>
      <div>Mini App + Vite + TS + React + Wagmi</div>
      <ConnectMenu />
    </>
  );
}

function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  // const [safes, setSafes] = useState<string[]>([]);
  // const [selectedSafe, setSelectedSafe] = useState<string | null>(null);
  // const [loadingSafes, setLoadingSafes] = useState(false);
  // const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   if (isConnected && address) {
  //     setLoadingSafes(true);
  //     setError(null);
  //     fetchUserSafes(address)
  //       .then((safesData) => {
  //         setSafes(safesData);
  //         if (safesData.length === 0) {
  //           setError("No Safe accounts found for this address");
  //         }
  //       })
  //       .catch((err) => {
  //         setError(err.message);
  //       })
  //       .finally(() => {
  //         setLoadingSafes(false);
  //       });
  //   }
  // }, [isConnected, address]);

  if (isConnected) {
    return (
      <>
        <div>Connected account:</div>
        <div>{address}</div>
        <SignButton />
      </>
    );
  }

  return (
    <button type="button" onClick={() => connect({ connector: connectors[0] })}>
      Connect
    </button>
  );
}

function SignButton() {
  const { data: walletClient } = useWalletClient();
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    if (!walletClient) {
      setError("Wallet client not available");
      return;
    }

    setSigning(true);
    setError(null);
    setSignature(null);

    try {
      // EIP-712 typed data
      const domain = {
        name: "My App",
        version: "1",
        chainId: 100, // Gnosis Chain
        verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC" as `0x${string}`,
      };

      const types = {
        Message: [
          { name: "content", type: "string" },
          { name: "timestamp", type: "uint256" },
        ],
      };

      const message = {
        content: "hello world",
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
      };

      // Sign typed data v4
      const signature = await walletClient.signTypedData({
        account: walletClient.account,
        domain,
        types,
        primaryType: "Message",
        message,
      });

      setSignature(signature);
    } catch (err: any) {
      setError(err.message || "Failed to sign message");
    } finally {
      setSigning(false);
    }
  };

  return (
    <>
      <button type="button" onClick={handleSign} disabled={signing}>
        {signing ? "Signing..." : "Sign typed data v4"}
      </button>
      {signature && (
        <>
          <div>Signature:</div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{signature}</pre>
        </>
      )}
      {error && (
        <>
          <div>Error:</div>
          <div style={{ color: "red" }}>{error}</div>
        </>
      )}
    </>
  );
}

export default App;
