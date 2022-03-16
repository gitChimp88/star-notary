const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;
var instance;

contract("StarNotary", (accs) => {
  accounts = accs;
  owner = accounts[0];
});

before(async () => {
  instance = await StarNotary.deployed();
});

it("can Create a Star", async () => {
  let tokenId = 1;

  await instance.createStar("Awesome Star!", tokenId, {
    from: accounts[0],
  });
  const starName = await instance.tokenIdToStarInfo.call(tokenId);
  assert.equal(starName, "Awesome Star!");
});

it("lets user1 put up their star for sale", async () => {
  let user1 = accounts[1];
  let starId = 2;
  let starPrice = web3.utils.toWei(".01", "ether");
  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  const starForSale = await instance.starsForSale.call(starId);
  assert.equal(starForSale, starPrice);
});

it("lets user1 get the funds after the sale", async () => {
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 3;
  let starPrice = web3.utils.toWei(".01", "ether");
  let balance = web3.utils.toWei(".05", "ether");

  const gasPrice = web3.utils.toWei(".0001", "ether");

  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });

  await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice });

  let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
  await instance.buyStar(starId, { from: user2, value: balance });
  let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
  let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
  let value2 = Number(balanceOfUser1AfterTransaction);
  assert.equal(value1, value2);
});

it("lets user2 buy a star, if it is put up for sale", async () => {
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 4;
  let starPrice = web3.utils.toWei(".01", "ether");
  let balance = web3.utils.toWei(".05", "ether");
  const gasPrice = web3.utils.toWei(".0001", "ether");
  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });
  await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice });

  await instance.buyStar(starId, { from: user2, value: balance });
  const ownerOfStar = await instance.ownerOf.call(starId);
  assert.equal(ownerOfStar, user2);
});

it("lets user2 buy a star and decreases its balance in ether", async () => {
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 5;
  let starPrice = web3.utils.toWei(".01", "ether");
  let balance = web3.utils.toWei(".05", "ether");
  const gasPrice1 = web3.utils.toWei(".0001", "ether");

  await instance.createStar("awesome star", starId, { from: user1 });
  await instance.putStarUpForSale(starId, starPrice, { from: user1 });

  await instance.approve(user2, starId, { from: user1, gasPrice: gasPrice1 });

  const balanceOfUser2BeforeTransaction = web3.utils.toBN(
    await web3.eth.getBalance(user2)
  );
  const txInfo = await instance.buyStar(starId, {
    from: user2,
    value: balance,
  });
  const balanceAfterUser2BuysStar = web3.utils.toBN(
    await web3.eth.getBalance(user2)
  );

  // Important! Note that because these are big numbers (more than Number.MAX_SAFE_INTEGER), we
  // need to use the BN operations, instead of regular operations, which cause mathematical errors.
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
  // console.log("Ok  = " + (balanceOfUser2BeforeTransaction.sub(balanceAfterUser2BuysStar)).toString());
  // console.log("Bad = " + (balanceOfUser2BeforeTransaction - balanceAfterUser2BuysStar).toString());

  // calculate the gas fee
  const tx = await web3.eth.getTransaction(txInfo.tx);
  const gasPrice = web3.utils.toBN(tx.gasPrice);
  const gasUsed = web3.utils.toBN(txInfo.receipt.gasUsed);
  const txGasCost = gasPrice.mul(gasUsed);

  // make sure that [final_balance == initial_balance - star_price - gas_fee]
  const starPriceBN = web3.utils.toBN(starPrice); // from string
  const expectedFinalBalance = balanceOfUser2BeforeTransaction
    .sub(starPriceBN)
    .sub(txGasCost);
  assert.equal(
    expectedFinalBalance.toString(),
    balanceAfterUser2BuysStar.toString()
  );
});

// Implement Task 2 Add supporting unit tests

it("can add the star name and star symbol properly", async () => {
  // check name and symbol of token provided
  const name = await instance.NAME();
  const symbol = await instance.SYMBOL();

  assert.equal(name, "StarToken");
  assert.equal(symbol, "STR");
});

it("lets 2 users exchange stars", async () => {
  // 1. create 2 Stars with different tokenId

  let user1 = accounts[1];
  let user2 = accounts[2];
  const starId = 55;
  const starName = "test star";

  const starId2 = 62;
  const starName2 = "test star2";

  await instance.createStar(starName, starId, { from: user1 });
  await instance.createStar(starName2, starId2, { from: user2 });
  // 2. Call the exchangeStars functions implemented in the Smart Contract
  await instance.exchangeStars(starId, starId2, { from: user1 });
  // 3. Verify that the owners changed
  const ownerOfStar1 = await instance.ownerOf(starId);
  const ownerOfStar2 = await instance.ownerOf(starId2);

  console.log("is owner of returning an address - ", ownerOfStar1);
  assert.equal(ownerOfStar1, user2);
  assert.equal(ownerOfStar2, user1);
});

it("lets a user transfer a star", async () => {
  // 1. create a Star with different tokenId

  let user1 = accounts[1];
  let user2 = accounts[2];
  const starId = 550;
  const starName = "test star";

  await instance.createStar(starName, starId, { from: user1 });
  // 2. use the transferStar function implemented in the Smart Contract
  await instance.transferStar(user2, starId, { from: user1 });
  // 3. Verify the star owner changed.
  const changedOwner = await instance.ownerOf(starId);
  assert.equal(changedOwner, user2);
});

it("lookUptokenIdToStarInfo test", async () => {
  // 1. create a Star with different tokenId
  // 2. Call your method lookUptokenIdToStarInfo
  // 3. Verify if you Star name is the same

  const user1 = accounts[1];
  const starId = 10;
  const starName = "test star";

  await instance.createStar(starName, starId, { from: user1 });

  const starId2 = 11;
  const starName2 = "test star2";

  await instance.createStar(starName2, starId2, { from: user1 });
  //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
  const starInfo = await instance.lookUptokenIdToStarInfo(starId);
  const starInfo2 = await instance.lookUptokenIdToStarInfo(starId2);
  assert.equal(starInfo, starName);

  assert.equal(starInfo2, starName2);
});
