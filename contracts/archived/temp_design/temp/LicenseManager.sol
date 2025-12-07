// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CreatorChainRegistry.sol";

/**
 * @title LicenseManager
 * @dev 管理AI创作内容的使用授权 - 纯积分系统版本
 * 移除所有虚拟货币交易功能，符合大赛要求
 */
contract LicenseManager {
    CreationRegistry public creationRegistry;

    // 授权类型枚举
    enum LicenseType {
        Personal,
        Commercial,
        Derivative,
        Full
    }

    // 授权结构
    struct License {
        uint256 id;
        uint256 creationId;
        address licensee;
        LicenseType licenseType;
        uint256 pointsCost; // 改为积分成本
        uint256 startTime;
        uint256 endTime; // 0表示永久
        bool isActive;
    }

    // 授权模板结构
    struct LicenseTemplate {
        uint256 id;
        uint256 creationId;
        LicenseType licenseType;
        uint256 pointsCost; // 改为积分成本
        uint256 duration; // 0表示永久
        bool isActive;
    }

    // 存储所有授权
    mapping(uint256 => License) public licenses;
    uint256 private _licenseIds;

    // 存储所有授权模板
    mapping(uint256 => LicenseTemplate) public licenseTemplates;
    uint256 private _templateIds;

    // 创作ID到授权模板ID的映射
    mapping(uint256 => uint256[]) public creationToTemplates;

    // 用户地址到持有授权ID的映射
    mapping(address => uint256[]) public userLicenses;

    // 事件
    event LicenseTemplateCreated(
        uint256 indexed templateId,
        uint256 indexed creationId,
        LicenseType licenseType,
        uint256 pointsCost
    );
    event LicenseIssued(
        uint256 indexed licenseId,
        uint256 indexed creationId,
        address indexed licensee,
        LicenseType licenseType
    );
    event LicenseRevoked(uint256 indexed licenseId);

    constructor(address _creationRegistryAddress) {
        creationRegistry = CreationRegistry(_creationRegistryAddress);
    }

    /**
     * @dev 创建授权模板
     * @param creationId 创作ID
     * @param licenseType 授权类型
     * @param pointsCost 积分成本
     * @param duration 授权持续时间（秒）
     * @return 新创建的模板ID
     */
    function createLicenseTemplate(
        uint256 creationId,
        LicenseType licenseType,
        uint256 pointsCost,
        uint256 duration
    ) public returns (uint256) {
        CreationRegistry.Creation memory creation = creationRegistry
            .getCreation(creationId);
        require(
            creation.creator == msg.sender,
            "Only the creator can create license templates"
        );

        _templateIds++;
        uint256 newTemplateId = _templateIds;

        LicenseTemplate memory newTemplate = LicenseTemplate({
            id: newTemplateId,
            creationId: creationId,
            licenseType: licenseType,
            pointsCost: pointsCost,
            duration: duration,
            isActive: true
        });

        licenseTemplates[newTemplateId] = newTemplate;
        creationToTemplates[creationId].push(newTemplateId);

        emit LicenseTemplateCreated(
            newTemplateId,
            creationId,
            licenseType,
            pointsCost
        );

        return newTemplateId;
    }

    /**
     * @dev 申请授权（纯积分系统）
     * @param templateId 授权模板ID
     * @return 新创建的授权ID
     */
    function applyForLicense(uint256 templateId) public returns (uint256) {
        LicenseTemplate memory template = licenseTemplates[templateId];
        require(template.isActive, "License template is not active");
        require(template.id != 0, "Template does not exist");

        // 创建授权（无需支付，纯积分系统）
        _licenseIds++;
        uint256 newLicenseId = _licenseIds;

        License memory newLicense = License({
            id: newLicenseId,
            creationId: template.creationId,
            licensee: msg.sender,
            licenseType: template.licenseType,
            pointsCost: template.pointsCost,
            startTime: block.timestamp,
            endTime: template.duration == 0
                ? 0
                : block.timestamp + template.duration,
            isActive: true
        });

        licenses[newLicenseId] = newLicense;
        userLicenses[msg.sender].push(newLicenseId);

        emit LicenseIssued(
            newLicenseId,
            template.creationId,
            msg.sender,
            template.licenseType
        );

        return newLicenseId;
    }

    /**
     * @dev 检查用户是否有有效授权
     * @param creationId 创作ID
     * @param user 用户地址
     * @param licenseType 需要的授权类型
     * @return 是否有有效授权
     */
    function hasValidLicense(
        uint256 creationId,
        address user,
        LicenseType licenseType
    ) public view returns (bool) {
        uint256[] memory userLicenseIds = userLicenses[user];

        for (uint i = 0; i < userLicenseIds.length; i++) {
            License memory license = licenses[userLicenseIds[i]];

            if (
                license.creationId == creationId &&
                license.isActive &&
                (license.endTime == 0 || license.endTime > block.timestamp)
            ) {
                // 检查授权类型兼容性
                if (
                    license.licenseType == licenseType ||
                    license.licenseType == LicenseType.Full
                ) {
                    return true;
                }

                // 商业授权包含个人授权
                if (
                    license.licenseType == LicenseType.Commercial &&
                    licenseType == LicenseType.Personal
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @dev 撤销授权
     * @param licenseId 授权ID
     */
    function revokeLicense(uint256 licenseId) public {
        License storage license = licenses[licenseId];
        require(license.id != 0, "License does not exist");

        CreationRegistry.Creation memory creation = creationRegistry
            .getCreation(license.creationId);

        require(
            creation.creator == msg.sender,
            "Only the creator can revoke licenses"
        );
        require(license.isActive, "License is already inactive");

        license.isActive = false;

        emit LicenseRevoked(licenseId);
    }

    /**
     * @dev 获取创作的所有授权模板
     * @param creationId 创作ID
     * @return 授权模板ID列表
     */
    function getCreationTemplates(
        uint256 creationId
    ) public view returns (uint256[] memory) {
        return creationToTemplates[creationId];
    }

    /**
     * @dev 获取用户的所有授权
     * @param user 用户地址
     * @return 授权ID列表
     */
    function getUserLicenses(
        address user
    ) public view returns (uint256[] memory) {
        return userLicenses[user];
    }
}
