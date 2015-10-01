/**
 * Created by knk on 2015-09-14.
 */
//�信 ������ ���� ���� ������

var photos = [];
var Photo = require('../models/Photo'); //���������� �� �ҷ���
var path = require('path');
var fs = require('fs');
var util = require('util');
var async = require('async');
var fstools = require('fs-tools');
var mime = require('mime');

var baseImageDir = __dirname + '/../public/upload/';

//multipart parser�� ���Ȱ� ���õǼ� multer�� bodyparser���� parser�� ���� ����
//�׷��� formidable�� �����
var formidable = require('formidable');

photos.push({
    name: 'Node.js Logo',
    path: 'http://nodejs.org/images/logos/nodejs-green.png'
});

photos.push({
    name: 'Ryan Speaking',
    path: 'http://nodejs.org/images/ryan-speaker.jpg'
});

exports.list = function(req,res,next){
    Photo.find({},function(err,photos){ //{}�� �����÷����� ��� ���ڵ带 ã��
        if(err) return next(err);
        res.render('photos',{
            title: 'Photos',
            photos: photos
        });
    });
};
//app.js ���� form�� ����
exports.form = function(req,res){
    res.render('photos/upload',{
        title: 'Photo Upload'
    });
};

//�̹��� ��ȸ �Լ�
exports.getImage = function(req,res,next){
    //get������� �̹����� �θ����� ��ȸ�ϸ� �� �Լ��� ���� imagepath���� ������
    //�ش������� �����ϸ� ��Ʈ���� ���� �о� ��û�� Ŭ���̾�Ʈ�� �����Ѵ�.
    //��û�� ������ ������ next �̵��� �����Ѵ�.
    var imagepath = req.params.imagepath;
    var filepath  = path.normalize(baseImageDir+imagepath);
    fs.exists(filepath,function(exists){
        if(exists){
            res.statusCode = 200;
            res.set('content-Type',mime.lookup(imagepath));
            var rs = fs.createReadStream(filepath);
            rs.pipe(res);
        }else{
            next();
        }
    });
};

