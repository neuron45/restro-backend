const {getUserDB} = require('../services/user.service');
const {verifyToken} = require('../utils/jwt');
const {ROLES} = require('../config/user.config');
const {getAdminUserDB} = require('../services/superadmin.service');

exports.isLoggedIn = (req, res, next) => {
  let token;

  if (
    req.cookies.accessToken ||
    (req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer'))
  ) {
    token = req.cookies.accessToken || req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Login to access this area!',
    });
  }
  req.token = token;
  next();
};

exports.isAuthenticated = (req, res, next) => {
  const accessToken = req.token;

  try {
    const decodedToken = verifyToken(accessToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access!',
    });
  }
};

exports.isSubscriptionActive = (req, res, next) => {
  const user = req.user;
  if (user.is_active == 1) {
    return next();
  } else {
    return res.status(402).json({
      success: false,
      message: 'Your Subscription is not active!',
    });
  }
};

exports.hasRefreshToken = (req, res, next) => {
  let token;

  if (req.cookies.refreshToken) {
    token = req.cookies.refreshToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Login again to access this area!',
    });
  }
  try {
    const decodedToken = verifyToken(token);
    req.user = decodedToken;

    next();
  } catch (error) {
    console.error(error);

    res.clearCookie('accessToken', {
      expires: new Date(Date.now()),
      httpOnly: true,
      domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
      sameSite: false,
      secure: process.env.NODE_ENV == 'production',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      expires: new Date(Date.now()),
      httpOnly: true,
      domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
      sameSite: false,
      secure: process.env.NODE_ENV == 'production',
      path: '/',
    });
    res.clearCookie('restro__authenticated', {
      expires: new Date(Date.now()),
      domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
      sameSite: false,
      secure: process.env.NODE_ENV == 'production',
      path: '/',
    });

    return res.status(401).json({
      success: false,
      message: 'Unauthorized access!',
    });
  }
};

exports.authorize = requiredScopes => {
  return async (req, res, next) => {
    try {
      const {username, scope: userScopes, tenant_id} = req.user;

      const user = await getUserDB(username, tenant_id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied!',
        });
      }

      if (user.role == ROLES.ADMIN) {
        return next();
      }

      if (user.scope != userScopes) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden! Access Denied!',
        });
      }

      const userScopesArr = user?.scope?.split(',')?.map(s => s.trim());

      const isOperationAllowed = requiredScopes.some(scope =>
        userScopesArr.includes(scope),
      );

      // let isOperationAllowed = false;

      // for (const requiredScope of requiredScopes) {
      //     const isAllowed = userScopesArr.includes(requiredScope);
      //     if(isAllowed) {
      //         isOperationAllowed = true;
      //         break;
      //     }
      // }

      if (!isOperationAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden! Access Denied!',
        });
      }
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Something went wrong! try later!',
      });
    }
  };
};

exports.isSuperAdmin = async (req, res, next) => {
  try {
    const {username, role} = req.user;

    const user = await getAdminUserDB(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied!',
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! try later!',
    });
  }
};
