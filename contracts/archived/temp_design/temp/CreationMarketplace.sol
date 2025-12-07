// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CreationRegistry.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CreationMarketplace_CN
 * @dev AI创作内容的交易市场 - 中国合规版本
 * 注意：此版本仅用于技术展示，不涉及真实货币交易
 * 使用积分系统替代ETH支付，符合中国政策环境
 */
contract CreationMarketplace_CN is ReentrancyGuard {
    CreationRegistry public creationRegistry;

    // 市场费率（基点，1% = 100）
    uint256 public marketFeeRate = 250; // 2.5%
    address public feeCollector;

    // 积分系统 - 替代真实货币
    mapping(address => uint256) public creatorPoints;
    uint256 public totalPointsSupply = 1000000; // 总积分供应量
    uint256 public totalPointsMinted = 0;

    // 挂单结构 - 使用积分定价
    struct Listing {
        uint256 id;
        uint256 creationId;
        address seller;
        uint256 priceInPoints; // 使用积分定价
        bool isActive;
        uint256 timestamp;
    }

    // 出价结构 - 使用积分出价
    struct Offer {
        uint256 id;
        uint256 creationId;
        address bidder;
        uint256 amountInPoints; // 使用积分出价
        uint256 expiration;
        bool isActive;
    }

    // 存储所有挂单
    mapping(uint256 => Listing) public listings;
    uint256 private _listingIds;

    // 存储所有出价
    mapping(uint256 => Offer) public offers;
    uint256 private _offerIds;

    // 创作ID到挂单ID的映射
    mapping(uint256 => uint256[]) public creationToListings;

    // 创作ID到出价ID的映射
    mapping(uint256 => uint256[]) public creationToOffers;

    // 事件
    event ListingCreated(
        uint256 indexed listingId,
        uint256 indexed creationId,
        address indexed seller,
        uint256 priceInPoints
    );
    event ListingCanceled(uint256 indexed listingId);
    event ListingSold(
        uint256 indexed listingId,
        uint256 indexed creationId,
        address seller,
        address buyer,
        uint256 priceInPoints
    );
    event OfferCreated(
        uint256 indexed offerId,
        uint256 indexed creationId,
        address indexed bidder,
        uint256 amountInPoints
    );
    event OfferCanceled(uint256 indexed offerId);
    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed creationId,
        address seller,
        address buyer,
        uint256 amountInPoints
    );
    event PointsMinted(address indexed to, uint256 amount);
    event PointsTransferred(
        address indexed from,
        address indexed to,
        uint256 amount
    );
    event MarketFeeChanged(uint256 oldFee, uint256 newFee);
    event FeeCollectorChanged(address oldCollector, address newCollector);

    constructor(address _creationRegistryAddress) {
        creationRegistry = CreationRegistry(_creationRegistryAddress);
        feeCollector = msg.sender;

        // 给合约部署者一些初始积分用于测试
        creatorPoints[msg.sender] = 10000;
        totalPointsMinted = 10000;

        emit PointsMinted(msg.sender, 10000);
    }

    /**
     * @dev 铸造积分 - 仅用于演示目的
     * 在实际应用中，积分应该通过法定货币购买获得
     */
    function mintPoints(address to, uint256 amount) external {
        require(
            msg.sender == feeCollector,
            "Only fee collector can mint points"
        );
        require(
            totalPointsMinted + amount <= totalPointsSupply,
            "Exceeds total supply"
        );

        creatorPoints[to] += amount;
        totalPointsMinted += amount;

        emit PointsMinted(to, amount);
    }

    /**
     * @dev 获取用户的积分余额
     */
    function getPointsBalance(address user) external view returns (uint256) {
        return creatorPoints[user];
    }

    /**
     * @dev 创建挂单 - 使用积分定价
     * @param creationId 创作ID
     * @param priceInPoints 积分价格
     * @return 新创建的挂单ID
     */
    function createListing(
        uint256 creationId,
        uint256 priceInPoints
    ) public returns (uint256) {
        require(
            creationRegistry.ownerOf(creationId) == msg.sender,
            "Not the owner of this creation"
        );
        require(priceInPoints > 0, "Price must be greater than zero");
        require(priceInPoints <= 1000000, "Price too high"); // 防止溢出

        // 检查是否已授权给市场
        require(
            creationRegistry.getApproved(creationId) == address(this) ||
                creationRegistry.isApprovedForAll(msg.sender, address(this)),
            "Market not approved to transfer NFT"
        );

        _listingIds++;
        uint256 newListingId = _listingIds;

        Listing memory newListing = Listing({
            id: newListingId,
            creationId: creationId,
            seller: msg.sender,
            priceInPoints: priceInPoints,
            isActive: true,
            timestamp: block.timestamp
        });

        listings[newListingId] = newListing;
        creationToListings[creationId].push(newListingId);

        emit ListingCreated(
            newListingId,
            creationId,
            msg.sender,
            priceInPoints
        );

        return newListingId;
    }

    /**
     * @dev 取消挂单
     * @param listingId 挂单ID
     */
    function cancelListing(uint256 listingId) public {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing is not active");

        listing.isActive = false;

        emit ListingCanceled(listingId);
    }

    /**
     * @dev 购买挂单
     * @param listingId 挂单ID
     */
    function buyListing(uint256 listingId) public nonReentrant {
        require(
            listingId > 0 && listingId <= _listingIds,
            "Invalid listing ID"
        );
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing is not active");
        require(
            creatorPoints[msg.sender] >= listing.priceInPoints,
            "Insufficient points"
        );

        // 计算市场费用
        uint256 marketFee = (listing.priceInPoints * marketFeeRate) / 10000;
        uint256 sellerAmount = listing.priceInPoints - marketFee;

        // 转移积分
        creatorPoints[msg.sender] -= listing.priceInPoints;
        creatorPoints[listing.seller] += sellerAmount;
        creatorPoints[feeCollector] += marketFee;

        // 转移NFT
        creationRegistry.safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.creationId
        );

        // 更新挂单状态
        listing.isActive = false;

        emit ListingSold(
            listingId,
            listing.creationId,
            listing.seller,
            msg.sender,
            listing.priceInPoints
        );

        emit PointsTransferred(msg.sender, listing.seller, sellerAmount);
        emit PointsTransferred(msg.sender, feeCollector, marketFee);
    }

    /**
     * @dev 创建出价 - 使用积分
     * @param creationId 创作ID
     * @param amountInPoints 积分出价金额
     * @param expiration 过期时间戳
     * @return 新创建的出价ID
     */
    function createOffer(
        uint256 creationId,
        uint256 amountInPoints,
        uint256 expiration
    ) public returns (uint256) {
        require(
            creationRegistry.ownerOf(creationId) != msg.sender,
            "Cannot bid on your own creation"
        );
        require(amountInPoints > 0, "Amount must be greater than zero");
        require(
            expiration > block.timestamp,
            "Expiration must be in the future"
        );
        require(
            creatorPoints[msg.sender] >= amountInPoints,
            "Insufficient points"
        );

        // 锁定积分
        creatorPoints[msg.sender] -= amountInPoints;

        _offerIds++;
        uint256 newOfferId = _offerIds;

        Offer memory newOffer = Offer({
            id: newOfferId,
            creationId: creationId,
            bidder: msg.sender,
            amountInPoints: amountInPoints,
            expiration: expiration,
            isActive: true
        });

        offers[newOfferId] = newOffer;
        creationToOffers[creationId].push(newOfferId);

        emit OfferCreated(newOfferId, creationId, msg.sender, amountInPoints);

        return newOfferId;
    }

    /**
     * @dev 取消出价
     * @param offerId 出价ID
     */
    function cancelOffer(uint256 offerId) public nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.bidder == msg.sender, "Not the bidder");
        require(offer.isActive, "Offer is not active");

        offer.isActive = false;

        // 退还积分
        creatorPoints[offer.bidder] += offer.amountInPoints;

        emit OfferCanceled(offerId);
        emit PointsTransferred(
            address(this),
            offer.bidder,
            offer.amountInPoints
        );
    }

    /**
     * @dev 接受出价
     * @param offerId 出价ID
     */
    function acceptOffer(uint256 offerId) public nonReentrant {
        Offer storage offer = offers[offerId];
        require(offer.isActive, "Offer is not active");
        require(offer.expiration > block.timestamp, "Offer expired");

        uint256 creationId = offer.creationId;
        require(
            creationRegistry.ownerOf(creationId) == msg.sender,
            "Not the owner of this creation"
        );

        // 检查是否已授权给市场
        require(
            creationRegistry.getApproved(creationId) == address(this) ||
                creationRegistry.isApprovedForAll(msg.sender, address(this)),
            "Market not approved to transfer NFT"
        );

        // 计算市场费用
        uint256 marketFee = (offer.amountInPoints * marketFeeRate) / 10000;
        uint256 sellerAmount = offer.amountInPoints - marketFee;

        // 转移积分
        creatorPoints[msg.sender] += sellerAmount;
        creatorPoints[feeCollector] += marketFee;

        // 转移NFT
        creationRegistry.safeTransferFrom(msg.sender, offer.bidder, creationId);

        // 更新出价状态
        offer.isActive = false;

        // 取消该创作的所有其他出价
        _cancelOtherOffers(creationId, offerId);

        emit OfferAccepted(
            offerId,
            creationId,
            msg.sender,
            offer.bidder,
            offer.amountInPoints
        );

        emit PointsTransferred(address(this), msg.sender, sellerAmount);
        emit PointsTransferred(address(this), feeCollector, marketFee);
    }

    /**
     * @dev 取消创作的其他出价
     * @param creationId 创作ID
     * @param acceptedOfferId 已接受的出价ID
     */
    function _cancelOtherOffers(
        uint256 creationId,
        uint256 acceptedOfferId
    ) internal {
        uint256[] memory offerIds = creationToOffers[creationId];

        for (uint i = 0; i < offerIds.length; i++) {
            uint256 offerId = offerIds[i];
            if (offerId != acceptedOfferId) {
                Offer storage offer = offers[offerId];
                if (offer.isActive) {
                    offer.isActive = false;

                    // 退还积分
                    creatorPoints[offer.bidder] += offer.amountInPoints;

                    emit OfferCanceled(offerId);
                    emit PointsTransferred(
                        address(this),
                        offer.bidder,
                        offer.amountInPoints
                    );
                }
            }
        }
    }

    /**
     * @dev 设置市场费率
     * @param newFeeRate 新费率（基点）
     */
    function setMarketFeeRate(uint256 newFeeRate) public {
        require(
            msg.sender == feeCollector,
            "Only fee collector can change fee rate"
        );
        require(newFeeRate <= 1000, "Fee rate too high"); // 最高10%

        uint256 oldFeeRate = marketFeeRate;
        marketFeeRate = newFeeRate;

        emit MarketFeeChanged(oldFeeRate, newFeeRate);
    }

    /**
     * @dev 设置费用接收者
     * @param newFeeCollector 新费用接收者地址
     */
    function setFeeCollector(address newFeeCollector) public {
        require(
            msg.sender == feeCollector,
            "Only current fee collector can change"
        );
        require(newFeeCollector != address(0), "Invalid address");

        address oldFeeCollector = feeCollector;
        feeCollector = newFeeCollector;

        emit FeeCollectorChanged(oldFeeCollector, newFeeCollector);
    }

    /**
     * @dev 获取创作的所有挂单
     * @param creationId 创作ID
     * @return 挂单ID列表
     */
    function getCreationListings(
        uint256 creationId
    ) public view returns (uint256[] memory) {
        return creationToListings[creationId];
    }

    /**
     * @dev 获取创作的所有出价
     * @param creationId 创作ID
     * @return 出价ID列表
     */
    function getCreationOffers(
        uint256 creationId
    ) public view returns (uint256[] memory) {
        return creationToOffers[creationId];
    }
}
