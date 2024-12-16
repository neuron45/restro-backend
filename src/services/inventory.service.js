const {getMySqlPromiseConnection} = require('../config/mysql.db');

exports.addInventoryItemDB = async (
  title,
  minimumStockLevel,
  imageUrl,
  unitId,
  tenantId,
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        INSERT INTO inventory_items
        (title, minimum_stock_level, image_url, unit_id, tenant_id)
        VALUES
        (?, ?, ?, ?, ?);
        `;

    const [result] = await conn.query(sql, [
      title,
      minimumStockLevel,
      imageUrl,
      unitId,
      tenantId,
    ]);

    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateInventoryItemDB = async (
  id,
  title,
  minimumStockLevel,
  imageUrl,
  unitId,
  tenantId,
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE inventory_items SET
        title = ?, minimum_stock_level = ?, image_url = ?, unit_id = ?
        WHERE id = ? AND tenant_id = ?;
        `;

    await conn.query(sql, [
      title,
      minimumStockLevel,
      imageUrl,
      unitId,
      id,
      tenantId,
    ]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateInventoryItemImageDB = async (id, imageUrl, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE inventory_items SET
        image_url = ?
        WHERE id = ? AND tenant_id = ?;
        `;

    await conn.query(sql, [imageUrl, id, tenantId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

//@TODO think about this properly. Simply hide
exports.deleteInventoryItemDB = async (id, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        DELETE FROM inventory_items 
        WHERE id = ? AND tenant_id = ?;
        `;

    await conn.query(sql, [id, tenantId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getAllInventoryItemsDB = async (tenantId, assigned) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql =
      assigned === false
        ? `SELECT i.id, i.title from inventory_items i where i.id NOT IN (SELECT m.id FROM menu_items m where m.tenant_id = ? AND m.inventory_item_id = NULL)`
        : `
        SELECT 
        i.id,
        i.title, 
        i.stock_quantity,
        i.minimum_stock_level,
        i.image_url,
        u.title AS unit_title,
        u.id AS unit_id,
        i.image_url
        FROM inventory_items i
        LEFT JOIN inventory_units u ON i.unit_id = u.id
        WHERE i.tenant_id = ?;
        `;

    const [result] = await conn.query(sql, [tenantId]);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getInventoryItemDB = async (id, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT 
        i.id,
        i.title, 
        i.stock_quantity,
        i.minimum_stock_level,
        i.image_url,
        u.title AS unit_title,
        i.image_url
        FROM inventory_items i
        LEFT JOIN inventory_units u ON i.unit_id = u.id
        WHERE i.tenant_id = ?;
        `;

    const [result] = await conn.query(sql, [id, tenantId]);
    return result[0];
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getAllInventoryUnitsDB = async tenantId => {
  console.log(`Getting all inventory units ${tenantId}`);
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT id, title, description, quantity FROM inventory_units
        WHERE tenant_id = ?;
        `;

    const [result] = await conn.query(sql, [tenantId]);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.addStockMovementDB = async (
  inventoryItemId,
  username,
  unitPrice,
  stockQuantity,
  tenantId,
  createdAt,
) => {
  const conn = await getMySqlPromiseConnection();
  const changeType = 'restock';
  try {
    // Start transaction
    await conn.beginTransaction();

    // Insert into inventory_movements
    const movementSql = `
    INSERT INTO inventory_movements
    (inventory_item_id, username, unit_price, change_quantity, tenant_id, change_type, created_at)
    VALUES
    (?, ?, ?, ?, ?, ?, ?);
  `;

    const [movementResult] = await conn.query(movementSql, [
      inventoryItemId,
      username,
      unitPrice,
      stockQuantity,
      tenantId,
      changeType,
      createdAt,
    ]);

    // Update inventory_items
    const updateInventorySql = `
    UPDATE inventory_items 
    SET stock_quantity = stock_quantity + ?
    WHERE id = ? AND tenant_id = ?
  `;

    await conn.query(updateInventorySql, [
      stockQuantity,
      inventoryItemId,
      tenantId,
    ]);

    // Commit the transaction if both operations succeed
    await conn.commit();

    return movementResult.insertId;
  } catch (error) {
    await conn.rollback();
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.remveStockMovementDB = async (
  inventoryItemId,
  username,
  stockQuantity,
  tenantId,
  createdAt,
) => {
  const conn = await getMySqlPromiseConnection();
  const changeType = 'usage';
  try {
    // Start transaction
    await conn.beginTransaction();

    const sql = `
    INSERT INTO inventory_movements
    (inventory_item_id, username, change_quantity, tenant_id, change_type, created_at)
    VALUES
    (?, ?, ?, ?, ?, ?);
  `;

    const [result] = await conn.query(sql, [
      inventoryItemId,
      username,
      -stockQuantity,
      tenantId,
      changeType,
      createdAt,
    ]);

    // update inventory_item quantity
    const sql2 = `
    UPDATE inventory_items SET
    stock_quantity = stock_quantity - ?
    WHERE id = ? AND tenant_id = ?;
  `;

    await conn.query(sql2, [stockQuantity, inventoryItemId, tenantId]);

    // If all queries succeed, commit the transaction
    await conn.commit();

    return result.insertId;
  } catch (error) {
    await conn.rollback();
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};
