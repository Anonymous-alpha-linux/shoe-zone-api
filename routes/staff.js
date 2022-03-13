var express = require('express');
const { UserProfile, Account, Post, Attachment, Category, Workspace, Comment } = require('../models');
var router = express.Router();
const { cloudinary } = require('../utils');
const mongoose = require("mongoose");

let filter_actions = {
  DEFAULT: 0,
  MOST_LIKED: 1,
  MY_POST: 2,
  MY_BEST_POST: 3
}

/* GET workspace. */
router.route("/")
  .get(async (req, res) => {
    let { view, page = 0, filter = filter_actions.DEFAULT,
      count = 2, id = 0, postid, commentid, accountid, workspaceid } = req.query;
    let { accountId, roleId, workspace } = req.user;
    try {
      switch (view) {
        case 'query':
          return Workspace.aggregate()
            .match({ _id: req.user.workspace })
            .project({ posts: 1, _id: 0 })
            .unwind("posts")
            .lookup({
              from: 'posts', as: 'posts', localField: 'posts', foreignField: '_id'
            })
            .unwind('posts')
            .project({
              content: '$posts.content',
              categories: '$posts.categories',
              postAuthor: '$posts.postAuthor',
              postOwners: '$posts.postOwners',
              likedAccounts: '$posts.likedAccounts',
              dislikedAccounts: '$posts.dislikedAccounts',
              like: { $size: '$posts.likedAccounts' },
              dislike: { $size: "$posts.dislikedAccounts" },
              createdAt: '$posts.createdAt',
              updateAt: '$posts.updateAt',
              hideAuthor: '$posts.hideAuthor',
              comment: '$posts.comment',
              attachment: '$posts.attachment',
            })
            .sort({
              like: -1,
              createdAt: -1
            })
            .skip(0)
            .limit(3)
            .then(data => res.status(200).json({
              response: data
            }))
            .catch(e => res.status(400).send(e.message));
        case 'workspace':
          return Workspace.aggregate()
            .match({ members: { $in: [mongoose.Types.ObjectId(accountId)] } })
            .then(data => {
              return res.status(200).json({
                response: data
              });
            }).catch(error => res.status(400).json({ message: error.message }));
        case 'singleworkspace':
          return Workspace.findById(workspaceid).then(data => res.status(200).json({ response: data })).catch(error => res.status(401).send(error.message));
        case 'manager':
          console.log("get manager info", accountid);
          return Promise.all([
            Account.findById(accountid, "", {
              select: { profileImage: 1, username: 1, email: 1, role: 1 },
              populate: { path: 'role', select: { _id: 0, roleName: 1 } }
            }),
            UserProfile.findOne({ account: accountid }, '', {
              select: { _id: 0, address: 1, age: 7, firstName: 1, lastName: 1, phone: 1, gender: 1, introduction: 1 },
            })
          ])
            .then(data => {
              const [manager, profile] = data;
              res.status(200).json({ response: { manager, profile } });
            }).catch(error => res.status(402).send(error.message));
        case 'post':
          page = parseInt(page);
          count = parseInt(count);
          if (filter == filter_actions.MOST_LIKED) {
            return Post.aggregate()
              .match({ workspace: workspace })
              .project({
                content: 1,
                categories: 1,
                postAuthor: 1,
                postOwners: 1,
                likedAccounts: 1,
                dislikedAccounts: 1,
                like: { $size: "$likedAccounts" },
                dislike: { $size: "$dislikedAccounts" },
                createdAt: 1,
                updatedAt: 1,
                hideAuthor: 1,
                comment: { $size: "$comments" },
                attachments: 1,
              })
              .sort({ "like": -1, "createdAt": -1 })
              .skip(page * count)
              .limit(count)
              .lookup({ from: 'categories', as: 'categories', localField: 'categories', foreignField: '_id', })
              .lookup({ from: 'accounts', as: 'postAuthor', localField: 'postAuthor', foreignField: '_id' })
              .unwind('postAuthor')
              .lookup({ from: 'accounts', as: 'postOwners', localField: 'postOwners', foreignField: '_id' })
              .lookup({ from: 'attachments', as: 'attachments', localField: 'attachments', foreignField: '_id' })
              .then(data => {
                return res.status(200).json({
                  response: data
                })
              }).catch(error => res.status(400).send(error.message));
          };
          if (filter == filter_actions.MY_POST) {
            return Post.aggregate()
              .match({ postAuthor: accountId })
              .project({
                content: 1,
                categories: 1,
                postAuthor: 1,
                postOwners: 1,
                likedAccounts: 1,
                dislikedAccounts: 1,
                like: { $size: "$likedAccounts" },
                dislike: { $size: "$dislikedAccounts" },
                comment: { $size: "$comments" },
                createdAt: 1,
                updatedAt: 1,
                hideAuthor: 1,
                attachments: 1,
              })
              .sort({ 'createdAt': -1 })
              .skip(page * count)
              .limit(count)
              .lookup({ from: 'categories', as: 'categories', localField: 'categories', foreignField: '_id', })
              .lookup({ from: 'accounts', as: 'postAuthor', localField: 'postAuthor', foreignField: '_id' })
              .unwind('postAuthor')
              .lookup({ from: 'accounts', as: 'postOwners', localField: 'postOwners', foreignField: '_id' })
              .lookup({ from: 'attachments', as: 'attachments', localField: 'attachments', foreignField: '_id' })
              .then(data => {
                return res.status(200).json({
                  response: data
                })
              }).catch(error => res.status(400).send(error.message));
          }
          if (filter == filter_actions.MY_BEST_POST) {
            return Post.aggregate()
              .match({ postAuthor: accountId })
              .project({
                content: 1,
                categories: 1,
                postAuthor: 1,
                postOwners: 1,
                likedAccounts: 1,
                dislikedAccounts: 1,
                like: { $size: "$likedAccounts" },
                dislike: { $size: "$dislikedAccounts" },
                createdAt: 1,
                updatedAt: 1,
                hideAuthor: 1,
                comment: { $size: "$comments" },
                attachments: 1,
              })
              .sort({ "like": -1, "createdAt": -1 })
              .skip(page * count)
              .limit(count)
              .lookup({ from: 'categories', as: 'categories', localField: 'categories', foreignField: '_id', })
              .lookup({ from: 'accounts', as: 'postAuthor', localField: 'postAuthor', foreignField: '_id' })
              .unwind('postAuthor')
              .lookup({ from: 'accounts', as: 'postOwners', localField: 'postOwners', foreignField: '_id' })
              .lookup({ from: 'attachments', as: 'attachments', localField: 'attachments', foreignField: '_id' })
              .then(data => {
                return res.status(200).json({
                  response: data
                })
              }).catch(error => res.status(400).send(error.message));
          }
          return Post.aggregate()
            .match({ workspace: workspace })
            .project({
              content: 1,
              categories: 1,
              postAuthor: 1,
              postOwners: 1,
              likedAccounts: 1,
              dislikedAccounts: 1,
              comments: 1,
              like: { $size: "$likedAccounts" },
              dislike: { $size: "$dislikedAccounts" },
              comment: { $size: "$comments" },
              createdAt: 1,
              updatedAt: 1,
              hideAuthor: 1,
              attachments: 1
            })
            .sort({ 'createdAt': -1 })
            .skip(page * count)
            .limit(count)
            .lookup({ from: 'categories', as: 'categories', localField: 'categories', foreignField: '_id', })
            .lookup({ from: 'accounts', as: 'postAuthor', localField: 'postAuthor', foreignField: '_id' })
            .unwind('postAuthor')
            .lookup({ from: 'accounts', as: 'postOwners', localField: 'postOwners', foreignField: '_id' })
            .lookup({ from: 'attachments', as: 'attachments', localField: 'attachments', foreignField: '_id' })
            .then(data => {
              return res.status(200).json({
                response: data
              })
            }).catch(error => res.status(400).send(error.message));
        case 'singlepost':
          return Post.aggregate([{
            $match: { _id: mongoose.Types.ObjectId(postid) }
          }])
            .project({
              title: 1,
              content: 1,
              categories: 1,
              postAuthor: 1,
              hideAuthor: 1,
              postOwners: 1,
              likedAccounts: 1,
              dislikedAccounts: 1,
              attachment: 1,
              createdAt: 1,
              like: { $size: '$likedAccounts' },
              dislike: { $size: '$dislikedAccounts' },
              comment: { $size: '$comments' },
              attachments: 1,
            })
            .lookup({ from: 'categories', as: 'categories', localField: 'categories', foreignField: '_id' })
            .lookup({ from: 'accounts', as: 'postAuthor', localField: 'postAuthor', foreignField: '_id' })
            .unwind("postAuthor")
            .lookup({ from: 'accounts', as: 'postOwners', localField: 'postOwners', foreignField: '_id' })
            .lookup({ from: 'accounts', as: 'likedAccounts', localField: 'likedAccounts', foreignField: '_id' })
            .lookup({ from: 'accounts', as: 'dislikedAccounts', localField: 'dislikedAccounts', foreignField: '_id' })
            .lookup({ from: 'attachments', as: 'attachments', localField: 'attachments', foreignField: '_id' })
            .then(data => {
              return res.status(200).json({
                response: data[0]
              })
            }).catch(error => res.status(400).send(error.message));
        case 'profile':
          return UserProfile
            .findOne({ account: accountid }, 'account profileImage address age firstName lastName phone', {
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
                  select: 'title content categories postAuthor postOwners like dislike attachment',
                  populate: [{
                    path: 'categories',
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
        case 'comment':
          page = parseInt(page);
          count = parseInt(count);

          if (filter == filter_actions.MOST_LIKED) {
            return Comment.aggregate([{ $match: { post: mongoose.Types.ObjectId(postid), comment: { $exists: false } } }])
              .project({
                body: 1,
                account: 1,
                createdAt: 1,
                hideAuthor: 1,
                like: { $size: '$likedAccounts' },
                dislike: { $size: '$dislikedAccounts' },
                likedAccounts: 1,
                dislikedAccounts: 1,
                reply: { $size: '$replies' },
                replies: 1,
              })
              .sort({ like: -1, createdAt: -1 })
              .skip(page * count)
              .limit(count)
              .lookup({
                from: 'accounts',
                as: 'account',
                localField: 'account',
                foreignField: '_id'
              })
              .unwind('account')
              .lookup({
                from: 'accounts',
                as: 'likedAccounts',
                localField: 'likedAccounts',
                foreignField: '_id'
              })
              .lookup({
                from: 'accounts',
                as: 'dislikedAccounts',
                localField: 'dislikedAccounts',
                foreignField: '_id'
              })
              .then(data => {
                return res.status(200).json({
                  response: data
                });
              }).catch(error => res.status(400).send(error.message));
          }
          else if (filter == filter_actions.MY_POST) {
            return Comment.aggregate([{ $match: { post: mongoose.Types.ObjectId(postid), comment: { $exists: false } } }])
              .project({
                body: 1,
                account: 1,
                createdAt: 1,
                hideAuthor: 1,
                like: { $size: '$likedAccounts' },
                dislike: { $size: '$dislikedAccounts' },
                likedAccounts: 1,
                dislikedAccounts: 1,
                reply: { $size: '$replies' },
                replies: 1,
              })
              .sort({ createdAt: -1 })
              .skip(page * count)
              .limit(count)
              .lookup({
                from: 'accounts',
                as: 'account',
                localField: 'account',
                foreignField: '_id'
              })
              .unwind('account')
              .lookup({
                from: 'accounts',
                as: 'likedAccounts',
                localField: 'likedAccounts',
                foreignField: '_id'
              })
              .lookup({
                from: 'accounts',
                as: 'dislikedAccounts',
                localField: 'dislikedAccounts',
                foreignField: '_id'
              })
              .then(data => {
                res.status(200).json({
                  response: data
                });
              }).catch(error => res.status(400).send(error.message));
          }
          else if (filter == filter_actions.MY_BEST_POST) {
            return Comment.aggregate([{ $match: { post: mongoose.Types.ObjectId(postid), comment: { $exists: false } } }])
              .project({
                body: 1,
                account: 1,
                createdAt: 1,
                hideAuthor: 1,
                like: { $size: '$likedAccounts' },
                dislike: { $size: '$dislikedAccounts' },
                likedAccounts: 1,
                dislikedAccounts: 1,
                reply: { $size: '$replies' },
                replies: 1,
              })
              .sort({ like: -1, createdAt: -1 })
              .skip(page * count)
              .limit(count)
              .lookup({
                from: 'accounts',
                as: 'account',
                localField: 'account',
                foreignField: '_id'
              })
              .unwind('account')
              .lookup({
                from: 'accounts',
                as: 'likedAccounts',
                localField: 'likedAccounts',
                foreignField: '_id'
              })
              .lookup({
                from: 'accounts',
                as: 'dislikedAccounts',
                localField: 'dislikedAccounts',
                foreignField: '_id'
              })
              .then(data => {
                res.status(200).json({
                  response: data
                });
              }).catch(error => res.status(400).send(error.message));
          }
          return Comment.aggregate([{ $match: { post: mongoose.Types.ObjectId(postid), comment: { $exists: false } } }])
            .project({
              body: 1,
              account: 1,
              createdAt: 1,
              hideAuthor: 1,
              like: { $size: '$likedAccounts' },
              dislike: { $size: '$dislikedAccounts' },
              likedAccounts: 1,
              dislikedAccounts: 1,
              reply: { $size: '$replies' },
              replies: 1,
            })
            .sort({ createdAt: -1 })
            .skip(page * count)
            .limit(count)
            .lookup({ from: 'accounts', as: 'account', localField: 'account', foreignField: '_id', pipeline: [{ $project: { username: 1, email: 1, profileImage: 1 } }] })
            .unwind('account')
            // .lookup({ from: 'accounts', as: 'likedAccounts', localField: 'likedAccounts', foreignField: '_id' })
            // .lookup({ from: 'accounts', as: 'dislikedAccounts', localField: 'dislikedAccounts', foreignField: '_id' })
            .then(data => {
              return res.status(200).json({
                response: data
              });
            }).catch(error => res.status(400).send(error.message));
        case 'comment reply':
          page = parseInt(page);
          count = parseInt(count);
          console.log(page, count);
          return Comment.aggregate([{
            $match: { comment: mongoose.Types.ObjectId(commentid) }
          }])
            .project({
              body: 1,
              account: 1,
              createdAt: 1,
              hideAuthor: 1,
              like: { $size: '$likedAccounts' },
              dislike: { $size: '$dislikedAccounts' },
              likedAccounts: 1,
              dislikedAccounts: 1,
              reply: { $size: '$replies' },
              replies: 1,
            })
            .sort({ createdAt: -1 })
            .skip(page * count)
            .limit(count)
            .lookup({ from: 'accounts', as: 'account', localField: 'account', foreignField: '_id' })
            .unwind('account')
            .then(data => res.status(200).json({ response: data, message: 'get comment replies' })).catch(error => res.status(400).send(error.message));
        case 'singlecomment':
          return Comment.findById(commentid)
            .select({
              account: 1,
              likedAccounts: 1,
              dislikedAccounts: 1,
              like: { $size: '$likedAccounts' },
              dislike: { $size: '$dislikedAccounts' },
              reply: { $size: '$replies' },
              createdAt: 1,
              hideAuthor: 1,
              body: 1,
              replies: 1
            })
            .populate([{
              path: 'account likedAccounts dislikedAccounts',
              select: {
                username: 1,
                profileImage: 1,
              }
            },
            {
              path: 'replies',
            }])
            .then(data => res.status(200).json({
              response: data
            })).catch(error => res.status(400).send(error.message));
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
    const { view, postid } = req.query,
      { accountId, role, email } = req.user,
      files = req.files;
    try {
      switch (view) {
        case 'post':
          const { content, categories, private } = req.body;
          function createFolderOnCloudinary() {
            return new Promise((resolve, reject) => {
              cloudinary.api.create_folder(`CMS_STAFF/[${role.toUpperCase()}]-${email}`, {
              }, (error, result) => {
                if (error) reject(error);
                resolve(result);
              })
            })
          }
          function uploadFilesToCloudinaryFolder(folder) {
            const { path, name } = folder;
            return Promise.all(files.map(file => {
              return new Promise((resolve, reject) => {
                cloudinary.uploader.upload(file.path, {
                  folder: path,
                  filename_override: `${new Date(Date.now()).toLocaleString('en-uk', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}`,
                  use_filename: true
                }, function (error, result) {
                  if (error) {
                    files.map(file => {
                      cloudinary.uploader.destroy(file.path);
                    });
                    return reject(error);
                  }
                  resolve(result);
                });
              });
            }))
          }
          function createAttachmentFromCloudinary(file) {
            const {
              public_id,
              signature,
              format,
              resource_type,
              created_at,
              bytes,
              url,
              secure_url,
              api_key
            } = file;
            return Attachment.create({
              fileName: public_id,
              filePath: secure_url || url,
              fileType: `${resource_type}/${format}`,
              fileFormat: format,
              fileSize: bytes,
              createdAt: created_at,
              online_url: secure_url || url,
              api_key: api_key,
              signature,
              downloadable: true
            });
          }
          function createAttachment(file) {
            return Attachment.create({
              // fileName: file.filename,
              // filePath: file.path,
              // fileType: file.mimetype,
              // fileSize: file.size,
              downloadable: true
            })
          }
          function createNewPost(files) {
            return Post.create({
              content,
              postAuthor: accountId,
              categories: categories,
              attachments: files.map(file => file._id),
              createdAt: Date.now(),
              hideAuthor: private,
              workspace: req.user.workspace
            });
          }

          // 1. Create a new folder before saving file
          return createFolderOnCloudinary()
            // 2. Upload files to the upset folder
            .then(folder => {
              return uploadFilesToCloudinaryFolder(folder);
            })
            // 3. Create attachment
            .then(uploadFiles => {
              return Promise.all(uploadFiles.map(file => {
                return createAttachmentFromCloudinary(file);
              }))
            })
            // 4. Add Attachment to post and create a new one
            .then(attachments => {
              return createNewPost(attachments);
            })
            // 5. Find post
            .then(data => {
              return res.status(200).json({
                response: [data],
                message: 'Post successfully',
              });
            })
            .catch(e => {
              return res.status(400).json({
                error: e.message
              });
            });
        case 'chat':
          return res.send('created chat');
        case 'comment':
          const { content: body, private: hideCommentAuthor } = req.body;
          function createComment() {
            return Comment.create({
              body: body,
              hideAuthor: hideCommentAuthor,
              account: accountId,
              post: postid,
              like: 0,
              dislike: 0
            }).then(comment => Promise.all([comment, Post.findByIdAndUpdate(postid, {
              $push: { comments: comment._id }
            }, {
              select: {
                _id: 1
              }
            })]))
          }
          return createComment()
            .then(response => res.status(200).json({
              response: { _id: response[0]._id },
              message: 'Comment successfully',
            })).catch(error => res.status(400).send(error.message));
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
        error: error.message
      })
    }
  })
  .put(async (req, res) => {
    const { view, postid, commentid, interact } = req.query;
    const { accountId, roleId } = req.user;
    try {
      switch (view) {
        case 'profile':
          // const { firstName, lastName, age, phone, address } = req.body;
          const { introduction, gender, birth } = req.body;
          const dateOfBirth = new Date(birth);
          const doc = {
            firstName,
            lastName,
            age: dateOfBirth.getFullYear() - (new Date(Date.now())).getFullYear(),
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
            }));
        case 'post':
          const { email, role } = req.user;
          const { content, categories, private, isLiked, isDisliked } = req.body;
          const files = req.files;
          function createFolderOnCloudinary() {
            return new Promise((resolve, reject) => {
              cloudinary.api.create_folder(`CMS_STAFF/[${role.toUpperCase()}]-${email}`, {
              }, (error, result) => {
                if (error) reject(error);
                resolve(result);
              })
            })
          }
          function uploadFilesToCloudinaryFolder(folder) {
            const { path, name } = folder;
            return Promise.all(files.map(file => {
              return new Promise((resolve, reject) => {
                cloudinary.uploader.upload(file.path, {
                  folder: path,
                  filename_override: `${new Date(Date.now()).toLocaleString('en-uk', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}`,
                  use_filename: true
                }, function (error, result) {
                  if (error) {
                    reject(error);
                  }
                  resolve(result);
                });
              });
            }))
          }
          function createAttachmentFromCloudinary(file) {
            const {
              public_id,
              signature,
              format,
              resource_type,
              created_at,
              bytes,
              url,
              secure_url,
              api_key
            } = file;
            return Attachment.create({
              fileName: public_id,
              filePath: secure_url || url,
              fileType: `${resource_type}/${format}`,
              fileFormat: format,
              fileSize: bytes,
              createdAt: created_at,
              online_url: secure_url || url,
              api_key: api_key,
              signature,
              downloadable: true
            });
          }
          function removeAttachmentFromCloudinary(file) {
            return cloudinary.uploader.destroy(file.fileName);
          }
          function updatePost(files) {
            return new Promise((resolve, reject) => Post.findByIdAndUpdate(postid, {
              content,
              categories: categories,
              hideAuthor: private,
              attachments: files.map(file => file._id)
            }).then(res => resolve(res))
              .catch(error => reject(error)))
          }
          if (interact == 'rate') {
            if (isLiked && !isDisliked) {
              return Post.findByIdAndUpdate(postid, {
                $addToSet: {
                  'likedAccounts': req.user.accountId
                },
                $pull: {
                  'dislikedAccounts': req.user.accountId
                }
              }).then(data => res.status(201).json({
                message: 'Liked',
                data
              })).catch(error => res.status(400).send(error.message));
            }
            if (!isLiked && isDisliked) {
              return Post.findByIdAndUpdate(postid, {
                $addToSet: {
                  'dislikedAccounts': req.user.accountId
                },
                $pull: {
                  'likedAccounts': req.user.accountId
                }
              }).then(data => res.status(201).json({
                message: 'Disliked',
                data
              })).catch(error => res.status(400).send('Cannot liked now'));
            }
            if (!isLiked && !isDisliked) {

              return Post.findByIdAndUpdate(postid, {
                $pull: {
                  'likedAccounts': req.user.accountId,
                  'dislikedAccounts': req.user.accountId
                }
              }).then(data => res.status(201).json({
                message: 'No Contact'
              })).catch(error => res.status(400).send('Cannot liked now'));
            }
          }
          // 1. Create a new folder before saving file
          return createFolderOnCloudinary()
            // 2. Upload files to the upset folder
            .then(folder => {
              return uploadFilesToCloudinaryFolder(folder);
            })
            // 3. Create attachment
            .then(uploadFiles => {
              return Promise.all(uploadFiles.map(file => {
                return createAttachmentFromCloudinary(file);
              }))
            })
            // 4. Add Attachment to post and create a new one
            .then(attachments => {
              return updatePost(attachments);
            })
            .then(data => {
              return res.status(200).json({
                response: [data],
                message: 'Edited Post successfully',
              });
            })
            .catch(e => {
              return res.status(400).json({
                error: e.message
              });
            });
        case 'comment':
          const { content: body, private: hideAuthor, isLiked: likedComment, isDisliked: dislikedComment } = req.body;
          if (interact == 'rate') {
            if (likedComment && !dislikedComment) {

              return Comment.findByIdAndUpdate(commentid, {
                $addToSet: {
                  'likedAccounts': accountId
                },
                $pull: {
                  'dislikedAccounts': accountId
                }
              }).then(data => res.status(201).json({
                message: 'Liked Comment'
              })).catch(error => res.status(400).send('Cannot liked now'));
            }
            if (!likedComment && dislikedComment) {

              return Comment.findByIdAndUpdate(commentid, {
                $addToSet: {
                  'dislikedAccounts': req.user.accountId
                },
                $pull: {
                  'likedAccounts': req.user.accountId
                }
              }).then(data => res.status(201).json({
                message: 'Disliked Comment'
              })).catch(error => res.status(400).send('Cannot liked now'));
            }
            if (!likedComment && !dislikedComment) {
              return Comment.findByIdAndUpdate(commentid, {
                $pull: {
                  'likedAccounts': req.user.accountId,
                  'dislikedAccounts': req.user.accountId
                }
              }).then(data => res.status(201).json({
                message: 'No contact Comment'
              })).catch(error => res.status(400).send('Cannot liked now'));
            }
          }
          if (interact == 'reply') {
            return Comment.create({
              body: body,
              comment: commentid,
              account: accountId,
              post: postid,
              hideAuthor: hideAuthor
            }).then(data => Promise.all([Comment.findOneAndUpdate({
              _id: commentid,
            }, {
              $push: {
                replies: data._id
              }
            }), data])).then(success => res.status(200).json({
              message: 'Reply successfully',
              response: success[1]
            })).catch(error => res.status(400).send(error.message));
          }
          return Comment.create({
            body: body,
            account: accountId,
            post: postid,
            like: 0,
            dislike: 0
          }).then(data => Post.findOneAndUpdate({
            _id: postid,
          }, {
            $push: {
              comment: data._id
            }
          })).then(success => res.status(200).json({
            message: 'Comment successfully'
          })).catch(error => res.status(400).send(error.message));
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
          });
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
          async function clearAttachmentOnCloudinary() {
            return new Promise((resolve, reject) => {
              return Attachment.find({ post: postid }).then(data => {
                cloudinary.uploader.destroy(data[0].fileName, function (error, result) {
                  if (error) reject(error);
                  resolve(result);
                })
              });
            });
          }
          function removeAttachmentOnMongo() {
            return new Promise((onFulfill) => Attachment.deleteMany({ post: postid }, null, (err, doc, res) => {
              if (err) return res.status(500).send("Cannot delete attachment now!");
              onFulfill(doc);
            }));
          }
          function removeCommentOfPost() {
            console.log(postid);
            return new Promise((onFulfill) => Comment.deleteMany({ post: postid }, null, (err, doc, res) => {
              console.log('delete comment');
              if (err) return res.status(500).send("Cannot delete comment now!");
              onFulfill(doc);
            }));
          }
          function removeComment() {
            return Comment.findOneAndRemove({ post: postid });
          }
          function removePost() {
            return new Promise((onFulfill) => Post.findByIdAndRemove(postid, null, (err, doc, res) => {
              if (err) return res.status(500).send("Cannot delete post now!");
              onFulfill(doc);
            }));
          }

          return clearAttachmentOnCloudinary().then(res => {
            const { result } = res;
            if (result === 'ok') {
              return removeAttachmentOnMongo()
            }
            throw new Error("You cannot delete this attachment");
          }).then(data => removeCommentOfPost())
            .then(data => removePost())
            .then(data => res.status(200).json({ message: 'Deleted post successfully' }))
            .catch(error => res.status(400).send(error.message))
        case 'all post':
          return Post.remove({}).then(response => res.status(203).send('deleted all posts')).catch(e => res.status(400).send('delete failed'));
        case 'all attachment':
          return Attachment.remove({}).then(response => res.status(203).send('deleted all attachments')).catch(e => res.status(400).send('delete failed'));
        case 'all comment':
          return Comment.remove({}).then(response => res.status(203).send('deleted all comments')).catch(e => res.status(400).send('delete failed'));
        default:
          res.status(404).json({
            error: 'Not found query'
          })
      }
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

module.exports = router;