var express = require('express');
const mongoose = require('mongoose');
const { UserProfile, Account, Post, Attachment, Category, Workspace } = require('../models');
var router = express.Router();


/* GET workspace. */
router.route("/")
  .get(async (req, res) => {
    const { view, page = 0, count = 2, id = 0 } = req.query;
    const { accountId, roleId } = req.user;

    try {
      switch (view) {
        case 'workspace':
          return Workspace
            .findOne({ _id: req.user.workspace }, 'workTitle members manager expireTime eventTime')
            .populate([
              {
                path: 'posts',
                select: 'title content category postAuthor postOwners like dislike attachment createdAt comment',
                populate: [{
                  path: 'category',
                  select: 'name'
                }, {
                  path: 'attachment',
                  select: 'filePath fileType fileSize downloadable'
                }, {
                  path: 'postAuthor',
                  select: 'username role profileImage',
                  populate: {
                    path: 'role',
                    select: 'roleName'
                  }
                }, {
                  path: 'postOwners',
                  select: 'username role',
                  populate: {
                    path: 'role',
                    select: 'roleName'
                  }
                }]
              },
              {
                path: 'members',
                select: 'username email profileImage role',
                populate: 'role'
              },
              {
                path: 'manager',
                select: 'username email profileImage role',
                populate: 'role'
              }])
            .then(data => {
              res.status(200).json({
                workspace: data
              });
            })
            .catch(error => res.status(400).send(error.message));
        case 'post':
          return Workspace
            .findById(req.user.workspace)
            .select('posts')
            .populate({
              path: 'posts',
              select: 'title content category postAuthor hideAuthor postOwners like dislike attachment createdAt comment',
              populate: [{
                path: 'category',
                select: 'name'
              }, {
                path: 'attachment',
                select: 'filePath fileType fileSize downloadable'
              }, {
                path: 'postAuthor',
                select: 'username role profileImage',
                populate: {
                  path: 'role',
                  select: 'roleName'
                },
                module: 'Account'
              }, {
                path: 'postOwners',
                select: 'username role',
                populate: {
                  path: 'role',
                  select: 'roleName'
                }
              }]
            })
            .then(data => {
              console.log(data);
              return res.status(200).json({
                response: data.posts.slice(page * count, page * count + count)
              })
            }).catch(error => res.status(400).send(error.message));
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
          return Category.find().select('name').then(data => {
            res.status(200).json({
              response: data
            });
          }).catch(error => res.status(400).send(error.message));
        case 'account':
          return Account
            .findOne({ _id: accountId }, ['profileImage', 'role', 'workspace'])
            .populate([
              {
                path: 'workspace',
                select: 'workTitle posts members manager',
                populate: [{
                  path: 'posts',
                  select: 'title content category postAuthor postOwners like dislike attachment',
                  populate: [{
                    path: 'category',
                    select: 'name'
                  }, {
                    path: 'attachment',
                    select: 'filePath fileType fileSize downloadable'
                  }, {
                    path: 'postAuthor',
                    select: 'username role',
                    populate: {
                      path: 'role',
                      select: 'roleName'
                    }
                  }, {
                    path: 'postOwners',
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
                workspace: data
              });
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
  // [POST]
  .post(async (req, res) => {
    const { view } = req.query,
      { accountId, roleId } = req.user,
      files = req.files;
    try {
      switch (view) {
        // case 'workspace':
        //   return Account
        //     .findOne({_id: req.user.id})
        //     .then(data => {
        //       return Workspace.create({
        //         _id: '61f7bc0f4116f253caf86586',
        //         workTitle: req.body.workTitle,
        //         manager: req.user.accountId,
        //         members: data.map(item => item._doc._id)
        //       }).then(data => res.status(200).json({
        //         message: 'created workspace successsfully'
        //       })).catch(error => res.status(400).send(error.message));
        //     });

        case 'post':
          const { content, categories, private } = req.body;
          if (files.length) return Promise.all([...req.files.map(file => Attachment.create({
            fileName: file.filename,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            downloadable: true
          }))]).then(files => Promise.all([Post.create({
            content,
            like: 0,
            dislike: 0,
            postAuthor: accountId,
            category: categories,
            attachment: files.map(file => file._id),
            createdAt: Date.now(),
            hideAuthor: private
          }), files])).then(data => {
            const postID = data[0]._id;
            return Promise.all([Workspace.findByIdAndUpdate({ _id: req.user.workspace }, {
              $push: {
                posts: {
                  $each: [postID],
                  $position: 0
                }
              }
            }), postID]);
          }).then(data => {
            console.log(data);
            return res.status(201).json({
              message: "Posted successfully!",
              postID: data[1]
            })
          }).catch(error => res.status(400).send(error.message));

          return Post.create({
            content,
            like: 0,
            dislike: 0,
            account: accountId,
            category: category
          }).then(data => {
            const postID = data[0]._id;
            return Workspace.update({ _id: req.user.workspace }, {
              $push: {
                posts: postID
              }
            })
          }).then(data => res.status(200).json({
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
          }));
        default:
          res.json({
            files: req.files
          });
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
        case 'post':
          const { content, categories, private } = req.body;
          console.log(categories, private);
          return Promise.all([...req.files.map(file => Attachment.create({
            fileName: file.filename,
            filePath: file.path,
            fileType: file.mimetype,
            fileSize: file.size,
            downloadable: true
          }))]).then(files => Promise.all([Post.findByIdAndUpdate(postid, {
            content,
            category: categories,
            hideAuthor: private,
            attachment: files.map(file => file._id),
            $push: {
              updateAt: Date.now()
            }
          }), files])).then(data =>
            res.status(200).json({
              message: 'Update post successfully'
            })).catch(error => res.status(400).send(error.message));
        case 'like':
          return
        case 'dislike':
          return
        case 'timespan':
          const expireTime = new Date().setDate(new Date(Date.now()).getDate() + 30);

          return Workspace
            .update({ _id: req.user.workspace },
              {
                $set: {
                  expireTime
                }
              }, {
              upsert: true
            })
            .then(data => res.status(201).json({
              message: 'Set the timespan successfully'
            }))
            .catch(error => res.status(400).send(error.message));
        case 'eventtime':
          const eventTime = new Date().setDate(new Date(Date.now()).getDate() + 37);

          return Workspace
            .update({ _id: req.user.workspace },
              {
                $set: {
                  eventTime
                }
              }, {
              upsert: true
            })
            .then(data => res.status(201).json({
              message: 'Set the event time successfully'
            }))
            .catch(error => res.status(400).send(error.message));
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
    const { view, postid } = req.query;
    const { accountId, roleId } = req.user;
    try {
      switch (view) {
        case 'post':
          return Post.findByIdAndRemove(postid, {

          })
            .then()
            .then(data => res.status(204).json({
              message: 'Deleted post successfully'
            })).catch(error => res.status(400).send(error.message))
        default:
          res.status(404).json({
            error: 'Not found query'
          })
      }
    } catch (error) {

    }
  });

module.exports = router;