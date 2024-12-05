const { Router } = require("express");
const { getQRMenuInit , placeOrderViaQrMenu } = require("../controllers/qrmenu.controller");
const router = Router();

router.get(
  "/:qrcode",
  getQRMenuInit
);

router.post(
  "/:qrcode/place-order",
  placeOrderViaQrMenu
);

module.exports = router;
