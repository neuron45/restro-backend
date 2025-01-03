const {CONFIG} = require('../config');
const {getMySqlPromiseConnection} = require('../config/mysql.db');

exports.getTenantIdFromQRCode = async qrcode => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT
            tenant_id
        FROM
            store_details
        WHERE
            unique_qr_code = ?
        LIMIT 1;
        `;

    const [result] = await conn.query(sql, [qrcode]);
    return result[0]?.tenant_id;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getCurrencyDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();
  try {
    const sql = `
        SELECT
            currency
        FROM
            store_details
        WHERE tenant_id = ?
        LIMIT 1;
        `;

    const [result] = await conn.query(sql, [tenantId]);
    return result[0]?.currency;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getStoreSettingDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT tenant_id, store_name, address, phone, email, currency, image, is_qr_menu_enabled, unique_qr_code, is_qr_order_enabled FROM store_details
        WHERE tenant_id = ?
        LIMIT 1;
        `;

    const [result] = await conn.query(sql, [tenantId]);

    return result[0];
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.setStoreSettingDB = async (
  storeName,
  address,
  phone,
  email,
  currency,
  isQRMenuEnabled,
  isQROrderEnabled,
  uniqueQRCode,
  tenantId,
) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        INSERT INTO store_details ( store_name, address, phone, email, currency, is_qr_menu_enabled, is_qr_order_enabled, unique_qr_code, tenant_id)
        VALUES
        ( ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        store_name = VALUES(store_name),
        is_qr_menu_enabled = VALUES(is_qr_menu_enabled),
        address = VALUES(address),
        phone = VALUES(phone),
        email = VALUES(email),
        currency = VALUES(currency),
        tenant_id = VALUES(tenant_id),
        is_qr_order_enabled = VALUES(is_qr_order_enabled);
        `;

    await conn.query(sql, [
      storeName,
      address,
      phone,
      email,
      currency,
      isQRMenuEnabled,
      isQROrderEnabled,
      uniqueQRCode,
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

exports.getQRMenuCodeDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT unique_qr_code FROM store_details
        WHERE tenant_id = ?
        LIMIT 1;
        `;

    const [result] = await conn.query(sql, [tenantId]);
    return result[0]?.unique_qr_code || null;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateQRMenuCodeDB = async (uniqueQRCode, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        UPDATE store_details SET unique_qr_code = ?
        WHERE tenant_id = ?;
        `;

    await conn.query(sql, [uniqueQRCode, tenantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getPrintSettingDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT  page_format, header, footer, show_notes, is_enable_print, show_store_details, show_customer_details, print_token FROM print_settings
        WHERE tenant_id = ?
        LIMIT 1;
        `;

    const [result] = await conn.query(sql, [tenantId]);
    return result[0];
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.setPrintSettingDB = async (
  pageFormat,
  header,
  footer,
  showNotes,
  isEnablePrint,
  showStoreDetails,
  showCustomerDetails,
  printToken,
  tenantId,
) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        INSERT INTO print_settings
        ( page_format, header, footer, show_notes, is_enable_print, show_store_details, show_customer_details, print_token, tenant_id)
        VALUES
        ( ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        page_format = VALUES(page_format),
        header = VALUES(header),
        footer = VALUES(footer),
        show_notes = VALUES(show_notes),
        is_enable_print = VALUES(is_enable_print),
        show_store_details = VALUES(show_store_details),
        show_customer_details = VALUES(show_customer_details),
        print_token = VALUES(print_token),
        tenant_id = VALUES(tenant_id);
        `;

    await conn.query(sql, [
      pageFormat,
      header,
      footer,
      showNotes,
      isEnablePrint,
      showStoreDetails,
      showCustomerDetails,
      printToken,
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

/**
 * Adds a new tax
 *
 * @param {string} title - A description of the title.
 * @param {number} rate - A description of the rate.
 * @param {string} type - A description of the type.
 * @param {number} taxGroupId - The ID of the tax group (integer).
 * @param {number} tenantId - The ID of the tenant (integer).
 * @returns {type} Description of the return value (optional).
 */
exports.addTaxDB = async (title, rate, type, taxGroupId, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        INSERT INTO taxes
        (title, rate, type, tenant_id)
        VALUES (?, ?, ?, ?);
        `;
    const sql2 = `
        INSERT INTO taxes_tax_groups
        (tax_id, tax_group_id, tenant_id)
        VALUES (?, ?, ?);
        `;

    const [result] = await conn.query(sql, [title, rate, type, tenantId]);
    if (result.insertId) {
      await conn.query(sql2, [result.insertId, taxGroupId, tenantId]);
    }
    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getTaxesDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT taxes.id, taxes.title, taxes.rate, taxes.type, tax_groups.title as taxGroup 
        FROM taxes 
        LEFT OUTER JOIN taxes_tax_groups ON taxes_tax_groups.tax_id = taxes.id
        LEFT OUTER JOIN tax_groups ON tax_groups.id = taxes_tax_groups.tax_group_id
        WHERE taxes.tenant_id = ?;
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

exports.getAllTaxGroupsAndTaxesDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
      SELECT 
        tg.id,
        tg.title,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', t.id,
            'title', t.title,
            'rate', t.rate,
            'type', t.type
          )
        ) as taxes
      FROM tax_groups tg
      LEFT JOIN taxes_tax_groups ttg ON tg.id = ttg.tax_group_id
      LEFT JOIN taxes t ON t.id = ttg.tax_id
      WHERE tg.tenant_id = ?
      GROUP BY tg.id, tg.title
    `;

    const [result] = await conn.query(sql, [tenantId]);

    // Transform the taxes string into actual JSON array
    // Handle cases where tax group has no taxes (will be null)
    return result.map(group => ({
      ...group,
      taxes: group.taxes ? group.taxes : [],
    }));
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getTaxDB = async (taxId, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT id, title, rate, type FROM taxes
        WHERE id = ? AND tenant_id = ?
        LIMIT 1;
        `;

    const [result] = await conn.query(sql, [taxId, tenantId]);
    return result[0];
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.deleteTaxDB = async (id, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        DELETE FROM taxes WHERE id = ? AND tenant_id = ?;
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

exports.updateTaxDB = async (id, title, rate, type, tenantId, taxGroupId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        UPDATE taxes
        SET
        title = ?, rate = ?, type = ?
        WHERE id = ? AND tenant_id = ?
        `;

    const delSql = `
        delete from taxes_tax_groups where tax_id = ?;
    `;

    const addSql = `
    INSERT INTO taxes_tax_groups
    (tax_id, tax_group_id, tenant_id)
    VALUES (?, ?, ?);
    `;

    await conn.query(sql, [title, rate, type, id, tenantId]);
    await conn.query(delSql, [id]);
    await conn.query(addSql, [id, taxGroupId, tenantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getTaxGroupsDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT id, title FROM tax_groups WHERE tenant_id = ?;
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

exports.getTaxGroupDB = async (taxGroupId, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT id, title FROM tax_groups
        WHERE id = ? AND tenant_id = ?
        LIMIT 1;
        `;

    const [result] = await conn.query(sql, [taxGroupId, tenantId]);
    return result[0];
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.addTaxGroupDB = async (title, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
          INSERT INTO tax_groups
          (title, tenant_id)
          VALUES (?, ?);
          `;

    const [result] = await conn.query(sql, [title, tenantId]);
    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.deleteTaxGroupDB = async (id, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
          DELETE FROM tax_groups WHERE id = ? AND tenant_id = ?;
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

exports.updateTaxGroupDB = async (id, title, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
          UPDATE tax_groups
          SET
          title = ?
          WHERE id = ? AND tenant_id = ?
          `;

    await conn.query(sql, [title, id, tenantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.addPaymentTypeDB = async (title, isActive, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        INSERT INTO payment_types
        (title, is_active, tenant_id)
        VALUES (?, ?, ?);
        `;

    const [result] = await conn.query(sql, [title, isActive, tenantId]);
    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getPaymentTypesDB = async (activeOnly = false, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    let sql = `
        SELECT id, title, is_active FROM payment_types
        WHERE tenant_id = ?;
        `;

    if (activeOnly) {
      sql = `
            SELECT id, title, is_active FROM payment_types
            WHERE is_active = 1 AND tenant_id = ?;
            `;
    }

    const [result] = await conn.query(sql, [tenantId]);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updatePaymentTypeDB = async (id, title, isActive, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        UPDATE payment_types
        SET title = ?, is_active = ?
        WHERE id = ? AND tenant_id = ?;
        `;

    const [result] = await conn.query(sql, [title, isActive, id, tenantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.togglePaymentTypeDB = async (id, isActive, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        UPDATE payment_types
        SET is_active = ?
        WHERE id = ? AND tenant_id = ?;
        `;

    const [result] = await conn.query(sql, [isActive, id, tenantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.deletePaymentTypeDB = async (id, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        DELETE FROM payment_types
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

exports.addStoreTableDB = async (title, floor, seatingCapacity, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        INSERT INTO store_tables
        (table_title, floor, seating_capacity, tenant_id)
        VALUES (?, ?, ?, ?);
        `;

    const [result] = await conn.query(sql, [
      title,
      floor,
      seatingCapacity,
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

exports.getStoreTablesDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT
        id,
        HEX(AES_ENCRYPT(HEX(id), ?)) AS encrypted_id,
        table_title,
        floor,
        seating_capacity
        FROM store_tables
        WHERE tenant_id = ?;
        `;

    const [result] = await conn.query(sql, [CONFIG.ENCRYPTION_KEY, tenantId]);
    return result;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getStoreTableByEncryptedIdDB = async (tenantId, encryptedTableId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT
        id,
        table_title,
        floor,
        seating_capacity
        FROM store_tables
        WHERE tenant_id = ? AND AES_DECRYPT(UNHEX(?), ?) = HEX(id)
        LIMIT 1;
        `;

    const [result] = await conn.query(sql, [
      tenantId,
      encryptedTableId,
      CONFIG.ENCRYPTION_KEY,
    ]);

    return result[0] || null;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.updateStoreTableDB = async (
  id,
  title,
  floor,
  seatingCapacity,
  tenantId,
) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        UPDATE store_tables SET
        table_title = ?, floor = ?, seating_capacity = ?
        WHERE id = ? AND tenant_id = ?;
        `;

    await conn.query(sql, [title, floor, seatingCapacity, id, tenantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.deleteStoreTableDB = async (id, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        DELETE FROM store_tables
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

exports.addCategoryDB = async (title, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        INSERT INTO categories
        (title, tenant_id)
        VALUES (?, ?);
        `;

    const [result] = await conn.query(sql, [title, tenantId]);
    return result.insertId;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.getCategoriesDB = async tenantId => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        SELECT id, title FROM categories
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

exports.updateCategoryDB = async (id, title, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        UPDATE categories
        SET title = ?
        WHERE id = ? AND tenant_id = ?;
        `;

    await conn.query(sql, [title, id, tenantId]);
    return;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    conn.release();
  }
};

exports.deleteCategoryDB = async (id, tenantId) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
        DELETE FROM categories
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

exports.placeOrderViaQrMenuDB = async (
  tenantId,
  deliveryType,
  cartItems,
  customerType,
  customerId,
  tableId,
  customerName,
  paymentStatus = 'pending',
) => {
  const conn = await getMySqlPromiseConnection();

  try {
    // start transaction
    await conn.beginTransaction();

    // step 1: save data to orders table
    const [orderResult] = await conn.query(
      `INSERT INTO qr_orders (delivery_type, customer_type, customer_id, table_id, payment_status, tenant_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        deliveryType,
        customerType,
        customerId,
        tableId,
        paymentStatus || 'pending',
        tenantId,
      ],
    );

    const orderId = orderResult.insertId;

    // step 2: save data to order_items
    const sqlOrderItems = `
      INSERT INTO qr_order_items
      (order_id, item_id, variant_id, price, quantity, notes, addons, tenant_id)
      VALUES ?
      `;

    await conn.query(sqlOrderItems, [
      cartItems.map(item => [
        orderId,
        item.id,
        item.variant_id,
        item.price,
        item.quantity,
        item.notes,
        item?.addons_ids?.length > 0 ? JSON.stringify(item.addons_ids) : null,
        tenantId,
      ]),
    ]);

    // Step 3 : Search customer by phone in customer table - if not existing - create one
    if (customerId) {
      const sqlIsExistingCustomer = `
					SELECT 1 from customers where phone = ?
			`;

      const [existingCustomer] = await conn.query(
        sqlIsExistingCustomer,
        customerId,
      );

      if (!existingCustomer.length) {
        const sqlAddCustomer = `
							INSERT INTO customers (phone, name,tenant_id) VALUES (?, ?,?)
					`;

        await conn.query(sqlAddCustomer, [customerId, customerName, tenantId]);
      }
    }

    // step 7: commit transaction / if any exception occurs then rollback
    await conn.commit();

    return {
      orderId,
    };
  } catch (error) {
    console.error(error);
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};
