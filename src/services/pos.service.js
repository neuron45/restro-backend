const { getMySqlPromiseConnection } = require("../config/mysql.db")

exports.createOrderDB = async (tenantId, cartItems, deliveryType, customerType, customerId, tableId, paymentStatus = 'pending', invoiceId=null) => {
  const conn = await getMySqlPromiseConnection();

  try {
    // start transaction
    await conn.beginTransaction();

    // step 1: get current token no. from table token_sequences
    // if no data found give 0
    let tokenNo = 0;

    const [tokenSequence] = await conn.query("SELECT sequence_no, last_updated FROM token_sequences WHERE tenant_id = ? LIMIT 1 FOR UPDATE", [tenantId]);
    tokenNo = tokenSequence[0]?.sequence_no || 0;
    const tokenLastUpdated = tokenSequence[0]?.last_updated ? new Date(tokenSequence[0]?.last_updated).toISOString().substring(0, 10) : new Date().toISOString().substring(0,10);

    const today = new Date().toISOString().substring(0,10);

    if(tokenLastUpdated != today) {
      tokenNo = 0;
    }

    // step 2: increase the token no. by +1
    tokenNo += 1;

    // step 3: save data to orders table
    const [orderResult] = await conn.query(`INSERT INTO orders (delivery_type, customer_type, customer_id, table_id, token_no, payment_status, invoice_id, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [deliveryType, customerType, customerId, tableId, tokenNo, paymentStatus || 'pending', invoiceId || null, tenantId]);

    const orderId = orderResult.insertId;

    // step 4: save data to order_items
    const sqlOrderItems = `
    INSERT INTO order_items
    (order_id, item_id, variant_id, price, quantity, notes, addons, tenant_id)
    VALUES ?
    `;

    await conn.query(sqlOrderItems, [cartItems.map((item)=>[orderId, item.id, item.variant_id, item.price, item.quantity, item.notes, item?.addons_ids?.length > 0 ? JSON.stringify(item.addons_ids):null, tenantId ])]);

    // step 6: Save updated token no. to table token_sequences
    await conn.query("INSERT INTO token_sequences ( sequence_no, last_updated, tenant_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE sequence_no = VALUES(sequence_no), last_updated = VALUES(last_updated) ;", [tokenNo, today, tenantId]);

    // step 7: commit transaction / if any exception occurs then rollback
    await conn.commit();

    return {
      tokenNo,
      orderId
    }
  } catch (error) {
    console.error(error);
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

exports.getPOSQROrdersCountDB = async (tenantId) => {
  const conn = await getMySqlPromiseConnection();

    try {
      const sql = `
        SELECT COUNT(*) AS total_orders FROM qr_orders
        WHERE tenant_id = ? AND status NOT IN('completed', 'cancelled');
      `;

      const [result] = await conn.query(sql, [tenantId]);
      return result[0].total_orders ?? 0;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.getPOSQROrdersDB = async (tenantId) => {
  const conn = await getMySqlPromiseConnection();

    try {
      const sql = `
       SELECT
        o.id,
        o.date,
        o.delivery_type,
        o.customer_type,
        o.customer_id,
        c.name AS customer_name,
        o.table_id,
        st.table_title,
        st.floor,
        o.status,
        o.payment_status
      FROM
        qr_orders o
        LEFT JOIN customers c ON o.customer_id = c.phone
        LEFT JOIN store_tables st ON o.table_id = st.id
      WHERE
        o.status NOT IN('completed', 'cancelled')
        AND o.tenant_id = ?
      `;

      const [kitchenOrders] = await conn.query(sql, [tenantId]);

      let kitchenOrdersItems = [];
      let addons = [];

      if(kitchenOrders.length > 0) {
        const orderIds = kitchenOrders.map(o=>o.id).join(",");
        const sql2 = `
          SELECT
            oi.id,
            oi.order_id,
            oi.item_id,
            mi.title AS item_title,
            mi.tax_id,
            t.title as tax_title,
            t.rate as tax_rate,
            t.type as tax_type,
            oi.variant_id,
            miv.title AS variant_title,
            oi.price,
            oi.quantity,
            oi.status,
            oi.date,
            oi.addons,
            oi.notes
          FROM
            qr_order_items oi
            LEFT JOIN menu_items mi ON oi.item_id = mi.id
            LEFT JOIN taxes t ON t.id = mi.tax_id
            LEFT JOIN menu_item_variants miv ON oi.item_id = miv.item_id
            AND oi.variant_id = miv.id
          WHERE
            oi.order_id IN (${orderIds})
        `
        const [kitchenOrdersItemsResult] = await conn.query(sql2);
        kitchenOrdersItems = kitchenOrdersItemsResult;

        const addonIds = [...new Set([...kitchenOrdersItems.flatMap((o)=>o.addons?JSON.parse(o?.addons):[])])].join(",");
        const [addonsResult] = addonIds ? await conn.query(`SELECT id, item_id, title FROM menu_item_addons WHERE id IN (${addonIds});`):[]
        addons = addonsResult;
      }

      return {
        kitchenOrders,
        kitchenOrdersItems,
        addons
      }
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateQROrderStatusDB = async (tenantId, orderId, status) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
      UPDATE qr_orders
      SET status = ?
      WHERE tenant_id = ? AND id = ?;
    `;

    const [result] = await conn.query(sql, [status, tenantId, orderId]);
    return
  } catch (error) {
      console.error(error);
      throw error;
  } finally {
      conn.release();
  }
};


exports.cancelAllQROrdersDB = async (tenantId, status) => {
  const conn = await getMySqlPromiseConnection();

  try {
    const sql = `
      UPDATE qr_orders
      SET status = ?
      WHERE tenant_id = ?;
    `;

    const [result] = await conn.query(sql, [status, tenantId]);
    return;
  } catch (error) {
      console.error(error);
      throw error;
  } finally {
      conn.release();
  }
};
