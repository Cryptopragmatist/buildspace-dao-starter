

import { useEffect, useMemo, useState } from "react";
import { ThirdwebSDK } from "@3rdweb/sdk";
// import thirdweb
import { useWeb3, } from "@3rdweb/hooks";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();
// We instatiate the sdk on Rinkeby.
const sdk = new ThirdwebSDK("rinkeby");
console.log(process.env.DROP_ADDRESS);

// We can grab a reference to our ERC-1155 contract.
const bundleDropModule = sdk.getBundleDropModule(process.env.DROP_ADDRESS);
const tokenModule = sdk.getTokenModule(process.env.TOKEN_ADDRESS);

const voteModule = sdk.getVoteModule(process.env.VOTING_ADDRESS);

const App = () => {
    // Use the connectWallet hook thirdweb gives us.
    // eslint-disable-next-line
    const { connectWallet, address, error, provider } = useWeb3();
    console.log("👋 Address:", address)

    // The signer is required to sign transactions on the blockchain.
  // Without it we can only read data, not write.
  const signer = provider ? provider.getSigner() : undefined;

// State variable for us to know if user has our NFT.
const [hasClaimedNFT, setHasClaimedNFT] = useState(false);

  // isClaiming lets us easily keep a loading state while the NFT is minting.
  const [isClaiming, setIsClaiming] = useState(false);
// Holds the amount of token each member has in state.
const [memberTokenAmounts, setMemberTokenAmounts] = useState({});
// The array holding all of our members addresses.
const [memberAddresses, setMemberAddresses] = useState([]);

const [proposals, setProposals] = useState([]);

const [isVoting, setIsVoting] = useState(false);

const [hasVoted, setHasVoted] = useState(false);

// A fancy function to shorten someones wallet address, no need to show the whole thing. 
const shortenAddress = (str) => {
  return str.substring(0, 6) + "..." + str.substring(str.length - 4);
};

// This useEffect grabs all our the addresses of our members holding our NFT.
useEffect(() => {
  if (!hasClaimedNFT) {
    return;
  }
  
  // Just like we did in the 7-airdrop-token.js file! Grab the users who hold our NFT
  // with tokenId 0.
  bundleDropModule
    .getAllClaimerAddresses("0")
    .then((addresess) => {
      console.log("🚀 Members addresses", addresess)
      setMemberAddresses(addresess);
    })
    .catch((err) => {
      console.error("failed to get member list", err);
    });
}, [hasClaimedNFT]);

// This useEffect grabs the # of token each member holds.
useEffect(() => {
  if (!hasClaimedNFT) {
    return;
  }

  // Grab all the balances.
  tokenModule
    .getAllHolderBalances()
    .then((amounts) => {
      console.log("👜 Amounts", amounts)
      setMemberTokenAmounts(amounts);
    })
    .catch((err) => {
      console.error("failed to get token amounts", err);
    });
}, [hasClaimedNFT]);

// Retreive all our existing proposals from the contract.
useEffect(() => {
  if (!hasClaimedNFT) {
    return;
  }
  // A simple call to voteModule.getAll() to grab the proposals.
  voteModule
    .getAll()
    .then((proposals) => {
      // Set state!
      setProposals(proposals);
      console.log("🌈 Proposals:", proposals)
    })
    .catch((err) => {
      console.error("failed to get proposals", err);
    });
}, [hasClaimedNFT]);

// We also need to check if the user already voted.
useEffect(() => {
  if (!hasClaimedNFT) {
    return;
  }

  // If we haven't finished retreieving the proposals from the useEffect above
  // then we can't check if the user voted yet!
  if (!proposals.length) {
    return;
  }

  // Check if the user has already voted on the first proposal.
  voteModule
    .hasVoted(proposals[0].proposalId, address)
    .then((hasVoted) => {
      setHasVoted(hasVoted);
      console.log("🥵 User has already voted")
    })
    .catch((err) => {
      console.error("failed to check if wallet has voted", err);
    });
}, [hasClaimedNFT, proposals, address]);

// Now, we combine the memberAddresses and memberTokenAmounts into a single array
const memberList = useMemo(() => {
  return memberAddresses.map((address) => {
    return {
      address,
      tokenAmount: ethers.utils.formatUnits(
        // If the address isn't in memberTokenAmounts, it means they don't
        // hold any of our token.
        memberTokenAmounts[address] || 0,
        18,
      ),
    };
  });
}, [memberAddresses, memberTokenAmounts]);
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
  // If the user has already claimed their NFT we want to display the interal DAO page to them
// only DAO members will see this. Render all the members + token amounts.
if (hasClaimedNFT) {
  return (
    <div className="member-page">
      <h1>🍪SCIDAO Member Page</h1>
      <p>Congratulations on being a member</p>
      <div>
        <div>
          <h2>Member List</h2>
          <table className="card">
            <thead>
              <tr>
                <th>Address</th>
                <th>Token Amount</th>
              </tr>
            </thead>
            <tbody>
              {memberList.map((member) => {
                return (
                  <tr key={member.address}>
                    <td>{shortenAddress(member.address)}</td>
                    <td>{member.tokenAmount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
