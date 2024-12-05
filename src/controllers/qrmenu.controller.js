const { getAllMenuItemsDB, getAllAddonsDB, getAllVariantsDB } = require("../services/menu_item.service");
const { getStoreSettingDB, getCategoriesDB, getTenantIdFromQRCode, getStoreTableByEncryptedIdDB , placeOrderViaQrMenuDB} = require("../services/settings.service");

exports.getQRMenuInit = async (req, res) => {
    try {
        const qrcode = req.params.qrcode;
        const tableId = req.query.tableId;

        const tenantId = await getTenantIdFromQRCode(qrcode);

        if(!tenantId) {
            return res.status(404).json({
                success: false,
                message: "QR/Digital Menu not found!"
            });
        }

        const [categories, storeSettings, storeTable] = await Promise.all([
            getCategoriesDB(tenantId),
            getStoreSettingDB(tenantId),
            getStoreTableByEncryptedIdDB(tenantId, tableId)
        ]);

        const [menuItems, addons, variants] = await Promise.all([
            getAllMenuItemsDB(tenantId),
            getAllAddonsDB(tenantId),
            getAllVariantsDB(tenantId),
        ]);

        const formattedMenuItems = menuItems.map((item) => {
            const itemAddons = addons.filter((addon) => addon.item_id == item.id);
            const itemVariants = variants.filter(
                (variant) => variant.item_id == item.id
            );

            return {
                ...item,
                addons: [...itemAddons],
                variants: [...itemVariants],
            };
        });

        return res.status(200).json({
            categories: categories,
            storeSettings: storeSettings,
            menuItems: formattedMenuItems,
            storeTable: storeTable
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.placeOrderViaQrMenu = async (req, res) => {

    try {
      const qrcode = req.params.qrcode;

      const tenantId = await getTenantIdFromQRCode(qrcode);

      const {deliveryType , cartItems, customerType, customer, tableId} = req.body;

      if(cartItems?.length == 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty!"
        });
      }

      const result = await placeOrderViaQrMenuDB(tenantId, deliveryType , cartItems, customerType, customer.phone || null, tableId || null , customer.name || null);

      return res.status(200).json({
        success: true,
        message: `Order Placed Successfully`,
        orderId: result.orderId,
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Error processing the request, please try after sometime!"
      });
    }

  };
