// SPDX-License-Identifier: APACHE-2.0
pragma solidity >=0.8.0 <0.9.0;

import "https://github.com/Block-Star-Logic/open-register/blob/85c0a12e23b69c71a0c256938f6084cfdf651c77/blockchain_ethereum/solidity/V1/interfaces/IOpenRegister.sol";

import "https://github.com/Block-Star-Logic/open-roles/blob/fc410fe170ac2d608ea53e3760c8691e3c5b550e/blockchain_ethereum/solidity/v2/contracts/interfaces/IOpenRoles.sol";

import "https://github.com/Block-Star-Logic/open-roles/blob/e7813857f186df0043c84f0cca42478584abe09c/blockchain_ethereum/solidity/v2/contracts/core/OpenRolesSecure.sol";

import "../interfaces/IJobSeekerDashboard.sol";

contract JobSeekerDashboard is OpenRolesSecure, IJobSeekerDashboard {

    using LOpenUtilities for address; 

    uint256 version             = 6; 
    string name = "RESERVED_JOB_SEEKER_DASHBOARD";

    string registerCA           = "RESERVED_OPEN_REGISTER_CORE";
    string roleManagerCA        = "RESERVED_OPEN_ROLES_CORE"; 

    address [] appliedPostings; 
    address [] viewableAppliedPostings; 

    IOpenRegister registry; 

    address jobSeeker; 
 
    string localViewerRole      = "LOCAL_DASHBOARD_VIEWER_ROLE";
    string localEditorRole      = "LOCAL_DASHBOARD_EDITOR_ROLE";
    string localModeratorRole   = "LOCAL_DASHBOARD_MODERATOR_ROLE";
    string jobcryptAdminRole    = "JOBCRYPT_ADMIN_ROLE";

    
    string dashboardType        = "JOBSEEKER_DASHBOARD_TYPE";

    constructor(address _jobSeeker, address _registryAddress) {
        jobSeeker = _jobSeeker;         
        registry = IOpenRegister(_registryAddress);
        setRoleManager(registry.getAddress(roleManagerCA));

        addConfigurationItem(_registryAddress);   
        addConfigurationItem(address(roleManager));           
        addConfigurationItem(name, self, version);
    }

    function getAppliedJobs() override view external returns (address [] memory _appliedJobAddresses){
        require(isSecure(localViewerRole, "getAppliedJobs"), "JC JOBSEEKER DASHBOARD : getAppliedJobs : 00 - Local Viewer Role only"); // job seeker only 
        return viewableAppliedPostings; 
    }

    function removeAppliedJob(address _appliedJob) external returns (bool _removed){
        require(isSecure(localEditorRole, "getAppliedJobs"), "JC JOBSEEKER DASHBOARD : getAppliedJobs : 00 - Local Viewer Role only"); // job seeker only 
        viewableAppliedPostings = _appliedJob.remove(viewableAppliedPostings);
        return true; 
    }

    function addJobApplication(address _jobPosting) override external returns (bool _added){
        require(isSecure(localModeratorRole, "addJobApplication"), "JC JOBSEEKER DASHBOARD : addJobApplication : 00 - Local Manager Role only");        
        appliedPostings.push(_jobPosting);
        viewableAppliedPostings.push(_jobPosting);
        return true; 
    }

    function notifyChangeOfAddress() external returns (bool _recieved){
        require(isSecure(jobcryptAdminRole, "notifyChangeOfAddress")," admin only ");    
        registry                = IOpenRegister(registry.getAddress(registerCA)); // make sure this is NOT a zero address       
        roleManager             = IOpenRoles(registry.getAddress(roleManagerCA));
        addConfigurationItem(address(registry));   
        addConfigurationItem(address(roleManager));  
        return true; 
    }
    // ======================== INTERNAL ==================================
    
}