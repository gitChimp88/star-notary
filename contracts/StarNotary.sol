pragma solidity ^0.5.5;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract StarNotary is ERC721 {

    string public constant NAME  = "StarToken";
    string public constant SYMBOL = "STR";

    struct Star {
        string name;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo;
    mapping(uint256 => uint256) public starsForSale;


    // Create Star using the Struct
    function createStar(string memory _name, uint256 _tokenId) public { // Passing the name and tokenId as a parameters
        Star memory newStar = Star(_name); // Star is an struct so we are creating a new Star
        tokenIdToStarInfo[_tokenId] = newStar; // Creating in memory the Star -> tokenId mapping
        _mint(msg.sender, _tokenId); // _mint assign the the star with _tokenId to the sender address (ownership)
    }

    // Putting an Star for sale (Adding the star tokenid into the mapping starsForSale, first verify that the sender is the owner)
    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == msg.sender, "You can't sell a Star you don't own");
        starsForSale[_tokenId] = _price;
    }


    // Function that allows you to convert an address into a payable address
    function _make_payable(address x) internal pure returns (address payable) {
        return address(uint160(x));
    }

    function lookUptokenIdToStarInfo(uint256 _tokenId) public view returns(string memory name){
        Star storage star = tokenIdToStarInfo[_tokenId];
        return star.name;
    }

    function exchangeStars(uint256 _tokenId1, uint256 _tokenId2) public {
        // write code here to exchange these two stars

        // first we need to get the owners address for both.
        address ownerOfToken1 = ownerOf(_tokenId1);
        address ownerOfToken2 = ownerOf(_tokenId2);

        // check that msg.sender is one of the addresses
        require(ownerOfToken1 == msg.sender || ownerOfToken2 == msg.sender);
        
        // use erc721 _transferFrom function (from, to, tokenId)
        _transferFrom(ownerOfToken1, ownerOfToken2, _tokenId1);
        _transferFrom(ownerOfToken2, ownerOfToken1, _tokenId2);

    }

    function transferStar(address _transferStarTo, uint256 _tokenId) public {
        address ownerAddress = msg.sender;
        // check that msg.sender is one of the addresses
        address ownerOfToken = ownerOf(_tokenId);
        require(ownerOfToken == ownerAddress);

        transferFrom(ownerAddress, _transferStarTo, _tokenId);
    }

    function buyStar(uint256 _tokenId) public  payable {
        require(starsForSale[_tokenId] > 0, "The Star should be up for sale");
        uint256 starCost = starsForSale[_tokenId];
        address ownerAddress = ownerOf(_tokenId);
        require(msg.value > starCost, "You need to have enough Ether to buy the star");
        transferFrom(ownerAddress, msg.sender, _tokenId); // We can't use _addTokenTo or_removeTokenFrom functions, now we have to use _transferFrom
        address payable ownerAddressPayable = _make_payable(ownerAddress); // We need to make this conversion to be able to use transfer() function to transfer ethers
        // transfer uses ether from msg.value
        ownerAddressPayable.transfer(starCost);
        if(msg.value > starCost) {
            msg.sender.transfer(msg.value - starCost);
        }
    }

}
