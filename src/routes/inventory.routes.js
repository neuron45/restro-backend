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
} = require('../controllers/inventory.controller');

const router = Router();

router.post(
  '/add',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.INVENTORY]),
  addInventoryItem,
);
router.post(
  '/update/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.INVENTORY]),
  updateInventoryItem,
);
router.post(
  '/update/:id/upload-photo',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.INVENTORY]),
  uploadInventoryItemPhoto,
);
router.post(
  '/update/:id/remove-photo',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.INVENTORY]),
  removeInventoryItemPhoto,
);
router.delete(
  '/delete/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.INVENTORY]),
  deleteInventoryItem,
);
router.get(
  '/',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.INVENTORY]),
  getAllInventoryItems,
);
router.get(
  '/units',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.INVENTORY]),
  getAllInventoryUnits,
);
router.get(
  '/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.INVENTORY]),
  getInventoryItem,
);
router.post(
  '/:id/movements/add',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.INVENTORY]),
  addStock,
);
router.post(
  '/:id/movements/remove',
  isLoggedIn,
  isAuthenticated,
  authorize([SCOPES.INVENTORY]),
  removeStock,
);

module.exports = router;
