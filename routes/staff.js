var express = require('express');
const { UserProfile, Account, Post, Attachment, Category, Workspace, Comment } = require('../models');
var router = express.Router();
const { cloudinary } = require('../utils');
const mongoose = require("mongoose");
const { roles } = require("../fixtures");
const { workspaceCtrl, accountCtrl, profileCtrl } = require("../controllers");

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
    let { accountId, workspace } = req.user;
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
          return workspaceCtrl.getWorkspaceListByPage(req, res);
        case 'singleworkspace':
          return workspaceCtrl.getAssignedWorkspace(req, res);
        case 'myworkspace':
          return workspaceCtrl.getAssignedWorkspace(req, res);
        case 'manager':
          return profileCtrl.getManagerProfile(req, res);
        case 'post':
          page = parseInt(page);
          count = parseInt(count);
          if (filter == filter_actions.MOST_LIKED) {
            return Post.aggregate()
              .match({ workspace: workspace })
              .project({
                title: 1,
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
                title: 1,
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
                title: 1,
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
              title: 1,
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
            // .lookup({ from: 'accounts', as: 'likedAccounts', localField: 'likedAccounts', foreignField: '_id' })
            // .lookup({ from: 'accounts', as: 'dislikedAccounts', localField: 'dislikedAccounts', foreignField: '_id' })
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
            .then(data => {
              return res.status(200).json({
                response: data
              });
            }).catch(error => res.status(400).send(error.message));
        case 'comment reply':
          page = parseInt(page);
          count = parseInt(count);

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
            .sort({ createdAt: -1, like: -1 })
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
            })
            .populate([{
              path: 'account',
              select: {
                username: 1,
                profileImage: 1,
              }
            }])
            .then(data => res.status(200).json({
              response: data
            })).catch(error => res.status(400).send(error.message));
        case 'member':
          return accountCtrl.getAccountListByWorkspaceId(req, res);
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
          const { title, content, categories, private } = req.body;
          if (!title || !content || !categories) return res.status(401).json({ error: 'Please send your request' });
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
                let fileExtension = /[^.]+$/.exec(file.originalname);
                cloudinary.uploader.upload(file.path, {
                  folder: path,
                  filename_override: `${new Date(Date.now()).toLocaleString('en-uk', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}}`,
                  use_filename: true,
                  unique_filename: true,
                  resource_type: 'auto',
                  format: fileExtension[0]
                }, function (error, result) {
                  if (error) {
                    return reject(error);
                  }
                  resolve(result);
                });
              });
            }));
          }
          function createAttachmentFromCloudinary(files, postId) {
            files = files.map(file => {
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
              return {
                fileName: public_id,
                filePath: secure_url || url,
                fileType: `${resource_type}/${format || 'document'}`,
                fileFormat: format,
                fileSize: bytes,
                post: postId,
                createdAt: created_at,
                online_url: secure_url || url,
                api_key: api_key,
                signature,
                downloadable: true
              }
            });
            return new Promise((resolve, reject) => {
              Attachment.insertMany(files, function (error, docs) {
                if (error) reject(error);
                resolve(docs);
              })
            });
          }
          function createNewPost(files) {
            return Post.create({
              title,
              content,
              postAuthor: accountId,
              categories: categories,
              attachments: files.map(file => file._id),
              createdAt: Date.now(),
              hideAuthor: private,
              workspace: req.user.workspace
            })
          }
          // 1. Create a new folder before saving file
          return createFolderOnCloudinary()
            // 2. Upload files to the upset folder
            .then(folder => {
              return uploadFilesToCloudinaryFolder(folder);
            })
            // 3. Create attachment
            .then(uploadFiles => {
              return createAttachmentFromCloudinary(uploadFiles);
            })
            .then(attachmentList => {
              return Promise.all([createNewPost(attachmentList), attachmentList]);
            })
            // 4. Find post
            .then(data => {
              const [post, attachmentList] = data;
              attachmentList.forEach(attachment => {
                attachment.post = post._id;
              });
              return res.status(200).json({
                response: [post],
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
          const { firstName, lastName, age, phone, address, introduction, gender, birth } = req.body;
          console.log(req.body);
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
          const { title, content, categories, private, isLiked, isDisliked } = req.body;
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
                let fileExtension = /[^.]+$/.exec(file.originalname);
                cloudinary.uploader.upload(file.path, {
                  folder: path,
                  filename_override: `${new Date(Date.now()).toLocaleString('en-uk', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}.${fileExtension[0]}`,
                  use_filename: true,
                  unique_filename: true,
                  resource_type: 'auto',
                }, function (error, result) {
                  if (error) {
                    return reject(error);
                  }
                  resolve(result);
                });
              });
            }))
          }
          function createAttachmentFromCloudinary(files) {
            const newFiles = files.map(file => {
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
              return {
                fileName: public_id,
                filePath: secure_url || url,
                fileType: `${resource_type}/${format || 'document'}`,
                fileFormat: format || 'document',
                fileSize: bytes,
                post: postid,
                createdAt: created_at,
                online_url: secure_url || url,
                api_key: api_key,
                signature,
                downloadable: true
              }
            });
            return new Promise((resolve, reject) => {
              Attachment.insertMany(newFiles, function (error, docs) {
                if (error) reject(error);
                resolve(docs);
              })
            });
          }
          async function clearAttachmentOnCloudinary() {
            const { attachments } = await Post.findById(postid).exec();
            return new Promise(resolve => {
              Attachment.where({ _id: { $in: attachments } })
                .then(result => {
                  return Promise.all(result.map(attach => {
                    return new Promise((resolve) => {
                      cloudinary.uploader.destroy(attach.fileName, { resource_type: attach.fileType.split('/')[0] }, function (error, result) {
                        if (error) throw new Error(error);
                        resolve(result);
                      });
                      removeSingleAttachmentOnMongo(attach._id);
                    })
                  }));
                })
                .then(data => {
                  resolve(data);
                })
                .catch(error => res.status(500).send("Cannot clear attachment from Cloudinary"));
            })
          }
          function removeSingleAttachmentOnMongo(attachmentId) {
            return new Promise((onFulfill) => Attachment.findByIdAndRemove({ _id: attachmentId }, null, (err, doc, res) => {
              if (err) return res.status(500).send("Cannot delete attachment now!");
              onFulfill(doc);
            }));
          }
          function updatePost(files) {
            return new Promise((resolve, reject) => Post.findByIdAndUpdate(postid, {
              title,
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
          if (!title || !content || !categories.length) return res.status(401).json({ error: 'Please send your request' });
          // 1. Create a new folder before saving file
          return createFolderOnCloudinary()
            // 2. Upload files to the upset folder
            .then(folder => { return uploadFilesToCloudinaryFolder(folder) })
            // 3. Create attachment
            .then(uploadFiles => {
              clearAttachmentOnCloudinary();
              return createAttachmentFromCloudinary(uploadFiles);
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
              }).then(data => {
                return res.status(201).json({
                  response: data._id,
                  message: 'Liked Comment'
                })
              }).catch(error => res.status(400).send('Cannot liked now'));
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
          const { counter } = req.body;
          if (!counter) return res.status(401).json({ error: 'Please send your request information' });
          let remainingTime = counter || 30;
          const expireTime = new Date().setDate(new Date(Date.now()).getDate() + remainingTime);
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
        case 'workspace':
          return workspaceCtrl.editWorkspace(req, res);
        case 'accountworkspace':
          const { workspaceid } = req.body;
          if (!workspaceid) return res.status(401).json({ error: 'Please send your workspaceid' });
          const foundWorkspace = await Workspace.where(workspaceid).findOne({ members: { $in: req.user.accountId } }).exec();
          if (!foundWorkspace) return res.status(401).json({ error: "This workspaceid or your account cannot be included" });
          return Account.findByIdAndUpdate(req.user.accountId, {
            workspace: workspaceid
          }).then(data => res.status(201).json({ message: 'Update current workspaceid successfully!', response: foundWorkspace })).catch(error => res.status(500).json({ error: 'Cannot change now!' }));
        case 'assign_workspace_manager':
          return workspaceCtrl.assignWorkspaceManager(req, res);
        case 'assign_workspace_member':
          return workspaceCtrl.assignMemberToWorkspace(req, res);
        case 'unassign_workspace_member':
          return workspaceCtrl.unassignMemberToWorkspace(req, res);
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
            const { attachments } = await Post.findById(postid).exec();
            return new Promise(resolve => {
              Attachment.where({ _id: { $in: attachments } })
                .then(result => {
                  return Promise.all(result.map(attach => {
                    return new Promise((resolve) => {
                      cloudinary.uploader.destroy(attach.fileName, { resource_type: attach.fileType.split('/')[0] }, function (error, result) {
                        if (error) throw new Error(error);
                        resolve(result);
                      });
                      removeAttachmentOnMongo(attach._id);
                    });
                  }));
                })
                .then(data => {
                  resolve(data);
                })
                .catch(error => res.status(500).send("Cannot clear attachment from Cloudinary"));
            })
          }
          function removeAttachmentOnMongo(attachmentId) {
            return new Promise((onFulfill) => Attachment.findByIdAndRemove({ _id: attachmentId }, null, (err, doc, res) => {
              if (err) return res.status(500).send("Cannot delete attachment now!");
              onFulfill(doc);
            }));
          }
          function removeCommentOfPost() {
            return new Promise((onFulfill) => Comment.deleteMany({ post: postid }, null, (err, doc, res) => {
              if (err) return res.status(500).send("Cannot delete comment now!");
              onFulfill(doc);
            }));
          }
          function removePost() {
            return new Promise((onFulfill) => Post.findByIdAndRemove(postid, null, (err, doc, res) => {
              if (err) return res.status(500).send("Cannot delete post now!");
              onFulfill(doc);
            }));
          }
          return clearAttachmentOnCloudinary().then(res => {
            return res.map(e => {
              // if (e !== 'ok') {
              //   throw new Error("You cannot delete this attachment");
              // }
              return e;
            });
          })
            .then(data => {
              removeCommentOfPost();
            })
            .then(data => removePost())
            .then(data => res.status(200).json({ message: 'Deleted post successfully' }))
            .catch(error => res.status(403).send(error.message))
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