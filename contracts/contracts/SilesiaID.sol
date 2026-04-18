// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SilesiaID is ERC721, Ownable {
    uint256 private _nextTokenId;

    uint8 public constant TRUST_CEIDG = 1;
    uint8 public constant TRUST_KRS = 2;
    uint8 public constant TRUST_BANK = 3;

    struct BusinessIdentity {
        bytes32 nipHash;
        bytes32 krsHash;
        uint8 trustLevel;
        bool isActive;
        uint256 issuedAt;
        uint256 updatedAt;
        string certId;
    }

    mapping(string => uint256) public certIdToTokenId;
    mapping(uint256 => BusinessIdentity) public identities;
    mapping(address => uint256) public walletToTokenId;

    event IdentityIssued(
        uint256 indexed tokenId,
        string indexed certId,
        address indexed wallet,
        uint8 trustLevel,
        uint256 timestamp
    );
    event IdentityRevoked(
        uint256 indexed tokenId,
        string indexed certId,
        uint256 timestamp
    );

    constructor() ERC721("SilesiaID", "SID") {}

    function mint(
        address wallet,
        bytes32 nipHash,
        bytes32 krsHash,
        uint8 trustLevel,
        string calldata certId
    ) external onlyOwner returns (uint256) {
        require(walletToTokenId[wallet] == 0, "Wallet already has a certificate");
        require(certIdToTokenId[certId] == 0, "certId already used");
        require(trustLevel >= 1 && trustLevel <= 3, "Invalid trust level");

        uint256 tokenId = ++_nextTokenId;
        _safeMint(wallet, tokenId);

        identities[tokenId] = BusinessIdentity({
            nipHash: nipHash,
            krsHash: krsHash,
            trustLevel: trustLevel,
            isActive: true,
            issuedAt: block.timestamp,
            updatedAt: block.timestamp,
            certId: certId
        });

        certIdToTokenId[certId] = tokenId;
        walletToTokenId[wallet] = tokenId;

        emit IdentityIssued(tokenId, certId, wallet, trustLevel, block.timestamp);
        return tokenId;
    }

    function getIdentityByCertId(string calldata certId)
        external
        view
        returns (BusinessIdentity memory)
    {
        uint256 tokenId = certIdToTokenId[certId];
        require(tokenId != 0, "Certificate not found");
        return identities[tokenId];
    }

    /// @notice Wycofanie usuwa token z łańcucha i zwalnia adres — ten sam portfel może dostać nowy certyfikat przy kolejnym mint.
    function revoke(string calldata certId) external onlyOwner {
        uint256 tokenId = certIdToTokenId[certId];
        require(tokenId != 0, "Certificate not found");
        address holder = ownerOf(tokenId);

        emit IdentityRevoked(tokenId, certId, block.timestamp);

        walletToTokenId[holder] = 0;
        certIdToTokenId[certId] = 0;
        delete identities[tokenId];

        _burn(tokenId);
    }

    // Soulbound - blokujemy transfery
    function transferFrom(address, address, uint256) public pure override {
        revert("SilesiaID: token is soulbound");
    }

    function safeTransferFrom(address, address, uint256) public pure override {
        revert("SilesiaID: token is soulbound");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("SilesiaID: token is soulbound");
    }
}
