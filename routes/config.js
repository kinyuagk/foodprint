const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid'); // ✅ Corrected UUID import
const ROLES = require('../utils/roles');

const initModels = require('../models/init-models');
const sequelize = require('../config/db/db_sequelise');

const models = initModels(sequelize);

/* GET configuration page */
router.get(
  '/',
  require('connect-ensure-login').ensureLoggedIn({ redirectTo: '/app/auth/login' }),
  async (req, res) => {
    try {
      if (req.user.role === ROLES.Admin || req.user.role === ROLES.Superuser) {
        const rows = await models.FoodprintConfig.findAll({ order: [['pk', 'DESC']] });
        return res.render('config', {
          page_title: 'FoodPrint - Global Configuration',
          data: rows,
          user: req.user,
          page_name: 'config',
        });
      }
      res.render('error', {
        message: 'You are not authorised to view this resource.',
        title: 'Error',
        user: req.user,
        page_name: 'error',
      });
    } catch (err) {
      req.flash('error', err.message);
      res.redirect('/app/config');
    }
  }
);

/* POST route for inserting data */
router.post(
  '/save',
  [
    check('config_name', 'Your config name is not valid').notEmpty().trim().escape(),
    check('config_description', 'Your config description is not valid').notEmpty().trim().escape(),
    check('config_value', 'Your config value is not valid').notEmpty().trim().escape(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg));
      return res.render('config', {
        page_title: 'FoodPrint - Global Configuration',
        data: '',
        page_name: 'config',
      });
    }

    try {
      await models.FoodprintConfig.create({
        configname: req.body.config_name,
        configdescription: req.body.config_description,
        configvalue: req.body.config_value,
        logdatetime: new Date(),
        configid: uuidv4(),
      });

      req.flash('success', `New Configuration added successfully! Config Name = ${req.body.config_name}`);
      res.redirect('/app/config');
    } catch (err) {
      next(err);
    }
  }
);

/* POST route for updating data */
router.post(
  '/update',
  [
    check('config_name', 'Your config name is not valid').notEmpty().trim().escape(),
    check('config_description', 'Your config description is not valid').notEmpty().trim().escape(),
    check('config_value', 'Your config value is not valid').notEmpty().trim().escape(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg));
      return res.render('config', {
        page_title: 'FoodPrint - Global Configuration',
        data: '',
        page_name: 'config',
      });
    }

    try {
      await models.FoodprintConfig.update(
        {
          configname: req.body.config_name,
          configdescription: req.body.config_description,
          configvalue: req.body.config_value,
        },
        { where: { configid: req.body.config_id } }
      );

      req.flash('success', `Configuration updated successfully! Config Name = ${req.body.config_name}`);
      res.redirect('/app/config');
    } catch (err) {
      next(err);
    }
  }
);

/* POST route for deleting data */
router.post('/delete', async (req, res) => {
  try {
    await models.FoodprintConfig.destroy({ where: { configid: req.body.config_id2 } });

    req.flash('success', `Configuration deleted successfully! Config Name = ${req.body.config_name2}`);
    res.redirect('/app/config');
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/app/config');
  }
});

module.exports = router;
