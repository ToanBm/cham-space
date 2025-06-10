const fs = require("fs");
const path = require("path");

const nftName = "Lightwarp Nexus";
const description = "Protocols pushing Ethereum beyond light-speed limits.";
const baseImageUrl = "https://bafybeiee5o52pud7fojhztvk2dumpaxa3mk5saeggql6zjkx5iyalcey3a.ipfs.w3s.link/Lightwarp%20Nexus.png";
const outputDir = path.join(__dirname, `metadata-${nftName.toLowerCase()}`);

const rarityGroups = [
  { value: "Mythic", count: 5 },   // 5% – cực hiếm
  { value: "Epic", count: 20 },    // 20% – rất hiếm
  { value: "Common", count: 75 }   // 75% – phổ biến
];

const maskList = [];
rarityGroups.forEach(group => {
  for (let i = 0; i < group.count; i++) {
    maskList.push(group.value);
  }
});

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Shuffle maskList
for (let i = maskList.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [maskList[i], maskList[j]] = [maskList[j], maskList[i]];
}

for (let i = 1; i <= 100; i++) {
  const metadata = {
    name: `${nftName} #${i}`,
    description,
    image: baseImageUrl,
    attributes: [
      { trait_type: "Faction", value: nftName },
      { trait_type: "Mask", value: maskList[i - 1] },
      { trait_type: "Theme", value: "Cyberpunk" }
    ]
  };

  fs.writeFileSync(
    path.join(outputDir, `${i}.json`),
    JSON.stringify(metadata, null, 2)
  );
}

console.log(`✅ Created 100 metadata files in ${outputDir}`); // node generateMetadata.js
