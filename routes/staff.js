var express = require('express');
const { UserProfile, Account, Post, Attachment, Category, Workspace } = require('../models');
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
            .findOne({ _id: accountId }, ['profileImage', 'role', 'workspace'])
            .populate([{
              path: 'workspace',
              select: 'workTitle members manager',
              populate: [{
                path: 'posts',
                select: 'title content category account like dislike attachment',
                populate: [{
                  path: 'category',
                  select: 'name'
                }, {
                  path: 'attachment',
                  select: 'filePath fileType fileSize downloadable'
                }, {
                  path: 'account',
                  select: 'username role',
                  populate: {
                    path: 'role',
                    select: 'roleName'
                  }
                }]
              }, {
                path: 'manager',
                select: 'username email profileImage role',
                populate: 'role'
              }]
            }, {
              path: 'role',
              select: 'roleName'
            }])
            .then(data => {
              res.status(200).json({
                account: data
              });
            })
            .catch(error => res.status(400).send('Not found your profile'));

        case 'profile':
          return UserProfile
            .findOne({ account: accountId }, 'account address age firstName lastName phone', {
              populate: {
                path: 'account',
                select: 'role',
                populate: {
                  path: 'role',
                  select: 'roleName'
                }
              }
            })
            .then(data => {
              res.status(200).json({
                userProfile: data
              })
            })
            .catch(error => res.status(400).send(error.message));

        case 'category':
          return Category.find().then(data => {
            res.status(200).json({
              category: data
            });
          }).catch(error => res.status(400).send(error.message));

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

  // [POST]
  .post(async (req, res) => {
    const { view } = req.query,
      { accountId, roleId } = req.user,
      files = req.files;

    try {
      switch (view) {
        case 'post':
          const { title, content, category } = req.body;
          if (files.length) return Promise.all([...req.files.map(file => Attachment.create({
            fileName: file.filename,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            downloadable: true
          }))])
            .then(files => Promise.all([Post.create({
              title,
              content,
              like: 0,
              dislike: 0,
              account: accountId,
              category: category,
              attachment: files.map(file => file._id)
            }), files]))
            .then(data => {
              const postID = data[0]._id;
              return Workspace.update({ _id: req.user.workspace }, {
                $push: {
                  posts: postID
                }
              })
            })
            .then(data => {
              return res.status(201).json({
                message: "Posted successfully!"
              })
            })
            .catch(error => res.status(400).send(error.message));
          return Post.create({
            title,
            content,
            like: 0,
            dislike: 0,
            account: accountId,
            category: category
          }).then(data => res.status(200).json({
            result: data,
            message: "Posted successfully!"
          })).catch(error => res.status(400).send(error.message));
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

module.exports = router;