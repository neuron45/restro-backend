const { CONFIG } = require("../config");
const { mailTransport } = require("../config/mailTransport");
const { signInDB, removeRefreshTokenDB, addRefreshTokenDB, verifyRefreshTokenDB, removeRefreshTokenByDeviceIdDB, getDevicesDB, checkEmailExistsDB, signUpDB, updateTenantSubscriptionAccess, getSubscriptionDetailsDB, getUserDB, forgotPasswordDB, checkForgotPasswordTokenDB, deleteForgotPasswordTokenDB , updateSubscriptionHistory , getTenantIdFromCustomerEmail} = require("../services/auth.service");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { deleteUserRefreshTokensDB, updateUserPasswordDB } = require("../services/user.service");
const stripe = require('stripe')(CONFIG.STRIPE_SECRET);


exports.signIn = async (req, res) => {
    try {

        const username = req.body.username;
        const password = req.body.password;

        if(!(username && password)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const result = await signInDB(username, password);

        if(result) {
            // set cookie
            const cookieOptions = {
                expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY)),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            };

            const refreshTokenExpiry = new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY_REFRESH));
            const cookieRefreshTokenOptions = {
                expires: refreshTokenExpiry,
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            };

            result.password = undefined;

            const payload = {
                tenant_id: result.tenant_id,
                username: result.username,
                name: result.name,
                role: result.role,
                scope: result.scope,
                is_active: result.is_active
            }
            const accessToken = generateAccessToken(payload);
            const refreshToken = generateRefreshToken(payload);

            res.cookie('accessToken', accessToken, cookieOptions);
            res.cookie('refreshToken', refreshToken, cookieRefreshTokenOptions);
            res.cookie('restroprosaas__authenticated', true, {
                expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY_REFRESH)),
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            })

            // set refresh token in DB.
            const deviceDetails = req.useragent;

            const deviceIP = req.connection.remoteAddress;
            const deviceName = `${deviceDetails.platform}\nBrowser: ${deviceDetails.browser}`;
            const deviceLocation = "";
            await addRefreshTokenDB(username, refreshToken, refreshTokenExpiry, deviceIP, deviceName, deviceLocation, result.tenant_id);

            return res.status(200).json({
                success: true,
                message: "Login Successful.",
                accessToken,
                user: result
            })

        } else {
            return res.status(401).json({
                success: false,
                message: "Email or Password is Invalid!"
            });
        }


    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "We're facing some issues! Please try later!"
        });
    }
}

