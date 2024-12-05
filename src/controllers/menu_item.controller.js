const { addMenuItemDB, updateMenuItemDB, deleteMenuItemDB, addMenuItemAddonDB, updateMenuItemAddonDB, deleteMenuItemAddonDB, getMenuItemAddonsDB, getAllAddonsDB, addMenuItemVariantDB, updateMenuItemVariantDB, deleteMenuItemVariantDB, getMenuItemVariantsDB, getAllVariantsDB, getAllMenuItemsDB, getMenuItemDB, updateMenuItemImageDB } = require("../services/menu_item.service");

const path = require("path")
const fs = require("fs");

exports.addMenuItem = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const {title, price, netPrice, taxId, categoryId} = req.body;

        if(!(title && price)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details: title, price"
            });
        }

        const menuItemId = await addMenuItemDB(title, price, netPrice, taxId, categoryId, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Added.",
            menuItemId
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.updateMenuItem = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;
        const {title, price, netPrice, taxId, categoryId} = req.body;

        if(!(title && price)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details: title, price"
            });
        }

        await updateMenuItemDB(id, title, price, netPrice, taxId, categoryId, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Updated."
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.uploadMenuItemPhoto = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;
        
        const file = req.files.image;
        
        const imagePath = path.join(__dirname, `../../public/${tenantId}/`) + id;
        
        if(!fs.existsSync(path.join(__dirname, `../../public/${tenantId}/`))) {
            fs.mkdirSync(path.join(__dirname, `../../public/${tenantId}/`));
        }

        const imageURL = `/public/${tenantId}/${id}`;

        await file.mv(imagePath);
        await updateMenuItemImageDB(id, imageURL, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Image Uploaded.",
            imageURL: imageURL
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.removeMenuItemPhoto = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;
        const imagePath = path.join(__dirname, `../../public/${tenantId}/`) + id;
         
        fs.unlinkSync(imagePath)

        await updateMenuItemImageDB(id, null, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Image Removed.",
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;
        
        await deleteMenuItemDB(id, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Deleted."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getAllMenuItems = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const [menuItems, addons, variants] = await Promise.all([
            getAllMenuItemsDB(tenantId),
            getAllAddonsDB(tenantId),
            getAllVariantsDB(tenantId)
        ]);

        const formattedMenuItems = menuItems.map(item => {
            const itemAddons = addons.filter(addon => addon.item_id == item.id);
            const itemVariants = variants.filter(variant => variant.item_id == item.id);

            return {
                ...item,
                addons: [...itemAddons],
                variants: [...itemVariants],
            }
        })

        return res.status(200).json(formattedMenuItems);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getMenuItem = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const id = req.params.id;

        const [menuItem, addons, variants] = await Promise.all([
            getMenuItemDB(id, tenantId),
            getMenuItemAddonsDB(id, tenantId),
            getMenuItemVariantsDB(id, tenantId)
        ]);

        const formattedMenuItems = {
            ...menuItem,
            addons: [...addons],
            variants: [...variants]
        }

        return res.status(200).json(formattedMenuItems);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

/* Addons */
exports.addMenuItemAddon = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const itemId = req.params.id;
        const {title, price} = req.body;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details: title"
            });
        }

        const menuItemAddonId = await addMenuItemAddonDB(itemId, title, price, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Addon Added.",
            addonId: menuItemAddonId
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
exports.updateMenuItemAddon = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const itemId = req.params.id;
        const addonId = req.params.addonId;
        const {title, price} = req.body;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details: title"
            });
        }

        await updateMenuItemAddonDB(itemId, addonId, title, price, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Addon Updated.",
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
exports.deleteMenuItemAddon = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const itemId = req.params.id;
        const addonId = req.params.addonId;

        await deleteMenuItemAddonDB(itemId, addonId, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Addon Deleted.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
exports.getMenuItemAddons = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const itemId = req.params.id;

        const itemAddons = await getMenuItemAddonsDB(itemId, tenantId);

        if(itemAddons.length == 0) {
            return res.status(404).json({
                success: false,
                message: "No addons found for this item!"
            });    
        }

        return res.status(200).json(itemAddons);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
exports.getAllAddons = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const addons = await getAllAddonsDB(tenantId);

        return res.status(200).json(addons);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
/* Addons */


/* Variants */
exports.addMenuItemVariant = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const itemId = req.params.id;
        const {title, price} = req.body;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details: title"
            });
        }

        const menuItemVariantId = await addMenuItemVariantDB(itemId, title, price, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Variant Added.",
            variantId: menuItemVariantId
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
exports.updateMenuItemVariant = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const itemId = req.params.id;
        const variantId = req.params.variantId;
        const {title, price} = req.body;

        if(!(title)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details: title"
            });
        }

        await updateMenuItemVariantDB(itemId, variantId, title, price, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Variant Updated."
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
exports.deleteMenuItemVariant = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const itemId = req.params.id;
        const variantId = req.params.variantId;
        
        await deleteMenuItemVariantDB(itemId, variantId, tenantId);

        return res.status(200).json({
            success: true,
            message: "Menu Item Variant Deleted."
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
exports.getMenuItemVariants = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const itemId = req.params.id;

        const itemVariants = await getMenuItemVariantsDB(itemId, tenantId);

        if(itemVariants.length == 0) {
            return res.status(404).json({
                success: false,
                message: "No variants found for this item!"
            });    
        }

        return res.status(200).json(itemVariants);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
exports.getAllVariants = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const allVariants = await getAllVariantsDB(tenantId);

        return res.status(200).json(allVariants);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};
/* Variants */