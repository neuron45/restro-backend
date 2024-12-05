const { doCustomerExistDB, addCustomerDB, getCustomersDB, updateCustomerDB, deleteCustomerDB, getCustomerDB, searchCustomerDB } = require("../services/customer.service");

exports.addCustomer = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const phone = req.body.phone;
        const name = req.body.name;
        const email = req.body.email;
        const birthDate = req.body.birthDate;
        const gender = req.body.gender;
        const isMember = req.body.isMember;

        if(!(phone && name)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details: Name, Phone!"
            });
        }

        const doCustomerExist = await doCustomerExistDB(phone, tenantId);

        if(doCustomerExist) {
            return res.status(400).json({
                success: false,
                message: `Customer with Phone: ${phone} Already exists!`
            });
        }

        await addCustomerDB(phone, name, email, birthDate, gender, isMember, tenantId);

        return res.status(200).json({
            success: true,
            message: `Customer: ${phone} added.`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getCustomers = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const { page, perPage, sort, filter } = req.query;

        const result = await getCustomersDB(page, perPage, sort, filter, tenantId);

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const phone = req.params.id;
        const name = req.body.name;
        const email = req.body.email;
        const birthDate = req.body.birthDate;
        const gender = req.body.gender;

        if(!(phone && name)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details: Name, Phone!"
            });
        }

        await updateCustomerDB(phone, name, email, birthDate, gender, tenantId);

        return res.status(200).json({
            success: true,
            message: `Customer: ${phone} Details Updated.`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};


exports.deleteCustomer = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const phone = req.params.id;

        await deleteCustomerDB(phone, tenantId);

        return res.status(200).json({
            success: true,
            message: `Customer: ${phone} Deleted.`
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getCustomer = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const phone = req.params.id;

        const result = await getCustomerDB(phone, tenantId);

        if(result) {
            return res.status(200).json(result);
        }
        return res.status(404).json({
            success: false,
            message: `No Customer found with Phone: ${phone}`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.searchCustomer = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const searchString = req.query.q;

        const result = await searchCustomerDB(searchString, tenantId);

        if(result.length > 0) {
            return res.status(200).json(result);
        }
        return res.status(404).json({
            success: false,
            message: `No Customers found!`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};