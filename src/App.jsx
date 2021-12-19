

import { useEffect, useMemo, useState } from "react";
import { ThirdwebSDK } from "@3rdweb/sdk";
// import thirdweb
import { useWeb3, } from "@3rdweb/hooks";

// We instatiate the sdk on Rinkeby.
const sdk = new ThirdwebSDK("rinkeby");

// We can grab a reference to our ERC-1155 contract.
const bundleDropModule = sdk.getBundleDropModule(
  "0x1Db298723BB2b64a72bC41DD210e6be11768b1bA",
);

  const App = () => {
    // Use the connectWallet hook thirdweb gives us.
    const { connectWallet, address, error, provider } = useWeb3();
    console.log("👋 Address:", address)

    // The signer is required to sign transactions on the blockchain.
  // Without it we can only read data, not write.
  const signer = provider ? provider.getSigner() : undefined;

// State variable for us to know if user has our NFT.
const [hasClaimedNFT, setHasClaimedNFT] = useState(false);

  // isClaiming lets us easily keep a loading state while the NFT is minting.
  const [isClaiming, setIsClaiming] = useState(false);

useEffect(() => {

  // We pass the signer to the sdk, which enables us to interact with
    // our deployed contract!
    sdk.setProviderOrSigner(signer);
  }, [signer]);
  // If they don't have an connected wallet, exit!

  useEffect(() => {
    if (!address) {
      return;
    }
  // Check if the user has the NFT by using bundleDropModule.balanceOf
  return bundleDropModule
    .balanceOf(address, "0")
    .then((balance) => {
      // If balance is greater than 0, they have our NFT!
      if (balance.gt(0)) {
        setHasClaimedNFT(true);
        console.log("🌟 this user has a membership NFT!")
      } else {
        setHasClaimedNFT(false);
        console.log("😭 this user doesn't have a membership NFT.")
      }
    })
    .catch((error) => {
      setHasClaimedNFT(false);
      console.error("failed to nft balance", error);
    });
    }, [address]);

   // This is the case where the user hasn't connected their wallet
  // to your web app. Let them call connectWallet.
  if (!address) {
    return (
    <div className="landing">
      <h1>Scientific Knowledge is a Public Good.</h1>
      <h2>Our mission is to permanently store knowledge, <br></br>make it censorship-resistant and freely accessible for everyone.</h2>
      <h3> Knowledge is Power.</h3>
      <button onClick={() => connectWallet("injected")} className="btn-hero">
          Connect your wallet
        </button>
    </div>
  );

  }
  // Add this little piece!
if (hasClaimedNFT) {
  return (
    <div className="member-page">
      <h1>🍪DAO Member Page</h1>
      <p>Congratulations on being a member</p>
    </div>
  );
};
  
  // This is the case where we have the user's address
  // which means they've connected their wallet to our site!
  const mintNft = () => {
    setIsClaiming(true);
    // Call bundleDropModule.claim("0", 1) to mint nft to user's wallet.
    bundleDropModule
    .claim("0", 1)
    .catch((err) => {
      console.error("failed to claim", err);
      setIsClaiming(false);
    })
    .finally(() => {
      // Stop loading state.
      setIsClaiming(false);
      // Set claim state.
      setHasClaimedNFT(true);
      // Show user their fancy new NFT!
      console.log(
        `🌊 Successfully Minted! Check it out on OpenSea: https://testnets.opensea.io/assets/${bundleDropModule.address}/0`
      );
    });
  }

  

  // Render mint nft screen.
  return (
    <div className="mint-nft">
      <h1>Mint your free SCIDAO Membership NFT</h1>
      <button
        disabled={isClaiming}
        onClick={() => mintNft()}
      >
        {isClaiming ? "Minting..." : "Mint your nft (FREE)"}
      </button>
    </div>
  );

};

export default App;
