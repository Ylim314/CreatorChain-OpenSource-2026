// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleCreationRegistry
 * @dev Simple creation registry that matches frontend expectations
 */
contract SimpleCreationRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    struct Creation {
        uint256 id;
        address creator;
        string title;
        string description;
        string ipfsHash;
        uint256 creationType;
        bytes32 contentHash;
        bool confirmed;
        uint256 timestamp;
    }

    mapping(uint256 => Creation) public creations;
    mapping(address => uint256[]) public creatorToCreations;
    uint256 private _creationCounter;

    event CreationRegistered(
        uint256 indexed creationId,
        address indexed creator,
        string title,
        string ipfsHash
    );

    event CreationConfirmed(
        uint256 indexed creationId,
        address indexed creator,
        string finalIpfsHash
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CREATOR_ROLE, msg.sender);
        // Grant CREATOR_ROLE to everyone by default for testing
        _setRoleAdmin(CREATOR_ROLE, DEFAULT_ADMIN_ROLE);
    }

    /**
     * @dev Register a new creation
     */
    function registerCreation(
        string memory _title,
        string memory _description,
        string memory _ipfsHash,
        uint256 _creationType,
        bytes32 _contentHash
    ) public returns (uint256) {
        _creationCounter++;
        uint256 creationId = _creationCounter;

        Creation storage creation = creations[creationId];
        creation.id = creationId;
        creation.creator = msg.sender;
        creation.title = _title;
        creation.description = _description;
        creation.ipfsHash = _ipfsHash;
        creation.creationType = _creationType;
        creation.contentHash = _contentHash;
        creation.confirmed = false;
        creation.timestamp = block.timestamp;

        creatorToCreations[msg.sender].push(creationId);

        emit CreationRegistered(creationId, msg.sender, _title, _ipfsHash);

        return creationId;
    }

    /**
     * @dev Confirm a creation
     */
    function confirmCreation(
        uint256 _creationId,
        string memory _finalIpfsHash,
        bytes32 _finalContentHash
    ) public {
        require(creations[_creationId].creator == msg.sender, "Not the creator");

        Creation storage creation = creations[_creationId];
        creation.ipfsHash = _finalIpfsHash;
        creation.contentHash = _finalContentHash;
        creation.confirmed = true;

        emit CreationConfirmed(_creationId, msg.sender, _finalIpfsHash);
    }

    /**
     * @dev Get creation details
     */
    function getCreation(uint256 _creationId) public view returns (Creation memory) {
        return creations[_creationId];
    }

    /**
     * @dev Get all creations by a creator
     */
    function getCreationsByCreator(address _creator) public view returns (uint256[] memory) {
        return creatorToCreations[_creator];
    }

    /**
     * @dev Grant creator role to an address
     */
    function grantCreatorRole(address account) public {
        _grantRole(CREATOR_ROLE, account);
    }

    /**
     * @dev Check if account has creator role
     */
    function hasCreatorRole(address account) public view returns (bool) {
        return hasRole(CREATOR_ROLE, account);
    }
}