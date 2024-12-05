const { CONFIG } = require("../config");
const { removeRefreshTokenDB, addRefreshTokenDB, verifyRefreshTokenDB } = require("../services/auth.service");

const { signInDB, getAdminUserDB, getActiveTenantsDB, getInActiveTenantsDB,getAllTenantsDB,  getOrdersProcessedTodayDB, getSalesVolumeTodayDB, getMRRValueDB, getARRValueDB, getRestaurantsTotalCustomersDB, getSuperAdminTopSellingItemsDB, getSuperAdminSalesVolumeDB, getSuperAdminOrdersProcessedDB, getTenantsDB , addTenantDB , updateTenantDB , getTenantCntByIdDB ,getTenantDetailsByIdDB , logoutAllUsersOfTenantDB , deleteTenantDB , getTenantsDataByStatusDB, getTenantSubscriptionHistoryDB, getTenantTotalUsersDB, getTenantDetailsDB, getTenantStoreDetailsDB } = require("../services/superadmin.service")
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const {checkEmailExistsDB} = require('../services/auth.service');

exports.signIn = async (req, res) => {
    try {

        const username = req.body.username;
        const password = req.body.password;

        if (!(username && password)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const result = await signInDB(username, password);

        if (result) {
            // set cookie
            const cookieOptions = {
                expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY)),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            };

            const refreshTokenExpiry = new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY_REFRESH));
            const cookieRefreshTokenOptions = {
                expires: refreshTokenExpiry,
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            };

            result.password = undefined;

            const payload = {
                username: result.email,
                name: result.name,
                role: "superadmin",
            }
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);

            res.cookie('accessToken', accessToken, cookieOptions);
            res.cookie('refreshToken', refreshToken, cookieRefreshTokenOptions);
            res.cookie('restroprosaas__authenticated', true, {
                expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY_REFRESH)),
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            })

            // set refresh token in DB.
            const deviceDetails = req.useragent;

            const deviceIP = req.connection.remoteAddress;
            const deviceName = `${deviceDetails.platform}\nBrowser: ${deviceDetails.browser}`;
            const deviceLocation = null;
            await addRefreshTokenDB(username, refreshToken, refreshTokenExpiry, deviceIP, deviceName, deviceLocation, null);

            return res.status(200).json({
                success: true,
                message: "Login Successful.",
                accessToken,
                user: payload
            })

        } else {
            return res.status(401).json({
                success: false,
                message: "Email or Password is Invalid!"
            });
        }


    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "We're facing some issues! Please try later!"
        });
    }
}
exports.signOut = async (req, res) => {
    try {
        const user = req.user;
        const refreshToken = req.cookies.refreshToken;

        const cookieOptions = {
            expires: new Date(Date.now()),
            httpOnly: true,
            domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
            sameSite: false,
            secure: process.env.NODE_ENV == "production",
            path: "/"
        };

        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);
        res.clearCookie('restroprosaas__authenticated', {
            expires: new Date(Date.now()),
            domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
            sameSite: false,
            secure: process.env.NODE_ENV == "production",
            path: "/"
        });

        // remove refreshToken in DB.
        await removeRefreshTokenDB(user.username, refreshToken);

        return res.status(200).json({
            success: true,
            message: "Logout Successful."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
}

exports.getNewAccessToken = async (req, res) => {
    try {
        const user = req.user;
        const refreshToken = req.cookies.refreshToken;

        // verify the refresh token with the DB
        const isExist = await verifyRefreshTokenDB(refreshToken);

        if(isExist) {
            // generate new access token
            // set cookie
            const cookieOptions = {
                expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY)),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            };
            const u = await getAdminUserDB(user.username);
            const payload = {
                username: u.email,
                name: u.name,
                role: "superadmin",
            }
            const accessToken = generateAccessToken(payload);

            res.cookie('accessToken', accessToken, cookieOptions);

            return res.status(200).json({
                success: true,
                message: "New Token Created Successfully.",
                accessToken
            });
        } else {
            res.clearCookie('accessToken', {
                expires: new Date(Date.now()),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            });
            res.clearCookie('refreshToken', {
                expires: new Date(Date.now()),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            });
            res.clearCookie('restroprosaas__authenticated', {
                expires: new Date(Date.now()),
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            });
            return res.status(401).json({
                success: false,
                loginNeeded: true,
                message: "Login again to access this page."
            });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getTenants = async (req, res) => {
    try {
        const { page, perPage, search, status, type, from, to } = req.query;

        // if (!type) {
        //     return res.status(400).json({
        //       success: false,
        //       message: "Please provide required details!",
        //     });
        //   }

        if (type == "custom") {
            if (!(from && to)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide required details from & to dates!",
                });
            }
        }

        const result = await getTenantsDB(page, perPage, search, status, type, from, to);

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
}

exports.getSuperAdminTenantsCntData = async (req, res) => {
    try {

        const [activeTenants, inactiveTenants, allTenants] = await Promise.all([
            getActiveTenantsDB(),
            getInActiveTenantsDB(),
            getAllTenantsDB(),
        ]);

        return res.status(200).json({
            activeTenants, inactiveTenants, allTenants
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
}

exports.getSuperAdminDashboardData = async (req, res) => {
    try {

        const [activeTenants, ordersProcessedToday, salesVolumeToday, mrr, arr] = await Promise.all([
            getActiveTenantsDB(),
            getOrdersProcessedTodayDB(),
            getSalesVolumeTodayDB(),
            getMRRValueDB(),
            getARRValueDB()
        ]);

        return res.status(200).json({
            activeTenants, ordersProcessedToday, salesVolumeToday, mrr, arr
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.addTenant = async (req, res) => {
    try {
        const { name, email, password, isActive } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isAdmin = 1;

        const tenantData = await addTenantDB({ name, email, password, isAdmin, isActive });

        return res.status(200).json({ message: "Tenant added successfully", tenant: tenantData });
    } catch (error) {
        console.error("Error adding tenant:", error);

        if (error == "User already exist! Try Different Email!") {
            return res.status(409).json({ message: error }); // 409 Conflict status code
        }

        return res.status(500).json({ message: "An error occurred while adding the tenant" });
    }
};


exports.updateTenant = async (req, res) => {
    try {
        const tenantId = req.params.id;
        const { name, email, isActive } = req.body;

        if(!tenantId){
            return res.status(400).json({ message: 'Invalid Tenant' });
        }
        if (!name || !email || isActive === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const tenantCnt = await getTenantCntByIdDB(tenantId);

        if (tenantCnt != 1) {
            return res.status(404).json({ message: "Tenant Not Found" });
        }

        const currentTenant = await getTenantDetailsByIdDB(tenantId);

        if(currentTenant.username !== email){
            // check if email exists
            const isEmailExists = await checkEmailExistsDB(email);

            if(isEmailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Account already exists with provided email !"
                });
            }
        }

        await updateTenantDB(tenantId, name, email, isActive);

        if (currentTenant.username !== email || (isActive == 0 && currentTenant.is_active == 1)) {
            await logoutAllUsersOfTenantDB(tenantId);
        }

        return res.status(200).json({ message: 'Tenant updated successfully' });
    } catch (error) {
        console.error('Error updating tenant:', error);
        return res.status(500).json({ message: "An error occurred while updating the tenant" });
    }
};

exports.deleteTenant= async (req , res) => {
    try {
        const tenantId = req.params.id;

        if(!tenantId){
            return res.status(400).json({ message: 'Invalid Tenant' });
        }

        const tenantCnt = await getTenantCntByIdDB(tenantId);

        if (tenantCnt != 1) {
            return res.status(404).json({ message: "Tenant Not Found" });
        }

        await deleteTenantDB(tenantId);

        return res.status(200).json({
            success: true,
            message: "Tenant Deleted Successfully."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
}

exports.getTenantsDataByStatus = async (req, res) => {
    try {
        const status = req.params.status;

        if(status != 'active' && status != 'inactive' && status != 'all'){
            return res.status(400).json({
                success: false,
                message: "Invalid Status. Try Again Later !"
            });
        }

        let data;

        if(status == 'active'){
            data = await getTenantsDataByStatusDB(1);
        }else if(status == 'inactive'){
            data = await getTenantsDataByStatusDB(0);
        }else if(status == 'all'){
            data = await getTenantsDataByStatusDB(null);

        }

        return res.status(200).json(data);
        } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
}

exports.getTenantSubscriptionHistory = async (req, res) => {
    try {
        const tenantId = req.params.id;

        const subscriptionHistory = await getTenantSubscriptionHistoryDB(tenantId);

        // tenant info
        const tenantDetails = await getTenantDetailsDB(tenantId);

        // store details
        const storeDetails = await getTenantStoreDetailsDB(tenantId);

        // tenant users
        const tenantTotalUsers = await getTenantTotalUsersDB(tenantId);

        return res.status(200).json({
            tenantInfo: tenantDetails,
            storeDetails: storeDetails,
            totalUsers: tenantTotalUsers,
            subscriptionHistory: subscriptionHistory
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
}

exports.getSuperAdminReportsData = async (req, res) => {
    try {
        const from = req.query.from || null;
        const to = req.query.to || null;
        const type = req.query.type;

        if(!type) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        if(type == 'custom') {
            if(!(from && to)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide required details from & to dates!"
                });
            }
        }

        const [activeTenants, mrr, arr, totalCustomers, topSellingItems, salesVolume, ordersProcessed] = await Promise.all([
            getActiveTenantsDB(),
            getMRRValueDB(),
            getARRValueDB(),
            getRestaurantsTotalCustomersDB(),
            getSuperAdminTopSellingItemsDB(type, from, to),
            getSuperAdminSalesVolumeDB(type, from, to),
            getSuperAdminOrdersProcessedDB(type, from, to)
        ]);

        return res.status(200).json({
            activeTenants, mrr, arr, totalCustomers, topSellingItems,
            salesVolume, ordersProcessed
        });
        } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
