const {
  getInvoicesDB,
  getInvoiceOrdersDB,
  searchInvoicesDB,
} = require("../services/invoice.service");
const {
  getPrintSettingDB,
  getStoreSettingDB,
} = require("../services/settings.service");

exports.getInvoicesInit = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const [printSettings, storeSettings] = await Promise.all([
      getPrintSettingDB(tenantId),
      getStoreSettingDB(tenantId),
    ]);

    return res.status(200).json({
      printSettings,
      storeSettings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const from = req.query.from || null;
    const to = req.query.to || null;
    const type = req.query.type;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Please provide required details!",
      });
    }

    if (type == "custom") {
      if (!(from && to)) {
        return res.status(400).json({
          success: false,
          message: "Please provide required details from & to dates!",
        });
      }
    }

    const result = await getInvoicesDB(type, from, to, tenantId);

    if (result.length > 0) {
      // format the result
      const invoices = [];

      for (let index = 0; index < result.length; index++) {
        const invoice = result[index];
        const {
          invoice_id,
          created_at,
          sub_total,
          tax_total,
          total,
          table_id,
          table_title,
          floor,
          order_id,
          payment_status,
          token_no,
          delivery_type,
          customer_type,
          customer_id,
          name,
          email,
        } = invoice;

        const existingInvoiceId = invoices.findIndex(
          (i) => i.invoice_id == invoice_id
        );

        if (existingInvoiceId == -1) {
          invoices.push({
            invoice_id,
            created_at,
            sub_total,
            tax_total,
            total,
            table_id,
            table_title,
            floor,
            delivery_type,
            customer_type,
            customer_id,
            name,
            email,
            orders: [{ order_id, payment_status, token_no }],
          });
        } else {
          invoices[existingInvoiceId].orders.push({
            order_id,
            payment_status,
            token_no,
          });
        }
      }

      return res.status(200).json(invoices);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.searchInvoices = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const searchString = req.query.q;

    if (!searchString) {
      return res.status(400).json({
        success: false,
        message: "Please provide required details!",
      });
    }

    const result = await searchInvoicesDB(searchString, tenantId);

    if (result.length > 0) {
      // format the result
      const invoices = [];

      for (let index = 0; index < result.length; index++) {
        const invoice = result[index];
        const {
          invoice_id,
          created_at,
          sub_total,
          tax_total,
          total,
          table_id,
          table_title,
          floor,
          order_id,
          payment_status,
          token_no,
          delivery_type,
          customer_type,
          customer_id,
          name,
          email,
        } = invoice;

        const existingInvoiceId = invoices.findIndex(
          (i) => i.invoice_id == invoice_id
        );

        if (existingInvoiceId == -1) {
          invoices.push({
            invoice_id,
            created_at,
            sub_total,
            tax_total,
            total,
            table_id,
            table_title,
            floor,
            delivery_type,
            customer_type,
            customer_id,
            name,
            email,
            orders: [{ order_id, payment_status, token_no }],
          });
        } else {
          invoices[existingInvoiceId].orders.push({
            order_id,
            payment_status,
            token_no,
          });
        }
      }

      return res.status(200).json(invoices);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.getInvoiceOrders = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const orderIds = req.body.orderIds;

    if (!orderIds || orderIds?.length == 0) {
      return res.status(400).JSON({
        success: false,
        message: "Invalid Request!",
      });
    }

    const orderIdsParams = orderIds.join(",");

    const { kitchenOrders, kitchenOrdersItems, addons } =
      await getInvoiceOrdersDB(orderIdsParams);

    const formattedOrders = kitchenOrders.map((order) => {
      const orderItems = kitchenOrdersItems.filter(
        (oi) => oi.order_id == order.id
      );

      orderItems.forEach((oi, index) => {
        const addonsIds = oi?.addons ? JSON.parse(oi?.addons) : null;

        if (addonsIds) {
          const itemAddons = addonsIds.map((addonId) => {
            const addon = addons.filter((a) => a.id == addonId);
            return addon[0];
          });
          orderItems[index].addons = [...itemAddons];
        }
      });

      return {
        ...order,
        items: orderItems,
      };
    });

    // calculate summary
    let subtotal = 0;
    let taxTotal = 0;
    let total = 0;

    for (const order of formattedOrders) {
      const items = order.items;

      for (let index = 0; index < items.length; index++) {
        const item = items[index];

        const {
          variant_price,
          price,
          tax_rate,
          tax_type: taxType,
          quantity,
          addons,
        } = item;

        const taxRate = Number(tax_rate);

        let addonsTotal = 0;
        if(addons) {
          for (const addon of addons) {
            addonsTotal += Number(addon.price)
          }
        }

        const itemPrice =
          Number(variant_price ? variant_price : price) * Number(quantity);

        if (taxType == "exclusive") {
          const tax = (itemPrice * taxRate) / 100;
          const priceWithTax = itemPrice + tax;

          taxTotal += tax;
          subtotal += itemPrice + addonsTotal * quantity;
          total += priceWithTax + addonsTotal * quantity;

          items[index].itemTotal = priceWithTax / quantity + addonsTotal;
          items[index].price = priceWithTax / quantity + addonsTotal;
        } else if (taxType == "inclusive") {
          const tax = itemPrice - itemPrice * (100 / (100 + taxRate));
          const priceWithoutTax = itemPrice - tax;

          taxTotal += tax;
          subtotal += priceWithoutTax + addonsTotal * quantity;
          total += itemPrice + addonsTotal * quantity;

          items[index].itemTotal = itemPrice / quantity + addonsTotal;
          items[index].price = itemPrice / quantity + addonsTotal;
        } else {
          subtotal += itemPrice + addonsTotal * quantity;
          total += itemPrice + addonsTotal * quantity;

          items[index].itemTotal = itemPrice / quantity + addonsTotal;
          items[index].price = itemPrice / quantity + addonsTotal;
        }
      }
    }
    // calculate summary

    return res.status(200).json({
      subtotal,
      taxTotal,
      total,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};
