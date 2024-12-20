const {Router} = require('express');

const {
  isLoggedIn,
  isAuthenticated,
  authorize,
  isSubscriptionActive,
} = require('../middlewares/auth.middleware');
const {SCOPES} = require('../config/user.config');
const {
  addInventoryItem,
  getAllInventoryItems,
  getInventoryItem,
  uploadInventoryItemPhoto,
  removeInventoryItemPhoto,
  deleteInventoryItem,
  updateInventoryItem,
  getAllInventoryUnits,
  addStock,
  removeStock,
  updateInventoryUnit,
  addInventoryUnit,
} = require('../controllers/inventory.controller');

const router = Router();

router.post(
  '/add',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.STOCK]),
  addInventoryItem,
);
router.post(
  '/update/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.STOCK]),
  updateInventoryItem,
);
router.post(
  '/update/:id/upload-photo',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.STOCK]),
  uploadInventoryItemPhoto,
);
router.post(
  '/update/:id/remove-photo',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.STOCK]),
  removeInventoryItemPhoto,
);
router.delete(
  '/delete/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.STOCK]),
  deleteInventoryItem,
);
router.get(
  '/',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.STOCK]),
  getAllInventoryItems,
);
router.get(
  '/units',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.STOCK]),
  getAllInventoryUnits,
);
router.post(
  '/units/update/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.STOCK]),
  updateInventoryUnit,
);
router.post(
  '/units/add',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.STOCK]),
  addInventoryUnit,
);
router.get(
  '/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.STOCK]),
  getInventoryItem,
);
router.post(
  '/:id/movements/add',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.STOCK]),
  addStock,
);
router.post(
  '/:id/movements/remove',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.STOCK]),
  removeStock,
);

module.exports = router;
