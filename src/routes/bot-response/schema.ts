import Joi from "@hapi/joi";

export default {
  payload: Joi.object().keys({
    type: Joi.string().required(),
    message: Joi.string().required(),
  }),
};
