import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useWalletClient } from "wagmi";
import Safe from "@safe-global/protocol-kit";
import { getConnectorClient } from "@wagmi/core";
import { config } from "./wagmi";
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
    return (
      <>
        <div>Connected account:</div>
        <div>{address}</div>
        {loadingSafes && <div>Loading Safe accounts...</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
        {safes.length > 0 && (
          <>
            <div>Select a Safe:</div>
            <select onChange={(e) => setSelectedSafe(e.target.value)} value={selectedSafe || ""}>
              <option value="">-- Select Safe --</option>
              {safes.map((safe) => (
                <option key={safe} value={safe}>
                  {safe}
                </option>
              ))}
            </select>
          </>
        )}
        {selectedSafe && <SignButton safeAddress={selectedSafe} />}
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
      // Initialize Safe Protocol Kit
      const client = await getConnectorClient(config);
      const protocolKit = await Safe.init({
        provider: client.transport.url || "https://rpc.gnosis.gateway.fm",
        signer: walletClient.account.address,
        safeAddress,
      });

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

      // Create Safe message using createMessage
      const safeMessage = protocolKit.createMessage({
        domain,
        types,
        primaryType: "Message",
        message,
      });

      // Sign with Safe
      const safeSignature = await protocolKit.signMessage(safeMessage);

      setSignature(JSON.stringify(safeSignature.data, null, 2));
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