exports.signUp = async (req, res) => {
    try {
        const biz_name = req.body.biz_name;
        const username = req.body.username;
        const password = req.body.password;

        if(!(biz_name && username && password)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        // check if email exists
        const isEmailExists = await checkEmailExistsDB(username);

        if(isEmailExists) {
            return res.status(400).json({
                success: false,
                message: "Account already exists with provided email! Try Login!"
            });
        }

        // encrypt the password
        const encryptedPassword = await bcrypt.hash(password, CONFIG.PASSWORD_SALT);

        await signUpDB(biz_name, username, encryptedPassword);

        return res.status(200).json({
            success: true,
            message: "Account Created Successfully, You can login now!"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Can't Register right now! Please try later!"
        });
    }
}

exports.signOut = async (req, res) => {
    try {
        const user = req.user;
        const refreshToken = req.cookies.refreshToken;

        res.clearCookie('accessToken', {
            expires: new Date(Date.now() ),
            httpOnly: true,
            domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
            sameSite: false,
            secure: process.env.NODE_ENV == "production",
            path: "/"
        });
        res.clearCookie('refreshToken', {
            expires: new Date(Date.now()),
            httpOnly: true,
            domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
            sameSite: false,
            secure: process.env.NODE_ENV == "production",
            path: "/"
        });
        res.clearCookie('restroprosaas__authenticated', {
            expires: new Date(Date.now()),
            domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
            sameSite: false,
            secure: process.env.NODE_ENV == "production",
            path: "/"
        });

        // remove refreshToken in DB.
        await removeRefreshTokenDB(user.username, refreshToken);

        return res.status(200).json({
            success: true,
            message: "Logout Successful."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
}

exports.getNewAccessToken = async (req, res) => {
    try {
        const user = req.user;
        const refreshToken = req.cookies.refreshToken;

        // verify the refresh token with the DB
        const isExist = await verifyRefreshTokenDB(refreshToken);

        if(isExist) {
            // generate new access token
            // set cookie
            const cookieOptions = {
                expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY)),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            };
            const u = await getUserDB(user.username, user.tenant_id);
            const payload = {
                tenant_id: u.tenant_id,
                is_active: u.is_active,
                username: u.username,
                name: u.name,
                role: u.role,
                scope: u.scope,
            }
            const accessToken = generateAccessToken(payload);

            res.cookie('accessToken', accessToken, cookieOptions);

            return res.status(200).json({
                success: true,
                message: "New Token Created Successfully.",
                accessToken
            });
        } else {
            res.clearCookie('accessToken', {
                expires: new Date(Date.now() ),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            });
            res.clearCookie('refreshToken', {
                expires: new Date(Date.now()),
                httpOnly: true,
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            });
            res.clearCookie('restroprosaas__authenticated', {
                expires: new Date(Date.now()),
                domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
                sameSite: false,
                secure: process.env.NODE_ENV == "production",
                path: "/"
            });
            return res.status(401).json({
                success: false,
                loginNeeded: true,
                message: "Login again to access this page."
            });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.removeDeviceAccessToken = async (req, res) => {
    try {
        const user = req.user;
        const myRefreshToken = req.cookies.refreshToken;
        const deviceId = req.body.device_id;

        if(myRefreshToken == deviceId) {
            return res.status(400).json({
                success: false,
                message: "Operation not allowed!"
            });
        }

        await removeRefreshTokenByDeviceIdDB(user.username, deviceId);

        return res.status(200).json({
            success: true,
            message: "Device Removed Successfully."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.getDevices = async (req, res) => {
    try {
        const user = req.user;
        const myRefreshToken = req.cookies.refreshToken;

        const devices = await getDevicesDB(user.username);

        const modifiedDevices = devices.map((device)=>{
            const newDevice = new Object({...device, isMyDevice: device.refresh_token == myRefreshToken});
            return newDevice;
        });

        return res.status(200).json(modifiedDevices);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const username = req.body.username;

        if(!username) {
            return res.status(400).json({
                success: false,
                message: "Please provide email address!"
            });
        }

        const doesEmailExists = await checkEmailExistsDB(username);

        if(doesEmailExists) {
            const token = crypto.randomBytes(20).toString('hex');

            const encryptedToken = crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");

            const tokenValidity = new Date(Date.now() + 20 * 60 * 1000); // valid till next 20 mins

            const resetPasswordURL = `${CONFIG.FRONTEND_DOMAIN}/reset-password?token=${token}`;

            await forgotPasswordDB(username, encryptedToken, tokenValidity);

            await mailTransport({
                to: username,
                subject: "Reset Your Password",
                html: `Here is link to reset your profile password, open link to setup new password. the link is only valid till next 20 minutes, don't share this link with anyone.<br/><br/>${resetPasswordURL}`
            });
        }

        return res.status(200).json({
            success: true,
            message: "You'll receive email with instructions to reset password. Check spam if email doesn't land in your inbox."
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error proccessing your request now! Please try after sometime!"
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const token = req.params.token;
        const password = req.body.password;

        if(!password) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const encryptedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");


        const user = await checkForgotPasswordTokenDB(encryptedToken, new Date(Date.now()));
        if(user) {
            const username = user.username;
            const tenantId = user.tenant_id;

            const encryptedPassword = await bcrypt.hash(password, CONFIG.PASSWORD_SALT);

            await deleteUserRefreshTokensDB(username, tenantId);
            await updateUserPasswordDB(username, encryptedPassword, tenantId);

            await deleteForgotPasswordTokenDB(encryptedPassword);

            return res.status(200).json({
                success: true,
                message: "Password changed successfully!"
            });

        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid request or Link expired!"
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error proccessing your request now! Please try after sometime!"
        });
    }
};

exports.getSubscriptionDetails = async (req, res) => {
    try {
        const user = req.user;
        const result = await getSubscriptionDetailsDB(user.tenant_id);
        return res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.cancelSubscription = async (req, res) => {
    try {
        const user = req.user;
        const id = req.body.id;

        if(!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid Request!"
            });
        }

        const subscription = await stripe.subscriptions.cancel(
            id
        );

        // generate new access token
        // set cookie
        const cookieOptions = {
            expires: new Date(Date.now() + parseInt(CONFIG.COOKIE_EXPIRY)),
            httpOnly: true,
            domain: CONFIG.FRONTEND_DOMAIN_COOKIE,
            sameSite: false,
            secure: process.env.NODE_ENV == "production",
            path: "/"
        };
        const payload = {
            tenant_id: user.tenant_id,
            is_active: 0,
            username: user.username,
            name: user.name,
            role: user.role,
            scope: user.scope,
        }
        const accessToken = generateAccessToken(payload);

        res.cookie('accessToken', accessToken, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Your subscription is cancelled now! You'll no longer be charged for the product."
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.stripeProductSubscriptionLookup = async (req, res) => {
    try {
        const productId = req.body.id;
        const user = req.user;

        // const prices = await stripe.prices.list({
        //     lookup_keys: [productId],
        //     expand: ['data.product'],
        // });

        // console.log(prices);

        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            customer_email: user.username,
            metadata: {
                tenant_id: user.tenant_id,
            },
            line_items: [
                {
                    price: productId,
                    // price: prices.data[0].id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${CONFIG.FRONTEND_DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${CONFIG.FRONTEND_DOMAIN}/cancelled-payment`,
        });

        return res.status(200).json({
            success: true,
            url: session.url,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Can't retrieve product subscription right now! Please try after sometime!"
        });
    }
}

exports.stripeWebhook = async (request, response) => {
    let event = request.body;
    // Replace this endpoint secret with your endpoint's unique secret
    // If you are testing with the CLI, find the secret by running 'stripe listen'
    // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    // at https://dashboard.stripe.com/webhooks
    const endpointSecret = CONFIG.STRIPE_WEBHOOK_SECRET;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = request.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
      }
    }
    let subscription;
    let status;
    let customerEmail;

    // console.log(subscription);
    /*
    id, current_period_start, current_period_end, customer
    */
    subscription = event?.data?.object;
    status = subscription?.status;

    const stripeCustomerId = subscription?.customer;
    const subscriptionId = subscription?.id;
    const subscriptionStart = subscription?.current_period_start;
    const subscriptionEnd = subscription?.current_period_end;

    const startDate = new Date(subscriptionStart * 1000);
    const endDate = new Date(subscriptionEnd * 1000);

    const startDateStr = `${startDate.getFullYear()}-${(startDate.getMonth()+1).toString().padStart(2,'0')}-${startDate.getDate().toString().padStart(2,'0')}`;
    const endDateStr = `${endDate.getFullYear()}-${(endDate.getMonth()+1).toString().padStart(2,'0')}-${endDate.getDate().toString().padStart(2,'0')}`;

    // get customer email
    try {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        customerEmail = customer?.email;
    } catch (error) {
        console.error("Error getting customer from stripe =>");
        console.error(error);
    }

    const tenantId = await getTenantIdFromCustomerEmail(customerEmail);

    // Handle the event
    try {
        switch (event.type) {
            case 'customer.subscription.trial_will_end':

              console.log(`Subscription status is ${status}.`);
              // Then define and call a method to handle the subscription trial ending.
              // handleSubscriptionTrialEnding(subscription);
              break;
            case 'customer.subscription.deleted':
              console.log(`Subscription status is ${status}.`);
              // Then define and call a method to handle the subscription deleted.
              // handleSubscriptionDeleted(subscriptionDeleted);
              await updateTenantSubscriptionAccess(customerEmail, 0, subscriptionId, stripeCustomerId, startDateStr, endDateStr);

              await updateSubscriptionHistory(tenantId, startDateStr, endDateStr , 'cancelled');

              break;
            case 'customer.subscription.created':
              console.log(`Subscription status is ${status}.`);
              // Then define and call a method to handle the subscription created.
              // handleSubscriptionCreated(subscription);
              await updateTenantSubscriptionAccess(customerEmail, 1, subscriptionId, stripeCustomerId, startDateStr, endDateStr);

              await updateSubscriptionHistory(tenantId, startDateStr, endDateStr , 'created');

              break;
            case 'customer.subscription.updated':
              console.log(`Subscription status is ${status}.`);
              // Then define and call a method to handle the subscription update.
              // handleSubscriptionUpdated(subscription);
              if(status == 'active') {
                  await updateTenantSubscriptionAccess(customerEmail, 1, subscriptionId, stripeCustomerId, startDateStr, endDateStr);
                  await updateSubscriptionHistory(tenantId, startDateStr, endDateStr , 'updated');

              } else {
                  await updateTenantSubscriptionAccess(customerEmail, 0, subscriptionId, stripeCustomerId, startDateStr, endDateStr);
                 await updateSubscriptionHistory(tenantId, startDateStr, endDateStr , 'updated');

              }
              break;
            case 'entitlements.active_entitlement_summary.updated':
              console.log(`Active entitlement summary updated for ${subscription}.`);
              // Then define and call a method to handle active entitlement summary updated
              // handleEntitlementUpdated(subscription);
              break;
            default:
              // Unexpected event type
              console.log(`Unhandled event type ${event.type}.`);
          }
    } catch (error) {
        console.error(error);
    }


    // Return a 200 response to acknowledge receipt of the event
    response.send();
}
