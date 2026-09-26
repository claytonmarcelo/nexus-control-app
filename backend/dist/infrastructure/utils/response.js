export const sendSuccess = (res, data, message = 'Sucesso', statusCode = 200) => {
    const payload = {
        statusCode,
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
    if (!res)
        return payload;
    return res.status(statusCode).json(payload);
};
export const sendError = (res, message = 'Erro interno', statusCode = 500, errors = null) => {
    const payload = {
        statusCode,
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString()
    };
    if (!res)
        return payload;
    return res.status(statusCode).json(payload);
};
export const sendPaginated = (res, data, page, limit, total, message = 'Sucesso') => {
    const payload = {
        statusCode: 200,
        success: true,
        message,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
    };
    if (!res)
        return payload;
    return res.status(200).json(payload);
};
