module.exports = [
    {
        ext: '.new',
        transform: function (content) {


            if (Buffer.isBuffer(content)) {
                content = content.toString();
            }

            return content.replace('!NOCOMPILE!', 'value = value ');
        }
    }
];
