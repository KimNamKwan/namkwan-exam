/**
 * Created by knk on 2015-09-14.
 */
//������ ����

var mongoose = require('mongoose');
//localhost�� ������ �����ϰ� photo_app�����ͺ��̽��� ����
mongoose.connect('mongodb://localhost/photo_app');

var schema = new mongoose.Schema({
    name: String,
    path: String
});

module.exports = mongoose.model('Photo',schema);