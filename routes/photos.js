/**
 * Created by knk on 2015-09-14.
 */
//뷰에 노출할 더미 사진 데이터

var photos = [];
var Photo = require('../models/Photo'); //사진데이터 모델 불러옴
var path = require('path');
var fs = require('fs');
var util = require('util');
var async = require('async');
var fstools = require('fs-tools');
var mime = require('mime');

var baseImageDir = __dirname + '/../public/upload/';

//multipart parser가 보안과 관련되서 multer와 bodyparser에서 parser가 되지 않음
//그래서 formidable을 사용함
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
    Photo.find({},function(err,photos){ //{}는 사진컬렉션의 모든 레코드를 찾음
        if(err) return next(err);
        res.render('photos',{
            title: 'Photos',
            photos: photos
        });
    });
};
//app.js 에서 form을 정의
exports.form = function(req,res){
    res.render('photos/upload',{
        title: 'Photo Upload'
    });
};

//이미지 조회 함수
exports.getImage = function(req,res,next){
    //get방식으로 이미지의 팡리명을 조회하면 이 함수로 들어와 imagepath값을 얻어온후
    //해당파일이 존재하면 스트림을 통해 읽어 요청한 클라이언트로 전송한다.
    //요청한 파일이 없으면 next 미들웨어를 실행한다.
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
        // 안드로이드앱과 같은 모바일 애플리케이션에서의 요청의 인코딩 방식을 확인하기 위해 아래와 같이 검사구문 추가
        if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
            // 모바일 업로드 요청

        } else {//multipart/form-data
            // 일반 웹페이지 업로드 요청


        var form = new formidable.IncomingForm();
        form.uploadDir = path.normalize(__dirname+'/../public/photos/');//임시파일이 생성될 디렉토리
        form.keepExtensions = true; //파일 확장자를 남길것인가
        form.multiples = true;      //multiple upload

        //form.encoding = 'utf-8';  //encoding 세팅
        //form.maxFieldsSize = 2* 1024 * 124; //byte로 업로드 파일크기 제한

        form.on('field', function (name, value) {
            /*
             input의  type이 text인 경우등
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
             input의 타입이 file인 경우
             Emitted whenever a field / file pair has been received. file is an instance of File.
             */

            console.log('[name] ' + name, file);

            // fs.rename(file.path, form.uploadDir + '/' + file.name);    // file 명 변경.

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
            // end 이벤트까지 전송되고 나면 최종적으로 호출되는 부분
            //새로운부분
            //이 미들웨어는 멀티파트 요청을 파싱하기 위해 form.parse를 사용하는데
            //form.parse의 콜백함수의 매개변수 (fields,files)로 폼의 필드 정보들과 파일정보들이 전달된다

            //여러개의 파일을 업로드하는 경우
            if(files.pict instanceof Array){

                //async.each를 사용해 files.pict배열 객체의 각각의 파일을 /images디렉토리로 옮긴다
                async.each(files.pict,function(file,cb){
                    //파일명만 추출후 업로드되는 파일명으로 선택하여 이미지가 저장될 경로를 더해준다

                    //var destPath = path.normalize(baseImageDir+path.basename(file.path));
                    var destPath = path.normalize(baseImageDir+fields.photo_name+'_'+Date.now()+'_'+file.name);

                    //해당 파일명을 서버로 전송처
                    fstools.move(file.path,destPath,function(err){
                        if(err) cb(err);
                        else cb();
                    });

                }, function(err){
                    //최종 처리 콜백함
                    if(err){
                        err.status(500);
                        next(err);
                    }else{
                        res.status(200);
                        res.json({error:null,data:'Upload successful'});
                    }
                });
            }else if(!files.pict.name){   //파일을 선택하지 않았을떄
                //파일 선택하지 않았을 경우 업로드 과정에서 생긴 크기가 0 인 파일을 삭제한다.
                fstools.remove(files.pict.path,function(err){
                    if(err){
                        err.status(500);
                        next(err);
                    }else{
                        res.status(200);
                        res.json({error:null,data:'Upload successful'});
                    }
                })
            }else{                  //파일을 하나만 선택했을떄
                //업로드 된 파일을(files.pict)/images디렉토리로 옮긴다.
                //업로드되는 파일명을 추출해서 이미지가 저장될 경로를 더해준다.
                var destPath = path.normalize(baseImageDir+path.basename(files.pict.path));
                //임시 폴더에 저장된 이미지 파일을 이미지 경로로 이동시킨다.
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
            되는부분
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
                    // 임시 파일 삭제
                });
            }
            */
            /*  에러남
             if (files.uploadfile.size > 0) {
             console.log(files.uploadfile.size);
             console.log(files.uploadfile.path);

             console.log(fields);
             console.log(files);
             fs.readFile(files.uploadfile.path, function (err, data) {
             var filePath = '저장할 파일명';
             fs.writeFile(filePath, data, function (err) {
             //임시 파일 삭제
             fs.unlink(files.uploadfile.path, function (error) {

             });

             if (err) {
             throw err;
             } else {
             // 작업....
             }
             });
             });
             } else {
             fs.unlink(files.uploadfile.path, function (err) {
             // 임시 파일 삭제
             });
             }
             */
        });
    }
    }
};

