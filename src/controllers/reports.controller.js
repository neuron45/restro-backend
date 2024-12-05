const { getOrdersCountDB, getNewCustomerCountDB, getRepeatCustomerCountDB, getAverageOrderValueDB, getTotalCustomersDB, getTotalNetRevenueDB, getTotalTaxDB, getRevenueDB, getTopSellingItemsDB } = require("../services/reports.service")
const { getCurrencyDB } = require("../services/settings.service")

exports.getReports = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

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

        const [ordersCount, newCustomers, repeatedCustomers, averageOrderValue, totalCustomers, netRevenue, taxTotal, revenueTotal, topSellingItems, currency] = await Promise.all([
            getOrdersCountDB(type, from, to, tenantId),
            getNewCustomerCountDB(type, from, to, tenantId),
            getRepeatCustomerCountDB(type, from, to, tenantId),
            getAverageOrderValueDB(type, from, to, tenantId),
            getTotalCustomersDB(tenantId),
            getTotalNetRevenueDB(type, from, to, tenantId),
            getTotalTaxDB(type, from, to, tenantId),
            getRevenueDB(type, from, to, tenantId),
            getTopSellingItemsDB(type, from, to, tenantId),
            getCurrencyDB(tenantId),
        ]);

        return res.status(200).json({
            ordersCount, newCustomers, repeatedCustomers, currency, averageOrderValue, totalCustomers, netRevenue, taxTotal, revenueTotal, topSellingItems
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};