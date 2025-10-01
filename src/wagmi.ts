import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import { base, gnosis, mainnet } from "wagmi/chains";

export const config = createConfig({
  chains: [gnosis],
  connectors: [farcasterFrame()],
  transports: {
    [gnosis.id]: http()
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
