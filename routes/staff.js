var express = require('express');
const { UserProfile, Account, Post, Attachment, Category } = require('../models');
var router = express.Router();


/* GET workspace. */
router.route("/")
  .get(async (req, res) => {
    const { view, page = 0 } = req.query;
    const { accountId, roleId } = req.user;
    try {
      switch (view) {
        case 'workspace':
          return Account
            .findOne({ _id: accountId })
            .populate('workspace', 'workTitle posts manager members')
            .then(data => {
              res.status(200).json({
                message: 'this is workspace',
                workspace: data
              });
            })
            .catch(error => res.status(400).send('Not found your profile'));
        case 'profile':
          return UserProfile
            .findOne({ account: accountId })
            .then(data => {
              res.status(200).json({
                userProfile: data
              })
            })
            .catch(error => res.status(400).send(error.message));
        default:
          return res.status(404).send('Not found query');
      }
    }
    catch (error) {
      res.status(500).json({
        error: error.message,
      })
    }
  })
  .post(async (req, res) => {
    const { view } = req.query,
      { accountId, roleId } = req.user,
      files = req.files;

    try {
      switch (view) {
        case 'post':
          const { title, content, category } = req.body;
          return Post
            .create({
              title,
              content,
              account: accountId,
              category: category,
            })
            .then(data => {
              if (!files.length) {
                return res.status(202).json({
                  data,
                  message: "Added post successfully"
                })
              }
              return Promise.all([...req.files.map(file => {
                return Attachment.create({
                  fileName: file.filename,
                  filePath: file.path,
                  fileType: file.mimetype,
                  fileSize: file.size,
                  downloadable: true,
                  post: data._id
                })
              }), data])
            })
            .then(data => {
              console.log(data);
              return res.status(201).json({
                data,
                message: 'Post successfully'
              })
            })
            .catch(error => res.status(402).send(error.message));
        case 'chat':
          res.send('created chat');
          break;
        case 'comment':
          res.send('created comment');
        case 'category':
          const { name } = req.body;
          return Category.create({
            name
          }).then(data => {
            res.status(201).json({
              data
            })
          }).catch(error => res.status(404).json({
            error: error.message
          }))
        default:
          res.json({
            files: req.files
          })
          break;
      }
    }
    catch (error) {
      res.status(500).json({
        error: 'Error Created In Server'
      })
    }

  })
  .put(async (req, res) => {
    const { view, postid } = req.query;
    const { accountId, roleId } = req.user;
    try {
      switch (view) {
        case 'profile':
          const { firstName, lastName, age, phone, address } = req.body;
          const doc = {
            firstName,
            lastName,
            age,
            phone,
            address
          }
          // 1. Check if account have profile
          return UserProfile
            .findOneAndUpdate({ account: accountId }, {
              ...doc,
              $set: {
                account: accountId
              }
            }, { upsert: true, new: true, setDefaultsOnInsert: true })
            .then(data => {
              res.status(202).json({
                data,
                status: 'Edit successfully'
              });
            })
            .catch(error => res.status(404).json({
              error: error.message
            }))
        // case 'post':
        //   const { title, content, attachment } = req.body;
        // return Post.findByIdAndUpdate(postid, {

        // }])
        default:
          res.status(404).json({
            error: 'Not found query'
          })
      }
    }
    catch (error) {
      res.status(500).json({
        error: error.message
      })
    }
  })
  .delete(async (req, res) => {
  });

router.route('/post')
  .get(async (req, res) => {

  })

module.exports = router;