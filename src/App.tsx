import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useWalletClient, useConfig } from "wagmi";
import Safe from "@safe-global/protocol-kit";
import { getConnectorClient } from "@wagmi/core";

import { fetchUserSafes } from "./safeService";

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
  const [safes, setSafes] = useState<string[]>([]);
  const [selectedSafe, setSelectedSafe] = useState<string | null>(null);
  const [loadingSafes, setLoadingSafes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      setLoadingSafes(true);
      setError(null);
      fetchUserSafes(address)
        .then((safesData) => {
          setSafes(safesData);
          if (safesData.length === 0) {
            setError("No Safe accounts found for this address");
          }
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoadingSafes(false);
        });
    }
  }, [isConnected, address]);

  if (isConnected) {
    if (selectedSafe) {
      return <SignButton safeAddress={selectedSafe} />;
    }

    return (
      <>
        <div>Connected EOA:</div>
        <div>{address}</div>
        {loadingSafes && <div>Loading Safe accounts...</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
        {safes.length > 0 && (
          <>
            <div>Select a Safe account:</div>
            {safes.map((safe) => (
              <button
                key={safe}
                type="button"
                onClick={() => setSelectedSafe(safe)}
                style={{ display: "block", margin: "5px 0" }}
              >
                {safe}
              </button>
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <button type="button" onClick={() => connect({ connector: connectors[0] })}>
      Connect
    </button>
  );
}

function SignButton({ safeAddress }: { safeAddress: string }) {
  const { data: walletClient } = useWalletClient();
  const config = useConfig();
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
      // Get the connector client from wagmi
      const client = await getConnectorClient(config);

      // Initialize Safe with wagmi provider and signer
      const protocolKit = await Safe.init({
        provider: client.transport,
        signer: client.account.address,
        safeAddress,
      });

      const messageText = "hello world";
      const message = protocolKit.createMessage(messageText);

      // Sign the message using Safe protocol kit
      const signedMessage = await protocolKit.signMessage(message);

      setSignature(JSON.stringify(signedMessage, null, 2));
    } catch (err: any) {
      setError(err.message || "Failed to sign message");
    } finally {
      setSigning(false);
    }
  };

  return (
    <>
      <div>Safe Account: {safeAddress}</div>
      <button type="button" onClick={handleSign} disabled={signing}>
        {signing ? "Signing..." : "Sign 'hello world' message"}
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
