import hre from 'hardhat';
import { CofheClient, Encryptable, FheTypes } from '@cofhe/sdk';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';

describe('GhostVault', () => {
  let cofheClient: CofheClient;
  let signer: HardhatEthersSigner;
  let other: HardhatEthersSigner;

  before(async () => {
    [signer, other] = await hre.ethers.getSigners();
    cofheClient = await hre.cofhe.createClientWithBatteries(signer);
  });

  it('deposits and decrypts balance', async () => {
    const Factory = await hre.ethers.getContractFactory('GhostVault');
    const vault = await Factory.deploy();
    await vault.waitForDeployment();

    const [encrypted] = await cofheClient
      .encryptInputs([Encryptable.uint64(100n)])
      .execute();
    await (await vault.deposit(encrypted)).wait();

    const ctHash = await vault.getBalance();
    const balance = await cofheClient.decryptForView(ctHash, FheTypes.Uint64).execute();
    expect(balance).to.equal(100n);
  });

  it('transfers privately between accounts', async () => {
    const Factory = await hre.ethers.getContractFactory('GhostVault');
    const vault = await Factory.deploy();
    await vault.waitForDeployment();

    const clientA = await hre.cofhe.createClientWithBatteries(signer);
    const clientB = await hre.cofhe.createClientWithBatteries(other);

    const [encDeposit] = await clientA.encryptInputs([Encryptable.uint64(50n)]).execute();
    await (await vault.connect(signer).deposit(encDeposit)).wait();

    const [encSend] = await clientA.encryptInputs([Encryptable.uint64(30n)]).execute();
    await (await vault.connect(signer).transferPrivate(other.address, encSend)).wait();

    const aBal = await clientA
      .decryptForView(await vault.connect(signer).getBalance(), FheTypes.Uint64)
      .execute();
    expect(aBal).to.equal(20n);

    const bBal = await clientB
      .decryptForView(await vault.connect(other).getBalance(), FheTypes.Uint64)
      .execute();
    expect(bBal).to.equal(30n);
  });

  it('sets rule threshold and compares', async () => {
    const Factory = await hre.ethers.getContractFactory('GhostVault');
    const vault = await Factory.deploy();
    await vault.waitForDeployment();

    const [encDeposit] = await cofheClient.encryptInputs([Encryptable.uint64(100n)]).execute();
    await (await vault.deposit(encDeposit)).wait();

    const [encTh] = await cofheClient.encryptInputs([Encryptable.uint64(50n)]).execute();
    await (await vault.setRuleThreshold(encTh)).wait();

    await (await vault.refreshRuleCheck()).wait();
    const ctBool = await vault.getLastRuleAbove();
    const above = await cofheClient.decryptForView(ctBool, FheTypes.Bool).execute();
    expect(above).to.equal(true);
  });
});