exports.submit = function() {
    return function (req, res, next) {
        // �ȵ���̵�۰� ���� ����� ���ø����̼ǿ����� ��û�� ���ڵ� ����� Ȯ���ϱ� ���� �Ʒ��� ���� �˻籸�� �߰�
        if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            // ����� ���ε� ��û

        } else {//multipart/form-data
            // �Ϲ� �������� ���ε� ��û


        var form = new formidable.IncomingForm();
        form.uploadDir = path.normalize(__dirname+'/../public/photos/');//�ӽ������� ������ ���丮
        form.keepExtensions = true; //���� Ȯ���ڸ� ������ΰ�
        form.multiples = true;      //multiple upload

        //form.encoding = 'utf-8';  //encoding ����
        //form.maxFieldsSize = 2* 1024 * 124; //byte�� ���ε� ����ũ�� ����

        form.on('field', function (name, value) {
            /*
             input��  type�� text�� ����
             Emitted whenever a field / value pair has been received.
             */
            console.log('[name] ' + name, value);
            //   fields.push([name, value]);
        });

        form.on('fileBegin', function (name, file) {
            /*
             Emitted whenever a new file is detected in the upload stream.
             Use this even if you want to stream the file to somewhere else while buffering
             the upload on the file system.
             */
        });

        form.on('file', function (name, file) {
            /*
             input�� Ÿ���� file�� ���
             Emitted whenever a field / file pair has been received. file is an instance of File.
             */

            console.log('[name] ' + name, file);

            // fs.rename(file.path, form.uploadDir + '/' + file.name);    // file �� ����.

            //files.push([name, file]);
        });

        form.on('progress', function (bytesReceived, bytesExpected) {
            /*
             Emitted after each incoming chunk of data that has been parsed.
             Can be used to roll your own progress bar.
             */
            console.log(((bytesReceived/bytesExpected)*100).toFixed(1)+'% received');
        });

        form.on('aborted', function () {
            /*
             Emitted when the request was aborted by the user.
             Right now this can be due to a 'timeout' or 'close' event on the socket.
             After this event is emitted, an error event will follow.
             In the future there will be a separate 'timeout' event (needs a change in the node core).
             */
        });

        form.on('error', function (err) {
            /*
             Emitted when there is an error processing the incoming form.
             A request that experiences an error is automatically paused,
             you will have to manually call request.resume() if you want the
             request to continue firing 'data' events.
             */
            console.log('[error] error : ' + err);
        });

        form.on('end', function () {
            /*
             Emitted when the entire request has been received, and all contained
             files have finished flushing to disk. This is a great place for you to send your response.
             */
            console.log('-> upload done');
            //res.redirect('/upload');
        });

        form.parse(req, function (err, fields, files) {
            // end �̺�Ʈ���� ���۵ǰ� ���� ���������� ȣ��Ǵ� �κ�
            //���ο�κ�
            //�� �̵����� ��Ƽ��Ʈ ��û�� �Ľ��ϱ� ���� form.parse�� ����ϴµ�
            //form.parse�� �ݹ��Լ��� �Ű����� (fields,files)�� ���� �ʵ� ������� ������������ ���޵ȴ�

            //�������� ������ ���ε��ϴ� ���
            if(files.pict instanceof Array){

                //async.each�� ����� files.pict�迭 ��ü�� ������ ������ /images���丮�� �ű��
                async.each(files.pict,function(file,cb){
                    //���ϸ� ������ ���ε�Ǵ� ���ϸ����� �����Ͽ� �̹����� ����� ��θ� �����ش�

                    //var destPath = path.normalize(baseImageDir+path.basename(file.path));
                    var destPath = path.normalize(baseImageDir+fields.photo_name+'_'+Date.now()+'_'+file.name);

                    //�ش� ���ϸ��� ������ ����ó
                    fstools.move(file.path,destPath,function(err){
                        if(err) cb(err);
                        else cb();
                    });

                }, function(err){
                    //���� ó�� �ݹ���
                    if(err){
                        err.status(500);
                        next(err);
                    }else{
                        res.status(200);
                        res.json({error:null,data:'Upload successful'});
                    }
                });
            }else if(!files.pict.name){   //������ �������� �ʾ�����
                //���� �������� �ʾ��� ��� ���ε� �������� ���� ũ�Ⱑ 0 �� ������ �����Ѵ�.
                fstools.remove(files.pict.path,function(err){
                    if(err){
                        err.status(500);
                        next(err);
                    }else{
                        res.status(200);
                        res.json({error:null,data:'Upload successful'});
                    }
                })
            }else{                  //������ �ϳ��� ����������
                //���ε� �� ������(files.pict)/images���丮�� �ű��.
                //���ε�Ǵ� ���ϸ��� �����ؼ� �̹����� ����� ��θ� �����ش�.
                var destPath = path.normalize(baseImageDir+path.basename(files.pict.path));
                //�ӽ� ������ ����� �̹��� ������ �̹��� ��η� �̵���Ų��.
                fstools.move(files.pict.path,destPath,function(err){
                    if(err){
                        err.status(500);
                        next(err);
                    }else{
                        res.status(200);
                        res.json({error:null,data:'Upload successful'});
                    }
                })
            }

            /*
            �Ǵºκ�
            console.log(fields);
            console.log('1111111111:' + fields.photo_name);
            console.log(files);

            if (files.uploadfile.size > 0) {
                fs.readFile(files.uploadfile.path, function (err, data) {
                    var filePath = fields.photo_name + Date.now();
                    console.log('filePath:' + filePath);
                    file.name = filePath;
                });
            } else {
                fs.unlink(files.uploadfile.path, function (err) {
                    // �ӽ� ���� ����
                });
            }
            */
            /*  ������
             if (files.uploadfile.size > 0) {
             console.log(files.uploadfile.size);
             console.log(files.uploadfile.path);

             console.log(fields);
             console.log(files);
             fs.readFile(files.uploadfile.path, function (err, data) {
             var filePath = '������ ���ϸ�';
             fs.writeFile(filePath, data, function (err) {
             //�ӽ� ���� ����
             fs.unlink(files.uploadfile.path, function (error) {

             });

             if (err) {
             throw err;
             } else {
             // �۾�....
             }
             });
             });
             } else {
             fs.unlink(files.uploadfile.path, function (err) {
             // �ӽ� ���� ����
             });
             }
             */
        });
    }
    }
};

