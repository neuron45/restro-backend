const { nanoid } = require("nanoid");
const { addReservationDB, updateReservationDB, cancelReservationDB, deleteReservationDB, searchReservationsDB, getReservationsDB } = require("../services/reservation.service");
const { getStoreTablesDB } = require("../services/settings.service")

exports.initReservation = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        const [storeTables] = await Promise.all([
            getStoreTablesDB(tenantId)
        ]);

        return res.status(200).json({
            storeTables
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.addReservation = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;
        
        const customerId = req.body.customerId;
        const date = req.body.date;
        const tableId = req.body.tableId;
        const status = req.body.status;
        const notes = req.body.notes;
        const peopleCount = req.body.peopleCount;
        
        if(!(customerId && date && peopleCount)) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details: Customer, Date, People Count!"
            });
        }

        const uniqueCode = nanoid(10);

        const reservationId = await addReservationDB(customerId, date, tableId, status, notes, peopleCount, uniqueCode, tenantId);

        return res.status(200).json({
            success: true,
            message: "Reservation Done.",
            reservationId,
            uniqueCode
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};


exports.updateReservation = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const reservationId = req.params.id;
        const date = req.body.date;
        const tableId = req.body.tableId;
        const status = req.body.status;
        const notes = req.body.notes;
        const peopleCount = req.body.peopleCount;
        
        
        await updateReservationDB(reservationId, date, tableId, status, notes, peopleCount, tenantId);

        return res.status(200).json({
            success: true,
            message: "Reservation Details Updated.",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.cancelReservation = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const reservationId = req.params.id;
        await cancelReservationDB(reservationId, "CANCELLED", tenantId);

        return res.status(200).json({
            success: true,
            message: "Reservation Cancelled.",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};


exports.deleteReservation = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const reservationId = req.params.id;
        await deleteReservationDB(reservationId, tenantId);

        return res.status(200).json({
            success: true,
            message: "Reservation Deleted.",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};

exports.searchReservation = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const searchString = req.query.q;

        if(!searchString) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        const result = await searchReservationsDB(searchString, tenantId);

        if(result.length > 0) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({
                success: false,
                message: "No results found!"
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

exports.getReservations = async (req, res) => {
    try {
        const tenantId = req.user.tenant_id;

        const from = req.query.from || null;
        const to = req.query.to || null;
        const type = req.query.type;

        if(!type) {
            return res.status(400).json({
                success: false,
                message: "Please provide required details!"
            });
        }

        if(type == 'custom') {
            if(!(from && to)) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide required details from & to dates!"
                });
            }
        }

        const result = await getReservationsDB(type, from, to, tenantId);

        if(result.length > 0) {
            return res.status(200).json(result);
        } else {
            return res.status(200).json([]);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong! Please try later!"
        });
    }
};