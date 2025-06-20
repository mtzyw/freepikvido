import Joi from 'joi';

export const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
      .messages({
        'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
      }),
    name: Joi.string().max(50).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  oauthLogin: Joi.object({
    provider: Joi.string().valid('apple', 'google').required(),
    id_token: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refresh_token: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    new_password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  }),
};

export const userValidation = {
  updateProfile: Joi.object({
    name: Joi.string().max(50).optional(),
    email: Joi.string().email().optional(),
  }),
};

export const videoTaskValidation = {
  createTask: Joi.object({
    task_type: Joi.string().valid('image_to_video', 'text_to_video').required(),
    prompt: Joi.string().max(2500).required(),
    duration: Joi.number().valid(5, 10).required(),
    image_url: Joi.when('task_type', {
      is: 'image_to_video',
      then: Joi.string().uri().required(),
      otherwise: Joi.optional(),
    }),
    negative_prompt: Joi.string().max(2500).optional().default(''),
    cfg_scale: Joi.number().min(0).max(1).optional().default(0.5),
    static_mask_url: Joi.when('task_type', {
      is: 'image_to_video',
      then: Joi.string().uri().optional().default(''),
      otherwise: Joi.optional(),
    }),
    aspect_ratio: Joi.when('task_type', {
      is: 'text_to_video',
      then: Joi.string().valid('widescreen_16_9', 'social_story_9_16', 'square_1_1').required(),
      otherwise: Joi.optional(),
    }),
  }),
};

export const paymentValidation = {
  createOrder: Joi.object({
    product_id: Joi.number().integer().positive().required(),
    payment_method: Joi.string().valid('apple', 'stripe').required(),
  }),
};