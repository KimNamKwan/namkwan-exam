/**
 * Created by knk on 2015-09-14.
 */
//몽구스 연결

var mongoose = require('mongoose');
//localhost에 몽고디비를 연결하고 photo_app데이터베이스를 선택
mongoose.connect('mongodb://localhost/photo_app');

var schema = new mongoose.Schema({
    name: String,
    path: String
});

module.exports = mongoose.model('Photo',schema);