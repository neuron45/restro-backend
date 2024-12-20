const {
  addInventoryItemDB,
  updateInventoryItemDB,
  updateInventoryItemImageDB,
  deleteInventoryItemDB,
  getAllInventoryItemsDB,
  getInventoryItemDB,
  getAllInventoryUnitsDB,
  addStockMovementDB,
  remveStockMovementDB,
  updateInventoryUnitDB,
  addInventoryUnitDB,
} = require('../services/inventory.service');

const path = require('path');
const fs = require('fs');

exports.addInventoryItem = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const {title, minimumStockLevel, imageUrl, unitId} = req.body;

    if (!(title && minimumStockLevel && unitId)) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide required details: title, minimum stock level, unit',
      });
    }

    const inventoryItemId = await addInventoryItemDB(
      title,
      minimumStockLevel,
      imageUrl,
      unitId,
      tenantId,
    );

    return res.status(200).json({
      success: true,
      message: 'Inventory Item Added.',
      inventoryItemId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const id = req.params.id;
    const {title, minimumStockLevel, imageUrl, unitId} = req.body;

    if (!(title && minimumStockLevel && unitId)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required details: title, price',
      });
    }

    await updateInventoryItemDB(
      id,
      title,
      minimumStockLevel,
      imageUrl,
      unitId,
      tenantId,
    );

    return res.status(200).json({
      success: true,
      message: 'Inventory Item Updated.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.uploadInventoryItemPhoto = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const id = req.params.id;

    const file = req.files.image;

    // put image in S3
    // delete old image from S3
    const imagePath = path.join(__dirname, `../../public/${tenantId}/`) + id;

    if (!fs.existsSync(path.join(__dirname, `../../public/${tenantId}/`))) {
      fs.mkdirSync(path.join(__dirname, `../../public/${tenantId}/`));
    }

    const imageURL = `/public/${tenantId}/${id}`;

    await file.mv(imagePath);
    await updateInventoryItemImageDB(id, imageURL, tenantId);

    return res.status(200).json({
      success: true,
      message: 'Inventory Item Image Uploaded.',
      imageURL: imageURL,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.removeInventoryItemPhoto = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const id = req.params.id;

    // remove from S3
    const imagePath = path.join(__dirname, `../../public/${tenantId}/`) + id;

    fs.unlinkSync(imagePath);

    await updateInventoryItemImageDB(id, null, tenantId);

    return res.status(200).json({
      success: true,
      message: 'Menu Item Image Removed.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const id = req.params.id;

    await deleteInventoryItemDB(id, tenantId);

    return res.status(200).json({
      success: true,
      message: 'Inventory Item Deleted.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.getAllInventoryItems = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const inventoryItems = await getAllInventoryItemsDB(tenantId);

    return res.status(200).json(
      inventoryItems.map(item => ({
        id: item.id,
        title: item.title,
        stockQuantity: item.stock_quantity,
        minimumStockLevel: item.minimum_stock_level,
        imageUrl: item.image_url,
        unitId: item.unit_id,
        unitTitle: item.unit_title,
        unitQuantity: item.unit_quantity,
      })),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.getInventoryItem = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const id = req.params.id;

    const inventoryItem = await getInventoryItemDB(id, tenantId);

    return res.status(200).json(inventoryItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.getAllInventoryUnits = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const inventoryUnits = await getAllInventoryUnitsDB(tenantId);

    return res.status(200).json(
      inventoryUnits.map(unit => ({
        id: unit.id,
        title: unit.title,
        description: unit.description,
        quantity: unit.quantity,
      })),
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.updateInventoryUnit = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const id = req.params.id;
    const {title, quantity, description} = req.body;

    if (!(title && quantity && description)) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide required details: title, quantity, description',
      });
    }

    await updateInventoryUnitDB(id, title, quantity, description, tenantId);

    return res.status(200).json({
      success: true,
      message: 'Inventory Unit Updated.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.addInventoryUnit = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const {title, quantity, description} = req.body;

    if (!(title && quantity && description)) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide required details: title, quantity, description',
      });
    }

    await addInventoryUnitDB(title, quantity, description, tenantId);

    return res.status(200).json({
      success: true,
      message: 'Inventory Unit added.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

// updateInventoryUnit

exports.addStock = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const username = req.user.username;
    const inventoryItemId = req.params.id;
    const {unitPrice, stockQuantity, remarks, createdAt} = req.body;

    if (!(unitPrice && stockQuantity && remarks)) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide required details: unit price, stock quantity, remarks',
      });
    }

    const stockMovementId = await addStockMovementDB(
      inventoryItemId,
      username,
      unitPrice,
      stockQuantity,
      tenantId,
      createdAt,
    );

    return res.status(200).json({
      success: true,
      message: 'Inventory Item Added.',
      stockMovementId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};

exports.removeStock = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const username = req.user.username;
    const inventoryItemId = req.params.id;
    const {stockQuantity, remarks, createdAt} = req.body;

    if (!(stockQuantity && remarks)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required details: stock quantity, remarks',
      });
    }

    const stockMovementId = await remveStockMovementDB(
      inventoryItemId,
      username,
      stockQuantity,
      tenantId,
      createdAt,
    );

    return res.status(200).json({
      success: true,
      message: 'Removed stock for usage',
      stockMovementId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! Please try later!',
    });
  }
};
