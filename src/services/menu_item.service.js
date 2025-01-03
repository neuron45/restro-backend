const {getMySqlPromiseConnection} = require('../config/mysql.db');

exports.addMenuItemDB = async (
  title,
  netPrice,
  taxGroupId,
  categoryId,
  tenantId,
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        INSERT INTO menu_items
        (title, net_price, tax_group_id, category, tenant_id)
        VALUES
        (?, ?, ?, ?, ?);
        `;

    const [result] = await conn.query(sql, [
      title,
      netPrice,
      taxGroupId,
      categoryId,
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

exports.updateMenuItemDB = async (
  id,
  title,
  netPrice,
  taxGroupId,
  categoryId,
  tenantId,
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE menu_items SET
        title = ?, net_price = ?, tax_group_id = ?, category = ?
        WHERE id = ? AND tenant_id = ?;
        `;

    await conn.query(sql, [
      title,
      netPrice,
      taxGroupId,
      categoryId,
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

exports.updateMenuItemImageDB = async (id, image, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE menu_items SET
        image = ?
        WHERE id = ? AND tenant_id = ?;
        `;

    await conn.query(sql, [image, id, tenantId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.deleteMenuItemDB = async (id, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        DELETE FROM menu_items 
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

exports.getAllMenuItemsDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT 
        i.id,
        i.title, 
        i.net_price,
        i.tax_group_id,
        t.title AS tax_group_title,
        category AS category_id,
        c.title AS category_title,
        image
        FROM menu_items i
        LEFT JOIN tax_groups t ON i.tax_group_id = t.id
        LEFT JOIN categories c ON i.category = c.id
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

exports.getMenuItemDB = async (id, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT 
        i.id,
        i.title,
        i.net_price,
        i.tax_group_id,
        t.title AS tax_group_title,
        category as category_id,
        c.title AS category_title,
        image
        FROM menu_items i
        LEFT JOIN tax_groups t ON i.tax_group_id = t.id
        LEFT JOIN categories c ON i.category = c.id
        WHERE i.id = ? AND i.tenant_id = ?
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

/**
 * @param {number} itemId Menu Item ID to add Addon
 * @param {string} title Title of Addon
 * @param {number} net_price Additonal Net Price for addon, Put 0 / null to make addon as free option
 * @returns {Promise<number>}
 *  */
exports.addMenuItemAddonDB = async (itemId, title, netPrice, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        INSERT INTO menu_item_addons
        (item_id, title, net_price, tenant_id)
        VALUES
        (?, ?, ?, ?);
        `;

    const [result] = await conn.query(sql, [itemId, title, netPrice, tenantId]);
    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * @param {number} itemId Menu Item ID
 * @param {number} addonId Addon ID
 * @param {string} title Title of Addon
 * @param {number} net_price Additonal Net Price for addon, Put 0 / null to make addon as free option
 * @returns {Promise<void>}
 *  */
exports.updateMenuItemAddonDB = async (itemId, addonId, title, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE menu_item_addons
        SET
        title = ?
        WHERE id = ? AND item_id = ? AND tenant_id = ?
        `;

    await conn.query(sql, [title, addonId, itemId, tenantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * @param {number} itemId Menu Item ID
 * @param {number} addonId Addon ID
 * @returns {Promise<void>}
 *  */
exports.deleteMenuItemAddonDB = async (itemId, addonId, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        DELETE FROM menu_item_addons
        WHERE id = ? AND item_id = ? AND tenant_id = ?;
        `;

    await conn.query(sql, [addonId, itemId, tenantId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * @param {number} itemId Menu Item ID
 * @param {number} addonId Addon ID
 * @returns {Promise<Array>}
 *  */
exports.getMenuItemAddonsDB = async (itemId, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT id, item_id, title, net_price FROM menu_item_addons
        WHERE item_id = ? AND tenant_id = ?;
        `;

    const [result] = await conn.query(sql, [itemId, tenantId]);

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getAllAddonsDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT id, item_id, title, net_price FROM menu_item_addons
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

/**
 * @param {number} itemId Menu Item ID to add Variant
 * @param {string} title Title of Variant
 * @param {number} net_price Additonal net Price for Variant, Put 0 / null to make Variant as free option
 * @returns {Promise<number>}
 *  */
exports.addMenuItemVariantDB = async (itemId, title, net_price, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        INSERT INTO menu_item_variants
        (item_id, title, net_price, tenant_id)
        VALUES
        (?, ?, ?, ?);
        `;

    const [result] = await conn.query(sql, [
      itemId,
      title,
      net_price,
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

exports.updateMenuItemVariantDB = async (
  itemId,
  variantId,
  title,
  net_price,
  tenantId,
) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        UPDATE menu_item_variants
        SET
        title = ?, net_price = ?
        WHERE item_id = ? AND id = ? AND tenant_id = ?
        `;

    await conn.query(sql, [title, net_price, itemId, variantId, tenantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.deleteMenuItemVariantDB = async (itemId, variantId, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        DELETE FROM menu_item_variants
        WHERE item_id = ? AND id = ? AND tenant_id = ?
        `;

    await conn.query(sql, [itemId, variantId, tenantId]);

    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getMenuItemVariantsDB = async (itemId, tenantId) => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT id, item_id, title, net_price FROM menu_item_variants
        WHERE item_id = ? AND tenant_id = ?;
        `;

    const [result] = await conn.query(sql, [itemId, tenantId]);

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};
exports.getAllVariantsDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT id, item_id, title, net_price FROM menu_item_variants
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
