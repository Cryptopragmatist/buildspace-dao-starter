import sdk from "./1-initialize-sdk.js";
import { readFileSync } from "fs";

const bundleDrop = sdk.getBundleDropModule(
  "0x1Db298723BB2b64a72bC41DD210e6be11768b1bA",
);

(async () => {
  try {
    await bundleDrop.createBatch([
      {
        name: "SciDAO Badge",
        description: "This NFT will give you access to SciDAO!",
        image: readFileSync("scripts/assets/rick.jpg"),
      },
    ]);
    console.log("✅ Successfully created a new NFT in the drop!");
  } catch (error) {
    console.error("failed to create the new NFT", error);
  }
})()