const {Router} = require('express');

const {
  isLoggedIn,
  isAuthenticated,
  authorize,
  isSubscriptionActive,
} = require('../middlewares/auth.middleware');
const {SCOPES} = require('../config/user.config');
const {
  getStoreDetails,
  setStoreDetails,
  getPrintSettings,
  setPrintSettings,
  getAllTaxes,
  addTax,
  updateTax,
  deletTax,
  getTax,
  addPaymentType,
  getAllPaymentTypes,
  updatePaymentType,
  deletePaymentType,
  togglePaymentType,
  addStoreTable,
  getAllStoreTables,
  updateStoreTable,
  deleteStoreTable,
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getAllTaxGroups,
  addTaxGroup,
  updateTaxGroup,
  getTaxGroup,
  deletTaxGroup,
} = require('../controllers/settings.controller');

const router = Router();

router.get(
  '/store-setting',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  getStoreDetails,
);
router.post(
  '/store-setting',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  setStoreDetails,
);

router.get(
  '/print-setting',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  getPrintSettings,
);
router.post(
  '/print-setting',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  setPrintSettings,
);

router.get(
  '/taxes',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  getAllTaxes,
);
router.post(
  '/taxes/add',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  addTax,
);
router.post(
  '/taxes/:id/update',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  updateTax,
);
router.get(
  '/taxes/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  getTax,
);
router.delete(
  '/taxes/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  deletTax,
);

router.get(
  '/tax-groups',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  getAllTaxGroups,
);
router.post(
  '/tax-groups/add',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  addTaxGroup,
);
router.post(
  '/tax-groups/:id/update',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  updateTaxGroup,
);
router.get(
  '/tax-groups/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  getTaxGroup,
);
router.delete(
  '/tax-groups/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  deletTaxGroup,
);

router.post(
  '/payment-types/add',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  addPaymentType,
);
router.get(
  '/payment-types',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  getAllPaymentTypes,
);
router.post(
  '/payment-types/:id/update',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  updatePaymentType,
);
router.post(
  '/payment-types/:id/toggle',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  togglePaymentType,
);
router.delete(
  '/payment-types/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  deletePaymentType,
);

router.post(
  '/store-tables/add',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  addStoreTable,
);
router.get(
  '/store-tables',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  getAllStoreTables,
);
router.post(
  '/store-tables/:id/update',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  updateStoreTable,
);
router.delete(
  '/store-tables/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  deleteStoreTable,
);

router.post(
  '/categories/add',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  addCategory,
);
router.get(
  '/categories',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  getCategories,
);
router.post(
  '/categories/:id/update',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  updateCategory,
);
router.delete(
  '/categories/:id',
  isLoggedIn,
  isAuthenticated,
  isSubscriptionActive,
  authorize([SCOPES.SETTINGS]),
  deleteCategory,
);

module.exports = router;
