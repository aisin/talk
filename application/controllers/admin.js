var User = require('../models/user')
var Category = require('../models/category')
var validator = require('validator')
require('../libs/validator_extend')
var Utils = require('../libs/Utils')
var _Admin = require('../libs/Admin')
var _Category = require('../libs/Category')
var EventProxy = require('eventproxy')

//Get : 登录页
exports.index = function (req, res) {
    if(!req.session.user || req.session.user.role !== 'admin'){
        res.render('admin/login')
    }else{
        res.render('admin/dashboard')
    }
}

//Post : 登录操作
exports.login = function (req, res, next) {
    var username = validator.trim(req.body.username).toLowerCase()
    var password = validator.trim(req.body.password)
    var ep = new EventProxy()
    ep.fail(next)

    ep.on('errors', function(msg){
        res.status(403)
        return res.render('admin/login', {
            username : username,
            errors : msg
        })
    })

    if(!validator.isUserName(username)){
        return ep.emit('errors', "用户名5-12个英文字符")
    }else if(!password){
        return ep.emit('errors', "密码不能为空")
    }

    _Admin.getAdminByUsername(username, function(err, user){
        if(err) return next(err)
        if(!user){
            ep.emit('errors', "该管理员不存在")
        }else{
            if(user.role === 'admin'){
                Utils.pwVertify(password, user.password, ep.done(function(bool){
                    if(!bool){
                        ep.emit('errors', "管理员用户名或密码错误")
                    }else{
                        req.session.user = user
                        res.render('admin/dashboard')
                    }
                }))
            }else{
                ep.emit('errors', "您没有管理员权限")
            }
        }
    })
}

exports.dashboard = function(req, res, next){
    res.render('admin/dashboard')
}

//分类
exports.category = function(req, res, next){
    _Category.getAllCategories(function(err, categories){
        if(err) return next(err)
        res.render('admin/category/categoryList', {
            categories : categories
        })
    })
}

exports.categoryAdd = function(req, res, next){
    res.render('admin/category/categoryAdd')
}

exports.categoryDoAdd = function(req, res, next){
    var name = validator.trim(req.body.categoryName)
    var category = new Category()
    if(name){
        category.name = name
        category.save(function(){
            res.redirect('/admin/category')
        })
    }else{
        res.render('admin/category/categoryAdd', {
            errors: "分类名称不能为空"
        })
    }
}