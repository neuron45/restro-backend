const { nanoid } = require("nanoid");
const { getStoreSettingDB, setStoreSettingDB, getPrintSettingDB, setPrintSettingDB, getTaxesDB, addTaxDB, updateTaxDB, deleteTaxDB, getTaxDB, addPaymentTypeDB, getPaymentTypesDB, updatePaymentTypeDB, deletePaymentTypeDB, togglePaymentTypeDB, addStoreTableDB, getStoreTablesDB, updateStoreTableDB, deleteStoreTableDB, addCategoryDB, getCategoriesDB, updateCategoryDB, deleteCategoryDB, getQRMenuCodeDB, updateQRMenuCodeDB } = require("../services/settings.service");
exports.getStoreDetails = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const result = await getStoreSettingDB(tenantId);

        const storeSettings = {
            storeName: result?.store_name || null,
            address: result?.address || null,
            phone: result?.phone || null,
            email: result?.email || null,
            currency: result?.currency || null,
            image: result?.image || null,
            isQRMenuEnabled: result?.is_qr_menu_enabled || false,
            isQROrderEnabled: result?.is_qr_order_enabled || false,
            uniqueQRCode: result?.unique_qr_code || null
        };

        return res.status(200).json(storeSettings);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.setStoreDetails = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const storeName = req.body.storeName;
        const address = req.body.address;
        const phone = req.body.phone;
        const email = req.body.email;
        const currency = req.body.currency;
        const isQRMenuEnabled = req.body.isQRMenuEnabled;
        const isQROrderEnabled = req.body.isQROrderEnabled;
        const uniqueQRCode = nanoid();

        const qrCodeExists = await getQRMenuCodeDB(tenantId);
        if(qrCodeExists) {
            await setStoreSettingDB(storeName, address, phone, email, currency, isQRMenuEnabled,isQROrderEnabled , uniqueQRCode, tenantId);
        } else {
            await updateQRMenuCodeDB(uniqueQRCode, tenantId);
            await setStoreSettingDB(storeName, address, phone, email, currency, isQRMenuEnabled, isQROrderEnabled,uniqueQRCode, tenantId);
        }

        return res.status(200).json({
            success: true,
            message: "Details Saved Successfully."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getPrintSettings = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const result = await getPrintSettingDB(tenantId);

        const printSettings = {
            pageFormat: result?.page_format || null,
            header: result?.header || null,
            footer: result?.footer || null,
            showNotes: result?.show_notes || null,
            isEnablePrint: result?.is_enable_print || null,
            showStoreDetails: result?.show_store_details || null,
            showCustomerDetails: result?.show_customer_details || null,
            printToken: result?.print_token || null
        };

        return res.status(200).json(printSettings);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.setPrintSettings = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const pageFormat = req.body.pageFormat;
        const header = req.body.header;
        const footer = req.body.footer;
        const showNotes = req.body.showNotes;
        const isEnablePrint = req.body.isEnablePrint;
        const showStoreDetails = req.body.showStoreDetails;
        const showCustomerDetails = req.body.showCustomerDetails;
        const printToken = req.body.printToken;

        await setPrintSettingDB(pageFormat, header, footer, showNotes, isEnablePrint, showStoreDetails, showCustomerDetails, printToken, tenantId);

        return res.status(200).json({
            success: true,
            message: "Details Saved Successfully."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getAllTaxes = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const result = await getTaxesDB(tenantId);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getTax = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const taxId = req.params.id;
        const result = await getTaxDB(taxId, tenantId);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.addTax = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const title = req.body.title;
        const taxRate = req.body.rate;
        const type = req.body.type;

        if(!(title && taxRate && type)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const taxId = await addTaxDB(title, taxRate, type, tenantId);
        return res.status(200).json({
            success: true,
            message: `Tax Details Added.`,
            taxId
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updateTax = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const taxId = req.params.id;
        const title = req.body.title;
        const taxRate = req.body.rate;
        const type = req.body.type;

        if(!(title && taxRate && type)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        await updateTaxDB(taxId, title, taxRate, type, tenantId);
        return res.status(200).json({
            success: true,
            message: `Tax Details Updated.`,
            taxId
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.deletTax = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const taxId = req.params.id;

        await deleteTaxDB(taxId, tenantId);
        return res.status(200).json({
            success: true,
            message: `Tax Detail Removed.`,
            taxId
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};


exports.addPaymentType = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const title = req.body.title;
        const isActive = req.body.isActive;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const id = await addPaymentTypeDB(title, isActive, tenantId);
        return res.status(200).json({
            success: true,
            message: `Payment Type Added.`,
            id
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getAllPaymentTypes = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const result = await getPaymentTypesDB(false, tenantId);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updatePaymentType = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;
        const title = req.body.title;
        const isActive = req.body.isActive;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        await updatePaymentTypeDB(id, title, isActive, tenantId);
        return res.status(200).json({
            success: true,
            message: `Payment Type Updated.`,
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.togglePaymentType = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;
        const isActive = req.body.isActive;

        await togglePaymentTypeDB(id, isActive, tenantId);
        return res.status(200).json({
            success: true,
            message: `Payment Type Status Updated.`,
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.deletePaymentType = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;

        await deletePaymentTypeDB(id, tenantId);
        return res.status(200).json({
            success: true,
            message: `Payment Type Deleted.`,
            id
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.addStoreTable = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const title = req.body.title;
        const floor = req.body.floor;
        const seatingCapacity = req.body.seatingCapacity;

        if(!(title && floor && seatingCapacity)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        if(seatingCapacity < 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid seating capacity count!"
            });
        }

        const id = await addStoreTableDB(title, floor, seatingCapacity, tenantId);
        return res.status(200).json({
            success: true,
            message: `Store Table Added.`,
            id
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getAllStoreTables = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const result = await getStoreTablesDB(tenantId);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updateStoreTable = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;
        const title = req.body.title;
        const floor = req.body.floor;
        const seatingCapacity = req.body.seatingCapacity;

        if(!(title && floor && seatingCapacity)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        await updateStoreTableDB(id, title, floor, seatingCapacity, tenantId);
        return res.status(200).json({
            success: true,
            message: `Store Table Details Updated.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.deleteStoreTable = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;

        await deleteStoreTableDB(id, tenantId);
        return res.status(200).json({
            success: true,
            message: `Store Table Details Deleted.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};


exports.addCategory = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const title = req.body.title;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const id = await addCategoryDB(title, tenantId);
        return res.status(200).json({
            success: true,
            message: `Category Added.`,
            id
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const result = await getCategoriesDB(tenantId);
        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;
        const title = req.body.title;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        await updateCategoryDB(id, title, tenantId);
        return res.status(200).json({
            success: true,
            message: `Category Updated.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};


exports.deleteCategory = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;

        await deleteCategoryDB(id, tenantId);
        return res.status(200).json({
            success: true,
            message: `Category Deleted.`,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
