const { getOrdersDB, updateOrderItemStatusDB, cancelOrderDB, completeOrderDB, getOrdersPaymentSummaryDB, createInvoiceDB, completeOrdersAndSaveInvoiceIdDB } = require("../services/orders.service");
const {
  getPaymentTypesDB,
  getPrintSettingDB,
  getStoreSettingDB,
} = require("../services/settings.service");

exports.getOrders = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;

    const {kitchenOrders,kitchenOrdersItems,addons} = await getOrdersDB(tenantId);

    const formattedOrders = kitchenOrders.map((order)=>{
      const orderItems = kitchenOrdersItems.filter((oi)=>oi.order_id == order.id);
      
      orderItems.forEach((oi, index)=>{
        const addonsIds = oi?.addons ? JSON.parse(oi?.addons) : null;

        if(addonsIds) {
          const itemAddons = addonsIds.map((addonId)=>{
            const addon = addons.filter((a)=>a.id == addonId);
            return addon[0];
          });
          orderItems[index].addons = [...itemAddons];
        }
      });

      return {
        ...order,
        items: orderItems
      }
    })

    // group orders based on table id
    let ordersGroupedByTable = [];
    
    for (const order of formattedOrders) {
        const tableId = order.table_id;

        if(!tableId) {
            ordersGroupedByTable.push({
                table_id: tableId,
                table_title: order.table_title,
                floor: order.floor,
                orders: [{...order}],
                order_ids: [order.id],
            })
            continue;
        }

        const orderIndex = ordersGroupedByTable.findIndex(o=>o.table_id==tableId);
        if(orderIndex == -1) {
            ordersGroupedByTable.push({
                table_id: tableId,
                table_title: order.table_title,
                floor: order.floor,
                orders: [{...order}],
                order_ids: [order.id],
            })
        } else {
            ordersGroupedByTable[orderIndex].orders.push({...order})
            ordersGroupedByTable[orderIndex].order_ids.push(order.id)
        }
    }

    // add orders where table not present


    return res.status(200).json(ordersGroupedByTable);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.getOrdersInit = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const [paymentTypes, printSettings, storeSettings] = await Promise.all([
      getPaymentTypesDB(true, tenantId),
      getPrintSettingDB(tenantId),
      getStoreSettingDB(tenantId),
    ]);

    return res.status(200).json({
      paymentTypes,
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

exports.updateKitchenOrderItemStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const orderItemId = req.params.id;
    const { status } = req.body

    if(!status) {
      return res.status(400).json({
        success: false,
        message: "Invalid Request!"
      });
    }

    await updateOrderItemStatusDB(orderItemId, status, tenantId)

    return res.status(200).json({
      success: true,
      message: "Order Item Status updated"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.cancelKitchenOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { orderIds } = req.body

    if(!orderIds || orderIds?.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Request!"
      });
    }

    await cancelOrderDB(orderIds, tenantId);

    return res.status(200).json({
      success: true,
      message: "Order Cancelled Successfully!"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.completeKitchenOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { orderIds } = req.body

    if(!orderIds || orderIds?.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Request!"
      });
    }

    await completeOrderDB(orderIds, tenantId);

    return res.status(200).json({
      success: true,
      message: "Order Completed Successfully!"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.getOrdersPaymentSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const orderIds = req.body.orderIds;

    if(!orderIds || orderIds?.length == 0) {
      return res.status(400).JSON({
        success: false,
        message: "Invalid Request!"
      });
    }

    const orderIdsParams = orderIds.join(",");

    const {kitchenOrders,kitchenOrdersItems,addons} = await getOrdersPaymentSummaryDB(orderIdsParams, tenantId);

    const formattedOrders = kitchenOrders.map((order)=>{
      const orderItems = kitchenOrdersItems.filter((oi)=>oi.order_id == order.id);
      
      orderItems.forEach((oi, index)=>{
        const addonsIds = oi?.addons ? JSON.parse(oi?.addons) : null;

        if(addonsIds) {
          const itemAddons = addonsIds.map((addonId)=>{
            const addon = addons.filter((a)=>a.id == addonId);
            return addon[0];
          });
          orderItems[index].addons = [...itemAddons];
        }
      });

      return {
        ...order,
        items: orderItems
      }
    })

    
    // calculate summary
    let subtotal = 0;
    let taxTotal = 0;
    let total = 0;

    for (const order of formattedOrders) {
      const items = order.items;

      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        
        const { variant_price, price, tax_rate, tax_type: taxType, quantity, addons } = item;

        const taxRate = Number(tax_rate);

        // const addonsTotal = addons ? addons?.reduce((pV, cV)=>Number(pV?.price || 0 )+ Number(cV?.price), 0) : 0;
        let addonsTotal = 0;
        if(addons) {
          for (const addon of addons) {
            addonsTotal += Number(addon.price)
          }
        }
        
        const itemPrice = (Number(variant_price?variant_price:price) * Number(quantity));

        if (taxType == "exclusive") {
          const tax = (itemPrice * taxRate) / 100;
          const priceWithTax = itemPrice + tax;
  
          taxTotal += tax;
          subtotal += itemPrice + (addonsTotal * quantity);
          total += priceWithTax  + (addonsTotal * quantity);

          items[index].itemTotal = (priceWithTax/quantity) + addonsTotal;
          items[index].price = (priceWithTax/quantity) + addonsTotal;
        } else if (taxType == "inclusive") {
          const tax = itemPrice - (itemPrice * (100 / (100 + taxRate)));
          const priceWithoutTax = itemPrice - tax;
          
          taxTotal += tax;
          subtotal += priceWithoutTax + (addonsTotal * quantity);
          total += itemPrice + (addonsTotal * quantity);

          items[index].itemTotal = (itemPrice/quantity) + addonsTotal;
          items[index].price = (itemPrice/quantity) + addonsTotal;
        } else {
          subtotal += itemPrice + (addonsTotal * quantity);
          total += itemPrice + (addonsTotal * quantity);

          items[index].itemTotal = (itemPrice/quantity) + addonsTotal;
          items[index].price = (itemPrice/quantity) + addonsTotal;
        }
      }

    }
    // calculate summary



    return res.status(200).json({
      subtotal, 
      taxTotal, 
      total,
      orders: formattedOrders
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};

exports.payAndCompleteKitchenOrder = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const { orderIds, subTotal, taxTotal, total } = req.body

    if(!orderIds || orderIds?.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Request!"
      });
    }

    const now = new Date();
    const date = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // get invoice id
    const invoiceId = await createInvoiceDB(subTotal, taxTotal, total, date, tenantId);

    await completeOrdersAndSaveInvoiceIdDB(orderIds, invoiceId, tenantId);

    return res.status(200).json({
      success: true,
      message: "Order Completed Successfully!"
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try later!",
    });
  }
};