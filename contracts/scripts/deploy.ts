import fs from 'fs';
import path from 'path';
import hre from 'hardhat';

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying GhostVault with', deployer.address);

  const Factory = await hre.ethers.getContractFactory('GhostVault');
  const vault = await Factory.deploy();
  await vault.waitForDeployment();
  const address = await vault.getAddress();
  console.log('GhostVault deployed to', address);

  const outDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(outDir, { recursive: true });
  const artifact = await hre.artifacts.readArtifact('GhostVault');
  const payload = {
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };
  const file = path.join(outDir, `${hre.network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));
  console.log('Wrote', file);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
